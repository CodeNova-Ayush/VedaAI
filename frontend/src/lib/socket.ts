/**
 * Socket facade. Prefers a real Socket.io connection. If the API isn't
 * reachable, falls back to the in-browser mock event bus.
 */
import { io, Socket } from 'socket.io-client';
import { isRealBackendReachable, mockBus } from './mockBackend';

let realSocket: Socket | null = null;

function getRealSocket(): Socket | null {
  const url = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (!url) return null;
  if (
    url.includes('localhost') &&
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
  ) {
    return null;
  }
  if (realSocket) return realSocket;
  realSocket = io(url, {
    transports: ['websocket', 'polling'],
    autoConnect: true,
    timeout: 5000,
    reconnectionAttempts: 2,
  });
  return realSocket;
}

export interface JobEventHandlers {
  onProgress?: (p: { progress: number; message: string }) => void;
  onComplete?: (p: { paperId: string }) => void;
  onError?: (p: { error: string }) => void;
}

export async function subscribeToJob(
  assignmentId: string,
  handlers: JobEventHandlers,
): Promise<() => void> {
  const reachable = await isRealBackendReachable();
  if (!reachable) {
    const offProgress = handlers.onProgress
      ? mockBus.onProgress(assignmentId, handlers.onProgress)
      : () => undefined;
    const offComplete = handlers.onComplete
      ? mockBus.onComplete(assignmentId, handlers.onComplete)
      : () => undefined;
    const offError = handlers.onError
      ? mockBus.onError(assignmentId, handlers.onError)
      : () => undefined;
    return () => {
      offProgress();
      offComplete();
      offError();
    };
  }

  const socket = getRealSocket();
  if (!socket) return () => undefined;

  const join = (): void => {
    socket.emit('subscribe', assignmentId);
  };
  if (socket.connected) join();
  socket.on('connect', join);

  const onProgress = (p: { progress: number; message: string }): void => handlers.onProgress?.(p);
  const onComplete = (p: { paperId: string }): void => handlers.onComplete?.(p);
  const onError = (p: { error: string }): void => handlers.onError?.(p);
  socket.on('job:progress', onProgress);
  socket.on('job:complete', onComplete);
  socket.on('job:error', onError);

  return () => {
    socket.emit('unsubscribe', assignmentId);
    socket.off('connect', join);
    socket.off('job:progress', onProgress);
    socket.off('job:complete', onComplete);
    socket.off('job:error', onError);
  };
}
