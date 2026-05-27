import 'dotenv/config';
import { Worker, Job, UnrecoverableError } from 'bullmq';
import { connectMongo } from './config/db';
import { getRedis } from './config/redis';
import { Assignment } from './models/Assignment';
import { GeneratedPaper } from './models/GeneratedPaper';
import { buildPrompt } from './services/promptBuilder';
import { generatePaperWithLLM, generatePaperOffline, isLLMAvailable } from './services/aiService';
import { cacheSetPaper } from './services/cacheService';
import { publishJobEvent } from './socket/eventBus';
import { QUEUE_NAME, type PaperJobData } from './services/queueService';

async function processJob(job: Job<PaperJobData>): Promise<void> {
  const { assignmentId } = job.data;

  await publishJobEvent({
    kind: 'progress',
    assignmentId,
    progress: 10,
    message: 'Loading assignment...',
  });

  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) throw new UnrecoverableError('Assignment not found: ' + assignmentId);

  assignment.status = 'processing';
  await assignment.save();

  let paper;
  if (isLLMAvailable()) {
    await publishJobEvent({
      kind: 'progress',
      assignmentId,
      progress: 30,
      message: 'Building AI prompt...',
    });
    const { system, user } = buildPrompt(assignment);
    await publishJobEvent({
      kind: 'progress',
      assignmentId,
      progress: 55,
      message: 'Generating your question paper...',
    });
    paper = await generatePaperWithLLM(system, user);
  } else {
    await publishJobEvent({
      kind: 'progress',
      assignmentId,
      progress: 40,
      message: 'No API key set — using offline generator...',
    });
    paper = generatePaperOffline(assignment);
    // Tiny artificial delay so the progress bar feels real, not jumpy
    await new Promise((r) => setTimeout(r, 400));
  }

  await publishJobEvent({
    kind: 'progress',
    assignmentId,
    progress: 85,
    message: 'Validating and saving...',
  });

  const saved = await GeneratedPaper.create({
    assignmentId: assignment._id,
    schoolName: paper.schoolName,
    subject: paper.subject,
    className: paper.className,
    timeAllowed: paper.timeAllowed,
    totalMarks: paper.totalMarks,
    sections: paper.sections,
    answerKey: paper.answerKey,
  });

  assignment.resultId = saved._id;
  assignment.status = 'complete';
  await assignment.save();

  await cacheSetPaper(assignmentId, {
    schoolName: saved.schoolName,
    subject: saved.subject,
    className: saved.className,
    timeAllowed: saved.timeAllowed,
    totalMarks: saved.totalMarks,
    sections: saved.sections,
    answerKey: saved.answerKey,
    _id: saved._id.toString(),
    assignmentId: assignment._id.toString(),
  });

  await publishJobEvent({
    kind: 'complete',
    assignmentId,
    paperId: saved._id.toString(),
  });
}

async function main(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error('MONGODB_URI is not set');

  // Retry Mongo connection a few times on cold start. Atlas free tier can
  // take a moment to wake up.
  let lastErr: unknown;
  for (let i = 0; i < 5; i += 1) {
    try {
      await connectMongo(mongoUri);
      lastErr = null;
      break;
    } catch (err) {
      lastErr = err;
      console.error(`[worker] mongo connection attempt ${i + 1} failed:`, (err as Error).message);
      await new Promise((r) => setTimeout(r, 3_000 * (i + 1)));
    }
  }
  if (lastErr) throw lastErr;

  console.log(
    isLLMAvailable()
      ? '[worker] using Anthropic Claude for paper generation'
      : '[worker] ANTHROPIC_API_KEY not set — using deterministic offline generator',
  );

  const worker = new Worker<PaperJobData>(QUEUE_NAME, processJob, {
    connection: getRedis(),
    concurrency: 2,
  });

  worker.on('completed', (job) => {
    console.log('[worker] completed', job.id);
  });
  worker.on('failed', async (job, err) => {
    console.error('[worker] failed', job?.id, err.message);
    if (!job) return;
    const isUnrecoverable = err instanceof UnrecoverableError;
    const finalAttempt = (job.attemptsMade ?? 0) >= (job.opts.attempts ?? 1);
    if (isUnrecoverable || finalAttempt) {
      try {
        await Assignment.findByIdAndUpdate(job.data.assignmentId, { status: 'failed' });
        await publishJobEvent({
          kind: 'error',
          assignmentId: job.data.assignmentId,
          error: err.message,
        });
      } catch (publishErr) {
        console.error('[worker] failed to publish error event', publishErr);
      }
    }
  });

  console.log('[worker] started, listening on queue', QUEUE_NAME);
}

main().catch((err) => {
  console.error('[fatal]', err);
  process.exit(1);
});
