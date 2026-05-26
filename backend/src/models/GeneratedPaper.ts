import { Schema, model, Document, Types } from 'mongoose';
import type { Difficulty, GeneratedSection } from '../types';

export interface GeneratedPaperDoc extends Document {
  _id: Types.ObjectId;
  assignmentId: Types.ObjectId;
  schoolName: string;
  subject: string;
  className: string;
  timeAllowed: number;
  totalMarks: number;
  sections: GeneratedSection[];
  answerKey: { number: number; answer: string }[];
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema(
  {
    number: { type: Number, required: true },
    text: { type: String, required: true },
    difficulty: {
      type: String,
      enum: ['easy', 'moderate', 'hard', 'challenging'] as Difficulty[],
      required: true,
    },
    marks: { type: Number, required: true },
  },
  { _id: false },
);

const SectionSchema = new Schema(
  {
    title: { type: String, required: true },
    questionType: { type: String, required: true },
    instruction: { type: String, required: true },
    questions: { type: [QuestionSchema], required: true },
  },
  { _id: false },
);

const AnswerSchema = new Schema(
  {
    number: { type: Number, required: true },
    answer: { type: String, required: true },
  },
  { _id: false },
);

const GeneratedPaperSchema = new Schema<GeneratedPaperDoc>(
  {
    assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true },
    schoolName: { type: String, required: true },
    subject: { type: String, required: true },
    className: { type: String, required: true },
    timeAllowed: { type: Number, required: true },
    totalMarks: { type: Number, required: true },
    sections: { type: [SectionSchema], required: true },
    answerKey: { type: [AnswerSchema], required: true },
  },
  { timestamps: true },
);

export const GeneratedPaper = model<GeneratedPaperDoc>('GeneratedPaper', GeneratedPaperSchema);
