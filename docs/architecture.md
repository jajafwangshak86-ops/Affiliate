# Architecture

## Overview

The system has four layers:

1. **Smart Contracts** (Clarity on Stacks) — source of truth for escrow, payouts, and affiliate state
2. **Oracle Service** (Node.js) — bridges off-chain sale events to on-chain contract calls
3. **E-Commerce Plugins** (WooCommerce / Shopify) — capture sale events and forward to oracle
4. **Frontend** (Next.js) — merchant dashboard and affiliate portal

## Contract Interaction Model

```
Merchant → escrow.create-campaign()
Merchant → escrow.deposit()

Affiliate → affiliate.register()

[Sale occurs]
Plugin → Oracle (HTTP POST /sale)
Oracle → verifies signature
Oracle → payout.release-payout()
  payout → affiliate.is-sale-processed()   [read]
  payout → escrow.get-campaign()           [read]
  payout → escrow.deduct-escrow()          [write]
  payout → affiliate.record-conversion()   [write]
  payout → token.transfer()               [write]
```

## Security Model

- Only the `payout` contract can call `deduct-escrow` and `record-conversion`
- Only the deployer can set the oracle public key
- Oracle signatures are verified on-chain via `secp256k1-recover?`
- Sale IDs are stored on-chain to prevent replay attacks

## Escrow Auto-Pause

When a payout reduces the escrow balance below the configured floor, the campaign is automatically set to `active: false`. No further payouts are released until the merchant tops up.
