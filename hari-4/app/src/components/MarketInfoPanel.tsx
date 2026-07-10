import { useState, useEffect } from "react";
import { Search, Flame, Star, Clock, Info } from "lucide-react";
import TokenIcon from "./TokenIcon";
import { motion } from "framer-motion";

interface MarketInfoPanelProps {
  currentPrice: number;
  symA: string;
  symB: string;
  reserveA: number;
  reserveB: number;
}

interface TradeEntry {
  time: string;
  type: "buy" | "sell";
  price: number;
  amount: number;
}

export default function MarketInfoPanel({
  currentPrice,
  symA,
  symB,
  reserveA,
  reserveB,
}: MarketInfoPanelProps) {
  const [activeTab, setActiveTab] = useState<"pairs" | "trades" | "info">("pairs");
  const [searchQuery, setSearchQuery] = useState("");
  const [recentTrades, setRecentTrades] = useState<TradeEntry[]>([]);

  // Watchlist pairs
  const basePairs = [
    { name: `${symA}/${symB}`, price: currentPrice, change: "+3.68%", tvl: `${(reserveB * 2).toLocaleString()} ${symB}`, fee: "0.30%", isLive: true },
    { name: "ETH/USDT", price: 3450.25, change: "+1.42%", tvl: "124.5M USDT", fee: "0.05%", isLive: false },
    { name: "WBTC/USDC", price: 92400.12, change: "-0.85%", tvl: "89.2M USDC", fee: "0.30%", isLive: false },
    { name: "LINK/ETH", price: 0.0054, change: "+2.11%", tvl: "12.8M ETH", fee: "0.30%", isLive: false },
    { name: "UNI/USDT", price: 7.84, change: "-3.15%", tvl: "45.1M USDT", fee: "0.30%", isLive: false },
  ];

  const filteredPairs = basePairs.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Generate mock live trades around currentPrice
  useEffect(() => {
    if (!currentPrice || currentPrice <= 0) return;

    // Seed initial trades
    const seedTrades: TradeEntry[] = [];
    for (let i = 0; i < 15; i++) {
      const type = Math.random() > 0.5 ? "buy" : "sell";
      const factor = type === "buy" ? 1 + Math.random() * 0.0015 : 1 - Math.random() * 0.0015;
      seedTrades.push({
        time: new Date(Date.now() - i * 45000).toLocaleTimeString(undefined, { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        type,
        price: currentPrice * factor,
        amount: Math.random() * 200 + 5,
      });
    }
    setRecentTrades(seedTrades);

    // Append new trades periodically
    const interval = setInterval(() => {
      const type = Math.random() > 0.5 ? "buy" : "sell";
      const factor = type === "buy" ? 1 + Math.random() * 0.0012 : 1 - Math.random() * 0.0012;
      const newTrade: TradeEntry = {
        time: new Date().toLocaleTimeString(undefined, { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        type,
        price: currentPrice * factor,
        amount: Math.random() * 150 + 2,
      };

      setRecentTrades(prev => [newTrade, ...prev.slice(0, 19)]);
    }, 5000);

    return () => clearInterval(interval);
  }, [currentPrice]);

  return (
    <div className="glass-panel p-5 rounded-md flex flex-col h-full text-xs select-none">
      {/* Tabs */}
      <div className="flex bg-zinc-900/40 p-1 rounded-md border border-zinc-800 mb-4 relative">
        {(["pairs", "trades", "info"] as const).map((t) => {
          const isActive = activeTab === t;
          const label = t === "pairs" ? "Watchlist" : t === "trades" ? "Trades" : "Pool Info";
          const Icon = t === "pairs" ? Star : t === "trades" ? Clock : Info;
          return (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`relative flex-1 py-2 font-semibold transition-all duration-200 flex items-center justify-center space-x-1 rounded-md ${
                isActive ? "text-white" : "text-zinc-550 hover:text-zinc-300"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="active-info-tab"
                  className="absolute inset-0 bg-[#27272A] rounded-md border border-zinc-700 shadow-sm"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <Icon size={12} className="relative z-10" />
              <span className="relative z-10">{label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {activeTab === "pairs" && (
        <div className="flex-1 flex flex-col min-h-0 space-y-2.5">
          {/* Search bar */}
          <div className="relative bg-zinc-900/50 border border-zinc-800 rounded-md px-3 py-2 flex items-center hover:border-zinc-700 transition-colors">
            <Search size={14} className="text-zinc-500 mr-2" />
            <input
              type="text"
              placeholder="Search markets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none focus:outline-none w-full text-zinc-300 text-xs placeholder-zinc-650"
            />
          </div>

          {/* List of Pairs */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            <div className="grid grid-cols-4 text-zinc-500 font-bold uppercase text-[9px] pb-1.5 border-b border-zinc-800 tracking-tight">
              <span className="col-span-2">Pair / TVL</span>
              <span className="text-right">Price</span>
              <span className="text-right">Change</span>
            </div>

            {filteredPairs.map((pair) => (
              <div 
                key={pair.name} 
                className={`grid grid-cols-4 items-center p-3 rounded-md border transition-all duration-150 ease-out cursor-pointer hover:bg-zinc-850 ${
                  pair.isLive 
                    ? "bg-[#18181B] border-zinc-800" 
                    : "bg-[#18181B] border-zinc-850"
                }`}
              >
                <div className="col-span-2 flex flex-col">
                  <div className="flex items-center space-x-1">
                    {(() => {
                      const [tokenSymbolA, tokenSymbolB] = pair.name.split("/");
                      return (
                        <div className="flex -space-x-1.5 mr-1.5 flex-shrink-0">
                          <TokenIcon symbol={tokenSymbolA} size="w-4 h-4" textClass="text-[6px]" bgClass="bg-blue-600" />
                          <TokenIcon symbol={tokenSymbolB} size="w-4 h-4" textClass="text-[6px]" bgClass="bg-purple-600" />
                        </div>
                      );
                    })()}
                    <span className="font-bold text-zinc-205">{pair.name}</span>
                    {pair.isLive && (
                      <span className="bg-emerald-950 text-emerald-400 border border-emerald-900/40 px-1 py-0.2 rounded text-[7px] font-bold uppercase tracking-wide">
                        Live
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono mt-0.5">{pair.tvl}</span>
                </div>
                <span className="text-right font-mono text-zinc-300 font-semibold">
                  {pair.price > 0 ? pair.price.toLocaleString(undefined, { maximumFractionDigits: pair.price < 1 ? 5 : 2 }) : "-"}
                </span>
                <span className={`text-right font-mono font-bold ${pair.change.startsWith("+") ? "text-emerald-450" : "text-rose-455"}`}>
                  {pair.change}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "trades" && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="grid grid-cols-3 text-zinc-500 font-bold uppercase text-[9px] pb-2.5 border-b border-zinc-800 tracking-tight">
            <span>Time</span>
            <span className="text-right">Price ({symB})</span>
            <span className="text-right">Amount ({symA})</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 py-1.5 pr-1 font-mono">
            {recentTrades.map((trade, idx) => (
              <div 
                key={`${trade.time}-${trade.price}-${idx}`} 
                className={`grid grid-cols-3 py-1.5 px-2 rounded hover:bg-zinc-900 transition-colors duration-150 ${
                  trade.type === "buy" ? "text-emerald-450" : "text-rose-455"
                }`}
              >
                <span className="text-zinc-550">{trade.time}</span>
                <span className="text-right font-semibold">{trade.price.toFixed(4)}</span>
                <span className="text-right text-zinc-300">{trade.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "info" && (
        <div className="flex-1 flex flex-col min-h-0 justify-between space-y-4">
          <div className="space-y-3.5 bg-[#18181B] p-4 rounded-md border border-zinc-800 font-mono text-zinc-400">
            <div className="flex justify-between border-b border-zinc-800 pb-2">
              <span>AMM System</span>
              <span className="text-blue-400 font-bold">Uniswap V2 x*y=k</span>
            </div>
            <div className="flex justify-between border-b border-zinc-800 pb-2">
              <span>Router Fee</span>
              <span className="text-[#FAFAFA] font-bold">0.30% to LPs</span>
            </div>
            <div className="flex justify-between border-b border-zinc-800 pb-2">
              <span>{symA} Decimals</span>
              <span className="text-[#FAFAFA] font-bold">18 (Standard)</span>
            </div>
            <div className="flex justify-between">
              <span>{symB} Decimals</span>
              <span className="text-[#FAFAFA] font-bold">18 (Standard)</span>
            </div>
          </div>

          <div className="p-4 bg-[#18181B] border border-zinc-800 rounded-md flex items-start space-x-2.5 text-zinc-400 leading-normal">
            <Flame size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-blue-400 font-bold block mb-0.5 tracking-tight">DikaSwap Protocol</span>
              DikaSwap is deployed on the Ethereum Sepolia Testnet. Always verify addresses before executing swaps.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
