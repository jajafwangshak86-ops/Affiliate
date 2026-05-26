#!/usr/bin/env bash
# set-oracle-pubkey.sh — Set the oracle public key on the deployed payout contract
# Usage: ./scripts/set-oracle-pubkey.sh <oracle-pubkey-hex> [testnet|mainnet]

set -euo pipefail

PUBKEY="${1:?Usage: $0 <oracle-pubkey-hex> [testnet|mainnet]}"
NETWORK="${2:-testnet}"
API_URL="https://api.${NETWORK}.hiro.so"

if [ -z "${DEPLOYER_KEY:-}" ]; then
  echo "Error: DEPLOYER_KEY env var not set (deployer private key hex)"
  exit 1
fi

if [ -z "${CONTRACT_DEPLOYER:-}" ]; then
  echo "Error: CONTRACT_DEPLOYER env var not set (deployer Stacks address)"
  exit 1
fi

echo "Setting oracle pubkey on payout contract ($NETWORK)..."

stacks-cli contract-call \
  --network "$NETWORK" \
  --contract-address "$CONTRACT_DEPLOYER" \
  --contract-name payout \
  --function-name set-oracle-pubkey \
  --function-args "0x${PUBKEY}" \
  --sender-key "$DEPLOYER_KEY" \
  --node-url "$API_URL"

echo "Oracle pubkey set: 0x${PUBKEY}"
