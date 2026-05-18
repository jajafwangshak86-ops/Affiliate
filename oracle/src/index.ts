import express from 'express';
import dotenv from 'dotenv';
import { saleRouter } from './routes/sale';

dotenv.config();

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/sale', saleRouter);

const PORT = process.env.PORT ?? 3001;
app.listen(PORT, () => console.log(`Oracle running on port ${PORT}`));
