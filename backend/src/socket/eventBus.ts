import IORedis from 'ioredis';
import { emitProgress, emitComplete, emitError } from './socketServer';

const CHANNEL = 'vedaai:job-events';

export type JobEvent =
  | { kind: 'progress'; assignmentId: string; progress: number; message: string }
  | { kind: 'complete'; assignmentId: string; paperId: string }
  | { kind: 'error'; assignmentId: string; error: string };

function newClient(): IORedis {
  const url = process.env.REDIS_URL ?? 'redis://127.0.0.1:6379';
  return new IORedis(url, { maxRetriesPerRequest: null, enableReadyCheck: false });
}

let publisher: IORedis | null = null;
function getPublisher(): IORedis {
  if (publisher) return publisher;
  publisher = newClient();
  return publisher;
}

export async function publishJobEvent(event: JobEvent): Promise<void> {
  await getPublisher().publish(CHANNEL, JSON.stringify(event));
}

export function startEventBusSubscriber(): void {
  const sub = newClient();
  sub.subscribe(CHANNEL, (err) => {
    if (err) console.error('[bus] subscribe error', err.message);
    else console.log('[bus] subscribed to', CHANNEL);
  });
  sub.on('message', (_channel, raw) => {
    try {
      const evt = JSON.parse(raw) as JobEvent;
      switch (evt.kind) {
        case 'progress':
          emitProgress(evt.assignmentId, { progress: evt.progress, message: evt.message });
          break;
        case 'complete':
          emitComplete(evt.assignmentId, { paperId: evt.paperId });
          break;
        case 'error':
          emitError(evt.assignmentId, { error: evt.error });
          break;
      }
    } catch (err) {
      console.error('[bus] failed to handle message', err);
    }
  });
}
