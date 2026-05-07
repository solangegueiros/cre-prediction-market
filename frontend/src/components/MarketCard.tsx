import { useState } from "react";
import { formatEther } from "viem";
import type { MarketEntry } from "../hooks/usePredictionMarket";
import { SEPOLIA_BLOCK_EXPLORER } from "../config";

interface Props {
  entry: MarketEntry;
  loading: boolean;
  canAct: boolean;
  onPredict: (id: number, side: 0 | 1, amount: string) => Promise<void>;
  onRequestSettlement: (id: number) => Promise<void>;
  onClaim: (id: number) => Promise<void>;
}

export function MarketCard({ entry, loading, canAct, onPredict, onRequestSettlement, onClaim }: Props) {
  const { id, market, userPred } = entry;
  const [amount, setAmount] = useState("");

  const yesPool = formatEther(market.totalYesPool);
  const noPool = formatEther(market.totalNoPool);
  const total = market.totalYesPool + market.totalNoPool;
  const yesPct = total > 0n
    ? Number((market.totalYesPool * 10000n) / total) / 100
    : 50;
  const noPct = 100 - yesPct;

  const isSettled = market.settled;
  const outcome = market.outcome;
  const outcomeLabel = outcome === 0 ? "YES" : "NO";
  const createdAt = market.createdAt > 0
    ? new Date(market.createdAt * 1000).toLocaleString()
    : "—";

  const predictedSide = userPred ? userPred.prediction : null;
  const won = isSettled && userPred && predictedSide === outcome;
  const lost = isSettled && userPred && predictedSide !== outcome;
  const canClaim = won && !userPred!.claimed;
  const canPredict = !isSettled && !userPred && canAct;
  const canRequest = !isSettled && canAct;

  const handlePredict = async (side: 0 | 1) => {
    if (!amount || parseFloat(amount) <= 0) return;
    await onPredict(id, side, amount);
    setAmount("");
  };

  return (
    <div className={`card market-card${isSettled ? " market-settled" : ""}`}>
      <div className="market-head">
        <h3 className="market-title">#{id} &mdash; {market.question}</h3>
        {isSettled ? (
          <span className={`badge ${outcome === 0 ? "badge-yes" : "badge-no"}`}>
            Settled &middot; {outcomeLabel} ({(market.confidence / 100).toFixed(0)}%)
          </span>
        ) : (
          <span className="badge badge-open">Open</span>
        )}
      </div>
      <p className="market-meta">
        Created {createdAt} &middot; by{" "}
        <a href={`${SEPOLIA_BLOCK_EXPLORER}/address/${market.creator}`} target="_blank" rel="noopener noreferrer">
          {market.creator.slice(0, 6)}...{market.creator.slice(-4)}
        </a>
      </p>

      <div className="pools">
        <div className="pool pool-yes">
          <span className="label">Yes &middot; {yesPct.toFixed(1)}%</span>
          <span className="value">{yesPool} ETH</span>
        </div>
        <div className="pool pool-no">
          <span className="label">No &middot; {noPct.toFixed(1)}%</span>
          <span className="value">{noPool} ETH</span>
        </div>
      </div>

      {canPredict && (
        <div className="predict-row">
          <div className="input-group predict-input">
            <input
              type="number"
              step="0.001"
              min="0"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={loading}
            />
            <span className="input-suffix">ETH</span>
          </div>
          <button
            className="btn btn-yes"
            disabled={loading || !amount || parseFloat(amount) <= 0}
            onClick={() => handlePredict(0)}
          >
            Predict YES
          </button>
          <button
            className="btn btn-no"
            disabled={loading || !amount || parseFloat(amount) <= 0}
            onClick={() => handlePredict(1)}
          >
            Predict NO
          </button>
        </div>
      )}

      {userPred && (
        <div className="user-pred">
          Your prediction: <strong>{predictedSide === 0 ? "YES" : "NO"}</strong>{" "}
          with {formatEther(userPred.amount)} ETH
          {userPred.claimed && <span className="tag"> &middot; claimed</span>}
          {won && !userPred.claimed && <span className="tag tag-win"> &middot; you won</span>}
          {lost && <span className="tag tag-lose"> &middot; lost</span>}
        </div>
      )}

      <div className="market-actions">
        {canRequest && (
          <button className="btn btn-secondary" disabled={loading} onClick={() => onRequestSettlement(id)}>
            Request settlement
          </button>
        )}
        {canClaim && (
          <button className="btn btn-primary" disabled={loading} onClick={() => onClaim(id)}>
            Claim winnings
          </button>
        )}
      </div>
    </div>
  );
}
