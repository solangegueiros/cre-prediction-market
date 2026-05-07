import { useState } from "react";

interface Props {
  loading: boolean;
  onCreate: (question: string) => Promise<void>;
}

export function CreateMarket({ loading, onCreate }: Props) {
  const [question, setQuestion] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = question.trim();
    if (!q) return;
    await onCreate(q);
    setQuestion("");
  };

  return (
    <div className="card">
      <h2>Create Market</h2>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <input
            type="text"
            placeholder="e.g. Will ETH close above $4000 on Friday?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={loading}
          />
        </div>
        <button type="submit" disabled={loading || !question.trim()} className="btn btn-primary">
          {loading ? "Processing..." : "Create"}
        </button>
      </form>
      <p className="hint">
        Calls <code>createMarket</code> directly on-chain. In production, the CRE HTTP workflow does this.
      </p>
    </div>
  );
}
