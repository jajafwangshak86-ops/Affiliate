# Security Model

## Smart Contract Security

### Clarity Decidability

All contracts are written in Clarity, a non-Turing-complete language. Every contract's complete behavior can be statically analyzed before deployment. This eliminates entire classes of vulnerabilities common on EVM chains:

- No reentrancy attacks (no dynamic dispatch)
- No integer overflow via unexpected execution paths
- No hidden logic branches
- Full auditability before any funds are at risk

### Contract-Caller Guards

`deduct-escrow` and `record-conversion` are restricted to be callable only by the `payout` contract:

```clarity
(asserts! (is-eq contract-caller .payout) ERR-NOT-AUTHORIZED)
```

No external account or other contract can trigger escrow deductions or record conversions.

### Oracle Signature Verification

Every payout requires a valid secp256k1 signature from the authorized oracle key. The contract recovers the signer on-chain:

```clarity
(secp256k1-recover? (sha256 message) sig)
```

The recovered public key is compared against the stored oracle pubkey. A mismatched or malformed signature returns `ERR-INVALID-SIGNATURE (u301)` before any state changes occur.

### Replay Attack Prevention

Every sale ID is stored on-chain in the `processed-sales` map after a successful payout. Subsequent calls with the same sale ID are rejected with `ERR-DUPLICATE-SALE` before signature verification runs.

### Escrow Auto-Pause

When a payout reduces the escrow balance below the configured floor, the campaign is automatically set to `active: false`. No further payouts are released until the merchant tops up and calls `resume-campaign`.

### Affiliate Active Check

`release-payout` verifies the affiliate account is active before processing. Deactivated affiliates cannot receive payouts.

### Escrow Balance Guard

`deduct-escrow` explicitly checks `(>= escrow-balance amount)` before deducting, preventing underflow.

---

## Oracle Security

### Signature Format

The oracle signs attestations using compact secp256k1 signatures (64 bytes + 1 recovery byte = 65 bytes total). This matches the format expected by Clarity's `secp256k1-recover?`.

### Deduplication

The oracle deduplicates sale IDs in Redis before broadcasting to Stacks. This provides a fast first line of defense against duplicate submissions, complementing the on-chain replay protection.

### HMAC Webhook Verification (Shopify)

Shopify webhooks are verified using `x-shopify-hmac-sha256` with `timingSafeEqual` to prevent timing attacks.

---

## Audit Status

**Pre-audit.** An independent security audit is scheduled before mainnet deployment.

**Responsible disclosure:** Email `security@your-domain.com`. Do not open a public issue. We respond within 48 hours and follow coordinated disclosure practices.
