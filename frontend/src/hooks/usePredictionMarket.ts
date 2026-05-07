import { useState, useEffect, useCallback, useMemo } from "react";
import {
  createPublicClient,
  http,
  parseEther,
  zeroAddress,
  type Address,
  type WalletClient,
} from "viem";
import { sepolia } from "viem/chains";
import { PREDICTION_MARKET_ABI, ADDRESSES } from "../contracts/abis";
import type { MarketData, UserPrediction } from "../contracts/abis";
import { SEPOLIA_RPC } from "../config";

const MAX_SCAN = 50;

export interface MarketEntry {
  id: number;
  market: MarketData;
  userPred: UserPrediction | null;
}

export function usePredictionMarket(walletClient: WalletClient | null, account: Address | null) {
  const [marketAddress, setMarketAddress] = useState<Address>(ADDRESSES.market);
  const [markets, setMarkets] = useState<MarketEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [txStatus, setTxStatus] = useState<string | null>(null);

  const publicClient = useMemo(
    () => createPublicClient({ chain: sepolia, transport: http(SEPOLIA_RPC) }),
    []
  );

  const refresh = useCallback(async () => {
    if (!marketAddress) return;
    setRefreshing(true);

    try {
      const found: MarketEntry[] = [];
      for (let i = 0; i < MAX_SCAN; i++) {
        try {
          const m = (await publicClient.readContract({
            address: marketAddress,
            abi: PREDICTION_MARKET_ABI,
            functionName: "getMarket",
            args: [BigInt(i)],
          })) as MarketData;

          if (m.creator === zeroAddress) break;

          let userPred: UserPrediction | null = null;
          if (account) {
            try {
              const p = (await publicClient.readContract({
                address: marketAddress,
                abi: PREDICTION_MARKET_ABI,
                functionName: "getPrediction",
                args: [BigInt(i), account],
              })) as UserPrediction;
              if (p.amount > 0n) userPred = p;
            } catch {
              // ignore
            }
          }
          found.push({ id: i, market: m, userPred });
        } catch {
          break;
        }
      }
      setMarkets(found.reverse());
    } catch (err) {
      console.error("Failed to fetch markets:", err);
    } finally {
      setRefreshing(false);
    }
  }, [publicClient, marketAddress, account]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
  }, [refresh]);

  const updateMarketAddress = useCallback((newAddress: Address) => {
    setMarketAddress(newAddress);
  }, []);

  const runWrite = useCallback(
    async (label: string, send: () => Promise<`0x${string}`>) => {
      if (!walletClient || !account) return;
      setLoading(true);
      setTxStatus(label);
      try {
        const hash = await send();
        setTxStatus("Waiting for confirmation...");
        await publicClient.waitForTransactionReceipt({ hash });
        setTxStatus("Success!");
        await refresh();
      } catch (err: unknown) {
        setTxStatus(`Error: ${parseError(err)}`);
      } finally {
        setLoading(false);
      }
    },
    [walletClient, account, publicClient, refresh]
  );

  const createMarket = useCallback(
    async (question: string) => {
      if (!walletClient || !account) return;
      await runWrite("Sending transaction...", () =>
        walletClient.writeContract({
          address: marketAddress,
          abi: PREDICTION_MARKET_ABI,
          functionName: "createMarket",
          args: [question],
          account,
          chain: sepolia,
        })
      );
    },
    [walletClient, account, marketAddress, runWrite]
  );

  const predict = useCallback(
    async (marketId: number, side: 0 | 1, ethAmount: string) => {
      if (!walletClient || !account) return;
      await runWrite("Submitting prediction...", () =>
        walletClient.writeContract({
          address: marketAddress,
          abi: PREDICTION_MARKET_ABI,
          functionName: "predict",
          args: [BigInt(marketId), side],
          value: parseEther(ethAmount),
          account,
          chain: sepolia,
        })
      );
    },
    [walletClient, account, marketAddress, runWrite]
  );

  const requestSettlement = useCallback(
    async (marketId: number) => {
      if (!walletClient || !account) return;
      await runWrite(
        "Requesting settlement (CRE workflow will settle via AI)...",
        () =>
          walletClient.writeContract({
            address: marketAddress,
            abi: PREDICTION_MARKET_ABI,
            functionName: "requestSettlement",
            args: [BigInt(marketId)],
            account,
            chain: sepolia,
          })
      );
    },
    [walletClient, account, marketAddress, runWrite]
  );

  const claim = useCallback(
    async (marketId: number) => {
      if (!walletClient || !account) return;
      await runWrite("Claiming winnings...", () =>
        walletClient.writeContract({
          address: marketAddress,
          abi: PREDICTION_MARKET_ABI,
          functionName: "claim",
          args: [BigInt(marketId)],
          account,
          chain: sepolia,
        })
      );
    },
    [walletClient, account, marketAddress, runWrite]
  );

  return {
    marketAddress,
    markets,
    loading,
    refreshing,
    txStatus,
    createMarket,
    predict,
    requestSettlement,
    claim,
    refresh,
    updateMarketAddress,
    configured: Boolean(marketAddress),
  };
}

function parseError(err: unknown): string {
  const e = err as { shortMessage?: string; details?: string; message?: string };
  return e.shortMessage || e.details || e.message || String(err);
}
