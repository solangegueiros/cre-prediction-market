import { useState, useEffect, useCallback } from "react";
import { createWalletClient, custom, type Address, type WalletClient } from "viem";
import { sepolia } from "viem/chains";
import { SEPOLIA_CHAIN_ID } from "../contracts/abis";
import { SEPOLIA_RPC, SEPOLIA_BLOCK_EXPLORER } from "../config";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}

export function useWallet() {
  const [account, setAccount] = useState<Address | null>(null);
  const [walletClient, setWalletClient] = useState<WalletClient | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const switchToSepolia = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      });
    } catch (err: unknown) {
      const switchError = err as { code: number };
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: SEPOLIA_CHAIN_ID,
              chainName: "Sepolia Testnet",
              nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
              rpcUrls: [SEPOLIA_RPC],
              blockExplorerUrls: [SEPOLIA_BLOCK_EXPLORER],
            },
          ],
        });
      }
    }
  }, []);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError("Please install MetaMask");
      return;
    }
    setConnecting(true);
    setError(null);
    try {
      await switchToSepolia();
      const client = createWalletClient({
        chain: sepolia,
        transport: custom(window.ethereum),
      });
      const [addr] = await client.requestAddresses();
      setWalletClient(client);
      setAccount(addr);
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to connect");
    } finally {
      setConnecting(false);
    }
  }, [switchToSepolia]);

  useEffect(() => {
    if (!window.ethereum) return;
    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as Address[];
      if (accounts.length === 0) {
        setAccount(null);
        setWalletClient(null);
      } else {
        setAccount(accounts[0]);
        connect();
      }
    };
    const handleChainChanged = () => window.location.reload();

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);
    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener("chainChanged", handleChainChanged);
    };
  }, [connect]);

  return { account, walletClient, error, connecting, connect };
}
