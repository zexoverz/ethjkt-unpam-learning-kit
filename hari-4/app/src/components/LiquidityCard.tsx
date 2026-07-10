import { useState, useMemo } from "react";
import { ArrowUpDown, Plus, Trash2, Layers, Info } from "lucide-react";
import { formatUnits } from "viem";
import TokenIcon from "./TokenIcon";
import { motion } from "framer-motion";

interface LiquidityCardProps {
  symA: string;
  symB: string;
  decA: number | undefined;
  decB: number | undefined;
  balA: bigint | undefined;
  balB: bigint | undefined;
  reserveA: bigint;
  reserveB: bigint;
  totalShares: bigint;
  myShares: bigint | undefined;
  addA: string;
  setAddA: (val: string) => void;
  addB: string;
  setAddB: (val: string) => void;
  onAddA: (val: string) => void;
  onAddB: (val: string) => void;
  removeShares: string;
  setRemoveShares: (val: string) => void;
  doAddLiquidity: () => Promise<void>;
  doRemoveLiquidity: () => Promise<void>;
  busy: { key: string; text: string } | null;
  ready: boolean;
  actLabel: string | null;
  hasPool: boolean;
}

export default function LiquidityCard({
  symA,
  symB,
  decA,
  decB,
  balA,
  balB,
  reserveA,
  reserveB,
  totalShares,
  myShares,
  addA,
  setAddA,
  addB,
  setAddB,
  onAddA,
  onAddB,
  removeShares,
  setRemoveShares,
  doAddLiquidity,
  doRemoveLiquidity,
  busy,
  ready,
  actLabel,
  hasPool,
}: LiquidityCardProps) {
  const [liqSub, setLiqSub] = useState<"add" | "remove">("add");
  const [isFlipped, setIsFlipped] = useState(false); // State buat ngebaca posisi Flip

  const balAFormatted = useMemo(() => {
    if (balA === undefined || decA === undefined) return "0.0";
    return Number(formatUnits(balA, decA)).toLocaleString(undefined, { maximumFractionDigits: 4 });
  }, [balA, decA]);

  const balBFormatted = useMemo(() => {
    if (balB === undefined || decB === undefined) return "0.0";
    return Number(formatUnits(balB, decB)).toLocaleString(undefined, { maximumFractionDigits: 4 });
  }, [balB, decB]);

  const mySharesFormatted = useMemo(() => {
    if (myShares === undefined) return "0.0";
    return Number(formatUnits(myShares, 18)).toLocaleString(undefined, { maximumFractionDigits: 4 });
  }, [myShares]);

  const totalSharesFormatted = useMemo(() => {
    return Number(formatUnits(totalShares, 18)).toLocaleString(undefined, { maximumFractionDigits: 2 });
  }, [totalShares]);

  const lpSharePercent = useMemo(() => {
    if (!myShares || !totalShares || totalShares === 0n) return 0;
    const my = Number(formatUnits(myShares, 18));
    const tot = Number(formatUnits(totalShares, 18));
    return (my / tot) * 100;
  }, [myShares, totalShares]);

  const myTokenAClaim = useMemo(() => {
    if (!myShares || !totalShares || !reserveA || totalShares === 0n || decA === undefined) return 0;
    const share = Number(formatUnits(myShares, 18)) / Number(formatUnits(totalShares, 18));
    return share * Number(formatUnits(reserveA, decA));
  }, [myShares, totalShares, reserveA, decA]);

  const myTokenBClaim = useMemo(() => {
    if (!myShares || !totalShares || !reserveB || totalShares === 0n || decB === undefined) return 0;
    const share = Number(formatUnits(myShares, 18)) / Number(formatUnits(totalShares, 18));
    return share * Number(formatUnits(reserveB, decB));
  }, [myShares, totalShares, reserveB, decB]);

  const balANum = useMemo(() => {
    if (balA === undefined || decA === undefined) return 0;
    return Number(formatUnits(balA, decA));
  }, [balA, decA]);

  const balBNum = useMemo(() => {
    if (balB === undefined || decB === undefined) return 0;
    return Number(formatUnits(balB, decB));
  }, [balB, decB]);

  const mySharesNum = useMemo(() => {
    if (myShares === undefined) return 0;
    return Number(formatUnits(myShares, 18));
  }, [myShares]);

  const handleMaxShares = () => {
    if (myShares !== undefined) {
      setRemoveShares(formatUnits(myShares, 18));
    }
  };

  if (!ready) {
    return (
      <div className="w-full flex flex-col items-center justify-center space-y-3 py-8 text-center select-none">
        <div className="p-3 rounded-full bg-zinc-900/60 border border-zinc-800 text-emerald-400 shadow-md">
          <Layers size={24} />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-[#FAFAFA] text-sm">Connect your wallet</h3>
          <p className="text-zinc-500 text-xs max-w-[240px] leading-relaxed">
            Please connect your Web3 wallet at the top right to manage liquidity and view pool shares.
          </p>
        </div>
      </div>
    );
  }

  // Komponen Box Token A (Biar gampang dituker posisinya)
  const TokenBoxA = (
    <div className="bg-[#18181B] p-3.5 rounded-xl border border-zinc-800 flex flex-col gap-2 relative z-0 hover:border-zinc-700 transition-all duration-300">
      <div className="flex justify-between items-center text-[10px]">
        <span className="text-zinc-500 font-medium">Deposit</span>
        <span className="text-zinc-400 font-semibold font-mono">Balance: {balAFormatted}</span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <input
          type="number"
          min="0"
          placeholder="0.0"
          value={addA}
          onChange={(e) => {
            const val = e.target.value;
            if (val === "" || val === ".") {
              onAddA(val);
              return;
            }
            const dec = decA || 18;
            const maxDec = Math.min(dec, 6);
            const parts = val.split(".");
            if (parts[1] && parts[1].length > maxDec) {
              onAddA(`${parts[0]}.${parts[1].slice(0, maxDec)}`);
            } else {
              onAddA(val);
            }
          }}
          disabled={busy?.key === "add"}
          className="bg-transparent border-none text-2xl font-bold font-mono text-[#FAFAFA] focus:outline-none w-full min-w-0"
        />
        <div className="flex items-center space-x-1 flex-shrink-0 bg-zinc-800 px-2 py-1.5 rounded-lg border border-zinc-800 font-bold text-xs text-zinc-200">
          <TokenIcon symbol={symA} size="w-4 h-4" textClass="text-[7px]" bgClass="bg-blue-600" />
          <span>{symA}</span>
        </div>
      </div>
    </div>
  );

  // Komponen Box Token B
  const TokenBoxB = (
    <div className="bg-[#18181B] p-3.5 rounded-xl border border-zinc-800 flex flex-col gap-2 relative z-0 hover:border-zinc-700 transition-all duration-300">
      <div className="flex justify-between items-center text-[10px]">
        <span className="text-zinc-500 font-medium">Deposit</span>
        <span className="text-zinc-400 font-semibold font-mono">Balance: {balBFormatted}</span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <input
          type="number"
          min="0"
          placeholder="0.0"
          value={addB}
          onChange={(e) => {
            const val = e.target.value;
            if (val === "" || val === ".") {
              onAddB(val);
              return;
            }
            const dec = decB || 18;
            const maxDec = Math.min(dec, 6);
            const parts = val.split(".");
            if (parts[1] && parts[1].length > maxDec) {
              onAddB(`${parts[0]}.${parts[1].slice(0, maxDec)}`);
            } else {
              onAddB(val);
            }
          }}
          disabled={busy?.key === "add"}
          className="bg-transparent border-none text-2xl font-bold font-mono text-[#FAFAFA] focus:outline-none w-full min-w-0"
        />
        <div className="flex items-center space-x-1 flex-shrink-0 bg-zinc-800 px-2 py-1.5 rounded-lg border border-zinc-800 font-bold text-xs text-zinc-200">
          <TokenIcon symbol={symB} size="w-4 h-4" textClass="text-[7px]" bgClass="bg-purple-600" />
          <span>{symB}</span>
        </div>
      </div>
    </div>
  );

  // Logika Error Handling yang menyesuaikan posisi atas/bawah
  const topError = isFlipped
    ? (Number(addB) > balBNum ? `Insufficient ${symB}` : null)
    : (Number(addA) > balANum ? `Insufficient ${symA}` : null);

  const bottomError = isFlipped
    ? (Number(addA) > balANum ? `Insufficient ${symA}` : null)
    : (Number(addB) > balBNum ? `Insufficient ${symB}` : null);


  return (
    <div className="w-full flex flex-col gap-1.5">
      {/* Subtabs Add/Remove Header */}
      <div className="flex bg-zinc-900/40 p-1 rounded-lg border border-zinc-800 relative z-20">
        {(["add", "remove"] as const).map((mode) => {
          const isActive = liqSub === mode;
          const Icon = mode === "add" ? Plus : Trash2;
          const label = mode === "add" ? "Add Liquidity" : "Remove Liquidity";
          return (
            <button
              key={mode}
              onClick={() => setLiqSub(mode)}
              className={`relative flex-1 py-1.5 font-semibold transition-all duration-200 flex items-center justify-center space-x-1.5 rounded-md ${
                isActive ? "text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="active-liq-sub-tab"
                  className="absolute inset-0 bg-[#27272A] rounded-md border border-zinc-700 shadow-sm"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <Icon size={12} className="relative z-10" />
              <span className="relative z-10 text-[11px]">{label}</span>
            </button>
          );
        })}
      </div>

      {/* Content Body */}
      {liqSub === "add" ? (
        <div className="flex flex-col">
          
          {/* Render Token Atas */}
          {isFlipped ? TokenBoxB : TokenBoxA}

          {/* Toggle Button & Error Spacer */}
          <div className="flex flex-col items-center justify-center -my-3 z-10 relative h-6">
            
            {topError && (
              <div className="absolute left-1 top-0 text-rose-455 text-[9px] font-semibold font-mono flex items-center space-x-1 animate-fadeIn">
                <Info size={10} />
                <span>{topError}</span>
              </div>
            )}
            
            {bottomError && !topError && (
              <div className="absolute left-1 bottom-0 text-rose-455 text-[9px] font-semibold font-mono flex items-center space-x-1 animate-fadeIn">
                <Info size={10} />
                <span>{bottomError}</span>
              </div>
            )}

            <button 
              onClick={() => setIsFlipped(!isFlipped)}
              className="p-1.5 rounded-lg bg-zinc-800 border-2 border-[#121214] text-zinc-400 hover:text-white hover:bg-zinc-700 shadow flex items-center justify-center transition-all duration-200 cursor-pointer"
            >
              <ArrowUpDown size={12} />
            </button>
          </div>

          {/* Render Token Bawah */}
          {isFlipped ? TokenBoxA : TokenBoxB}
          
          <p className="text-[9px] text-zinc-400 bg-zinc-900/40 p-2 rounded-lg border border-zinc-800/80 font-mono leading-relaxed mt-1.5">
            {hasPool
              ? "💡 Ratios are automatically adjusted based on current pool prices."
              : "💡 First LP: You determine the initial price of the pool by inputting both values."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {/* Input Shares (Remove Liquidity Mode) */}
          <div className="bg-[#18181B] p-3.5 rounded-xl border border-zinc-800 flex flex-col gap-2 relative z-0 hover:border-zinc-700 transition-all duration-300">
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-zinc-500 font-medium">Remove Shares</span>
              <span className="text-zinc-400 font-semibold font-mono">Shares: {mySharesFormatted}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <input
                type="number"
                min="0"
                placeholder="0.0"
                value={removeShares}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || val === ".") {
                    setRemoveShares(val);
                    return;
                  }
                  const maxDec = 6;
                  const parts = val.split(".");
                  if (parts[1] && parts[1].length > maxDec) {
                    setRemoveShares(`${parts[0]}.${parts[1].slice(0, maxDec)}`);
                  } else {
                    setRemoveShares(val);
                  }
                }}
                disabled={busy?.key === "remove"}
                className="bg-transparent border-none text-2xl font-bold font-mono text-[#FAFAFA] focus:outline-none w-full min-w-0"
              />
              <button
                onClick={handleMaxShares}
                className="px-2 py-1 text-[9px] font-extrabold uppercase rounded bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-600 transition-all duration-200 flex-shrink-0"
              >
                Max
              </button>
            </div>
          </div>

          <div className="h-4 relative">
             {Number(removeShares) > mySharesNum && (
              <div className="absolute left-1 top-0 text-rose-455 text-[9px] font-semibold font-mono flex items-center space-x-1 animate-fadeIn">
                <Info size={10} />
                <span>Insufficient shares balance</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Position & Pool Information Details */}
      <div className="p-3 text-[10px] bg-black/20 rounded-xl flex flex-col gap-1 font-mono text-zinc-400 transition-all duration-300">
        <div className="flex justify-between border-b border-zinc-800/40 pb-1 mb-0.5">
          <span className="font-semibold text-zinc-200">Your Position</span>
          <span className="text-blue-400 font-bold">{lpSharePercent.toFixed(4)}% Share</span>
        </div>
        <div className="flex justify-between">
          <span>Your LP Shares</span>
          <span className="text-zinc-200 font-semibold">{mySharesFormatted}</span>
        </div>
        <div className="flex justify-between">
          <span>Claimable {symA}</span>
          <span className="text-zinc-200 font-semibold">{myTokenAClaim.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
        </div>
        <div className="flex justify-between">
          <span>Claimable {symB}</span>
          <span className="text-zinc-200 font-semibold">{myTokenBClaim.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
        </div>

        <div className="flex justify-between border-b border-zinc-800/40 pb-1 pt-1 mb-0.5 mt-0.5">
          <span className="font-semibold text-zinc-200">Pool Statistics</span>
          <span>-</span>
        </div>
        <div className="flex justify-between">
          <span>Total Pooled {symA}</span>
          <span className="text-zinc-200 font-semibold">
            {Number(formatUnits(reserveA, decA || 18)).toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Total Pooled {symB}</span>
          <span className="text-zinc-200 font-semibold">
            {Number(formatUnits(reserveB, decB || 18)).toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Total LP Shares</span>
          <span className="text-zinc-200 font-semibold">{totalSharesFormatted}</span>
        </div>
      </div>

      {/* Action Button */}
      {liqSub === "add" ? (
        <button
          onClick={doAddLiquidity}
          disabled={!ready || busy?.key === "add" || !addA || !addB || Number(addA) <= 0 || Number(addB) <= 0 || Number(addA) > balANum || Number(addB) > balBNum}
          className="w-full py-3 rounded-xl bg-blue-600 disabled:bg-zinc-800 disabled:opacity-40 disabled:text-zinc-500 disabled:border-zinc-800 disabled:cursor-not-allowed text-white font-bold text-sm hover:bg-blue-500 transition-colors duration-150 flex items-center justify-center space-x-2 mt-0.5"
        >
          {busy?.key === "add" ? (
            <>
              <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
              <span className="tracking-wide text-xs font-semibold">{busy.text}</span>
            </>
          ) : (
            <span>{actLabel || "Add Liquidity"}</span>
          )}
        </button>
      ) : (
        <button
          onClick={doRemoveLiquidity}
          disabled={!ready || busy?.key === "remove" || !removeShares || Number(removeShares) <= 0 || Number(removeShares) > mySharesNum}
          className="w-full py-3 rounded-xl bg-red-600 disabled:bg-zinc-800 disabled:opacity-40 disabled:text-zinc-500 disabled:border-zinc-800 disabled:cursor-not-allowed text-white font-bold text-sm hover:bg-red-500 transition-colors duration-150 flex items-center justify-center space-x-2 mt-0.5"
        >
          {busy?.key === "remove" ? (
            <>
              <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
              <span className="tracking-wide text-xs font-semibold">{busy.text}</span>
            </>
          ) : (
            <span>{actLabel || "Remove Liquidity"}</span>
          )}
        </button>
      )}
    </div>
  );
}