import { Router, Request, Response } from 'express';
import { verifySaleSignature, signAttestation } from '../verifier';
import { broadcastPayout } from '../broadcaster';
import { isDuplicate, markProcessed } from '../deduplicator';

export const saleRouter = Router();

interface SalePayload {
  saleId: string;
  affiliate: string;
  campaignId: number;
  amount: number;
  signature: string;
  merchantPubkey: string;
  tokenContract: string;
}

saleRouter.post('/', async (req: Request, res: Response) => {
  const { saleId, affiliate, campaignId, amount, signature, merchantPubkey, tokenContract } =
    req.body as SalePayload;

  if (!saleId || !affiliate || !campaignId || !amount || !signature || !merchantPubkey) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (await isDuplicate(saleId)) {
    return res.status(409).json({ error: 'Duplicate sale' });
  }

  const valid = verifySaleSignature(saleId, affiliate, campaignId, amount, signature, merchantPubkey);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  try {
    const saleIdBuf = Buffer.from(saleId, 'hex');
    const attestationSig = await signAttestation(
      saleIdBuf,
      affiliate,
      campaignId,
      amount,
      process.env.ORACLE_PRIVATE_KEY!
    );

    const txid = await broadcastPayout(saleIdBuf, affiliate, campaignId, amount, attestationSig, tokenContract);
    await markProcessed(saleId);
    return res.json({ txid });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
});
