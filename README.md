# Affiliate — Bitcoin-Settled Affiliate Network

<p align="center">
  <strong>Instant affiliate payouts, settled on Bitcoin. No middlemen. No delays. No trust required.</strong>
</p>

<p align="center">
  <a href="#architecture">Architecture</a> ·
  <a href="#getting-started">Getting Started</a> ·
  <a href="#smart-contracts">Smart Contracts</a> ·
  <a href="#integrations">Integrations</a> ·
  <a href="#roadmap">Roadmap</a> ·
  <a href="#security">Security</a>
</p>

---

## Overview

The $17B affiliate marketing industry runs on broken payment infrastructure. Amazon Associates controls 40%+ of the market, cuts commissions annually, and holds withdrawals for months. Nearly half of all affiliates quit networks because of payment delays.

**Affiliate** is a decentralized affiliate network built on [Stacks](https://www.stacks.co), where every payout is automatic, instant, and settled with Bitcoin finality. Merchants deposit escrow once. Affiliates are paid on every verified sale — no platform in between, no waiting, no trust required.

---

## Why Stacks

Stacks is the only smart contract platform that settles directly on Bitcoin. This matters for a payments product:

| Property | Traditional Networks | EVM Chains | **Stacks** |
|---|---|---|---|
| Settlement Layer | Centralized database | Ethereum | **Bitcoin** |
| Contract Model | None | Turing-complete (exploit risk) | **Clarity (decidable, auditable)** |
| Trust Model | Platform trust | Chain trust | **Bitcoin finality** |
| Payout Asset | Fiat (delayed) | ETH / ERC-20 | **sBTC + stablecoins** |
| Auditability | None | Partial | **Full — before execution** |

Clarity's non-Turing-complete design means contract behavior can be fully analyzed before deployment. No reentrancy attacks. No unexpected execution paths. For a product handling merchant escrow at scale, this is not optional.

---

## Architecture

```
┌──────────────────┐      Sale Event       ┌─────────────────────────┐
│  E-Commerce      │ ────────────────────► │   Oracle / Verifier     │
│  Plugin          │                       │   (off-chain service)   │
│  WooCommerce /   │                       └────────────┬────────────┘
│  Shopify         │                                    │ Signed Attestation
└──────────────────┘                                    ▼
                                           ┌─────────────────────────┐
┌──────────────────┐   Escrow Deposit      │   Clarity Contracts     │
│  Merchant        │ ────────────────────► │                         │
│  Dashboard       │                       │  escrow.clar            │
└──────────────────┘                       │  ├─ holds merchant funds│
                                           │  ├─ validates events    │
┌──────────────────┐   Instant Payout      │  └─ enforces rules      │
│  Affiliate       │ ◄──────────────────── │                         │
│  Wallet          │                       │  payout.clar            │
└──────────────────┘                       │  ├─ releases commissions│
                                           │  └─ routes sBTC / USDC  │
                                           │                         │
                                           │  affiliate.clar         │
                                           │  ├─ registration        │
                                           │  └─ referral tracking   │
                                           └─────────────────────────┘
```

### Flow

1. **Merchant** deploys a campaign and deposits USDC or sBTC into the escrow contract
2. **Affiliate** registers, receives a unique referral link, and sets their payout asset preference
3. **Buyer** clicks the affiliate link and completes a purchase on the merchant's store
4. **Plugin** posts the sale event to the oracle service with a signed payload
5. **Oracle** verifies the event and submits a signed attestation to the Clarity contract
6. **Contract** validates the attestation, calculates the commission, and releases the payout instantly to the affiliate's wallet

No human approval. No batch processing. No waiting period.

---

## Smart Contracts

All contracts are written in [Clarity](https://docs.stacks.co/clarity) and deployed on the Stacks blockchain.

### `escrow.clar`

Manages merchant funds. Merchants deposit USDC or sBTC, set commission rates, and define campaign parameters. The contract enforces minimum escrow thresholds and pauses payouts automatically if the balance falls below the configured floor.

```clarity
;; Merchant deposits escrow
(define-public (deposit (amount uint) (token <ft-trait>))
  ...)

;; Campaign configuration
(define-public (set-commission-rate (campaign-id uint) (rate uint))
  ...)
```

### `affiliate.clar`

Handles affiliate registration, referral link generation, and on-chain tracking of conversions. Each affiliate is identified by their Stacks wallet address.

```clarity
;; Register as affiliate
(define-public (register (payout-asset (string-ascii 4)))
  ...)

;; Record a verified conversion
(define-public (record-conversion (affiliate principal) (sale-id (buff 32)))
  ...)
```

### `payout.clar`

Releases commissions to affiliate wallets upon receiving a valid oracle attestation. Supports both sBTC and stablecoin payouts based on affiliate preference.

```clarity
;; Release payout on verified sale
(define-public (release-payout (sale-id (buff 32)) (oracle-sig (buff 65)))
  ...)
```

---

## Integrations

### WooCommerce Plugin

Install the plugin on any WooCommerce store. On order completion, the plugin signs and posts the sale event to the oracle service.

```bash
# Install via WordPress admin or manually
cp -r plugins/woocommerce/ /wp-content/plugins/affiliate-network/
```

Configuration is handled via the WordPress admin panel. Required fields: merchant wallet address, campaign ID, oracle endpoint.

### Shopify App

The Shopify app listens to order webhooks and forwards verified events to the oracle. Available in the Shopify App Store (beta).

### Oracle Service

The oracle is a lightweight Node.js service that:
- Receives sale events from e-commerce plugins
- Validates event signatures and deduplicates submissions
- Posts signed attestations to the Clarity contract on Stacks

```bash
cd oracle
npm install
cp .env.example .env   # configure oracle signing key and RPC endpoint
npm start
```

---

## Payout Assets

Affiliates choose their preferred payout asset at registration and can update it at any time.

| Asset | Description | Best For |
|---|---|---|
| **sBTC** | Wrapped Bitcoin on Stacks, 1:1 BTC-backed | Affiliates who want Bitcoin exposure |
| **USDC** | USD stablecoin bridged to Stacks | Affiliates who want price stability |

Merchants fund escrow in either asset. The contract handles routing based on affiliate preference.

---

## Getting Started

### Prerequisites

- [Clarinet](https://github.com/hirosystems/clarinet) v2+ — Stacks smart contract toolchain
- [Node.js](https://nodejs.org) v18+
- A Stacks wallet — [Leather](https://leather.io) or [Xverse](https://www.xverse.app)

### Install

```bash
git clone https://github.com/your-org/affiliate.git
cd affiliate
npm install
```

### Local Development

```bash
# Start local Stacks devnet (runs Bitcoin + Stacks nodes locally)
clarinet devnet start

# In a separate terminal, start the oracle service
cd oracle && npm run dev

# Start the merchant dashboard
cd frontend/merchant && npm run dev

# Start the affiliate portal
cd frontend/affiliate && npm run dev
```

### Run Tests

```bash
# Clarity contract tests
clarinet test

# Oracle and plugin unit tests
npm test
```

### Deploy Contracts

```bash
clarinet deployments apply --devnet    # local devnet
clarinet deployments apply --testnet   # Stacks testnet
clarinet deployments apply --mainnet   # mainnet — requires explicit confirmation
```

---

## Repository Structure

```
affiliate/
├── contracts/                  # Clarity smart contracts
│   ├── escrow.clar             # Merchant escrow and campaign management
│   ├── affiliate.clar          # Affiliate registration and referral tracking
│   └── payout.clar             # Commission release logic
├── tests/                      # Contract unit and integration tests
│   ├── escrow_test.ts
│   ├── affiliate_test.ts
│   └── payout_test.ts
├── oracle/                     # Sale event verification service
│   ├── src/
│   │   ├── verifier.ts         # Event signature validation
│   │   ├── broadcaster.ts      # Stacks transaction submission
│   │   └── deduplicator.ts     # Replay attack prevention
│   └── .env.example
├── plugins/
│   ├── woocommerce/            # WooCommerce plugin (PHP)
│   └── shopify/                # Shopify app (Node.js)
├── frontend/
│   ├── merchant/               # Merchant dashboard (Next.js)
│   └── affiliate/              # Affiliate portal (Next.js)
└── docs/
    ├── architecture.md         # Detailed system design
    ├── oracle-spec.md          # Oracle API and signing spec
    └── integration-guide.md    # Merchant integration guide
```

---

## Compliance

| Regulation | Implementation |
|---|---|
| **FTC** | Affiliate disclosure enforced at the link level; non-compliant links are flagged |
| **GDPR / CCPA** | No personal data stored on-chain; off-chain data minimized and deletable on request |
| **AML** | Wallet screening via Chainalysis integration at affiliate onboarding |

---

## Roadmap

**v1 — Foundation**
- [x] Core escrow and payout contracts (Clarity)
- [x] Oracle service (event verification + Stacks broadcaster)
- [x] WooCommerce plugin (beta)
- [x] Merchant dashboard (deposit, campaign management)
- [x] Affiliate portal (referral links, earnings tracking)

**v2 — Expansion**
- [ ] Shopify app
- [ ] sBTC payout support
- [ ] Multi-tier commission structures (e.g., sub-affiliate splits)
- [ ] Dispute resolution mechanism

**v3 — Scale**
- [ ] On-chain affiliate reputation scoring
- [ ] SDK for custom platform integrations
- [ ] Mobile wallet support
- [ ] Cross-chain payout routing

---

## Security

Clarity contracts are **decidable** — their complete behavior can be statically analyzed before execution. This eliminates entire classes of vulnerabilities common on EVM chains: reentrancy, integer overflow via unexpected paths, and hidden logic branches.

**Audit status:** Pre-audit. Independent audit scheduled before mainnet deployment.

**Responsible disclosure:** Email **security@your-domain.com** with a description of the vulnerability. Do not open a public issue. We respond within 48 hours and follow coordinated disclosure practices.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Write tests for any new contract logic
4. Open a pull request against `main`

Read [CONTRIBUTING.md](./CONTRIBUTING.md) before submitting. All Clarity changes require passing `clarinet test` with no regressions.

---

## License

[MIT](./LICENSE)

---

## Links

- [Stacks Documentation](https://docs.stacks.co)
- [Clarity Language Reference](https://docs.stacks.co/clarity)
- [sBTC Documentation](https://docs.stacks.co/sbtc)
- [Hiro Developer Tools](https://www.hiro.so)
- [Clarinet GitHub](https://github.com/hirosystems/clarinet)
