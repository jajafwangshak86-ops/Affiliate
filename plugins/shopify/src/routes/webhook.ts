import { Router, Request, Response } from 'express';
import { createHash, createHmac, timingSafeEqual } from 'crypto';
import { signAttestation } from '../verifier';
import fetch from 'node-fetch';

export const webhookRouter = Router();

interface ShopifyOrder {
  id: number;
  total_price: string;
  note_attributes?: Array<{ name: string; value: string }>;
}

function verifyShopifyHmac(body: Buffer, hmacHeader: string): boolean {
  const secret = process.env.SHOPIFY_API_SECRET!;
  const digest = createHmac('sha256', secret).update(body).digest('base64');
  try {
    return timingSafeEqual(Buffer.from(digest), Buffer.from(hmacHeader));
  } catch {
    return false;
  }
}

// Use raw body for HMAC verification
webhookRouter.post(
  '/orders/paid',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response) => {
    const hmacHeader = req.headers['x-shopify-hmac-sha256'] as string;
    if (!hmacHeader || !verifyShopifyHmac(req.body as Buffer, hmacHeader)) {
      return res.status(401).json({ error: 'Invalid HMAC' });
    }

    const order = JSON.parse((req.body as Buffer).toString()) as ShopifyOrder;
    const affiliateAttr = order.note_attributes?.find((a) => a.name === 'affiliate_ref');
    if (!affiliateAttr) return res.sendStatus(200);

    const affiliate = affiliateAttr.value;
    const amount = Math.round(parseFloat(order.total_price) * 1_000_000); // to USDC micro-units
    const campaignId = parseInt(process.env.CAMPAIGN_ID ?? '1', 10);
    const saleIdBuf = createHash('sha256')
      .update(`${order.id}${affiliate}`)
      .digest();
    const saleId = saleIdBuf.toString('hex');

    try {
      const sig = await signAttestation(
        saleIdBuf,
        affiliate,
        campaignId,
        amount,
        process.env.ORACLE_PRIVATE_KEY!
      );

      await fetch(`${process.env.ORACLE_ENDPOINT}/sale`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          saleId,
          affiliate,
          campaignId,
          amount,
          signature: sig,
          merchantPubkey: process.env.MERCHANT_PUBKEY ?? '',
          tokenContract: process.env.TOKEN_CONTRACT ?? '',
        }),
      });
    } catch (err) {
      console.error('[Shopify] Oracle submission failed:', err);
    }

    return res.sendStatus(200);
  }
);

// avoid circular import — import express here
import express from 'express';
