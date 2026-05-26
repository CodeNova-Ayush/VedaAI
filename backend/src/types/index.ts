/**
 * Backend-specific re-exports of the shared types so internal modules can
 * keep importing from `../types` without knowing about the workspace package.
 *
 * NEVER define duplicate types here — add new shared types to
 * `shared/types/index.ts` instead.
 */
export type {
  Difficulty,
  JobStatus,
  QuestionType,
  Assignment,
  Question,
  Section,
  GeneratedPaper,
  AnswerKeyEntry,
  JobProgressPayload,
  JobCompletePayload,
  JobErrorPayload,
  ApiResponse,
} from '@veda-ai/shared';

import type { JobStatus, QuestionType, GeneratedPaper, ApiResponse } from '@veda-ai/shared';

/**
 * Backwards-compatible aliases used by existing backend modules.
 * These all reference the shared types — no duplication.
 */
export type AssignmentStatus = JobStatus;
export type QuestionTypeRow = QuestionType;
export type GeneratedPaperShape = GeneratedPaper;
export type ApiSuccess<T> = Extract<ApiResponse<T>, { success: true }>;
export type ApiFailure = Extract<ApiResponse<unknown>, { success: false }>;

import type { Question, Section } from '@veda-ai/shared';
export type GeneratedQuestion = Question;
export type GeneratedSection = Section;
