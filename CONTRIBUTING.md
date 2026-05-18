# Contributing

## Requirements

- [Clarinet](https://github.com/hirosystems/clarinet) v2+
- Node.js v18+
- A Stacks wallet for testing

## Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Make your changes
4. Run `clarinet check` — must pass with no errors
5. Run `npm test` — all tests must pass
6. Open a pull request against `main`

## Contract Changes

All Clarity contract changes require:
- Passing `clarinet check` with no errors
- Corresponding test coverage in `tests/`
- A description of the security implications in the PR

## Commit Style

Use conventional commits:

```
feat: add multi-tier commission support
fix: prevent escrow underflow on deduct
test: add payout replay attack coverage
docs: update oracle signing spec
```
