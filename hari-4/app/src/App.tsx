import { useMemo, useState, useEffect } from "react";
import { useAccount, useChainId, useReadContracts } from "wagmi";
import { readContract, writeContract, waitForTransactionReceipt } from "@wagmi/core";
import { formatUnits, parseUnits } from "viem";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeftRight, Droplet, X, CheckCircle, AlertCircle, Info } from "lucide-react";

// Configuration & ABI
import { CONFIG } from "../config";
import { ERC20_ABI, AMM_ABI } from "./abi";
import { wagmiConfig } from "./wagmi";

// Components
import Navbar from "./components/Navbar";
import MarketStats from "./components/MarketStats";
import TradingChart from "./components/TradingChart";
import SwapCard from "./components/SwapCard";
import LiquidityCard from "./components/LiquidityCard";
import HistoryCard from "./components/HistoryCard";
import OrderBook from "./components/OrderBook";
import MarketInfoPanel from "./components/MarketInfoPanel";

const SEPOLIA = CONFIG.SEPOLIA_CHAIN_ID;
const tokenA = { address: CONFIG.TOKEN_A.address as `0x${string}`, abi: ERC20_ABI };
const tokenB = { address: CONFIG.TOKEN_B.address as `0x${string}`, abi: ERC20_ABI };
const amm = { address: CONFIG.AMM_ADDRESS as `0x${string}`, abi: AMM_ABI };
const HKEY = "ks_hist_v2_" + String(CONFIG.AMM_ADDRESS).toLowerCase();

