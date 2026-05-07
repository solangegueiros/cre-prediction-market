# Prediction Market Frontend

Vite + React 19 + TypeScript + viem v2 frontend for the CRE bootcamp prediction market on Ethereum Sepolia. 

## Setup

```bash
cd frontend
npm install
cp .env.example .env   # then edit MARKET_ADDRESS
npm run dev
```

The `.env` is already pointed at the current deployment `0x3c01d85D7d2b7C505b1317b1e7f418334A7777bd`. Vite's `envPrefix` is set to `MARKET_`, so the variable is exposed to the app as `import.meta.env.MARKET_ADDRESS`.

## What it does

- **Create market** &mdash; calls `createMarket(question)` directly. In production this is driven by the CRE HTTP workflow.
- **Predict** &mdash; `predict(marketId, 0|1)` with an ETH stake.
- **Request settlement** &mdash; emits `SettlementRequested`; the CRE log-trigger workflow picks it up, calls Gemini, and writes the outcome via `onReport`.
- **Claim** &mdash; `claim(marketId)` for winners.
- Edit the contract address inline (useful if you redeploy).

## Notes

- `nextMarketId` is `internal`, so the UI scans `getMarket(0..49)` and stops at the first empty slot. Bump `MAX_SCAN` in `src/hooks/usePredictionMarket.ts` if you create more than 50 markets.
- Outcome: `0 = YES`, `1 = NO`. Confidence is in basis points (e.g. `8500` &rarr; 85%).
