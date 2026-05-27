/**
 * Browser-side replica of the backend's offline question paper generator.
 * Used by the mock backend when the real API is not reachable.
 */
import type {
  AnswerKeyEntry,
  Difficulty,
  GeneratedPaper,
  QuestionType,
  Section,
  Question,
} from '@/types';

const DIFFICULTY_CYCLE: Difficulty[] = [
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
  return {
    subject,
    className: `${grade}th`,
    schoolName: 'Delhi Public School, Sector-4, Bokaro',
  };
}

function instructionFor(_type: string, marksPer: number): string {
  return `Attempt all questions. Each question carries ${marksPer} mark${marksPer === 1 ? '' : 's'}.`;
}

function questionsForRow(
  type: string,
  count: number,
  startNumber: number,
  _marksPer: number,
  subject: string,
): { question: string; answer: string; difficulty: Difficulty }[] {
  const out: { question: string; answer: string; difficulty: Difficulty }[] = [];
  const lower = type.toLowerCase();
  for (let i = 0; i < count; i += 1) {
    const n = startNumber + i;
    const difficulty = DIFFICULTY_CYCLE[i % DIFFICULTY_CYCLE.length];
    let question: string;
    let answer: string;
    if (lower.includes('multiple choice')) {
      question = `${subject} MCQ ${n}: Choose the correct option about a key concept covered in class. (a) Option A  (b) Option B  (c) Option C  (d) Option D`;
      answer = `Option ${'ABCD'[i % 4]} — refer to the textbook chapter for justification.`;
    } else if (lower.includes('short')) {
      question = `Briefly explain a core ${subject.toLowerCase()} concept covered in class. Limit your answer to 3-4 sentences.`;
      answer = `Sample answer: define the concept, mention its key property, give one real-world example.`;
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

export interface GenerateInput {
  questionTypes: QuestionType[];
  additionalInstructions?: string;
}

export function generatePaperOffline(input: GenerateInput): GeneratedPaper {
  const ctx = guessContext(input.additionalInstructions ?? '');
  const totalMarks = input.questionTypes.reduce((s, r) => s + r.count * r.marks, 0);
  const totalQuestions = input.questionTypes.reduce((s, r) => s + r.count, 0);
  const timeAllowed = Math.max(30, totalQuestions * 3);

  const sections: Section[] = [];
  const answerKey: AnswerKeyEntry[] = [];
  let runningNumber = 1;
  for (let i = 0; i < input.questionTypes.length; i += 1) {
    const row = input.questionTypes[i];
    const letter = String.fromCharCode(65 + i);
    const items = questionsForRow(row.type, row.count, runningNumber, row.marks, ctx.subject);
    const questions: Question[] = items.map((it, idx) => ({
      number: runningNumber + idx,
      text: it.question,
      difficulty: it.difficulty,
      marks: row.marks,
    }));
    sections.push({
      title: `Section ${letter}`,
      questionType: row.type,
      instruction: instructionFor(row.type, row.marks),
      questions,
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
