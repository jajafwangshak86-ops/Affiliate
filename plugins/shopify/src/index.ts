import express from 'express';
import dotenv from 'dotenv';
import { webhookRouter } from './routes/webhook';

dotenv.config();

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/webhooks', webhookRouter);

const PORT = process.env.PORT ?? 3002;
app.listen(PORT, () => console.log(`Shopify app running on port ${PORT}`));
