import { Server as HttpServer } from 'http';
import { Server as IOServer, Socket } from 'socket.io';

let io: IOServer | null = null;

export function initSocket(server: HttpServer, frontendUrl: string): IOServer {
  io = new IOServer(server, {
    cors: { origin: frontendUrl, credentials: true },
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
