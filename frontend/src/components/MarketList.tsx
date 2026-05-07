import { MarketCard } from "./MarketCard";
import type { MarketEntry } from "../hooks/usePredictionMarket";

interface Props {
  markets: MarketEntry[];
  loading: boolean;
  refreshing: boolean;
  canAct: boolean;
  onPredict: (id: number, side: 0 | 1, amount: string) => Promise<void>;
  onRequestSettlement: (id: number) => Promise<void>;
  onClaim: (id: number) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export function MarketList({
  markets,
  loading,
  refreshing,
  canAct,
  onPredict,
  onRequestSettlement,
  onClaim,
  onRefresh,
}: Props) {
  return (
    <div className="card markets-card">
      <div className="markets-header">
        <h2>Markets</h2>
        <button className="btn-copy" onClick={onRefresh} disabled={refreshing}>
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>
      {markets.length === 0 ? (
        <p className="empty">No markets yet. Create the first one above.</p>
      ) : (
        <div className="markets-list">
          {markets.map((entry) => (
            <MarketCard
              key={entry.id}
              entry={entry}
              loading={loading}
              canAct={canAct}
              onPredict={onPredict}
              onRequestSettlement={onRequestSettlement}
              onClaim={onClaim}
            />
          ))}
        </div>
      )}
    </div>
  );
}
