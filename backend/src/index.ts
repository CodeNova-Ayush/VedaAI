import 'dotenv/config';
import http from 'http';
import path from 'path';
import express from 'express';
import cors from 'cors';
import { connectMongo } from './config/db';
import assignmentsRouter from './routes/assignments';
import { errorHandler } from './middleware/errorHandler';
import { initSocket } from './socket/socketServer';
import { startEventBusSubscriber } from './socket/eventBus';

async function main(): Promise<void> {
  const port = Number(process.env.PORT ?? 4000);
  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error('MONGODB_URI is not set');

  await connectMongo(mongoUri);

  const app = express();
  app.use(cors({ origin: frontendUrl, credentials: true }));
  app.use(express.json({ limit: '2mb' }));
  app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

  app.get('/health', (_req, res) => {
    res.json({ success: true, data: { ok: true } });
  });

  app.use('/api/assignments', assignmentsRouter);
  app.use(errorHandler);

  const server = http.createServer(app);
  initSocket(server, frontendUrl);
  startEventBusSubscriber();

  server.listen(port, () => {
    console.log(`[api] listening on http://localhost:${port}`);
  });
}

main().catch((err) => {
  console.error('[fatal]', err);
  process.exit(1);
});
