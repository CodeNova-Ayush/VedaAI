import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Assignment } from '../models/Assignment';
import { GeneratedPaper } from '../models/GeneratedPaper';
import { enqueuePaperJob } from '../services/queueService';
import { cacheGetPaper, cacheInvalidatePaper } from '../services/cacheService';
import type { ApiResponse } from '../types';

const questionTypeSchema = z.object({
  type: z.string().min(1, 'Question type is required'),
  count: z.coerce.number().int().min(1, 'At least 1 question').max(50, 'At most 50 questions'),
  marks: z.coerce.number().int().min(1, 'At least 1 mark').max(100, 'At most 100 marks'),
});

const createSchema = z.object({
  dueDate: z.string().refine((v) => !Number.isNaN(Date.parse(v)), { message: 'Invalid date' }),
  questionTypes: z.array(questionTypeSchema).min(1, 'Add at least one question type'),
  additionalInstructions: z.string().optional().default(''),
});

function deriveTitle(instr: string, firstType: string): string {
  const trimmed = instr.trim();
  if (trimmed.length > 0) {
    return trimmed.length > 80 ? trimmed.slice(0, 77) + '...' : trimmed;
  }
  return `${firstType} Question Paper`;
}

export async function createAssignment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let questionTypesRaw: unknown;
    try {
      questionTypesRaw =
        typeof req.body.questionTypes === 'string'
          ? JSON.parse(req.body.questionTypes)
          : req.body.questionTypes;
    } catch {
      res.status(400).json({ success: false, error: 'questionTypes must be valid JSON' });
      return;
    }

    const parsed = createSchema.parse({
      dueDate: req.body.dueDate,
      questionTypes: questionTypesRaw,
      additionalInstructions: req.body.additionalInstructions ?? '',
    });

    const due = new Date(parsed.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (due < today) {
      res.status(400).json({
        success: false,
        error: 'Due date must be today or later',
        fields: { dueDate: 'Due date must be today or later' },
      });
      return;
    }

    const fileUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
    const title = deriveTitle(parsed.additionalInstructions ?? '', parsed.questionTypes[0].type);

    const assignment = await Assignment.create({
      title,
      dueDate: due,
      questionTypes: parsed.questionTypes,
      additionalInstructions: parsed.additionalInstructions,
      fileUrl,
      status: 'pending',
    });

    await enqueuePaperJob(assignment._id.toString());

    const payload: ApiResponse<{ assignmentId: string }> = {
      success: true,
      data: { assignmentId: assignment._id.toString() },
    };
    res.status(201).json(payload);
  } catch (err) {
    next(err);
  }
}

export async function listAssignments(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const items = await Assignment.find().sort({ createdAt: -1 }).lean();
    res.json({
      success: true,
      data: items.map((a) => ({
        id: a._id.toString(),
        title: a.title,
        dueDate: a.dueDate,
        questionTypes: a.questionTypes,
        status: a.status,
        createdAt: a.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
}

export async function getAssignment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const a = await Assignment.findById(req.params.id).lean();
    if (!a) {
      res.status(404).json({ success: false, error: 'Assignment not found' });
      return;
    }
    res.json({
      success: true,
      data: {
        id: a._id.toString(),
        title: a.title,
        dueDate: a.dueDate,
        questionTypes: a.questionTypes,
        additionalInstructions: a.additionalInstructions,
        fileUrl: a.fileUrl,
        status: a.status,
        resultId: a.resultId?.toString(),
        createdAt: a.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getAssignmentResult(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id;
    const cached = await cacheGetPaper(id);
    if (cached) {
      res.json({ success: true, data: { status: 'complete', paper: cached } });
      return;
    }
    const a = await Assignment.findById(id).lean();
    if (!a) {
      res.status(404).json({ success: false, error: 'Assignment not found' });
      return;
    }
    if (a.status !== 'complete' || !a.resultId) {
      res.json({ success: true, data: { status: a.status } });
      return;
    }
    const paper = await GeneratedPaper.findById(a.resultId).lean();
    if (!paper) {
      res.json({ success: true, data: { status: 'processing' } });
      return;
    }
    res.json({ success: true, data: { status: 'complete', paper } });
  } catch (err) {
    next(err);
  }
}

export async function deleteAssignment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id;
    const a = await Assignment.findById(id);
    if (!a) {
      res.status(404).json({ success: false, error: 'Assignment not found' });
      return;
    }
    if (a.resultId) {
      await GeneratedPaper.findByIdAndDelete(a.resultId);
    }
    await Assignment.findByIdAndDelete(id);
    await cacheInvalidatePaper(id);
    res.json({ success: true, data: { id } });
  } catch (err) {
    next(err);
  }
}

export async function regenerateAssignment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id;
    const a = await Assignment.findById(id);
    if (!a) {
      res.status(404).json({ success: false, error: 'Assignment not found' });
      return;
    }
    if (a.resultId) {
      await GeneratedPaper.findByIdAndDelete(a.resultId);
      a.resultId = undefined;
    }
    a.status = 'pending';
    await a.save();
    await cacheInvalidatePaper(id);
    await enqueuePaperJob(id);
    res.json({ success: true, data: { assignmentId: id } });
  } catch (err) {
    next(err);
  }
}
