/**
 * VedaAI shared types.
 *
 * This package contains TYPE DEFINITIONS ONLY. No runtime code.
 * Both frontend and backend import these types via `@veda-ai/shared`.
 */

export type Difficulty = 'easy' | 'moderate' | 'hard' | 'challenging';

export type JobStatus = 'pending' | 'processing' | 'complete' | 'failed';

export interface QuestionType {
  type: string;
  count: number;
  marks: number;
}

export interface Assignment {
  id: string;
  title: string;
  dueDate: string; // ISO 8601
  questionTypes: QuestionType[];
  additionalInstructions?: string;
  fileUrl?: string;
  status: JobStatus;
  resultId?: string;
  createdAt: string;
}

export interface Question {
  number: number;
  text: string;
  difficulty: Difficulty;
  marks: number;
}

export interface Section {
  title: string;
  questionType: string;
  instruction: string;
  questions: Question[];
}

export interface AnswerKeyEntry {
  number: number;
  answer: string;
}

export interface GeneratedPaper {
  schoolName: string;
  subject: string;
  className: string;
  timeAllowed: number;
  totalMarks: number;
  sections: Section[];
  answerKey: AnswerKeyEntry[];
}

/**
 * Real-time WebSocket payloads emitted by the worker / API.
 */
export interface JobProgressPayload {
  progress: number;
  message: string;
}
export interface JobCompletePayload {
  paperId: string;
}
export interface JobErrorPayload {
  error: string;
}

/**
 * HTTP response envelope used by every backend endpoint.
 */
export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; fields?: Record<string, string> };
