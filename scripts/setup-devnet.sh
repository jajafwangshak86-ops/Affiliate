#!/usr/bin/env bash
# setup-devnet.sh — Start local Stacks devnet and print next steps
# Usage: ./scripts/setup-devnet.sh

set -euo pipefail

echo "Starting Stacks devnet (Bitcoin + Stacks nodes)..."
clarinet devnet start &
DEVNET_PID=$!

echo "Waiting for devnet to initialize..."
sleep 10

echo ""
echo "Devnet is running (PID: $DEVNET_PID)"
echo ""
echo "Next steps:"
echo "  1. Deploy contracts:    clarinet deployments apply --devnet"
echo "  2. Start oracle:        cd oracle && npm run dev"
echo "  3. Start merchant UI:   cd frontend/merchant && npm run dev"
echo "  4. Start affiliate UI:  cd frontend/affiliate && npm run dev"
echo ""
echo "Stacks Explorer: http://localhost:8000"
echo "Stacks API:      http://localhost:3999"
echo ""
echo "Press Ctrl+C to stop devnet."
wait $DEVNET_PID
