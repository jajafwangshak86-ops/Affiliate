import { createClient } from 'redis';

const client = createClient({ url: process.env.REDIS_URL ?? 'redis://localhost:6379' });
client.connect().catch((err) => console.error('[Deduplicator] Redis connect error:', err));

export async function isDuplicate(saleId: string): Promise<boolean> {
  const exists = await client.exists(`sale:${saleId}`);
  return exists === 1;
}

export async function markProcessed(saleId: string): Promise<void> {
  // TTL of 90 days — long enough to prevent replay, short enough to not grow unbounded
  await client.set(`sale:${saleId}`, '1', { EX: 60 * 60 * 24 * 90 });
}

export async function getProcessedCount(): Promise<number> {
  let count = 0;
  for await (const _ of client.scanIterator({ MATCH: 'sale:*', COUNT: 100 })) {
    count++;
  }
  return count;
}

export async function closeConnection(): Promise<void> {
  await client.quit();
}
