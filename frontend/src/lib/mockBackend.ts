/**
 * In-browser fallback that mirrors the real Express API contract.
 * Storage: localStorage. Pub/sub: EventTarget. Generation: mockGenerator.
 *
 * The real Express + Socket.io + BullMQ + MongoDB + Redis backend lives in
 * /backend and runs end-to-end with `npm run dev` from the repo root.
 */
import { generatePaperOffline } from './mockGenerator';
import type {
  Assignment,
  AssignmentStatus,
  GeneratedPaper,
  QuestionType,
} from '@/types';

const ASSIGNMENT_KEY = 'vedaai:assignments';
const PAPER_KEY = (id: string): string => `vedaai:paper:${id}`;

interface StoredAssignment extends Assignment {
  additionalInstructions?: string;
}

function readAssignments(): StoredAssignment[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(ASSIGNMENT_KEY);
    return raw ? (JSON.parse(raw) as StoredAssignment[]) : [];
  } catch {
    return [];
  }
}

function writeAssignments(items: StoredAssignment[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ASSIGNMENT_KEY, JSON.stringify(items));
}

function readPaper(assignmentId: string): GeneratedPaper | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(PAPER_KEY(assignmentId));
    return raw ? (JSON.parse(raw) as GeneratedPaper) : null;
  } catch {
    return null;
  }
}

function writePaper(assignmentId: string, paper: GeneratedPaper): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PAPER_KEY(assignmentId), JSON.stringify(paper));
}

