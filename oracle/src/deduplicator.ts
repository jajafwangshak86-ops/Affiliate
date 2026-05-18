// In-memory deduplication store.
// Replace with Redis or a database for production.
const processed = new Set<string>();

export function isDuplicate(saleId: string): boolean {
  return processed.has(saleId);
}

export function markProcessed(saleId: string): void {
  processed.add(saleId);
}
