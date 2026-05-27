import 'dotenv/config';
import http from 'http';
import path from 'path';
import express from 'express';
import cors from 'cors';
import { connectMongo } from './config/db';
import assignmentsRouter from './routes/assignments';
import { errorHandler } from './middleware/errorHandler';
import { buildOriginChecker, initSocket } from './socket/socketServer';
import { startEventBusSubscriber } from './socket/eventBus';

async function connectMongoWithRetry(uri: string): Promise<void> {
  let lastErr: unknown;
  for (let i = 0; i < 5; i += 1) {
    try {
      await connectMongo(uri);
      return;
    } catch (err) {
      lastErr = err;
      console.error(`[api] mongo connection attempt ${i + 1} failed:`, (err as Error).message);
      await new Promise((r) => setTimeout(r, 3_000 * (i + 1)));
    }
  }
  throw lastErr;
}

async function main(): Promise<void> {
  const port = Number(process.env.PORT ?? 4000);
  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error('MONGODB_URI is not set');

  await connectMongoWithRetry(mongoUri);

  const app = express();
  const isAllowed = buildOriginChecker(frontendUrl);
  app.use(
    cors({
      origin: (origin, cb) => cb(null, isAllowed(origin)),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '2mb' }));
  app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

  app.get('/health', (_req, res) => {
    res.json({ success: true, data: { ok: true } });
  });
  app.get('/', (_req, res) => {
    res.json({ success: true, data: { service: 'veda-ai-api', ok: true } });
  });

  app.use('/api/assignments', assignmentsRouter);
  app.use(errorHandler);

  const server = http.createServer(app);
  initSocket(server, frontendUrl);
  startEventBusSubscriber();

  server.listen(port, '0.0.0.0', () => {
    console.log(`[api] listening on http://0.0.0.0:${port}`);
  });
}

main().catch((err) => {
  console.error('[fatal]', err);
  process.exit(1);
});
