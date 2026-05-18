# Merchant Integration Guide

## WooCommerce

### Install

Copy the plugin directory to your WordPress installation:

```bash
cp -r plugins/woocommerce/ /wp-content/plugins/affiliate-network/
```

Activate via **Plugins → Installed Plugins → Affiliate Network → Activate**.

### Configure

Go to **Settings → Affiliate Network** and fill in:

| Field | Description |
|---|---|
| Oracle Endpoint | URL of your running oracle service |
| Campaign ID | Your campaign ID from the escrow contract |
| Merchant Pubkey | Your compressed secp256k1 public key (hex) |
| Token Contract | Stacks token contract address (e.g. `SP...usdc-token`) |

### How It Works

1. Buyer visits your store via an affiliate link (`?ref=AFFILIATE_ADDRESS`)
2. Plugin stores the referral in a 30-day cookie
3. On order completion, plugin signs the sale event and posts it to the oracle
4. Oracle verifies and submits the payout transaction to Stacks

---

## Shopify

### Install

Deploy the Shopify app and register the order webhook:

```bash
cd plugins/shopify
npm install
cp .env.example .env   # fill in your credentials
npm start
```

Register the webhook in your Shopify admin:
- **Settings → Notifications → Webhooks → Create webhook**
- Event: `Order payment`
- URL: `https://your-app-host.com/webhooks/orders/paid`

### Affiliate Tracking

Pass the affiliate address as a cart note attribute named `affiliate_ref`. This can be set via a storefront script that reads the `?ref=` query parameter.

---

## Campaign Setup

Before going live:

1. Deploy contracts to Stacks testnet: `clarinet deployments apply --testnet`
2. Call `escrow.create-campaign()` with your commission rate and escrow floor
3. Call `escrow.deposit()` to fund the escrow
4. Start the oracle service and configure your plugin
5. Test with a real purchase on testnet
