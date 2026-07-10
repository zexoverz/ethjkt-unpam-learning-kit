import { useState } from "react";
import { ExternalLink, CheckCircle2, History, ListRestart, ArrowRight } from "lucide-react";
import TokenIcon from "./TokenIcon";

interface HistoryEntry {
  type: string;
  hash: string;
  ts: number;
  aLogo: string;
  aAmt: string;
  aSym: string;
  bLogo: string;
  bAmt: string;
  bSym: string;
}

interface HistoryCardProps {
  history: HistoryEntry[];
  logLines: string[];
}

export default function HistoryCard({ history, logLines }: HistoryCardProps) {
  const [activeSubTab, setActiveSubTab] = useState<"history" | "logs">("history");

  const formatShortHash = (hash: string) => {
    if (!hash) return "";
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  const getRelativeTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="glass-panel w-full p-4 md:p-4.5 rounded-md border-zinc-800 flex flex-col space-y-3.5 flex-shrink-0 min-h-[250px] max-h-[480px]">
      {/* Subtabs header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800">
        <div className="flex space-x-5">
          <button
            onClick={() => setActiveSubTab("history")}
            className={`text-xs font-bold transition-all duration-155 flex items-center space-x-1.5 ${
              activeSubTab === "history"
                ? "text-[#FAFAFA]"
                : "text-zinc-500 hover:text-zinc-350 font-normal"
            }`}
          >
            <History size={14} />
            <span>Transaction History</span>
          </button>
          <button
            onClick={() => setActiveSubTab("logs")}
            className={`text-xs font-bold transition-all duration-155 flex items-center space-x-1.5 ${
              activeSubTab === "logs"
                ? "text-[#FAFAFA]"
                : "text-zinc-500 hover:text-zinc-350 font-normal"
            }`}
          >
            <ListRestart size={14} />
            <span>Developer Logs</span>
          </button>
        </div>
        <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-500 bg-zinc-900/40 px-2.5 py-1 rounded border border-zinc-800">
          {activeSubTab === "history" ? history.length : logLines.length} Entries
        </span>
      </div>

      {/* Body rendering */}
      {activeSubTab === "history" ? (
        <div className="space-y-2 flex-1 min-h-0 overflow-y-auto pr-1">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-zinc-650">
              <History size={36} className="mb-2 stroke-[1.5]" />
              <p className="text-sm font-semibold tracking-tight">No transactions recorded yet</p>
              <p className="text-xs">Your Sepolia swaps and liquidity actions will show up here.</p>
            </div>
          ) : (
            history.slice(0, 3).map((tx, idx) => {
              const txUrl = `https://sepolia.etherscan.io/tx/${tx.hash}`;
              const relativeTime = getRelativeTime(tx.ts);
              const txTypeLabel = tx.type === "swap" ? "Swap" : tx.type === "add" ? "Add Liquidity" : "Remove Liquidity";
              const badgeClass = 
                tx.type === "swap" 
                  ? "bg-blue-950/40 text-blue-400 border border-blue-900/30" 
                  : tx.type === "add" 
                  ? "bg-emerald-950/40 text-emerald-450 border border-emerald-900/30" 
                  : "bg-rose-950/40 text-rose-450 border border-rose-900/30";
              
              return (
                <div 
                  key={tx.hash} 
                  className="bg-[#18181B] border border-zinc-800 hover:border-zinc-700 p-4 rounded-md flex items-center justify-between text-sm font-mono transition-all duration-150 ease-out"
                >
                  {/* Left: Token icons & amounts */}
                  <div className="flex items-center space-x-4 md:space-x-6">
                    <div className="flex items-center space-x-2">
                      {tx.aLogo && (
                        <TokenIcon symbol={tx.aSym} logoUrl={tx.aLogo} size="w-6 h-6" textClass="text-[9px]" bgClass="bg-blue-600" />
                      )}
                      <span className="font-bold text-zinc-150">{tx.aAmt ? `${tx.aAmt} ${tx.aSym}` : tx.aSym}</span>
                    </div>

                    {tx.type === "swap" && (
                      <div className="flex items-center justify-center">
                        <ArrowRight size={14} className="text-zinc-500" />
                      </div>
                    )}

                    {tx.bSym && (
                      <div className="flex items-center space-x-2">
                        {tx.bLogo && (
                          <TokenIcon symbol={tx.bSym} logoUrl={tx.bLogo} size="w-6 h-6" textClass="text-[9px]" bgClass="bg-purple-600" />
                        )}
                        <span className="font-bold text-zinc-150">{tx.bAmt ? `${tx.bAmt} ${tx.bSym}` : tx.bSym}</span>
                      </div>
                    )}
                  </div>

                  {/* Right: Badge, time, hash link, status */}
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2.5">
                      <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider flex items-center justify-center ${badgeClass}`}>
                        {txTypeLabel}
                      </span>
                      <span className="text-zinc-500 text-[10px] hidden sm:inline self-center">{relativeTime}</span>
                    </div>

                    <a 
                      href={txUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center text-zinc-300 hover:text-white font-bold bg-zinc-800 px-3 py-1.5 rounded-md border border-zinc-700 hover:bg-zinc-700 transition-colors duration-150 text-xs self-center"
                    >
                      <span className="mr-1.5">{formatShortHash(tx.hash)}</span>
                      <ExternalLink size={12} />
                    </a>

                    <div className="flex items-center text-emerald-450">
                      <CheckCircle2 size={18} />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="bg-[#18181B] p-3 rounded-md border border-zinc-800 flex-1 min-h-0 overflow-y-auto">
          {logLines.length === 0 ? (
            <p className="text-zinc-650 text-xs font-mono py-6 text-center">System idle. Ready for operations.</p>
          ) : (
            <pre className="text-[11px] font-mono text-zinc-400 whitespace-pre-wrap leading-relaxed">
              {logLines.join("\n")}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
