import type {
  ApiResponse,
  AssignmentStatus,
  AssignmentSummary,
  GeneratedPaper,
  QuestionTypeRow,
} from '@/types';
import {
  isRealBackendReachable,
  forceMockMode,
  mockCreateAssignment,
  mockListAssignments,
  mockDeleteAssignment,
  mockGetResult,
  mockRegenerate,
} from './mockBackend';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

async function unwrap<T>(res: Response): Promise<T> {
  const json = (await res.json()) as ApiResponse<T>;
  if (!json.success) {
    const err = new Error(json.error) as Error & { fields?: Record<string, string> };
    err.fields = json.fields;
    throw err;
  }
  return json.data;
}

export interface CreateAssignmentInput {
  file?: File | null;
  dueDate: string;
  questionTypes: QuestionTypeRow[];
  additionalInstructions: string;
}

async function tryRealOrFallback<T>(
  realFn: () => Promise<T>,
  mockFn: () => T | Promise<T>,
): Promise<T> {
  const reachable = await isRealBackendReachable();
  if (!reachable) return mockFn();
  try {
    return await realFn();
  } catch (err) {
    if (err instanceof TypeError) {
      forceMockMode();
      return mockFn();
    }
    throw err;
  }
}

export async function createAssignment(
  input: CreateAssignmentInput,
): Promise<{ assignmentId: string }> {
  return tryRealOrFallback(
    async () => {
      const fd = new FormData();
      if (input.file) fd.append('file', input.file);
      fd.append('dueDate', input.dueDate);
      fd.append('questionTypes', JSON.stringify(input.questionTypes));
      fd.append('additionalInstructions', input.additionalInstructions);
      const res = await fetch(`${BASE}/api/assignments`, { method: 'POST', body: fd });
      return unwrap<{ assignmentId: string }>(res);
    },
    () =>
      mockCreateAssignment({
        dueDate: input.dueDate,
        questionTypes: input.questionTypes,
        additionalInstructions: input.additionalInstructions,
        fileName: input.file?.name ?? null,
      }),
  );
}

export async function listAssignments(): Promise<AssignmentSummary[]> {
  return tryRealOrFallback(
    async () => {
      const res = await fetch(`${BASE}/api/assignments`, { cache: 'no-store' });
      return unwrap<AssignmentSummary[]>(res);
    },
    () => mockListAssignments(),
  );
}

export async function deleteAssignment(id: string): Promise<void> {
  await tryRealOrFallback(
    async () => {
      const res = await fetch(`${BASE}/api/assignments/${id}`, { method: 'DELETE' });
      await unwrap<{ id: string }>(res);
      return undefined;
    },
    () => {
      mockDeleteAssignment(id);
      return undefined;
    },
  );
}

export async function getAssignmentResult(
  id: string,
): Promise<{ status: AssignmentStatus; paper?: GeneratedPaper }> {
  return tryRealOrFallback(
    async () => {
      const res = await fetch(`${BASE}/api/assignments/${id}/result`, { cache: 'no-store' });
      return unwrap<{ status: AssignmentStatus; paper?: GeneratedPaper }>(res);
    },
    () => mockGetResult(id),
  );
}

export async function regenerateAssignment(id: string): Promise<void> {
  await tryRealOrFallback(
    async () => {
      const res = await fetch(`${BASE}/api/assignments/${id}/regenerate`, { method: 'POST' });
      await unwrap<{ assignmentId: string }>(res);
      return undefined;
    },
    () => {
      mockRegenerate(id);
      return undefined;
    },
  );
}
