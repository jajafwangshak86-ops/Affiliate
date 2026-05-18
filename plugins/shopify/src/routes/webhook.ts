import { Router, Request, Response } from 'express';
import { createHash } from 'crypto';
import fetch from 'node-fetch';

export const webhookRouter = Router();

interface ShopifyOrder {
  id: number;
  total_price: string;
  note_attributes?: Array<{ name: string; value: string }>;
}

webhookRouter.post('/orders/paid', async (req: Request, res: Response) => {
  const order = req.body as ShopifyOrder;

  const affiliateAttr = order.note_attributes?.find((a) => a.name === 'affiliate_ref');
  if (!affiliateAttr) return res.sendStatus(200);

  const affiliate = affiliateAttr.value;
  const amount = Math.round(parseFloat(order.total_price) * 100);
  const campaignId = parseInt(process.env.CAMPAIGN_ID ?? '1', 10);
  const saleId = createHash('sha256')
    .update(`${order.id}${affiliate}${Date.now()}`)
    .digest('hex');

  try {
    await fetch(`${process.env.ORACLE_ENDPOINT}/sale`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        saleId,
        affiliate,
        campaignId,
        amount,
        signature: '',        // Shopify app uses server-side signing — oracle trusts this endpoint
        merchantPubkey: process.env.MERCHANT_PUBKEY ?? '',
        tokenContract: process.env.TOKEN_CONTRACT ?? '',
      }),
    });
  } catch (err) {
    console.error('[Shopify] Oracle submission failed:', err);
  }

  return res.sendStatus(200);
});
