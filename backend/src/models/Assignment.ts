import { Schema, model, Document, Types } from 'mongoose';
import type { AssignmentStatus, QuestionTypeRow } from '../types';

export interface AssignmentDoc extends Document {
  _id: Types.ObjectId;
  title: string;
  dueDate: Date;
  questionTypes: QuestionTypeRow[];
  additionalInstructions?: string;
  fileUrl?: string;
  status: AssignmentStatus;
  resultId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionTypeSchema = new Schema<QuestionTypeRow>(
  {
    type: { type: String, required: true },
    count: { type: Number, required: true, min: 1, max: 50 },
    marks: { type: Number, required: true, min: 1, max: 100 },
  },
  { _id: false },
);

const AssignmentSchema = new Schema<AssignmentDoc>(
  {
    title: { type: String, required: true },
    dueDate: { type: Date, required: true },
    questionTypes: { type: [QuestionTypeSchema], required: true },
    additionalInstructions: { type: String },
    fileUrl: { type: String },
    status: {
      type: String,
      enum: ['pending', 'processing', 'complete', 'failed'],
      default: 'pending',
    },
    resultId: { type: Schema.Types.ObjectId, ref: 'GeneratedPaper' },
  },
  { timestamps: true },
);

export const Assignment = model<AssignmentDoc>('Assignment', AssignmentSchema);
