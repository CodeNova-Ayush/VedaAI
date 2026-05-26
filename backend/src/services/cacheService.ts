import { getRedis } from '../config/redis';

const TTL_SECONDS = 60 * 60; // 1 hour

function key(assignmentId: string): string {
  return `paper:${assignmentId}`;
}

export async function cacheGetPaper(assignmentId: string): Promise<unknown | null> {
  const raw = await getRedis().get(key(assignmentId));
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function cacheSetPaper(assignmentId: string, value: unknown): Promise<void> {
  await getRedis().set(key(assignmentId), JSON.stringify(value), 'EX', TTL_SECONDS);
}

export async function cacheInvalidatePaper(assignmentId: string): Promise<void> {
  await getRedis().del(key(assignmentId));
}
