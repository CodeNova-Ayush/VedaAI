/**
 * Frontend-specific re-exports of the shared types so existing components
 * can keep importing from `@/types` without knowing about the workspace.
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

import type {
  JobStatus,
  QuestionType,
  Assignment,
  Question,
  Section,
} from '@veda-ai/shared';

/** Backwards-compatible aliases used by existing frontend modules. */
export type AssignmentStatus = JobStatus;
export type QuestionTypeRow = QuestionType;
export type AssignmentSummary = Assignment;
export type GeneratedQuestion = Question;
export type GeneratedSection = Section;
