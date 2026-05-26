import { describe, expect, it } from "vitest";
import { Cl, serializeCV } from "@stacks/transactions";
import * as secp from "noble-secp256k1";
import { createHash, createHmac } from "crypto";

/**
 * End-to-end integration test: full sale flow on simnet.
 *
 * Each test sets up its own state since simnet resets between tests.
 * Tests verify the complete contract interaction chain:
 *   merchant creates campaign → affiliate registers → oracle signs → payout verifies
 */

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const merchant = accounts.get("wallet_1")!;
const affiliateAddr = accounts.get("wallet_2")!;

// noble-secp256k1 v1 requires hmacSha256Sync for compact (der:false) signing
(secp.utils as unknown as { hmacSha256Sync: unknown }).hmacSha256Sync = (
  key: Uint8Array,
  ...msgs: Uint8Array[]
) => {
  const h = createHmac("sha256", key);
  msgs.forEach((m) => h.update(m));
  return h.digest();
};

const ORACLE_PRIVKEY = "0101010101010101010101010101010101010101010101010101010101010101";
const ORACLE_PUBKEY_HEX = secp.getPublicKey(ORACLE_PRIVKEY, true) as unknown as string;
const ORACLE_PUBKEY_BYTES = Buffer.from(ORACLE_PUBKEY_HEX, "hex");

// serializeCV returns hex string in this SDK version — convert to Buffer
function cvBuf(cv: ReturnType<typeof Cl.uint>): Buffer {
  return Buffer.from(serializeCV(cv) as unknown as string, "hex");
}

function buildMessage(saleId: Buffer, affiliate: string, campaignId: number, amount: number): Buffer {
  // Must match contract: sha256(sale-id | to-consensus-buff?(affiliate) | to-consensus-buff?(campaign-id) | to-consensus-buff?(amount))
  return createHash("sha256")
    .update(saleId)
    .update(cvBuf(Cl.principal(affiliate)))
    .update(cvBuf(Cl.uint(campaignId)))
    .update(cvBuf(Cl.uint(amount)))
    .digest();
}

async function oracleSign(saleId: Buffer, affiliate: string, campaignId: number, amount: number): Promise<Buffer> {
  const msg = buildMessage(saleId, affiliate, campaignId, amount);
  // Use der:false for compact 64-byte sig — required by Clarity secp256k1-recover?
  const [sig, recovery] = (await secp.sign(msg, ORACLE_PRIVKEY, { recovered: true, der: false })) as unknown as [Uint8Array, number];
  const out = Buffer.alloc(65);
  Buffer.from(sig).copy(out);
  out[64] = recovery;
  return out;
}

function setupBase() {
  simnet.callPublicFn("payout", "set-oracle-pubkey", [Cl.buffer(ORACLE_PUBKEY_BYTES)], deployer);
  simnet.callPublicFn(
    "escrow",
    "create-campaign",
    [Cl.uint(500), Cl.uint(1_000_000), Cl.principal(`${deployer}.usdc-token`)],
    merchant
  );
  simnet.callPublicFn("affiliate", "register", [Cl.stringAscii("USDC")], affiliateAddr);
}

