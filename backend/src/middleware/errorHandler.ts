import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    const fields: Record<string, string> = {};
    for (const issue of err.issues) {
      const key = issue.path.join('.') || '_';
      fields[key] = issue.message;
    }
    res.status(400).json({ success: false, error: 'Validation failed', fields });
    return;
  }
  if (err instanceof Error) {
    console.error('[error]', err.message);
    res.status(500).json({ success: false, error: err.message });
    return;
  }
  res.status(500).json({ success: false, error: 'Unknown server error' });
}
