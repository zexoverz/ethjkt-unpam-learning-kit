import React, { useState, useMemo, useEffect } from "react";
import { ArrowDownUp, Settings, AlertTriangle, HelpCircle } from "lucide-react";
import { formatUnits, parseUnits } from "viem";
import TokenIcon from "./TokenIcon";
import { motion } from "framer-motion";

interface SwapCardProps {
  symA: string;
  symB: string;
  decA: number | undefined;
  decB: number | undefined;
  balA: bigint | undefined;
  balB: bigint | undefined;
  reserveA: bigint;
  reserveB: bigint;
  amountIn: string;
  setAmountIn: (val: string) => void;
  swapDir: string;
  setSwapDir: (dir: string) => void;
  previewOut: string;
  doSwap: (fromSymOverride?: string, toSymOverride?: string, calculatedOutput?: number) => Promise<void>;
  busy: { key: string; text: string } | null;
  ready: boolean;
  actLabel: string | null;
  mockBalances: Record<string, number>;
  setMockBalances: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}

export default function SwapCard({
  symA,
  symB,
  decA,
  decB,
  balA,
  balB,
  reserveA,
  reserveB,
  amountIn,
  setAmountIn,
  swapDir,
  setSwapDir,
  previewOut,
  doSwap,
  busy,
  ready,
  actLabel,
  mockBalances,
  setMockBalances,
}: SwapCardProps) {
  const [slippage, setSlippage] = useState<number>(0.5); // Default 0.5%
  const [showSettings, setShowSettings] = useState(false);

  const [fromToken, setFromToken] = useState("DKT");
  const [toToken, setToToken] = useState("ETHJKT");
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);

  const TOKENS = [
    { symbol: "DKT", name: "Dika Token", logo: "/dkt-logo.png", isMock: false },
    { symbol: "ETHJKT", name: "ETH Jakarta", logo: "/ethjkt-logo.png", isMock: false },
    { symbol: "ETH", name: "Ethereum", logo: "/ethjkt-logo.png", isMock: true },
    { symbol: "USDT", name: "Tether USD", logo: "/dkt-logo.png", isMock: true },
    { symbol: "USDC", name: "USD Coin", logo: "/dkt-logo.png", isMock: true },
    { symbol: "UNI", name: "Uniswap Token", logo: "/dkt-logo.png", isMock: true },
    { symbol: "LINK", name: "Chainlink Token", logo: "/dkt-logo.png", isMock: true },
    { symbol: "WBTC", name: "Wrapped Bitcoin", logo: "/dkt-logo.png", isMock: true },
  ];

  // Pools reserves (DKT/ETHJKT is real, others are mock)
  const pools = useMemo(() => {
    // reserveA and reserveB are in bigint, convert to number
    const rA = Number(formatUnits(reserveA, decA || 18));
    const rB = Number(formatUnits(reserveB, decB || 18));

    return [
      { token0: "DKT", token1: "ETHJKT", r0: rA || 100000, r1: rB || 100000 },
      { token0: "ETHJKT", token1: "USDT", r0: 18000, r1: 62100000 }, // ETH/USDT: Price 3450
      { token0: "USDT", token1: "USDC", r0: 25000000, r1: 25000000 }, // USDT/USDC: Price 1
      { token0: "LINK", token1: "ETHJKT", r0: 2370000, r1: 12800 }, // LINK/ETH: Price 0.0054
      { token0: "UNI", token1: "USDT", r0: 2870000, r1: 22500000 }, // UNI/USDT: Price 7.84
      { token0: "WBTC", token1: "USDC", r0: 480, r1: 44350000 }, // WBTC/USDC: Price 92400
    ];
  }, [reserveA, reserveB, decA, decB]);

  const path = useMemo(() => {
    if (fromToken === toToken) return null;

    const queue: string[][] = [[fromToken]];
    const visited = new Set<string>([fromToken]);

    while (queue.length > 0) {
      const currentPath = queue.shift()!;
      const lastToken = currentPath[currentPath.length - 1];

      if (lastToken === toToken) {
        return currentPath;
      }

      for (const pool of pools) {
        let neighbor: string | null = null;
        if (pool.token0 === lastToken) neighbor = pool.token1;
        else if (pool.token1 === lastToken) neighbor = pool.token0;

        if (neighbor && !visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push([...currentPath, neighbor]);
        }
      }
    }
    return null;
  }, [fromToken, toToken, pools]);

  const routeCalculation = useMemo(() => {
    if (!path || !amountIn || Number(amountIn) <= 0) return { outputAmount: 0, priceImpact: 0, spotPrice: 0 };

    let currentAmount = Number(amountIn);
    let spotPriceProduct = 1;

    for (let i = 0; i < path.length - 1; i++) {
      const t0 = path[i];
      const t1 = path[i + 1];

      const pool = pools.find(
        (p) => (p.token0 === t0 && p.token1 === t1) || (p.token0 === t1 && p.token1 === t0)
      );

      if (!pool) return { outputAmount: 0, priceImpact: 0, spotPrice: 0 };

      const isToken0 = pool.token0 === t0;
      const rIn = isToken0 ? pool.r0 : pool.r1;
      const rOut = isToken0 ? pool.r1 : pool.r0;

      const amountInWithFee = currentAmount * 997;
      const numerator = amountInWithFee * rOut;
      const denominator = rIn * 1000 + amountInWithFee;
      const amountOut = numerator / denominator;

      const spotPrice = rOut / rIn;
      spotPriceProduct *= spotPrice;

      currentAmount = amountOut;
    }

    const expectedOutput = Number(amountIn) * spotPriceProduct;
    const priceImpact = expectedOutput > 0 ? Math.max(0, ((expectedOutput - currentAmount) / expectedOutput) * 100) : 0;

    return {
      outputAmount: currentAmount,
      priceImpact,
      spotPrice: spotPriceProduct,
    };
  }, [path, amountIn, pools]);

  // Keep parent's swapDir in sync for direct DKT <-> ETHJKT swaps
  useEffect(() => {
    if (fromToken === "DKT" && toToken === "ETHJKT") {
      setSwapDir("AtoB");
    } else if (fromToken === "ETHJKT" && toToken === "DKT") {
      setSwapDir("BtoA");
    }
  }, [fromToken, toToken, setSwapDir]);

  const fromBalanceNum = useMemo(() => {
    if (fromToken === "DKT") {
      if (balA === undefined || decA === undefined) return 0;
      return Number(formatUnits(balA, decA));
    }
    if (fromToken === "ETHJKT") {
      if (balB === undefined || decB === undefined) return 0;
      return Number(formatUnits(balB, decB));
    }
    return mockBalances[fromToken] || 0;
  }, [fromToken, balA, decA, balB, decB, mockBalances]);

  const fromBalFormatted = useMemo(() => {
    if (fromToken === "DKT") {
      if (balA === undefined || decA === undefined) return "0.0";
      return Number(formatUnits(balA, decA)).toLocaleString(undefined, { maximumFractionDigits: 4 });
    }
    if (fromToken === "ETHJKT") {
      if (balB === undefined || decB === undefined) return "0.0";
      return Number(formatUnits(balB, decB)).toLocaleString(undefined, { maximumFractionDigits: 4 });
    }
    return mockBalances[fromToken]?.toLocaleString(undefined, { maximumFractionDigits: 4 }) || "0.0";
  }, [fromToken, balA, decA, balB, decB, mockBalances]);

  const toBalFormatted = useMemo(() => {
    if (toToken === "DKT") {
      if (balA === undefined || decA === undefined) return "0.0";
      return Number(formatUnits(balA, decA)).toLocaleString(undefined, { maximumFractionDigits: 4 });
    }
    if (toToken === "ETHJKT") {
      if (balB === undefined || decB === undefined) return "0.0";
      return Number(formatUnits(balB, decB)).toLocaleString(undefined, { maximumFractionDigits: 4 });
    }
    return mockBalances[toToken]?.toLocaleString(undefined, { maximumFractionDigits: 4 }) || "0.0";
  }, [toToken, balA, decA, balB, decB, mockBalances]);

  const setMaxAmount = () => {
    if (fromToken === "DKT") {
      if (balA !== undefined && decA !== undefined) {
        setAmountIn(formatUnits(balA, decA));
      }
    } else if (fromToken === "ETHJKT") {
      if (balB !== undefined && decB !== undefined) {
        setAmountIn(formatUnits(balB, decB));
      }
    } else {
      setAmountIn(String(mockBalances[fromToken] || 0));
    }
  };

  const setFractionAmount = (fraction: number) => {
    if (fromToken === "DKT") {
      if (balA !== undefined && decA !== undefined) {
        const fractionBal = (balA * BigInt(Math.floor(fraction * 100))) / 100n;
        setAmountIn(formatUnits(fractionBal, decA));
      }
    } else if (fromToken === "ETHJKT") {
      if (balB !== undefined && decB !== undefined) {
        const fractionBal = (balB * BigInt(Math.floor(fraction * 100))) / 100n;
        setAmountIn(formatUnits(fractionBal, decB));
      }
    } else {
      setAmountIn(String((mockBalances[fromToken] || 0) * fraction));
    }
  };

  // Spot price and exchange rate for real pool DKT/ETHJKT
  const exchangeRate = useMemo(() => {
    if (!reserveA || !reserveB || decA === undefined || decB === undefined) return 0;
    const rA = Number(formatUnits(reserveA, decA));
    const rB = Number(formatUnits(reserveB, decB));

    if (swapDir === "AtoB") {
      return rA > 0 ? rB / rA : 0;
    } else {
      return rB > 0 ? rA / rB : 0;
    }
  }, [reserveA, reserveB, decA, decB, swapDir]);

  // Price impact calculation for real pool DKT/ETHJKT
  const priceImpact = useMemo(() => {
    if (!amountIn || Number(amountIn) <= 0 || !previewOut || exchangeRate === 0) return 0;
    const inputVal = Number(amountIn);
    const outputVal = Number(previewOut.replace(/[^0-9.-]+/g, ""));
    const expectedOutput = inputVal * exchangeRate;
    const impact = ((expectedOutput - outputVal) / expectedOutput) * 100;
    return Math.max(0, impact);
  }, [amountIn, previewOut, exchangeRate]);

  const finalPreviewOut = useMemo(() => {
    const isDirectReal = (fromToken === "DKT" && toToken === "ETHJKT") || (fromToken === "ETHJKT" && toToken === "DKT");
    if (isDirectReal) {
      return previewOut;
    }
    return routeCalculation.outputAmount > 0
      ? routeCalculation.outputAmount.toLocaleString(undefined, { maximumFractionDigits: 4 })
      : "";
  }, [fromToken, toToken, previewOut, routeCalculation.outputAmount]);

  const finalPriceImpact = useMemo(() => {
    const isDirectReal = (fromToken === "DKT" && toToken === "ETHJKT") || (fromToken === "ETHJKT" && toToken === "DKT");
    if (isDirectReal) {
      return priceImpact;
    }
    return routeCalculation.priceImpact;
  }, [fromToken, toToken, priceImpact, routeCalculation.priceImpact]);

  const finalMinimumReceived = useMemo(() => {
    const outputVal = finalPreviewOut ? Number(finalPreviewOut.replace(/[^0-9.-]+/g, "")) : 0;
    const minRec = outputVal * (1 - slippage / 100);
    return minRec.toLocaleString(undefined, { maximumFractionDigits: 4 });
  }, [finalPreviewOut, slippage]);

  const finalExchangeRate = useMemo(() => {
    const isDirectReal = (fromToken === "DKT" && toToken === "ETHJKT") || (fromToken === "ETHJKT" && toToken === "DKT");
    if (isDirectReal) {
      return exchangeRate;
    }
    return routeCalculation.spotPrice;
  }, [fromToken, toToken, exchangeRate, routeCalculation.spotPrice]);

  const handleFlip = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setAmountIn("");
  };

  const handleSwapClick = () => {
    const isDirectReal = (fromToken === "DKT" && toToken === "ETHJKT") || (fromToken === "ETHJKT" && toToken === "DKT");
    if (isDirectReal) {
      doSwap();
    } else {
      doSwap(fromToken, toToken, routeCalculation.outputAmount);
    }
  };

  if (!ready) {
    return (
      <div className="w-full flex flex-col items-center justify-center space-y-3 py-12 text-center select-none">
        <div className="p-3 rounded-full bg-zinc-900/60 border border-zinc-800 text-blue-400 shadow-md">
          <HelpCircle size={28} />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-[#FAFAFA] text-sm">Connect your wallet</h3>
          <p className="text-zinc-500 text-xs max-w-[240px] leading-relaxed">
            Please connect your Web3 wallet at the top right to swap assets and start trading.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col space-y-3">
      {/* Settings Row */}
      <div className="flex justify-end -mb-1 relative z-20">
        <div className="relative">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-[#FAFAFA] transition-all duration-200"
            aria-label="Settings"
          >
            <Settings size={16} />
          </button>

          {/* Slippage Settings Dropdown */}
          {showSettings && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setShowSettings(false)} />
              <div className="absolute right-0 mt-1 w-48 p-3 bg-[#18181B] border border-zinc-800 rounded-md shadow-2xl z-30 space-y-2">
                <div className="text-xs font-semibold text-zinc-400 tracking-tight">Slippage Tolerance</div>
                <div className="flex space-x-1">
                  {[0.1, 0.5, 1.0].map((val) => (
                    <button
                      key={val}
                      onClick={() => {
                        setSlippage(val);
                        setShowSettings(false);
                      }}
                      className={`flex-1 py-1 text-xs font-mono font-bold rounded transition-all duration-200 ${
                        slippage === val
                          ? "bg-blue-600 text-white"
                          : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                      }`}
                    >
                      {val}%
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Input container */}
      <div className="flex flex-col gap-2">
        {/* From Token Box */}
        <div className="bg-[#18181B] p-4 rounded-md border border-zinc-800 space-y-2 hover:border-zinc-700 transition-all duration-300">
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-zinc-500 font-medium">You Pay</span>
            <span className="text-zinc-400 font-semibold font-mono">Balance: {fromBalFormatted}</span>
          </div>
          <div className="flex items-center justify-between">
            <input
              type="number"
              min="0"
              placeholder="0.0"
              value={amountIn}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || val === ".") {
                  setAmountIn(val);
                  return;
                }
                const dec = fromToken === "DKT" ? (decA || 18) : fromToken === "ETHJKT" ? (decB || 18) : 18;
                const maxDec = Math.min(dec, 6);
                const parts = val.split(".");
                if (parts[1] && parts[1].length > maxDec) {
                  setAmountIn(`${parts[0]}.${parts[1].slice(0, maxDec)}`);
                } else {
                  setAmountIn(val);
                }
              }}
              disabled={busy?.key === "swap"}
              className="bg-transparent border-none text-3xl font-bold font-mono text-[#FAFAFA] focus:outline-none w-2/3"
            />
            <div className="flex items-center space-x-2">
              <button
                onClick={setMaxAmount}
                className="px-2 py-1 text-[9px] font-extrabold uppercase rounded bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700 transition-all duration-200"
              >
                Max
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowFromDropdown(!showFromDropdown)}
                  className="flex items-center space-x-1.5 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded border border-zinc-800 font-bold text-sm text-zinc-200 shadow-sm transition-all duration-200"
                >
                  <TokenIcon symbol={fromToken} size="w-[18px] h-[18px]" textClass="text-[8px]" />
                  <span>{fromToken}</span>
                  <span className="text-[8px] text-zinc-500">▼</span>
                </button>
                {showFromDropdown && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setShowFromDropdown(false)} />
                    <div className="absolute right-0 mt-2 w-48 max-h-60 overflow-y-auto bg-[#18181B] border border-zinc-800 rounded-md shadow-2xl z-30 p-2 space-y-1">
                      {TOKENS.map((token) => (
                        <button
                          key={token.symbol}
                          onClick={() => {
                            setFromToken(token.symbol);
                            setShowFromDropdown(false);
                            if (token.symbol === toToken) {
                              setToToken(token.symbol === "DKT" ? "ETHJKT" : "DKT");
                            }
                          }}
                          className="flex items-center space-x-2 w-full px-3 py-2 rounded text-left hover:bg-zinc-800 text-xs font-semibold text-zinc-200 transition-colors"
                        >
                          <TokenIcon symbol={token.symbol} size="w-[18px] h-[18px]" textClass="text-[8px]" />
                          <div>
                            <div className="font-bold">{token.symbol}</div>
                            <div className="text-[9px] text-zinc-500 font-normal">{token.name}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick select buttons */}
          <div className="flex space-x-1.5 pt-0.5">
            {[0.25, 0.5, 0.75].map((percent) => (
              <button
                key={percent}
                onClick={() => setFractionAmount(percent)}
                className="px-2 py-0.5 text-[9px] font-semibold font-mono rounded bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-all duration-200"
              >
                {percent * 100}%
              </button>
            ))}
          </div>
        </div>

        {Number(amountIn) > fromBalanceNum && (
          <div className="text-rose-400 text-[10px] font-semibold font-mono flex items-center space-x-1.5 px-1 animate-fadeIn -my-1">
            <AlertTriangle size={11} />
            <span>Insufficient {fromToken} balance</span>
          </div>
        )}

        {/* Switch Button */}
        <div className="flex justify-center -my-1 z-10">
          <button
            onClick={handleFlip}
            disabled={busy?.key === "swap"}
            className="p-1.5 rounded bg-[#18181B] border border-zinc-800 text-zinc-400 hover:text-[#FAFAFA] transition-all duration-200 shadow"
            aria-label="Switch swap direction"
          >
            <ArrowDownUp size={14} />
          </button>
        </div>

        {/* To Token Box */}
        <div className="bg-[#18181B] p-4 rounded-md border border-zinc-800 space-y-2 hover:border-zinc-700 transition-all duration-300">
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-zinc-500 font-medium">You Receive (Estimated)</span>
            <span className="text-zinc-400 font-semibold font-mono">Balance: {toBalFormatted}</span>
          </div>
          <div className="flex items-center justify-between">
            <input
              type="text"
              readOnly
              placeholder="0.0"
              value={finalPreviewOut}
              className="bg-transparent border-none text-3xl font-bold font-mono text-emerald-400 focus:outline-none w-2/3 cursor-default"
            />
            <div className="relative">
              <button
                onClick={() => setShowToDropdown(!showToDropdown)}
                className="flex items-center space-x-1.5 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded border border-zinc-800 font-bold text-sm text-zinc-200 shadow-sm transition-all duration-200"
              >
                <TokenIcon symbol={toToken} size="w-[18px] h-[18px]" textClass="text-[8px]" />
                <span>{toToken}</span>
                <span className="text-[8px] text-zinc-500">▼</span>
              </button>
              {showToDropdown && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setShowToDropdown(false)} />
                  <div className="absolute right-0 mt-2 w-48 max-h-60 overflow-y-auto bg-[#18181B] border border-zinc-800 rounded-md shadow-2xl z-30 p-2 space-y-1">
                    {TOKENS.map((token) => (
                      <button
                        key={token.symbol}
                        onClick={() => {
                          setToToken(token.symbol);
                          setShowToDropdown(false);
                          if (token.symbol === fromToken) {
                            setFromToken(token.symbol === "DKT" ? "ETHJKT" : "DKT");
                          }
                        }}
                        className="flex items-center space-x-2.5 w-full px-3 py-2 rounded text-left hover:bg-zinc-800 text-xs font-semibold text-zinc-200 transition-colors"
                      >
                        <TokenIcon symbol={token.symbol} size="w-[18px] h-[18px]" textClass="text-[8px]" />
                        <div>
                          <div className="font-bold">{token.symbol}</div>
                          <div className="text-[9px] text-zinc-500 font-normal">{token.name}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Visual Route Path Display */}
      {path && path.length > 2 && (
        <div className="flex flex-col space-y-1 bg-zinc-900/40 p-3 rounded-md border border-zinc-800 text-[10px] font-mono text-zinc-400">
          <span className="text-zinc-500 font-semibold tracking-tight uppercase text-[8px]">Routing Path</span>
          <div className="flex items-center space-x-2 py-0.5 overflow-x-auto">
            {path.map((token, idx) => (
              <React.Fragment key={token}>
                <div className="flex items-center space-x-1 bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                  <TokenIcon symbol={token} size="w-3.5 h-3.5" textClass="text-[7px]" />
                  <span className="font-bold text-[9px] text-zinc-200">{token}</span>
                </div>
                {idx < path.length - 1 && <span className="text-zinc-600 text-[9px]">➔</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Transaction Details */}
      <div
        className={`p-3 text-xs bg-black/20 rounded-xl mt-2 space-y-1.5 font-mono text-zinc-400 transition-all duration-300 ${
          Number(amountIn) > 0 ? "opacity-100" : "opacity-50"
        }`}
      >
        <div className="flex justify-between">
          <span>Rate</span>
          <span
            className={`font-semibold transition-colors duration-300 ${
              Number(amountIn) > 0 ? "text-zinc-200" : "text-zinc-500"
            }`}
          >
            1 {fromToken} = {Number(amountIn) > 0 && finalExchangeRate > 0 ? finalExchangeRate.toFixed(5) : "-"} {toToken}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="flex items-center">
            Price Impact
            <HelpCircle size={10} className="ml-1 text-zinc-500" />
          </span>
          <span
            className={`font-semibold transition-all duration-300 ${
              Number(amountIn) > 0
                ? finalPriceImpact > 5
                  ? "text-rose-400 font-bold flex items-center"
                  : finalPriceImpact > 2
                  ? "text-amber-400"
                  : "text-emerald-400"
                : "text-zinc-500"
            }`}
          >
            {Number(amountIn) > 0 ? (
              <>
                {finalPriceImpact > 5 && <AlertTriangle size={10} className="mr-1 inline" />}
                {finalPriceImpact.toFixed(2)}%
              </>
            ) : (
              "-"
            )}
          </span>
        </div>

        <div className="flex justify-between">
          <span>Minimum Received</span>
          <span
            className={`font-semibold transition-colors duration-300 ${
              Number(amountIn) > 0 ? "text-zinc-200" : "text-zinc-500"
            }`}
          >
            {Number(amountIn) > 0 ? `${finalMinimumReceived} ${toToken}` : `- ${toToken}`}
          </span>
        </div>

        <div className="flex justify-between">
          <span>Slippage Tolerance</span>
          <span
            className={`font-semibold transition-colors duration-300 ${
              Number(amountIn) > 0 ? "text-zinc-200" : "text-zinc-500"
            }`}
          >
            {slippage}%
          </span>
        </div>

        <div className="flex justify-between">
          <span>Network Fee</span>
          <span
            className={`font-semibold transition-colors duration-300 ${
              Number(amountIn) > 0 ? "text-blue-400" : "text-zinc-500"
            }`}
          >
            ~0.0015 ETH
          </span>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={handleSwapClick}
        disabled={!ready || busy?.key === "swap" || !amountIn || Number(amountIn) <= 0 || Number(amountIn) > fromBalanceNum}
        className="w-full py-3.5 rounded-md bg-blue-600 disabled:bg-zinc-800 disabled:opacity-40 disabled:text-zinc-500 disabled:border-zinc-800 disabled:cursor-not-allowed text-white font-bold text-base hover:bg-blue-500 transition-colors duration-150 flex items-center justify-center space-x-2"
      >
        {busy?.key === "swap" ? (
          <>
            <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            <span className="tracking-wide text-sm font-semibold">{busy.text}</span>
          </>
        ) : (
          <span>{actLabel || "Swap"}</span>
        )}
      </button>
    </div>
  );
}