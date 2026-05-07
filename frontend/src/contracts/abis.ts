import { parseAbi, type Address } from "viem";

export const PREDICTION_MARKET_ABI = parseAbi([
  "function createMarket(string question) returns (uint256)",
  "function predict(uint256 marketId, uint8 prediction) payable",
  "function requestSettlement(uint256 marketId)",
  "function claim(uint256 marketId)",
  "function getMarket(uint256 marketId) view returns ((address creator, uint48 createdAt, uint48 settledAt, bool settled, uint16 confidence, uint8 outcome, uint256 totalYesPool, uint256 totalNoPool, string question))",
  "function getPrediction(uint256 marketId, address user) view returns ((uint256 amount, uint8 prediction, bool claimed))",
  "event MarketCreated(uint256 indexed marketId, string question, address creator)",
  "event PredictionMade(uint256 indexed marketId, address indexed predictor, uint8 prediction, uint256 amount)",
  "event SettlementRequested(uint256 indexed marketId, string question)",
  "event MarketSettled(uint256 indexed marketId, uint8 outcome, uint16 confidence)",
  "event WinningsClaimed(uint256 indexed marketId, address indexed claimer, uint256 amount)",
]);

// Update this after deploying your contract to Sepolia
export const ADDRESSES = {
  market: (import.meta.env.MARKET_ADDRESS || "") as Address,
};

export const SEPOLIA_CHAIN_ID = "0xaa36a7"; // 11155111

export const Prediction = { Yes: 0, No: 1 } as const;
export type Prediction = typeof Prediction[keyof typeof Prediction];

export interface MarketData {
  creator: Address;
  createdAt: number;
  settledAt: number;
  settled: boolean;
  confidence: number;
  outcome: number;
  totalYesPool: bigint;
  totalNoPool: bigint;
  question: string;
}

export interface UserPrediction {
  amount: bigint;
  prediction: number;
  claimed: boolean;
}
