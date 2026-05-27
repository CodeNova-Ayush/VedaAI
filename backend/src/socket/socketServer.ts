import { Server as HttpServer } from 'http';
import { Server as IOServer, Socket } from 'socket.io';

let io: IOServer | null = null;

/**
 * Build a CORS origin checker. Accepts:
 *   - "*"  → allow any origin
 *   - explicit URL  → exact match
 *   - "*.vercel.app" pattern  → suffix match
 *   - comma-separated list of any of the above
 */
function buildOriginChecker(spec: string): (origin: string | undefined) => boolean {
  const trimmed = spec.trim();
  if (trimmed === '*' || trimmed === '') return () => true;
  const items = trimmed.split(',').map((s) => s.trim()).filter(Boolean);
  return (origin) => {
    if (!origin) return true; // server-to-server / curl / health checks
    return items.some((it) => {
      if (it === '*') return true;
      if (it.startsWith('*.')) {
        const suffix = it.slice(1); // ".vercel.app"
        try {
          const host = new URL(origin).host;
          return host.endsWith(suffix.slice(1)) || host.endsWith(suffix);
        } catch {
          return false;
        }
      }
      return it === origin;
    });
  };
}

export function initSocket(server: HttpServer, frontendUrl: string): IOServer {
  const isAllowed = buildOriginChecker(frontendUrl || '*');
  io = new IOServer(server, {
    cors: {
      origin: (origin, cb) => cb(null, isAllowed(origin)),
      credentials: true,
    },
  });
  io.on('connection', (socket: Socket) => {
    socket.on('subscribe', (assignmentId: string) => {
      if (typeof assignmentId === 'string' && assignmentId.length > 0) {
        socket.join(`assignment:${assignmentId}`);
      }
    });
    socket.on('unsubscribe', (assignmentId: string) => {
      if (typeof assignmentId === 'string' && assignmentId.length > 0) {
        socket.leave(`assignment:${assignmentId}`);
      }
    });
  });
  return io;
}

export function getIO(): IOServer {
  if (!io) throw new Error('socket.io not initialized');
  return io;
}

export type ProgressPayload = { progress: number; message: string };
export type CompletePayload = { paperId: string };
export type ErrorPayload = { error: string };

export function emitProgress(assignmentId: string, payload: ProgressPayload): void {
  if (!io) return;
  io.to(`assignment:${assignmentId}`).emit('job:progress', payload);
}
export function emitComplete(assignmentId: string, payload: CompletePayload): void {
  if (!io) return;
  io.to(`assignment:${assignmentId}`).emit('job:complete', payload);
}
export function emitError(assignmentId: string, payload: ErrorPayload): void {
  if (!io) return;
  io.to(`assignment:${assignmentId}`).emit('job:error', payload);
}

export { buildOriginChecker };
