import { createHash, createHmac } from 'crypto';
import * as secp from 'noble-secp256k1';

// Required for synchronous signing in noble-secp256k1 v1
secp.utils.hmacSha256Sync = (key: Uint8Array, ...msgs: Uint8Array[]) => {
  const h = createHmac('sha256', key);
  msgs.forEach((m) => h.update(m));
  return h.digest();
};

/**
 * Verifies a sale event payload signature from an e-commerce plugin.
 * Plugins sign: sha256(saleId + affiliateAddress + campaignId + amount)
 * Signature must be compact 64-byte secp256k1 sig (no DER encoding).
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
 * Produces a compact 64-byte sig + 1 recovery byte = 65 bytes total.
 * This matches the format expected by Clarity's secp256k1-recover?.
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

  const [sig, recovery] = await secp.sign(message, privateKey, { recovered: true, der: false }) as unknown as [Uint8Array, number];
  const sigWithRecovery = Buffer.alloc(65);
  Buffer.from(sig).copy(sigWithRecovery);
  sigWithRecovery[64] = recovery;
  return sigWithRecovery.toString('hex');
}
