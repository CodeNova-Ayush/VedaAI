import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import type { AssignmentDoc } from '../models/Assignment';
import type { GeneratedPaperShape } from '../types';

const difficultyEnum = z.enum(['easy', 'moderate', 'hard', 'challenging']);

const questionSchema = z.object({
  number: z.number().int().positive(),
  text: z.string().min(1),
  difficulty: difficultyEnum,
  marks: z.number().int().positive(),
});

const sectionSchema = z.object({
  title: z.string().min(1),
  questionType: z.string().min(1),
  instruction: z.string().min(1),
  questions: z.array(questionSchema).min(1),
});

const paperSchema = z.object({
  schoolName: z.string().min(1),
  subject: z.string().min(1),
  className: z.string().min(1),
  timeAllowed: z.number().int().positive(),
  totalMarks: z.number().int().positive(),
  sections: z.array(sectionSchema).min(1),
  answerKey: z.array(z.object({ number: z.number().int().positive(), answer: z.string().min(1) })).min(1),
});

export type ValidatedPaper = z.infer<typeof paperSchema>;

let client: Anthropic | null = null;
function getClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  if (client) return client;
  client = new Anthropic({ apiKey });
  return client;
}

function stripFences(raw: string): string {
  let s = raw.trim();
  if (s.startsWith('```')) {
    s = s.replace(/^```(?:json)?\s*/i, '').replace(/```$/m, '').trim();
  }
  const first = s.indexOf('{');
  const last = s.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) {
    s = s.slice(first, last + 1);
  }
  return s;
}

export async function generatePaperWithLLM(
  systemPrompt: string,
  userPrompt: string,
): Promise<GeneratedPaperShape> {
  const c = getClient();
  if (!c) throw new Error('ANTHROPIC_API_KEY is not set');
  const resp = await c.messages.create({
    model: 'claude-3-5-sonnet-latest',
    max_tokens: 4096,
    temperature: 0.4,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });
  const textBlock = resp.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('LLM returned no text content');
  }
  const cleaned = stripFences(textBlock.text);
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error('Failed to JSON.parse LLM output: ' + (err as Error).message);
  }
  const validated = paperSchema.parse(parsed);
  return validated;
}

/* ---------- Deterministic offline fallback (used when no API key) ---------- */

const DIFFICULTY_CYCLE: Array<'easy' | 'moderate' | 'challenging'> = [
  'easy',
  'moderate',
  'easy',
  'moderate',
  'moderate',
  'challenging',
  'challenging',
  'easy',
  'moderate',
  'challenging',
];

interface SubjectGuess {
  subject: string;
  className: string;
  schoolName: string;
}

function guessContext(instructions: string): SubjectGuess {
  const text = instructions.toLowerCase();
  const subjectKeywords: Array<[string, string]> = [
    ['science', 'Science'],
    ['physics', 'Physics'],
    ['chemistry', 'Chemistry'],
    ['biology', 'Biology'],
    ['math', 'Mathematics'],
    ['mathematics', 'Mathematics'],
    ['english', 'English'],
    ['history', 'History'],
    ['geography', 'Geography'],
    ['social', 'Social Studies'],
    ['computer', 'Computer Science'],
  ];
  let subject = 'General Knowledge';
  for (const [k, v] of subjectKeywords) {
    if (text.includes(k)) {
      subject = v;
      break;
    }
  }
  const gradeMatch = text.match(/grade\s*(\d{1,2})|class\s*(\d{1,2})/);
  const grade = gradeMatch?.[1] || gradeMatch?.[2] || '8';
  const className = `${grade}th`;
  return {
    subject,
    className,
    schoolName: 'Delhi Public School, Sector-4, Bokaro',
  };
}

function instructionFor(type: string, marksPer: number): string {
  return `Attempt all questions. Each question carries ${marksPer} mark${marksPer === 1 ? '' : 's'}.`;
}

