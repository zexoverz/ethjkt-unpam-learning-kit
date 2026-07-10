import { useEffect, useState } from "react";
import { TrendingUp, ArrowDown } from "lucide-react";

interface OrderBookProps {
  currentPrice: number;
  symA: string;
  symB: string;
}

interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
}

export default function OrderBook({ currentPrice, symA, symB }: OrderBookProps) {
  const [asks, setAsks] = useState<OrderBookEntry[]>([]);
  const [bids, setBids] = useState<OrderBookEntry[]>([]);
  const [spread, setSpread] = useState<number>(0);
  const [spreadPercent, setSpreadPercent] = useState<number>(0);

  // Generate orders around currentPrice
  useEffect(() => {
    if (!currentPrice || currentPrice <= 0) return;

    const generateOrders = () => {
      const askList: OrderBookEntry[] = [];
      const bidList: OrderBookEntry[] = [];
      const NUM_ROWS = 28;
      
      // Generate asks (prices higher than market price)
      let cumulativeAskTotal = 0;
      for (let i = NUM_ROWS; i >= 1; i--) {
        const price = currentPrice * (1 + (i * 0.0008) + (Math.random() * 0.0002));
        const amount = Math.random() * 500 + 10;
        cumulativeAskTotal += amount;
        askList.push({
          price,
          amount,
          total: cumulativeAskTotal,
        });
      }

      // Generate bids (prices lower than market price)
      let cumulativeBidTotal = 0;
      for (let i = 1; i <= NUM_ROWS; i++) {
        const price = currentPrice * (1 - (i * 0.0008) - (Math.random() * 0.0002));
        const amount = Math.random() * 500 + 10;
        cumulativeBidTotal += amount;
        bidList.push({
          price,
          amount,
          total: cumulativeBidTotal,
        });
      }

      setAsks(askList);
      setBids(bidList);

      const topBid = bidList[0]?.price || currentPrice;
      const topAsk = askList[askList.length - 1]?.price || currentPrice;
      const spreadVal = topAsk - topBid;
      setSpread(spreadVal);
      setSpreadPercent((spreadVal / currentPrice) * 100);
    };

    generateOrders();

    // Minor updates periodically to simulate order execution
    const interval = setInterval(() => {
      generateOrders();
    }, 4000);

    return () => clearInterval(interval);
  }, [currentPrice]);

  if (asks.length === 0 || bids.length === 0 || !currentPrice) {
    return (
      <div className="glass-panel p-6 rounded-md flex flex-col h-full items-center justify-center space-y-3 py-16 text-center select-none text-xs font-mono">
        <span className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent" />
        <span className="text-zinc-500 font-semibold tracking-wide animate-pulse">Loading Order Book...</span>
      </div>
    );
  }

  return (
    <div className="glass-panel p-4 rounded-md flex flex-col h-full overflow-hidden text-xs font-mono select-none">
      {/* Title */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
        <span className="font-bold text-[#FAFAFA] text-sm tracking-tight">Order Book</span>
        <span className="text-[10px] text-zinc-550 font-semibold tracking-wide">{symA}/{symB}</span>
      </div>

      {/* Header columns */}
      <div className="grid grid-cols-3 text-zinc-500 py-1.5 border-b border-zinc-800 text-[10px] font-bold uppercase tracking-tight">
        <span>Price ({symB})</span>
        <span className="text-right">Size ({symA})</span>
        <span className="text-right">Total</span>
      </div>

      {/* Asks (Sell Orders - Red, rendered top to bottom) */}
      <div className="flex-1 min-h-0 flex flex-col justify-end overflow-y-auto scrollbar-none space-y-0.5 py-1.5">
        {asks.slice(-15).map((ask, idx) => {
          const depthPercent = Math.min(100, (ask.total / (asks[0]?.total || 1)) * 100);
          return (
            <div 
              key={idx} 
              className="grid grid-cols-3 text-rose-450 hover:bg-rose-500/10 py-0.5 relative transition-all duration-150 ease-out cursor-pointer"
            >
              <div 
                className="absolute right-0 top-0 bottom-0 bg-rose-500/5 pointer-events-none transition-all duration-500" 
                style={{ width: `${depthPercent}%` }}
              />
              <span className="z-10 font-semibold glow-text-red">{ask.price.toFixed(4)}</span>
              <span className="z-10 text-right text-zinc-300">{ask.amount.toFixed(2)}</span>
              <span className="z-10 text-right text-zinc-550">{ask.total.toFixed(2)}</span>
            </div>
          );
        })}
      </div>

      {/* Mid Market Spread Info */}
      <div className="flex-none py-1.5 px-3 border-y border-zinc-800 bg-zinc-900/50 flex justify-between items-center">
        <div className="flex items-center space-x-1.5">
          <span className="text-sm font-bold text-emerald-400 font-mono glow-text-green">
            {currentPrice > 0 ? currentPrice.toFixed(4) : "-"}
          </span>
          <TrendingUp size={14} className="text-emerald-450 glow-text-green" />
        </div>
        <div className="text-right text-[10px]">
          <div className="text-zinc-400">Spread: <span className="font-semibold">{spread.toFixed(4)}</span></div>
          <div className="text-zinc-550">{spreadPercent.toFixed(2)}%</div>
        </div>
      </div>

      {/* Bids (Buy Orders - Green, rendered top to bottom) */}
      <div className="flex-1 min-h-0 flex flex-col justify-start overflow-y-auto scrollbar-none space-y-0.5 py-1.5">
        {bids.slice(0, 15).map((bid, idx) => {
          const depthPercent = Math.min(100, (bid.total / (bids[bids.length - 1]?.total || 1)) * 100);
          return (
            <div 
              key={idx} 
              className="grid grid-cols-3 text-emerald-450 hover:bg-emerald-500/10 py-0.5 relative transition-all duration-150 ease-out cursor-pointer"
            >
              <div 
                className="absolute right-0 top-0 bottom-0 bg-emerald-500/5 pointer-events-none transition-all duration-500" 
                style={{ width: `${depthPercent}%` }}
              />
              <span className="z-10 font-semibold glow-text-green">{bid.price.toFixed(4)}</span>
              <span className="z-10 text-right text-zinc-300">{bid.amount.toFixed(2)}</span>
              <span className="z-10 text-right text-zinc-550">{bid.total.toFixed(2)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