function deletePaper(assignmentId: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(PAPER_KEY(assignmentId));
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function deriveTitle(instr: string, firstType: string): string {
  const t = instr.trim();
  if (t.length > 0) return t.length > 80 ? t.slice(0, 77) + '...' : t;
  return `${firstType} Question Paper`;
}

/* Pub/sub bus, mirrors Socket.io rooms */

type Listener<T> = (payload: T) => void;

class MockBus extends EventTarget {
  emitProgress(assignmentId: string, payload: { progress: number; message: string }): void {
    this.dispatchEvent(new CustomEvent(`progress:${assignmentId}`, { detail: payload }));
  }
  emitComplete(assignmentId: string, payload: { paperId: string }): void {
    this.dispatchEvent(new CustomEvent(`complete:${assignmentId}`, { detail: payload }));
  }
  emitError(assignmentId: string, payload: { error: string }): void {
    this.dispatchEvent(new CustomEvent(`error:${assignmentId}`, { detail: payload }));
  }
  onProgress(assignmentId: string, cb: Listener<{ progress: number; message: string }>): () => void {
    const handler = (e: Event): void => cb((e as CustomEvent).detail);
    this.addEventListener(`progress:${assignmentId}`, handler);
    return () => this.removeEventListener(`progress:${assignmentId}`, handler);
  }
  onComplete(assignmentId: string, cb: Listener<{ paperId: string }>): () => void {
    const handler = (e: Event): void => cb((e as CustomEvent).detail);
    this.addEventListener(`complete:${assignmentId}`, handler);
    return () => this.removeEventListener(`complete:${assignmentId}`, handler);
  }
  onError(assignmentId: string, cb: Listener<{ error: string }>): () => void {
    const handler = (e: Event): void => cb((e as CustomEvent).detail);
    this.addEventListener(`error:${assignmentId}`, handler);
    return () => this.removeEventListener(`error:${assignmentId}`, handler);
  }
}

export const mockBus = new MockBus();

/* API surface (matches the real api.ts) */

export interface CreateInput {
  dueDate: string;
  questionTypes: QuestionType[];
  additionalInstructions: string;
  fileName?: string | null;
}

function startGeneration(assignmentId: string): void {
  setTimeout(() => mockBus.emitProgress(assignmentId, { progress: 15, message: 'Loading assignment...' }), 200);
  setTimeout(() => mockBus.emitProgress(assignmentId, { progress: 40, message: 'Building prompt...' }), 700);
  setTimeout(() => mockBus.emitProgress(assignmentId, { progress: 70, message: 'Generating questions...' }), 1500);
  setTimeout(() => mockBus.emitProgress(assignmentId, { progress: 90, message: 'Validating output...' }), 2300);
  setTimeout(() => {
    const all = readAssignments();
    const a = all.find((x) => x.id === assignmentId);
    if (!a) {
      mockBus.emitError(assignmentId, { error: 'Assignment not found' });
      return;
    }
    try {
      const paper = generatePaperOffline({
        questionTypes: a.questionTypes,
        additionalInstructions: a.additionalInstructions,
      });
      writePaper(assignmentId, paper);
      a.status = 'complete';
      a.resultId = assignmentId;
      writeAssignments(all);
      mockBus.emitComplete(assignmentId, { paperId: assignmentId });
    } catch (err) {
      a.status = 'failed';
      writeAssignments(all);
      mockBus.emitError(assignmentId, { error: (err as Error).message });
    }
  }, 2900);
}

export function mockCreateAssignment(input: CreateInput): { assignmentId: string } {
  const id = uid();
  const all = readAssignments();
  const title = deriveTitle(input.additionalInstructions, input.questionTypes[0]?.type ?? 'Question Paper');
  const assignment: StoredAssignment = {
    id,
    title,
    dueDate: new Date(input.dueDate).toISOString(),
    questionTypes: input.questionTypes,
    additionalInstructions: input.additionalInstructions,
    status: 'pending' as AssignmentStatus,
    createdAt: new Date().toISOString(),
  };
  all.unshift(assignment);
  writeAssignments(all);
  setTimeout(() => {
    const list = readAssignments();
    const target = list.find((x) => x.id === id);
    if (target) {
      target.status = 'processing';
      writeAssignments(list);
    }
    startGeneration(id);
  }, 50);
  return { assignmentId: id };
}

export function mockListAssignments(): Assignment[] {
  return readAssignments().map(({ additionalInstructions: _ai, ...rest }) => rest);
}

export function mockDeleteAssignment(id: string): void {
  const next = readAssignments().filter((a) => a.id !== id);
  writeAssignments(next);
  deletePaper(id);
}

export function mockGetResult(
  id: string,
): { status: AssignmentStatus; paper?: GeneratedPaper } {
  const a = readAssignments().find((x) => x.id === id);
  if (!a) return { status: 'failed' };
  if (a.status !== 'complete') return { status: a.status };
  const paper = readPaper(id);
  if (!paper) return { status: 'processing' };
  return { status: 'complete', paper };
}

export function mockRegenerate(id: string): void {
  const all = readAssignments();
  const a = all.find((x) => x.id === id);
  if (!a) return;
  deletePaper(id);
  a.status = 'pending';
  delete a.resultId;
  writeAssignments(all);
  setTimeout(() => {
    a.status = 'processing';
    writeAssignments(all);
    startGeneration(id);
  }, 50);
}

/* Reachability detection */

let realBackendReachable: boolean | null = null;
let probePromise: Promise<boolean> | null = null;

export async function isRealBackendReachable(): Promise<boolean> {
  if (realBackendReachable !== null) return realBackendReachable;
  if (probePromise) return probePromise;
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    realBackendReachable = false;
    return false;
  }
  // localhost only counts when the user is actually on localhost
  if (
    url.includes('localhost') &&
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
  ) {
    realBackendReachable = false;
    return false;
  }
  probePromise = (async () => {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 4000);
      const r = await fetch(`${url}/health`, { signal: ctrl.signal });
      clearTimeout(t);
      realBackendReachable = r.ok;
      return r.ok;
    } catch {
      realBackendReachable = false;
      return false;
    }
  })();
  return probePromise;
}

export function forceMockMode(): void {
  realBackendReachable = false;
}
