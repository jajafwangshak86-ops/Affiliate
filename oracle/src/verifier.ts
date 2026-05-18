import { createHash } from 'crypto';
import * as secp from 'noble-secp256k1';

/**
 * Verifies a sale event payload signature from an e-commerce plugin.
 * Plugins sign: sha256(saleId + affiliateAddress + campaignId + amount)
 */
export function verifySaleSignature(
  saleId: string,
  affiliate: string,
  campaignId: number,
  amount: number,
  signature: string,
  merchantPubkey: string
): boolean {
  try {
    const message = createHash('sha256')
      .update(saleId)
      .update(affiliate)
      .update(campaignId.toString())
      .update(amount.toString())
      .digest();

    return secp.verify(signature, message, merchantPubkey);
  } catch {
    return false;
  }
}

/**
 * Signs a sale attestation with the oracle private key for submission to Stacks.
 */
export async function signAttestation(
  saleId: Buffer,
  affiliate: string,
  campaignId: number,
  amount: number,
  privateKey: string
): Promise<string> {
  const message = createHash('sha256')
    .update(saleId)
    .update(affiliate)
    .update(campaignId.toString())
    .update(amount.toString())
    .digest();

  const [sig, recovery] = await secp.sign(message, privateKey, { recovered: true });
  // Append recovery byte for Clarity secp256k1-recover?
  const sigWithRecovery = Buffer.alloc(65);
  Buffer.from(sig).copy(sigWithRecovery);
  sigWithRecovery[64] = recovery;
  return sigWithRecovery.toString('hex');
}
