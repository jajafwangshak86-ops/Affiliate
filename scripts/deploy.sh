#!/usr/bin/env bash
# deploy.sh — Deploy contracts to devnet, testnet, or mainnet
# Usage: ./scripts/deploy.sh [devnet|testnet|mainnet]

set -euo pipefail

NETWORK="${1:-devnet}"

case "$NETWORK" in
  devnet)
    echo "Deploying to local devnet..."
    clarinet deployments apply --devnet
    ;;
  testnet)
    echo "Deploying to Stacks testnet..."
    clarinet deployments apply --testnet
    ;;
  mainnet)
    echo ""
    echo "⚠️  MAINNET DEPLOYMENT"
    echo "This will deploy contracts to Stacks mainnet using real STX."
    echo "Ensure you have:"
    echo "  - Run 'clarinet check' with no errors"
    echo "  - Completed an independent security audit"
    echo "  - Funded your deployer wallet"
    echo ""
    read -r -p "Type 'deploy mainnet' to confirm: " CONFIRM
    if [ "$CONFIRM" != "deploy mainnet" ]; then
      echo "Aborted."
      exit 1
    fi
    clarinet deployments apply --mainnet
    ;;
  *)
    echo "Usage: $0 [devnet|testnet|mainnet]"
    exit 1
    ;;
esac

echo "Done. Verify deployment on https://explorer.hiro.so/?chain=${NETWORK}"
