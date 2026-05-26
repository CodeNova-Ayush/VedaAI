import type { AssignmentDoc } from '../models/Assignment';

export interface BuiltPrompt {
  system: string;
  user: string;
}

export function buildPrompt(assignment: AssignmentDoc): BuiltPrompt {
  const totalQuestions = assignment.questionTypes.reduce((s, r) => s + r.count, 0);
  const totalMarks = assignment.questionTypes.reduce((s, r) => s + r.count * r.marks, 0);

  const sectionLines = assignment.questionTypes
    .map((row, i) => {
      const letter = String.fromCharCode(65 + i);
      return `Section ${letter}: ${row.count} ${row.type} question(s), each carrying ${row.marks} mark(s).`;
    })
    .join('\n');

  const system = [
    'You are an expert exam-paper writing assistant.',
    'You produce question papers in strict JSON only.',
    'Never include markdown, code fences, or any text outside a single JSON object.',
    'The JSON object must match this TypeScript shape exactly:',
    '{',
    '  "schoolName": string,',
    '  "subject": string,',
    '  "className": string,',
    '  "timeAllowed": number,        // minutes',
    '  "totalMarks": number,',
    '  "sections": [',
    '    {',
    '      "title": string,          // e.g. "Section A"',
    '      "questionType": string,   // e.g. "Multiple Choice Questions"',
    '      "instruction": string,    // italic instruction line for the section',
    '      "questions": [',
    '        {',
    '          "number": number,',
    '          "text": string,',
    '          "difficulty": "easy" | "moderate" | "hard" | "challenging",',
    '          "marks": number',
    '        }',
    '      ]',
    '    }',
    '  ],',
    '  "answerKey": [ { "number": number, "answer": string } ]',
    '}',
    'Distribute difficulty levels naturally across each section.',
    'Number questions sequentially across the whole paper starting at 1.',
    'Provide an answer for every question in answerKey.',
  ].join('\n');

  const user = [
    'Generate a complete question paper using this brief:',
    '',
    `Due date: ${assignment.dueDate.toISOString().slice(0, 10)}`,
    `Total questions: ${totalQuestions}`,
    `Total marks: ${totalMarks}`,
    '',
    'Section breakdown:',
    sectionLines,
    '',
    'Additional instructions from teacher:',
    assignment.additionalInstructions?.trim() || '(none provided — infer a reasonable subject and class)',
    '',
    'Use a plausible school name, subject and class consistent with the teacher\'s instructions.',
    'Pick a sensible timeAllowed in minutes for the workload.',
    'Return ONLY the JSON object. No prose. No markdown.',
  ].join('\n');

  return { system, user };
}
