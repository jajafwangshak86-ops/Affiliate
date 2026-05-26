import express from 'express';
import dotenv from 'dotenv';
import { saleRouter } from './routes/sale';
import { getProcessedCount, closeConnection } from './deduplicator';

dotenv.config();

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.get('/stats', async (_req, res) => {
  try {
    const processed = await getProcessedCount();
    res.json({ processed });
  } catch {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

app.use('/sale', saleRouter);

const PORT = process.env.PORT ?? 3001;
const server = app.listen(PORT, () => console.log(`Oracle running on port ${PORT}`));

async function shutdown() {
  console.log('Shutting down oracle...');
  server.close(async () => {
    await closeConnection();
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