function templateQuestionsFor(
  type: string,
  count: number,
  startNumber: number,
  marksPer: number,
  subject: string,
): { question: string; answer: string; difficulty: 'easy' | 'moderate' | 'challenging' }[] {
  const out: { question: string; answer: string; difficulty: 'easy' | 'moderate' | 'challenging' }[] = [];
  const lower = type.toLowerCase();
  for (let i = 0; i < count; i += 1) {
    const n = startNumber + i;
    const difficulty = DIFFICULTY_CYCLE[i % DIFFICULTY_CYCLE.length];
    let question: string;
    let answer: string;
    if (lower.includes('multiple choice')) {
      question = `${subject} MCQ ${n}: Choose the correct option about a key concept covered in class. (a) Option A  (b) Option B  (c) Option C  (d) Option D`;
      answer = `Option ${'ABCD'[i % 4]} — refer to the textbook chapter on this topic for justification.`;
    } else if (lower.includes('short')) {
      question = `Briefly explain a core ${subject.toLowerCase()} concept covered in class. Limit your answer to 3-4 sentences.`;
      answer = `Sample answer: Define the concept, mention its key property, and give one real-world example. Award full marks for clear definition with at least one example.`;
    } else if (lower.includes('diagram') || lower.includes('graph')) {
      question = `Draw a labelled diagram illustrating an important ${subject.toLowerCase()} idea, and explain each label in one line.`;
      answer = `Award marks for accuracy of diagram, correctness of labels, and clarity of one-line explanations.`;
    } else if (lower.includes('numerical') || lower.includes('problem')) {
      question = `Solve the following ${subject.toLowerCase()} problem showing all working: assume a representative dataset and compute the required quantity.`;
      answer = `Award marks step-wise: setup, formula, substitution, calculation, and final unit.`;
    } else if (lower.includes('long')) {
      question = `Write a detailed answer (about half a page) describing an important ${subject.toLowerCase()} topic, including definitions, mechanism, and applications.`;
      answer = `Award marks for definition, mechanism, applications, and clarity of writing.`;
    } else if (lower.includes('true') || lower.includes('false')) {
      question = `True or False: A foundational statement about ${subject.toLowerCase()} that students should evaluate.`;
      answer = i % 2 === 0 ? 'True' : 'False';
    } else {
      question = `${type}: A ${difficulty} question about ${subject.toLowerCase()} covered in the syllabus.`;
      answer = `Sample expected answer outline; teacher to grade based on rubric.`;
    }
    out.push({ question, answer, difficulty });
  }
  return out;
}

export function generatePaperOffline(assignment: AssignmentDoc): GeneratedPaperShape {
  const ctx = guessContext(assignment.additionalInstructions ?? '');
  const totalMarks = assignment.questionTypes.reduce((s, r) => s + r.count * r.marks, 0);
  const totalQuestions = assignment.questionTypes.reduce((s, r) => s + r.count, 0);
  const timeAllowed = Math.max(30, totalQuestions * 3);

  const sections = [];
  const answerKey: { number: number; answer: string }[] = [];
  let runningNumber = 1;
  for (let i = 0; i < assignment.questionTypes.length; i += 1) {
    const row = assignment.questionTypes[i];
    const letter = String.fromCharCode(65 + i);
    const items = templateQuestionsFor(row.type, row.count, runningNumber, row.marks, ctx.subject);
    sections.push({
      title: `Section ${letter}`,
      questionType: row.type,
      instruction: instructionFor(row.type, row.marks),
      questions: items.map((it, idx) => ({
        number: runningNumber + idx,
        text: it.question,
        difficulty: it.difficulty,
        marks: row.marks,
      })),
    });
    items.forEach((it, idx) => {
      answerKey.push({ number: runningNumber + idx, answer: it.answer });
    });
    runningNumber += row.count;
  }

  return {
    schoolName: ctx.schoolName,
    subject: ctx.subject,
    className: ctx.className,
    timeAllowed,
    totalMarks,
    sections,
    answerKey,
  };
}

export function isLLMAvailable(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}
