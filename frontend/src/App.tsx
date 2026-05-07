import { useState } from "react";
import type { Address } from "viem";
import { useWallet } from "./hooks/useWallet";
import { usePredictionMarket } from "./hooks/usePredictionMarket";
import { ConnectWallet } from "./components/ConnectWallet";
import { CopyAddress } from "./components/CopyAddress";
import { CreateMarket } from "./components/CreateMarket";
import { MarketList } from "./components/MarketList";
import "./App.css";

function App() {
  const { account, walletClient, error, connecting, connect } = useWallet();
  const {
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
    configured,
  } = usePredictionMarket(walletClient, account);

  const [editing, setEditing] = useState(false);
  const [editAddress, setEditAddress] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  const handleEdit = () => {
    setEditAddress(marketAddress);
    setEditError(null);
    setEditing(true);
  };

  const handleSave = () => {
    if (!/^0x[a-fA-F0-9]{40}$/.test(editAddress)) {
      setEditError("Invalid address");
      return;
    }
    updateMarketAddress(editAddress as Address);
    setEditing(false);
    setEditError(null);
  };

  const handleCancel = () => {
    setEditing(false);
    setEditError(null);
  };

  return (
    <>
      <header>
        <img src="/icon.png" alt="Logo" className="header-logo" />
        <div className="header-text">
          <h1>Prediction Market</h1>
          <p className="subtitle">AI-settled outcomes via Chainlink CRE &middot; Sepolia</p>
        </div>
      </header>
      <div className="app">
        {!configured && (
          <div className="card warning">
            <h2>Configuration Required</h2>
            <p>
              Set your contract address in <code>.env</code>:
            </p>
            <pre>MARKET_ADDRESS=0x...</pre>
          </div>
        )}

        {configured && (
          <main>
            <div className="card contracts-box">
              <div className="contract-row">
                <span className="label">Prediction Market:</span>
                {editing ? (
                  <span className="edit-address">
                    <input
                      type="text"
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      placeholder="0x..."
                    />
                    <button className="btn-copy" onClick={handleSave}>Save</button>
                    <button className="btn-copy" onClick={handleCancel}>Cancel</button>
                  </span>
                ) : (
                  <>
                    <CopyAddress address={marketAddress} />
                    <button className="btn-copy" onClick={handleEdit}>Edit</button>
                  </>
                )}
              </div>
              {editError && <p className="error">{editError}</p>}
            </div>

            {account ? (
              <CreateMarket loading={loading} onCreate={createMarket} />
            ) : (
              <div className="card">
                <p>Connect your wallet to create markets, predict, and claim winnings.</p>
              </div>
            )}

            <MarketList
              markets={markets}
              loading={loading}
              refreshing={refreshing}
              canAct={Boolean(account)}
              onPredict={predict}
              onRequestSettlement={requestSettlement}
              onClaim={claim}
              onRefresh={refresh}
            />

            {txStatus && (
              <p className={`tx-status ${txStatus.startsWith("Error") ? "error" : "success"}`}>
                {txStatus}
              </p>
            )}

            <ConnectWallet account={account} connecting={connecting} error={error} onConnect={connect} />
          </main>
        )}
      </div>
    </>
  );
}

export default App;