// ---------- Helpers ----------
function fmt(raw: bigint | undefined, dec: number | undefined): string {
  if (raw == null || dec == null) return "-";
  return Number(formatUnits(raw, dec)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

function fmtNum(x: number): string {
  return Number(x).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

function getAmountOut(amountIn: bigint, reserveIn: bigint, reserveOut: bigint): bigint {
  if (amountIn <= 0n || reserveIn <= 0n || reserveOut <= 0n) return 0n;
  const inWithFee = amountIn * 997n;
  return (inWithFee * reserveOut) / (reserveIn * 1000n + inWithFee);
}

function loadHistory() {
  try {
    const stored = localStorage.getItem(HKEY);
    if (stored) return JSON.parse(stored);
    
    // Seed 5 mock/sample transactions so there's always something to display initially
    return [
      {
        type: "swap",
        hash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        ts: Date.now() - 3600000 * 2, // 2h ago
        aLogo: "/ethjkt-logo.png",
        aAmt: "174.00",
        aSym: "ETHJKT",
        bLogo: "/dkt-logo.png",
        bAmt: "172.86",
        bSym: "DKT",
      },
      {
        type: "add",
        hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        ts: Date.now() - 3600000 * 5, // 5h ago
        aLogo: "/dkt-logo.png",
        aAmt: "50.00",
        aSym: "DKT",
        bLogo: "/ethjkt-logo.png",
        bAmt: "50.00",
        bSym: "ETHJKT",
      },
      {
        type: "swap",
        hash: "0x7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456",
        ts: Date.now() - 3600000 * 24, // 1 day ago
        aLogo: "/dkt-logo.png",
        aAmt: "10.00",
        aSym: "DKT",
        bLogo: "/ethjkt-logo.png",
        bAmt: "9.95",
        bSym: "ETHJKT",
      },
      {
        type: "remove",
        hash: "0x567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234",
        ts: Date.now() - 3600000 * 48, // 2 days ago
        aLogo: "/dkt-logo.png",
        aAmt: "",
        aSym: "DKT",
        bLogo: "/ethjkt-logo.png",
        bAmt: "",
        bSym: "ETHJKT",
      },
      {
        type: "swap",
        hash: "0x34567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12",
        ts: Date.now() - 3600000 * 72, // 3 days ago
        aLogo: "/ethjkt-logo.png",
        aAmt: "5.00",
        aSym: "ETHJKT",
        bLogo: "/dkt-logo.png",
        bAmt: "4.98",
        bSym: "DKT",
      }
    ];
  } catch {
    return [];
  }
}

export default function App() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const chainOk = chainId === SEPOLIA;

  const [activeModal, setActiveModal] = useState<"swap" | "liquidity" | null>(null);
  const [swapDir, setSwapDir] = useState("AtoB");
  const [amountIn, setAmountIn] = useState("");
  const [addA, setAddA] = useState("");
  const [addB, setAddB] = useState("");
  const [removeShares, setRemoveShares] = useState("");
  const [busy, setBusy] = useState<{ key: string; text: string } | null>(null);
  const [logLines, setLogLines] = useState<string[]>([]);
  const [history, setHistory] = useState<any[]>(loadHistory);
  const [mockBalances, setMockBalances] = useState<Record<string, number>>({
    ETH: 1.5,
    USDT: 150.0,
    USDC: 250.0,
    UNI: 25.0,
    LINK: 45.0,
    WBTC: 0.02,
  });

  interface ToastMessage {
    id: string;
    type: "success" | "error" | "info";
    title: string;
    message: string;
  }
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: "success" | "error" | "info", title: string, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  // ---------- Reads ----------
  const pool = useReadContracts({
    contracts: [
      { ...tokenA, functionName: "symbol" },
      { ...tokenA, functionName: "decimals" },
      { ...tokenB, functionName: "symbol" },
      { ...tokenB, functionName: "decimals" },
      { ...amm, functionName: "reserveA" },
      { ...amm, functionName: "reserveB" },
      { ...amm, functionName: "totalShares" },
    ],
    query: { refetchInterval: 8000 },
  });

  const user = useReadContracts({
    contracts: [
      { ...tokenA, functionName: "balanceOf", args: [address as `0x${string}`] },
      { ...tokenB, functionName: "balanceOf", args: [address as `0x${string}`] },
      { ...amm, functionName: "shares", args: [address as `0x${string}`] },
    ],
    query: { enabled: !!address, refetchInterval: 8000 },
  });

  const d = pool.data;
  const symA = d?.[0]?.result as string ?? "TOKEN A";
  const decA = d?.[1]?.result as number | undefined;
  const symB = d?.[2]?.result as string ?? "TOKEN B";
  const decB = d?.[3]?.result as number | undefined;
  const reserveA = d?.[4]?.result as bigint ?? 0n;
  const reserveB = d?.[5]?.result as bigint ?? 0n;
  const totalShares = d?.[6]?.result as bigint ?? 0n;

  const balA = user.data?.[0]?.result as bigint | undefined;
  const balB = user.data?.[1]?.result as bigint | undefined;
  const myShares = user.data?.[2]?.result as bigint | undefined;

  const ready = isConnected && chainOk && decA != null && decB != null;
  const hasPool = reserveA > 0n && reserveB > 0n;

  function refresh() {
    pool.refetch();
    user.refetch();
  }

  function log(msg: string) {
    const t = new Date().toLocaleTimeString();
    setLogLines((prev) => [`[${t}] ${msg}`, ...prev].slice(0, 40));
  }

  function pushHistory(entry: any) {
    setHistory((prev) => {
      const next = [entry, ...prev].slice(0, 50);
      try {
        localStorage.setItem(HKEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  // ---------- Swap Preview ----------
  const previewOut = useMemo(() => {
    if (!amountIn || Number(amountIn) <= 0 || decA == null || decB == null) return "";
    try {
      if (swapDir === "AtoB") {
        const out = getAmountOut(parseUnits(amountIn, decA), reserveA, reserveB);
        return fmt(out, decB);
      }
      const out = getAmountOut(parseUnits(amountIn, decB), reserveB, reserveA);
      return fmt(out, decA);
    } catch {
      return "";
    }
  }, [amountIn, swapDir, reserveA, reserveB, decA, decB]);

  // ---------- Live Market Price ----------
  const currentPrice = useMemo(() => {
    if (!reserveA || !reserveB || decA == null || decB == null) return 0;
    const rA = Number(formatUnits(reserveA, decA));
    const rB = Number(formatUnits(reserveB, decB));
    return rA > 0 ? rB / rA : 0;
  }, [reserveA, reserveB, decA, decB]);

  // ---------- Liquidity Auto-Pair ----------
  function onAddA(v: string) {
    setAddA(v);
    if (hasPool && v && Number(v) > 0 && decA != null && decB != null) {
      try {
        const amtA = parseUnits(v, decA);
        const amtB = (amtA * reserveB) / reserveA;
        setAddB(trim(formatUnits(amtB, decB)));
      } catch {}
    } else if (!v) setAddB("");
  }

  function onAddB(v: string) {
    setAddB(v);
    if (hasPool && v && Number(v) > 0 && decA != null && decB != null) {
      try {
        const amtB = parseUnits(v, decB);
        const amtA = (amtB * reserveA) / reserveB;
        setAddA(trim(formatUnits(amtA, decA)));
      } catch {}
    } else if (!v) setAddA("");
  }

  // ---------- Write Flows ----------
  async function ensureAllowance(token: typeof tokenA, amount: bigint, sym: string, setStep: (t: string) => void) {
    const cur = await readContract(wagmiConfig, {
      address: token.address,
      abi: ERC20_ABI,
      functionName: "allowance",
      args: [address as `0x${string}`, CONFIG.AMM_ADDRESS as `0x${string}`],
    });
    if (cur >= amount) return;
    setStep(`Approve ${sym} — Check wallet`);
    log(`Approving ${sym}... please confirm the transaction in your wallet.`);
    const hash = await writeContract(wagmiConfig, {
      address: token.address,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [CONFIG.AMM_ADDRESS as `0x${string}`, amount],
    });
    setStep(`Approving ${sym}...`);
    await waitForTransactionReceipt(wagmiConfig, { hash });
    log(`Approve ${sym} successful.`);
  }

  async function doSwap(fromSymOverride?: string, toSymOverride?: string, calculatedOutput?: number) {
    if (!guard()) return;
    if (!amountIn || Number(amountIn) <= 0) return alert("Please enter swap amount.");
    
    const inSym = fromSymOverride || (swapDir === "AtoB" ? symA : symB);
    const outSym = toSymOverride || (swapDir === "AtoB" ? symB : symA);
    const inDec = swapDir === "AtoB" ? decA : decB;
    const outDec = swapDir === "AtoB" ? decB : decA;
    const rIn = swapDir === "AtoB" ? reserveA : reserveB;
    const rOut = swapDir === "AtoB" ? reserveB : reserveA;
    const token = swapDir === "AtoB" ? tokenA : tokenB;
    
    // Check if it's a real direct swap
    const isRealDirect = (inSym === symA && outSym === symB) || (inSym === symB && outSym === symA);

    if (isRealDirect) {
      if (inDec === undefined || outDec === undefined) return;
      const amount = parseUnits(amountIn, inDec);
      const setStep = (t: string) => setBusy({ key: "swap", text: t });
      setStep("Preparing swap...");
      try {
        await ensureAllowance(token, amount, inSym, setStep);
        setStep("Confirm swap in wallet...");
        log("Sending swap transaction... confirm in wallet.");
        const hash = await writeContract(wagmiConfig, {
          address: CONFIG.AMM_ADDRESS as `0x${string}`,
          abi: AMM_ABI,
          functionName: inSym === symA ? "swapAforB" : "swapBforA",
          args: [amount],
        });
        setStep("Swapping assets... (waiting for confirmation)");
        await waitForTransactionReceipt(wagmiConfig, { hash });
        const outRaw = getAmountOut(amount, rIn, rOut);
        const amtIn = Number(amountIn);
        const amtOut = Number(formatUnits(outRaw, outDec));
        log("Swap transaction confirmed successfully!");
        addToast("success", "Swap Confirmed", `Successfully swapped ${amountIn} ${inSym} for ${fmtNum(amtOut)} ${outSym}.`);
        pushHistory({
          type: "swap",
          hash,
          ts: Date.now(),
          aLogo: inSym === symA ? CONFIG.TOKEN_A.logo : CONFIG.TOKEN_B.logo,
          aAmt: fmtNum(amtIn),
          aSym: inSym,
          bLogo: inSym === symA ? CONFIG.TOKEN_B.logo : CONFIG.TOKEN_A.logo,
          bAmt: fmtNum(amtOut),
          bSym: outSym,
        });
        setAmountIn("");
        refresh();
      } catch (e: any) {
        log("Swap transaction failed: " + short(e));
        addToast("error", "Swap Failed", short(e));
      } finally {
        setBusy(null);
      }
    } else {
      // Execute simulated routing swap
      const setStep = (t: string) => setBusy({ key: "swap", text: t });
      setStep("Routing trade...");
      try {
        await new Promise(resolve => setTimeout(resolve, 800));
        setStep("Confirming route in wallet...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        setStep("Simulating trade execution...");
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const hash = "0x" + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join("");
        log(`Simulated swap of ${amountIn} ${inSym} to ${calculatedOutput?.toFixed(4)} ${outSym} via multi-hop routing confirmed.`);
        addToast("success", "Swap Confirmed (Simulated)", `Successfully routed ${amountIn} ${inSym} to ${calculatedOutput?.toFixed(4)} ${outSym}.`);
        
        pushHistory({
          type: "swap",
          hash,
          ts: Date.now(),
          aLogo: inSym === "DKT" ? "/dkt-logo.png" : "/ethjkt-logo.png",
          aAmt: fmtNum(Number(amountIn)),
          aSym: inSym,
          bLogo: outSym === "DKT" ? "/dkt-logo.png" : "/ethjkt-logo.png",
          bAmt: fmtNum(calculatedOutput || 0),
          bSym: outSym,
        });
        
        // Update mock balances locally
        if (inSym !== "DKT" && inSym !== "ETHJKT") {
          setMockBalances(prev => ({
            ...prev,
            [inSym]: Math.max(0, (prev[inSym] || 0) - Number(amountIn)),
          }));
        }
        if (outSym !== "DKT" && outSym !== "ETHJKT") {
          setMockBalances(prev => ({
            ...prev,
            [outSym]: (prev[outSym] || 0) + (calculatedOutput || 0),
          }));
        }
        
        setAmountIn("");
        refresh();
      } catch (e: any) {
        log("Simulated swap failed: " + short(e));
        addToast("error", "Simulated Swap Failed", short(e));
      } finally {
        setBusy(null);
      }
    }
  }

  async function doAddLiquidity() {
    if (!guard()) return;
    if (!addA || !addB || Number(addA) <= 0 || Number(addB) <= 0) return alert("Please enter amounts for both tokens.");
    if (decA === undefined || decB === undefined) return;
    const amtA = parseUnits(addA, decA);
    const amtB = parseUnits(addB, decB);
    const setStep = (t: string) => setBusy({ key: "add", text: t });
    setStep("Preparing tokens...");
    try {
      await ensureAllowance(tokenA, amtA, symA, setStep);
      await ensureAllowance(tokenB, amtB, symB, setStep);
      setStep("Confirm liquidity add in wallet...");
      log("Sending addLiquidity transaction... confirm in wallet.");
      const hash = await writeContract(wagmiConfig, {
        address: CONFIG.AMM_ADDRESS as `0x${string}`,
        abi: AMM_ABI,
        functionName: "addLiquidity",
        args: [amtA, amtB],
      });
      setStep("Adding liquidity... (waiting for confirmation)");
      await waitForTransactionReceipt(wagmiConfig, { hash });
      log("Successfully added liquidity to pool!");
      addToast("success", "Liquidity Added", `Deposited ${addA} ${symA} and ${addB} ${symB} to the pool.`);
      pushHistory({
        type: "add",
        hash,
        ts: Date.now(),
        aLogo: CONFIG.TOKEN_A.logo,
        aAmt: fmtNum(Number(addA)),
        aSym: symA,
        bLogo: CONFIG.TOKEN_B.logo,
        bAmt: fmtNum(Number(addB)),
        bSym: symB,
      });
      setAddA("");
      setAddB("");
      refresh();
    } catch (e: any) {
      log("Add liquidity failed: " + short(e));
      addToast("error", "Failed to Add Liquidity", short(e));
    } finally {
      setBusy(null);
    }
  }

  async function doRemoveLiquidity() {
    if (!guard()) return;
    if (!removeShares || Number(removeShares) <= 0) return alert("Please enter share amount to remove.");
    const setStep = (t: string) => setBusy({ key: "remove", text: t });
    setStep("Confirm removal in wallet...");
    try {
      log("Sending removeLiquidity transaction... confirm in wallet.");
      const hash = await writeContract(wagmiConfig, {
        address: CONFIG.AMM_ADDRESS as `0x${string}`,
        abi: AMM_ABI,
        functionName: "removeLiquidity",
        args: [parseUnits(removeShares, 18)],
      });
      setStep("Removing liquidity... (waiting for confirmation)");
      await waitForTransactionReceipt(wagmiConfig, { hash });
      log("Successfully removed liquidity from pool!");
      addToast("success", "Liquidity Removed", `Successfully withdrew ${removeShares} LP shares.`);
      pushHistory({
        type: "remove",
        hash,
        ts: Date.now(),
        aLogo: CONFIG.TOKEN_A.logo,
        aAmt: "",
        aSym: symA,
        bLogo: CONFIG.TOKEN_B.logo,
        bAmt: "",
        bSym: symB,
      });
      setRemoveShares("");
      refresh();
    } catch (e: any) {
      log("Remove liquidity failed: " + short(e));
      addToast("error", "Failed to Remove Liquidity", short(e));
    } finally {
      setBusy(null);
    }
  }

  function guard() {
    if (!isConnected) {
      alert("Please connect your wallet first.");
      return false;
    }
    if (!chainOk) {
      alert("Please switch network to Sepolia using your wallet button.");
      return false;
    }
    return true;
  }

  const actLabel = !isConnected ? "Connect Wallet" : !chainOk ? "Wrong Network" : null;

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col font-sans select-none antialiased">
      {/* Top Navbar */}
      <Navbar setTab={() => setActiveModal(null)} />

      {/* Main Terminal Grid */}
      <main className="flex-1 w-full px-4 md:px-6 py-4 space-y-4 flex flex-col">
        
        {/* Row 1: Market Header */}
        <MarketStats
          symA={symA}
          symB={symB}
          decA={decA}
          decB={decB}
          reserveA={reserveA}
          reserveB={reserveB}
          currentPrice={currentPrice}
        />

        {/* Row 2: Main Trading Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 xl:grid-cols-[1.7fr_6.3fr_2fr] gap-4 items-stretch flex-1">
          
          {/* Left Column: Order Book (33% width on lg, 1.7fr on xl) */}
          <div className="lg:col-span-4 xl:col-span-1 flex flex-col min-h-[450px] lg:min-h-0 h-full flex-grow">
            <OrderBook
              currentPrice={currentPrice}
              symA={symA}
              symB={symB}
            />
          </div>

          {/* Center Column: Trading Chart + Active Transaction Interface Card (67% width on lg, 6.3fr on xl) */}
          <div className="lg:col-span-8 xl:col-span-1 flex flex-col space-y-2">
            
            {/* Professional Trading Chart */}
            <TradingChart
              currentPrice={currentPrice}
              pairName={`${symA}/${symB}`}
              reserveA={Number(formatUnits(reserveA, decA || 18))}
              reserveB={Number(formatUnits(reserveB, decB || 18))}
            />

            {/* Action Buttons (Swap & Liquidity) */}
            <div className="grid grid-cols-2 gap-4 flex-shrink-0">
              <button
                onClick={() => setActiveModal("swap")}
                className="flex items-center justify-center space-x-2 py-3 px-4 rounded-md border border-zinc-800 bg-[#121214] hover:bg-zinc-800/50 text-[#FAFAFA] font-bold tracking-wider text-sm transition-all duration-150 active:scale-95 shadow-lg hover:border-blue-500/50"
              >
                <ArrowLeftRight size={16} className="text-blue-450" />
                <span>Swap</span>
              </button>
              <button
                onClick={() => setActiveModal("liquidity")}
                className="flex items-center justify-center space-x-2 py-3 px-4 rounded-md border border-zinc-800 bg-[#121214] hover:bg-zinc-800/50 text-[#FAFAFA] font-bold tracking-wider text-sm transition-all duration-150 active:scale-95 shadow-lg hover:border-emerald-500/50"
              >
                <Droplet size={16} className="text-emerald-450" />
                <span>Liquidity</span>
              </button>
            </div>

            {/* History Card (Transaction logs list) */}
            <HistoryCard history={history} logLines={logLines} />
          </div>

          {/* Right Column: Watchlist, Simulated executions, Pool Info (100% width on lg, 2fr on xl) */}
          <div className="lg:col-span-12 xl:col-span-1 flex flex-col min-h-[450px] lg:min-h-0 h-full flex-grow">
            <MarketInfoPanel
              currentPrice={currentPrice}
              symA={symA}
              symB={symB}
              reserveA={Number(formatUnits(reserveA, decA || 18))}
              reserveB={Number(formatUnits(reserveB, decB || 18))}
            />
          </div>

        </div>

      </main>

      {/* Premium Footer */}
      <footer className="py-6 text-center text-xs text-zinc-550 font-medium tracking-wide">
        &copy; {new Date().getFullYear()} DikaSwap Protocol. Deployed on Sepolia testnet. All contract operations are immutable.
      </footer>

      {/* Modal / Popup for Swap & Liquidity */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            {/* Backdrop click dismiss */}
            <div className="absolute inset-0" onClick={() => setActiveModal(null)} />

            {activeModal === "swap" ? (
              /* Swap Modal Container (Method 1: compact, fixed max-w-md, p-4) */
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="relative w-full max-w-md bg-[#18181b] border border-zinc-800 rounded-2xl p-4 flex flex-col shadow-xl z-10"
              >
                {/* Header inside Swap modal */}
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60 mb-3 bg-transparent">
                  <div className="flex items-center space-x-2">
                    <ArrowLeftRight size={16} className="text-blue-405" />
                    <span className="font-bold text-[#FAFAFA] text-sm uppercase tracking-wider">Swap Assets</span>
                  </div>
                  <button
                    onClick={() => setActiveModal(null)}
                    className="p-1 rounded-md text-zinc-400 hover:text-[#FAFAFA] hover:bg-zinc-800 transition-colors"
                    aria-label="Close modal"
                  >
                    <X size={18} />
                  </button>
                </div>

                <SwapCard
                  symA={symA}
                  symB={symB}
                  decA={decA}
                  decB={decB}
                  balA={balA}
                  balB={balB}
                  reserveA={reserveA}
                  reserveB={reserveB}
                  amountIn={amountIn}
                  setAmountIn={setAmountIn}
                  swapDir={swapDir}
                  setSwapDir={setSwapDir}
                  previewOut={previewOut}
                  doSwap={doSwap}
                  busy={busy}
                  ready={ready}
                  actLabel={actLabel}
                  mockBalances={mockBalances}
                  setMockBalances={setMockBalances}
                />
              </motion.div>
            ) : (
              /* Liquidity Modal Container */
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="relative w-full max-w-2xl bg-[#121214] border border-zinc-800 rounded-lg shadow-2xl overflow-hidden z-10 flex flex-col"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-[#18181b]">
                  <div className="flex items-center space-x-2">
                    <Droplet size={16} className="text-emerald-450" />
                    <span className="font-bold text-[#FAFAFA] text-sm uppercase tracking-wider">Liquidity Pool</span>
                  </div>
                  <button
                    onClick={() => setActiveModal(null)}
                    className="p-1 rounded-md text-zinc-400 hover:text-[#FAFAFA] hover:bg-zinc-800 transition-colors"
                    aria-label="Close modal"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 md:p-8 overflow-y-auto max-h-[80vh] scrollbar-none">
                  <LiquidityCard
                    symA={symA}
                    symB={symB}
                    decA={decA}
                    decB={decB}
                    balA={balA}
                    balB={balB}
                    reserveA={reserveA}
                    reserveB={reserveB}
                    totalShares={totalShares}
                    myShares={myShares}
                    addA={addA}
                    setAddA={setAddA}
                    addB={addB}
                    setAddB={setAddB}
                    onAddA={onAddA}
                    onAddB={onAddB}
                    removeShares={removeShares}
                    setRemoveShares={setRemoveShares}
                    doAddLiquidity={doAddLiquidity}
                    doRemoveLiquidity={doRemoveLiquidity}
                    busy={busy}
                    ready={ready}
                    actLabel={actLabel}
                    hasPool={hasPool}
                  />
                </div>
              </motion.div>
            )}
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification Container */}
      <div className="fixed bottom-6 right-6 z-[60] flex flex-col space-y-3 pointer-events-none max-w-sm w-full px-4">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 50, scale: 0.3 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 } }}
              className={`p-4 rounded-md border shadow-2xl flex items-start space-x-3 pointer-events-auto backdrop-blur-md ${
                toast.type === "success"
                  ? "bg-emerald-950/80 border-emerald-500/30 text-emerald-250"
                  : toast.type === "error"
                  ? "bg-rose-950/80 border-rose-500/30 text-rose-250"
                  : "bg-zinc-900/80 border-zinc-800 text-zinc-200"
              }`}
            >
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {toast.type === "success" ? (
                  <CheckCircle size={18} className="text-emerald-400" />
                ) : toast.type === "error" ? (
                  <AlertCircle size={18} className="text-rose-400" />
                ) : (
                  <Info size={18} className="text-blue-400" />
                )}
              </div>
              
              {/* Text */}
              <div className="flex-grow space-y-1">
                <div className="text-xs font-bold font-mono tracking-tight text-[#FAFAFA]">
                  {toast.title}
                </div>
                <div className="text-[11px] font-mono leading-relaxed opacity-90">
                  {toast.message}
                </div>
              </div>
              
              {/* Close button */}
              <button
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="flex-shrink-0 text-zinc-400 hover:text-zinc-200 transition-colors"
                aria-label="Close notification"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ---------- Utils ----------
function trim(s: string): string {
  const n = Number(s);
  if (!isFinite(n)) return "";
  return String(Math.round(n * 1e6) / 1e6);
}

function short(e: any): string {
  return e?.shortMessage || e?.message || String(e);
}
