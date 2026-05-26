import { Queue } from 'bullmq';
import { getRedis } from '../config/redis';

export const QUEUE_NAME = 'paper-generation';

let queue: Queue | null = null;

export interface PaperJobData {
  assignmentId: string;
}

export function getQueue(): Queue<PaperJobData> {
  if (queue) return queue as Queue<PaperJobData>;
  queue = new Queue<PaperJobData>(QUEUE_NAME, {
    connection: getRedis(),
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 100 },
    },
  });
  return queue as Queue<PaperJobData>;
}

export async function enqueuePaperJob(assignmentId: string): Promise<void> {
  // BullMQ disallows ":" inside custom jobIds.
  await getQueue().add('generate', { assignmentId }, { jobId: `assignment-${assignmentId}` });
}