describe("E2E: contract state", () => {
  it("merchant can create a campaign", () => {
    const { result } = simnet.callPublicFn(
      "escrow",
      "create-campaign",
      [Cl.uint(500), Cl.uint(1_000_000), Cl.principal(`${deployer}.usdc-token`)],
      merchant
    );
    expect(result).toBeOk(Cl.uint(1));
  });

  it("affiliate can register", () => {
    const { result } = simnet.callPublicFn("affiliate", "register", [Cl.stringAscii("USDC")], affiliateAddr);
    expect(result).toBeOk(Cl.bool(true));
  });

  it("affiliate is registered after register call", () => {
    simnet.callPublicFn("affiliate", "register", [Cl.stringAscii("USDC")], affiliateAddr);
    const result = simnet.callReadOnlyFn("affiliate", "is-registered", [Cl.principal(affiliateAddr)], affiliateAddr);
    expect(result.result).toBeBool(true);
  });

  it("oracle pubkey is stored after set-oracle-pubkey", () => {
    simnet.callPublicFn("payout", "set-oracle-pubkey", [Cl.buffer(ORACLE_PUBKEY_BYTES)], deployer);
    const result = simnet.callReadOnlyFn("payout", "get-oracle-pubkey", [], deployer);
    expect(result.result).toEqual(Cl.buffer(ORACLE_PUBKEY_BYTES));
  });

  it("campaign escrow balance is 0 before deposit", () => {
    simnet.callPublicFn(
      "escrow",
      "create-campaign",
      [Cl.uint(500), Cl.uint(1_000_000), Cl.principal(`${deployer}.usdc-token`)],
      merchant
    );
    const result = simnet.callReadOnlyFn("escrow", "get-escrow-balance", [Cl.uint(1)], merchant);
    // result is (ok u0) — unwrap the ok value
    expect(result.result).toBeOk(Cl.uint(0));
  });

  it("campaign is inactive before deposit", () => {
    simnet.callPublicFn(
      "escrow",
      "create-campaign",
      [Cl.uint(500), Cl.uint(1_000_000), Cl.principal(`${deployer}.usdc-token`)],
      merchant
    );
    const result = simnet.callReadOnlyFn("escrow", "is-campaign-active", [Cl.uint(1)], merchant);
    expect(result.result).toBeOk(Cl.bool(false));
  });

  it("affiliate stats show zero conversions after registration", () => {
    simnet.callPublicFn("affiliate", "register", [Cl.stringAscii("USDC")], affiliateAddr);
    const result = simnet.callReadOnlyFn("affiliate", "get-affiliate", [Cl.principal(affiliateAddr)], affiliateAddr);
    expect(result.result.type).toBe("some");
    const tupleVal = (result.result as { value: { value: Record<string, { value: bigint }> } }).value.value;
    expect(tupleVal["total-conversions"].value).toBe(0n);
    expect(tupleVal["total-earned"].value).toBe(0n);
  });

  it("sale is not processed before any payout", () => {
    const saleId = Cl.buffer(Buffer.alloc(32, 0xab));
    const result = simnet.callReadOnlyFn("affiliate", "is-sale-processed", [saleId], affiliateAddr);
    expect(result.result).toBeBool(false);
  });
});

describe("E2E: payout signature verification", () => {
  it("release-payout rejects zeroed signature", () => {
    setupBase();
    const saleId = Buffer.alloc(32, 0xab);
    const badSig = Buffer.alloc(65, 0);

    const { result } = simnet.callPublicFn(
      "payout",
      "release-payout",
      [
        Cl.buffer(saleId),
        Cl.principal(affiliateAddr),
        Cl.uint(1),
        Cl.uint(5_000_000),
        Cl.buffer(badSig),
        Cl.principal(`${deployer}.usdc-token`),
      ],
      deployer
    );
    expect(result).toBeErr(Cl.uint(301)); // ERR-INVALID-SIGNATURE
  });

  it("release-payout rejects inactive campaign when oracle pubkey matches", async () => {
    setupBase(); // sets oracle pubkey, creates campaign (inactive), registers affiliate
    const saleId = Buffer.alloc(32, 0xcd);
    const sig = await oracleSign(saleId, affiliateAddr, 1, 5_000_000);

    const { result } = simnet.callPublicFn(
      "payout",
      "release-payout",
      [
        Cl.buffer(saleId),
        Cl.principal(affiliateAddr),
        Cl.uint(1),
        Cl.uint(5_000_000),
        Cl.buffer(sig),
        Cl.principal(`${deployer}.usdc-token`),
      ],
      deployer
    );
    // Signature is valid, campaign exists but has no deposit → inactive → ERR-CAMPAIGN-INACTIVE
    expect(result).toBeErr(Cl.uint(303));
  });
});
