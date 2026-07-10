import { useMemo, useState, type ReactNode } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useChainId, useReadContracts } from "wagmi";
import { readContract, writeContract, waitForTransactionReceipt } from "@wagmi/core";
import { formatUnits, parseUnits } from "viem";

import { CONFIG, type TokenSymbol } from "../config";
import { ERC20_ABI, AMM_ABI } from "./abi";
import { wagmiConfig } from "./wagmi";
import {
  findBestRoute,
  fmtToken,
  fmtRouteOut,
  getAmountOut,
  type PoolReserves,
  type Route,
} from "./router";

const SEPOLIA = CONFIG.SEPOLIA_CHAIN_ID;
const HKEY = "ks_hist_v3_" + CONFIG.POOLS.map((p) => p.ammAddress).join("_").toLowerCase();
const TOKEN_SYMBOLS = Object.keys(CONFIG.TOKENS) as TokenSymbol[];

// ── helpers ──────────────────────────────────────────────────
function fmt(raw: bigint | undefined, dec: number | undefined): string {
  if (raw == null || dec == null) return "–";
  return Number(formatUnits(raw, dec)).toLocaleString("id-ID", { maximumFractionDigits: 4 });
}
function fmtPrice(x: number): string {
  if (!isFinite(x) || x <= 0) return "–";
  if (x < 0.0001) return x.toExponential(3);
  return x.toLocaleString("en-US", { maximumFractionDigits: 6 });
}
function fmtNum(x: number): string {
  return x.toLocaleString("id-ID", { maximumFractionDigits: 4 });
}
function trim(s: string): string {
  const n = Number(s);
  if (!isFinite(n)) return "";
  return String(Math.round(n * 1e6) / 1e6);
}
function shortErr(e: unknown): string {
  const err = e as { shortMessage?: string; message?: string };
  return err?.shortMessage || err?.message || String(e);
}
function loadHistory(): unknown[] {
  try { return JSON.parse(localStorage.getItem(HKEY) || "[]"); }
  catch { return []; }
}

// ── SVG chart helpers ────────────────────────────────────────
function generateCurvePoints(
  rA: bigint, rB: bigint, decA: number, decB: number,
  W = 400, H = 140
) {
  if (rA <= 0n || rB <= 0n) return { path: "", dot: null };
  const rANum = Number(formatUnits(rA, decA));
  const rBNum = Number(formatUnits(rB, decB));
  const xMin = rANum * 0.1, xMax = rANum * 3.0;
  const steps = 80;
  const pts: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const x = xMin + (i / steps) * (xMax - xMin);
    pts.push([x, (rANum * rBNum) / x]);
  }
  const yVals = pts.map((p) => p[1]);
  const yMin = Math.min(...yVals), yMax = Math.max(...yVals);
  const xRange = xMax - xMin, yRange = yMax - yMin || 1;
  const pad = { l: 8, r: 8, t: 8, b: 8 };
  const plotW = W - pad.l - pad.r, plotH = H - pad.t - pad.b;
  const toSvg = (x: number, y: number) => [
    pad.l + ((x - xMin) / xRange) * plotW,
    pad.t + plotH - ((y - yMin) / yRange) * plotH,
  ];
  const path = pts
    .map(([x, y], i) => { const [sx, sy] = toSvg(x, y); return `${i === 0 ? "M" : "L"} ${sx.toFixed(1)} ${sy.toFixed(1)}`; })
    .join(" ");
  const [dotX, dotY] = toSvg(rANum, rBNum);
  return { path, dot: { x: dotX, y: dotY } };
}

// ══════════════════════════════════════════════════════════════
// APP
// ══════════════════════════════════════════════════════════════
export default function App() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const chainOk = chainId === SEPOLIA;

  // ── UI state ──
  const [tab, setTab] = useState<"swap" | "liquidity" | "pools">("swap");
  const [liqSub, setLiqSub] = useState<"add" | "remove">("add");
  const [logTab, setLogTab] = useState<"log" | "history">("history");
  const [activeLiqPool, setActiveLiqPool] = useState(CONFIG.POOLS[0].id);

  // Swap token selectors
  const [fromToken, setFromToken] = useState<TokenSymbol>("XEVO");
  const [toToken, setToToken] = useState<TokenSymbol>("ETHJKT");
  const [amountIn, setAmountIn] = useState("");

  // Liquidity inputs
  const [addA, setAddA] = useState("");
  const [addB, setAddB] = useState("");
  const [removeShares, setRemoveShares] = useState("");

  const [busy, setBusy] = useState<{ key: string; text: string } | null>(null);
  const [logLines, setLogLines] = useState<string[]>([]);
  const [history, setHistory] = useState(loadHistory);

  // ── Read all pools at once ────────────────────────────────
  // For each pool: reserveA, reserveB, totalShares
  const poolContracts = useMemo(() =>
    CONFIG.POOLS.flatMap((p) => [
      { address: p.ammAddress, abi: AMM_ABI, functionName: "reserveA" as const },
      { address: p.ammAddress, abi: AMM_ABI, functionName: "reserveB" as const },
      { address: p.ammAddress, abi: AMM_ABI, functionName: "totalShares" as const },
    ]),
  []);

  const poolQuery = useReadContracts({
    contracts: poolContracts,
    query: { refetchInterval: 10000 },
  });

  // Parse pool reserves into a lookup map
  const poolReserves = useMemo<Record<string, PoolReserves>>(() => {
    const out: Record<string, PoolReserves> = {};
    if (!poolQuery.data) return out;
    CONFIG.POOLS.forEach((p, i) => {
      const base = i * 3;
      out[p.id] = {
        poolId: p.id,
        reserveA: (poolQuery.data[base]?.result as bigint) ?? 0n,
        reserveB: (poolQuery.data[base + 1]?.result as bigint) ?? 0n,
      };
    });
    return out;
  }, [poolQuery.data]);

  const totalSharesMap = useMemo<Record<string, bigint>>(() => {
    const out: Record<string, bigint> = {};
    if (!poolQuery.data) return out;
    CONFIG.POOLS.forEach((p, i) => {
      out[p.id] = (poolQuery.data[i * 3 + 2]?.result as bigint) ?? 0n;
    });
    return out;
  }, [poolQuery.data]);

  // ── Read user balances ────────────────────────────────────
  const userContracts = useMemo(() => {
    if (!address) return [];
    return [
      ...TOKEN_SYMBOLS.map((sym) => ({
        address: CONFIG.TOKENS[sym].address,
        abi: ERC20_ABI,
        functionName: "balanceOf" as const,
        args: [address] as [`0x${string}`],
      })),
      ...CONFIG.POOLS.map((p) => ({
        address: p.ammAddress,
        abi: AMM_ABI,
        functionName: "shares" as const,
        args: [address] as [`0x${string}`],
      })),
    ];
  }, [address]);

  const userQuery = useReadContracts({
    contracts: userContracts,
    query: { enabled: !!address },
  });

  const userBalances = useMemo<Record<TokenSymbol, bigint | undefined>>(() => {
    const out = {} as Record<TokenSymbol, bigint | undefined>;
    if (!userQuery.data) return out;
    TOKEN_SYMBOLS.forEach((sym, i) => {
      out[sym] = userQuery.data[i]?.result as bigint | undefined;
    });
    return out;
  }, [userQuery.data]);

  const mySharesMap = useMemo<Record<string, bigint>>(() => {
    const out: Record<string, bigint> = {};
    if (!userQuery.data) return out;
    const offset = TOKEN_SYMBOLS.length;
    CONFIG.POOLS.forEach((p, i) => {
      out[p.id] = (userQuery.data[offset + i]?.result as bigint) ?? 0n;
    });
    return out;
  }, [userQuery.data]);

  // ── Token symbol reads ────────────────────────────────────
  const symContracts = useMemo(() =>
    TOKEN_SYMBOLS.map((sym) => ({
      address: CONFIG.TOKENS[sym].address,
      abi: ERC20_ABI,
      functionName: "symbol" as const,
    })),
  []);
  const symQuery = useReadContracts({ contracts: symContracts });
  const onChainSymbols = useMemo<Partial<Record<TokenSymbol, string>>>(() => {
    const out: Partial<Record<TokenSymbol, string>> = {};
    if (!symQuery.data) return out;
    TOKEN_SYMBOLS.forEach((sym, i) => {
      out[sym] = (symQuery.data[i]?.result as string) ?? sym;
    });
    return out;
  }, [symQuery.data]);

  const ready = isConnected && chainOk;
  const decOf = (sym: TokenSymbol) => CONFIG.TOKENS[sym]?.decimals ?? 18;
  const symOf = (sym: TokenSymbol) => onChainSymbols[sym] ?? sym;

  function refresh() { poolQuery.refetch(); userQuery.refetch(); }
  function log(msg: string) {
    const t = new Date().toLocaleTimeString();
    setLogLines((prev) => [`[${t}] ${msg}`, ...prev].slice(0, 40));
  }
  function pushHistory(entry: unknown) {
    setHistory((prev: unknown[]) => {
      const next = [entry, ...prev].slice(0, 50);
      try { localStorage.setItem(HKEY, JSON.stringify(next)); } catch {}
      return next;
    });
    setLogTab("history");
  }

  // ── Routing ──────────────────────────────────────────────
  const bestRoute = useMemo<Route | null>(() => {
    if (!amountIn || Number(amountIn) <= 0) return null;
    if (fromToken === toToken) return null;
    return findBestRoute(fromToken, toToken, amountIn, poolReserves);
  }, [amountIn, fromToken, toToken, poolReserves]);

  const slippageLevel = useMemo(() => {
    const s = bestRoute?.totalSlippage ?? 0;
    if (!bestRoute || !amountIn) return null;
    if (s < 0.5) return "low";
    if (s < 3) return "medium";
    return "high";
  }, [bestRoute, amountIn]);

  // ── Liquidity pool helpers ────────────────────────────────
  const liqPool = CONFIG.POOLS.find((p) => p.id === activeLiqPool) ?? CONFIG.POOLS[0];
  const liqR = poolReserves[liqPool.id];
  const liqHasPool = (liqR?.reserveA ?? 0n) > 0n && (liqR?.reserveB ?? 0n) > 0n;
  const liqSymA = liqPool.tokenA as TokenSymbol;
  const liqSymB = liqPool.tokenB as TokenSymbol;

  function onAddA(v: string) {
    setAddA(v);
    if (liqHasPool && v && Number(v) > 0 && liqR) {
      try {
        const amtA = parseUnits(v, decOf(liqSymA));
        setAddB(trim(formatUnits((amtA * liqR.reserveB) / liqR.reserveA, decOf(liqSymB))));
      } catch {}
    } else if (!v) setAddB("");
  }
  function onAddB(v: string) {
    setAddB(v);
    if (liqHasPool && v && Number(v) > 0 && liqR) {
      try {
        const amtB = parseUnits(v, decOf(liqSymB));
        setAddA(trim(formatUnits((amtB * liqR.reserveA) / liqR.reserveB, decOf(liqSymA))));
      } catch {}
    } else if (!v) setAddA("");
  }

  // ── Write flows ───────────────────────────────────────────
  async function ensureAllowance(
    tokenAddr: `0x${string}`,
    spender: `0x${string}`,
    amount: bigint,
    sym: string,
    setStep: (t: string) => void
  ) {
    const cur = await readContract(wagmiConfig, {
      address: tokenAddr, abi: ERC20_ABI,
      functionName: "allowance", args: [address!, spender],
    });
    if ((cur as bigint) >= amount) return;
    setStep(`Approve ${sym} — cek MetaMask`);
    log(`Approve ${sym}...`);
    const hash = await writeContract(wagmiConfig, {
      address: tokenAddr, abi: ERC20_ABI,
      functionName: "approve", args: [spender, amount],
    });
    setStep(`Approve ${sym} terkirim, nunggu…`);
    await waitForTransactionReceipt(wagmiConfig, { hash });
    log(`Approve ${sym} sukses.`);
  }

  async function doSwap() {
    if (!guard()) return;
    if (!amountIn || Number(amountIn) <= 0) return alert("Isi jumlah dulu.");
    if (!bestRoute) return alert("Tidak ada rute tersedia untuk pair ini.");
    const setStep = (t: string) => setBusy({ key: "swap", text: t });
    setStep("...");
    try {
      // Execute each hop sequentially
      let inputAmount = bestRoute.amountIn;
      for (let i = 0; i < bestRoute.hops.length; i++) {
        const hop = bestRoute.hops[i];
        const inToken = CONFIG.TOKENS[hop.fromToken];
        await ensureAllowance(inToken.address, hop.ammAddress, inputAmount, symOf(hop.fromToken), setStep);
        setStep(`Hop ${i + 1}/${bestRoute.hops.length}: ${symOf(hop.fromToken)} → ${symOf(hop.toToken)} — konfirmasi MetaMask`);
        log(`Swap hop ${i + 1}: ${symOf(hop.fromToken)} → ${symOf(hop.toToken)}`);
        const fnName = hop.direction === "AtoB" ? "swapAforB" : "swapBforA";
        const hash = await writeContract(wagmiConfig, {
          address: hop.ammAddress, abi: AMM_ABI,
          functionName: fnName, args: [inputAmount],
        });
        setStep(`Hop ${i + 1} terkirim, nunggu blok…`);
        await waitForTransactionReceipt(wagmiConfig, { hash });
        // Next hop input = this hop's output (from router)
        inputAmount = getAmountOut(inputAmount, hop.reserveIn, hop.reserveOut);
      }
      const amtOut = Number(formatUnits(bestRoute.amountOut, decOf(toToken)));
      log(`Swap sukses! ${amountIn} ${symOf(fromToken)} → ${fmtNum(amtOut)} ${symOf(toToken)}`);
      pushHistory({
        type: "swap", ts: Date.now(),
        aLogo: CONFIG.TOKENS[fromToken].logo,
        aAmt: amountIn, aSym: symOf(fromToken),
        bLogo: CONFIG.TOKENS[toToken].logo,
        bAmt: fmtNum(amtOut), bSym: symOf(toToken),
        route: bestRoute.path.map(symOf).join(" → "),
      });
      setAmountIn("");
      refresh();
    } catch (e) {
      log("Swap gagal: " + shortErr(e));
    } finally {
      setBusy(null);
    }
  }

  async function doAddLiquidity() {
    if (!guard()) return;
    if (!addA || !addB || Number(addA) <= 0 || Number(addB) <= 0) return alert("Isi kedua jumlah dulu.");
    const amtA = parseUnits(addA, decOf(liqSymA));
    const amtB = parseUnits(addB, decOf(liqSymB));
    const setStep = (t: string) => setBusy({ key: "add", text: t });
    setStep("...");
    try {
      await ensureAllowance(CONFIG.TOKENS[liqSymA].address, liqPool.ammAddress, amtA, symOf(liqSymA), setStep);
      await ensureAllowance(CONFIG.TOKENS[liqSymB].address, liqPool.ammAddress, amtB, symOf(liqSymB), setStep);
      setStep("Konfirmasi addLiquidity di MetaMask");
      const hash = await writeContract(wagmiConfig, {
        address: liqPool.ammAddress, abi: AMM_ABI,
        functionName: "addLiquidity", args: [amtA, amtB],
      });
      setStep("Menambah…");
      await waitForTransactionReceipt(wagmiConfig, { hash });
      log(`Tambah likuiditas [${liqPool.label}] sukses!`);
      pushHistory({
        type: "add", ts: Date.now(),
        aLogo: CONFIG.TOKENS[liqSymA].logo, aAmt: addA, aSym: symOf(liqSymA),
        bLogo: CONFIG.TOKENS[liqSymB].logo, bAmt: addB, bSym: symOf(liqSymB),
      });
      setAddA(""); setAddB("");
      refresh();
    } catch (e) {
      log("Tambah gagal: " + shortErr(e));
    } finally {
      setBusy(null);
    }
  }

  async function doRemoveLiquidity() {
    if (!guard()) return;
    if (!removeShares || Number(removeShares) <= 0) return alert("Isi jumlah share.");
    const setStep = (t: string) => setBusy({ key: "remove", text: t });
    setStep("Konfirmasi tarik di MetaMask");
    try {
      const hash = await writeContract(wagmiConfig, {
        address: liqPool.ammAddress, abi: AMM_ABI,
        functionName: "removeLiquidity", args: [parseUnits(removeShares, 18)],
      });
      setStep("Menarik…");
      await waitForTransactionReceipt(wagmiConfig, { hash });
      log(`Tarik likuiditas [${liqPool.label}] sukses!`);
      pushHistory({
        type: "remove", ts: Date.now(),
        aLogo: CONFIG.TOKENS[liqSymA].logo, aAmt: "", aSym: symOf(liqSymA),
        bLogo: CONFIG.TOKENS[liqSymB].logo, bAmt: "", bSym: symOf(liqSymB),
      });
      setRemoveShares("");
      refresh();
    } catch (e) {
      log("Tarik gagal: " + shortErr(e));
    } finally {
      setBusy(null);
    }
  }

  function guard() {
    if (!isConnected) { alert("Connect wallet dulu."); return false; }
    if (!chainOk) { alert("Pindah ke Sepolia."); return false; }
    return true;
  }

  const actLabel = !isConnected ? "Connect dulu" : !chainOk ? "Jaringan salah" : null;

  // ── My share % in active liq pool ────────────────────────
  const mySharePct = useMemo(() => {
    const my = mySharesMap[liqPool.id] ?? 0n;
    const total = totalSharesMap[liqPool.id] ?? 0n;
    if (!my || !total) return 0;
    return Math.min(100, Number((my * 10000n) / total) / 100);
  }, [mySharesMap, totalSharesMap, liqPool.id]);

  return (
    <div className="page">
      <img className="hero-title" src={CONFIG.TITLE_IMG} alt="AI & BLOCKCHAIN" />

      {/* ── HEADER ── */}
      <header className="head">
        <div className="brand">
          <img className="brand-logo" src={CONFIG.BRAND_LOGO} alt="ETHJKT" />
          <div>
            <p className="eyebrow">ETHJKT × UNPAM</p>
            <h1>XevoSwap</h1>
          </div>
        </div>
        {/* Pool count badge */}
        <div className="price-ticker">
          <span>🌊</span>
          <strong>{CONFIG.POOLS.length} Pool</strong>
          <span style={{ color: "rgba(255,255,255,0.4)" }}>|</span>
          <span>{TOKEN_SYMBOLS.length} Token</span>
        </div>
        <ConnectButton chainStatus="icon" showBalance={false} />
      </header>

      <div className="cols">
        {/* ═══ MAIN COLUMN ═══ */}
        <div className="col col-main">
          {/* Tabs */}
          <Glass className="pill tabs" inner="tabs-row">
            <button id="tab-swap" className={`tab ${tab === "swap" ? "tab--active" : ""}`} onClick={() => setTab("swap")}>
              ⟳ Swap
            </button>
            <button id="tab-liquidity" className={`tab ${tab === "liquidity" ? "tab--active" : ""}`} onClick={() => setTab("liquidity")}>
              💧 Liquidity
            </button>
            <button id="tab-pools" className={`tab ${tab === "pools" ? "tab--active" : ""}`} onClick={() => setTab("pools")}>
              🌊 Pools
            </button>
          </Glass>

          {/* ─ SWAP TAB ─ */}
          {tab === "swap" && (
            <Glass className="card main">
              <div className="view">
                {/* FROM */}
                <div className="box">
                  <div className="box-top">
                    <span className="box-label">Kamu bayar</span>
                    {userBalances[fromToken] != null && (
                      <span className="box-bal">
                        Saldo: {fmt(userBalances[fromToken], decOf(fromToken))} {symOf(fromToken)}
                      </span>
                    )}
                  </div>
                  <div className="box-mid">
                    <input
                      id="swap-amount-in"
                      type="number" min="0" placeholder="0.0"
                      value={amountIn}
                      onChange={(e) => setAmountIn(e.target.value)}
                    />
                    <TokenSelect
                      id="from-token-select"
                      value={fromToken}
                      exclude={toToken}
                      onChange={(s) => { setFromToken(s); setAmountIn(""); }}
                    />
                  </div>
                </div>

                {/* Flip */}
                <button
                  id="swap-flip"
                  className="flip"
                  title="Balik arah"
                  onClick={() => {
                    setFromToken(toToken);
                    setToToken(fromToken);
                    setAmountIn("");
                  }}
                >⇅</button>

                {/* TO */}
                <div className="box">
                  <div className="box-top">
                    <span className="box-label">Kamu terima (perkiraan)</span>
                  </div>
                  <div className="box-mid">
                    <input
                      id="swap-amount-out"
                      type="text" readOnly placeholder="0.0"
                      value={bestRoute ? fmtRouteOut(bestRoute, toToken) : ""}
                    />
                    <TokenSelect
                      id="to-token-select"
                      value={toToken}
                      exclude={fromToken}
                      onChange={(s) => { setToToken(s); setAmountIn(""); }}
                    />
                  </div>
                </div>

                {/* Route display */}
                {bestRoute && <RouteDisplay route={bestRoute} symOf={symOf} />}

                {/* Slippage warning */}
                {slippageLevel && bestRoute && (
                  <SlippageWarn level={slippageLevel} pct={bestRoute.totalSlippage} />
                )}

                {/* No route warning */}
                {amountIn && Number(amountIn) > 0 && !bestRoute && (
                  <div className="slippage-warning medium">
                    <span className="slippage-icon">🔍</span>
                    <span>Tidak ada rute atau pool tidak punya likuiditas</span>
                  </div>
                )}

                <div className="actions">
                  <button
                    id="swap-btn"
                    className="act act--primary"
                    disabled={!ready || !!busy || !bestRoute}
                    onClick={doSwap}
                  >
                    {busy?.key === "swap"
                      ? <><span className="spinner" />{busy.text}</>
                      : actLabel || `⟳ Swap ${symOf(fromToken)} → ${symOf(toToken)}`}
                  </button>
                </div>
              </div>
            </Glass>
          )}

          {/* ─ LIQUIDITY TAB ─ */}
          {tab === "liquidity" && (
            <Glass className="card main">
              {/* Pool selector */}
              {CONFIG.POOLS.length > 1 && (
                <div className="pool-selector">
                  <span className="box-label" style={{ marginBottom: "0.5rem", display: "block" }}>Pilih Pool</span>
                  <div className="pool-pills">
                    {CONFIG.POOLS.map((p) => (
                      <button
                        key={p.id}
                        className={`pool-pill ${activeLiqPool === p.id ? "pool-pill--active" : ""}`}
                        onClick={() => { setActiveLiqPool(p.id); setAddA(""); setAddB(""); }}
                      >
                        <img className="token-logo" src={CONFIG.TOKENS[p.tokenA as TokenSymbol].logo} alt="" />
                        <img className="token-logo" src={CONFIG.TOKENS[p.tokenB as TokenSymbol].logo} alt="" style={{ marginLeft: "-8px" }} />
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="subtabs">
                <button id="liq-add-btn" className={`subtab ${liqSub === "add" ? "subtab--active" : ""}`} onClick={() => setLiqSub("add")}>+ Tambah</button>
                <button id="liq-remove-btn" className={`subtab ${liqSub === "remove" ? "subtab--active" : ""}`} onClick={() => setLiqSub("remove")}>↑ Tarik</button>
              </div>

              {liqSub === "add" ? (
                <div className="view">
                  <div className="box">
                    <div className="box-top">
                      <span className="box-label">Setor {symOf(liqSymA)}</span>
                      {userBalances[liqSymA] != null && (
                        <span className="box-bal">Saldo: {fmt(userBalances[liqSymA], decOf(liqSymA))}</span>
                      )}
                    </div>
                    <div className="box-mid">
                      <input id="liq-add-a" type="number" min="0" placeholder="0.0" value={addA} onChange={(e) => onAddA(e.target.value)} />
                      <span className="token-chip">
                        <img className="token-logo" src={CONFIG.TOKENS[liqSymA].logo} alt="" />
                        {symOf(liqSymA)}
                      </span>
                    </div>
                  </div>
                  <div className="flip flip--plus">+</div>
                  <div className="box">
                    <div className="box-top">
                      <span className="box-label">Setor {symOf(liqSymB)}</span>
                      {userBalances[liqSymB] != null && (
                        <span className="box-bal">Saldo: {fmt(userBalances[liqSymB], decOf(liqSymB))}</span>
                      )}
                    </div>
                    <div className="box-mid">
                      <input id="liq-add-b" type="number" min="0" placeholder="0.0" value={addB} onChange={(e) => onAddB(e.target.value)} />
                      <span className="token-chip">
                        <img className="token-logo" src={CONFIG.TOKENS[liqSymB].logo} alt="" />
                        {symOf(liqSymB)}
                      </span>
                    </div>
                  </div>
                  <p className="hint">
                    {liqHasPool ? "💡 Isi salah satu, satunya otomatis ngikut rasio (x·y=k)." : "🌊 Pool baru — kamu yang tentuin harga awal."}
                  </p>
                  <div className="actions">
                    <button id="liq-add-submit" className="act act--primary" disabled={!ready || busy?.key === "add"} onClick={doAddLiquidity}>
                      {busy?.key === "add" ? <><span className="spinner" />{busy.text}</> : actLabel || "💧 Tambah Likuiditas"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="view">
                  <div className="box">
                    <div className="box-top">
                      <span className="box-label">Share ditarik [{liqPool.label}]</span>
                      <span className="box-bal">Punya: {fmt(mySharesMap[liqPool.id], 18)}</span>
                    </div>
                    <div className="box-mid">
                      <input id="liq-remove-shares" type="number" min="0" placeholder="0.0" value={removeShares} onChange={(e) => setRemoveShares(e.target.value)} />
                      <button className="token-chip chip-btn" onClick={() => {
                        const s = mySharesMap[liqPool.id];
                        if (s != null) setRemoveShares(formatUnits(s, 18));
                      }}>MAX</button>
                    </div>
                  </div>
                  {mySharePct > 0 && (
                    <div className="depth-bar-wrap">
                      <div className="depth-label">
                        <span>Share kamu di {liqPool.label}</span>
                        <span style={{ color: "#a855f7", fontFamily: "Space Mono,monospace" }}>{mySharePct.toFixed(2)}%</span>
                      </div>
                      <div className="depth-bar">
                        <div className="depth-bar-fill" style={{ width: `${mySharePct}%` }} />
                      </div>
                    </div>
                  )}
                  <div className="actions">
                    <button id="liq-remove-submit" className="act act--primary" disabled={!ready || busy?.key === "remove"} onClick={doRemoveLiquidity}>
                      {busy?.key === "remove" ? <><span className="spinner" />{busy.text}</> : actLabel || "↑ Tarik Likuiditas"}
                    </button>
                  </div>
                </div>
              )}
            </Glass>
          )}

          {/* ─ POOLS TAB ─ */}
          {tab === "pools" && (
            <div className="view" style={{ gap: "1rem" }}>
              {CONFIG.POOLS.map((p) => {
                const r = poolReserves[p.id];
                const tA = p.tokenA as TokenSymbol;
                const tB = p.tokenB as TokenSymbol;
                const rA = r?.reserveA ?? 0n;
                const rB = r?.reserveB ?? 0n;
                const total = totalSharesMap[p.id] ?? 0n;
                const myS = mySharesMap[p.id] ?? 0n;
                const spotA = rA > 0n && rB > 0n
                  ? Number(formatUnits(rB, decOf(tB))) / Number(formatUnits(rA, decOf(tA)))
                  : null;
                const chart = rA > 0n && rB > 0n
                  ? generateCurvePoints(rA, rB, decOf(tA), decOf(tB), 400, 100)
                  : null;
                return (
                  <Glass key={p.id} className="card pool-card">
                    {/* Pool header */}
                    <div className="pool-card-head">
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <div className="pool-logos">
                          <img className="pool-logo" src={CONFIG.TOKENS[tA].logo} alt="" />
                          <img className="pool-logo pool-logo-b" src={CONFIG.TOKENS[tB].logo} alt="" />
                        </div>
                        <div>
                          <div className="pool-name">{p.label}</div>
                          <div className="pool-fee">0.3% fee · SimpleAMM · x·y=k</div>
                        </div>
                      </div>
                      {rA > 0n ? (
                        <span className="pool-status pool-status--live">● Live</span>
                      ) : (
                        <span className="pool-status pool-status--empty">○ Empty</span>
                      )}
                    </div>

                    {/* Mini chart */}
                    {chart?.path && (
                      <div className="chart-wrap" style={{ height: "100px", marginBottom: "0.85rem" }}>
                        <svg viewBox="0 0 400 100" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id={`g-${p.id}`} x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.9" />
                              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.9" />
                            </linearGradient>
                            <linearGradient id={`gf-${p.id}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.2" />
                              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.02" />
                            </linearGradient>
                            <filter id={`glow-${p.id}`}>
                              <feGaussianBlur stdDeviation="1.5" result="blur" />
                              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                            </filter>
                          </defs>
                          <path d={chart.path + " L 392 100 L 8 100 Z"} fill={`url(#gf-${p.id})`} />
                          <path d={chart.path} fill="none" stroke={`url(#g-${p.id})`} strokeWidth="2" strokeLinecap="round" filter={`url(#glow-${p.id})`} />
                          {chart.dot && (
                            <>
                              <circle cx={chart.dot.x} cy={chart.dot.y} r="6" fill="rgba(6,182,212,0.2)" stroke="rgba(6,182,212,0.5)" strokeWidth="1" />
                              <circle cx={chart.dot.x} cy={chart.dot.y} r="3" fill="#06b6d4" filter={`url(#glow-${p.id})`} />
                            </>
                          )}
                        </svg>
                      </div>
                    )}

                    {/* Pool stats grid */}
                    <div className="pool-stats">
                      <PoolStat label={`Reserve ${symOf(tA)}`} val={fmt(rA, decOf(tA))} />
                      <PoolStat label={`Reserve ${symOf(tB)}`} val={fmt(rB, decOf(tB))} cyan />
                      <PoolStat label="Harga Spot" val={spotA ? `${fmtPrice(spotA)} ${symOf(tB)}/${symOf(tA)}` : "–"} />
                      <PoolStat label="Total Shares" val={fmt(total, 18)} />
                      <PoolStat label="Share Kamu" val={fmt(myS, 18)} />
                      <PoolStat
                        label="Porsi Kamu"
                        val={myS > 0n && total > 0n
                          ? (Number((myS * 10000n) / total) / 100).toFixed(2) + "%"
                          : "–"}
                        green
                      />
                    </div>

                    {/* AMM address */}
                    <div style={{ marginTop: "0.75rem" }}>
                      <a
                        href={`https://sepolia.etherscan.io/address/${p.ammAddress}`}
                        target="_blank" rel="noopener noreferrer"
                        className="hist-date"
                        style={{ fontSize: "0.72rem", flexDirection: "row", justifyContent: "flex-start", gap: "0.35rem" }}
                      >
                        <span style={{ color: "rgba(160,150,220,0.5)" }}>AMM:</span>
                        <span>{p.ammAddress.slice(0, 10)}…{p.ammAddress.slice(-6)}</span>
                        <span>↗</span>
                      </a>
                    </div>
                  </Glass>
                );
              })}
            </div>
          )}
        </div>

        {/* ═══ SIDE COLUMN ═══ */}
        <div className="col col-side">
          {/* Wallet info */}
          <Glass className="card info">
            <Row k="Akun" v={address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "belum connect"} />
            <Row k="Jaringan" v={!isConnected ? "–" : chainOk ? "✅ Sepolia" : `⚠️ chainId ${chainId}`} />
            <div className="hr" />
            {TOKEN_SYMBOLS.map((sym) => (
              <Row key={sym} k={<>Saldo <b>{symOf(sym)}</b></>} v={fmt(userBalances[sym], decOf(sym))} />
            ))}
            <div className="hr" />
            {CONFIG.POOLS.map((p) => {
              const r = poolReserves[p.id];
              const tA = p.tokenA as TokenSymbol;
              const tB = p.tokenB as TokenSymbol;
              const rA = r?.reserveA ?? 0n;
              const rB = r?.reserveB ?? 0n;
              const spotA = rA > 0n && rB > 0n
                ? Number(formatUnits(rB, decOf(tB))) / Number(formatUnits(rA, decOf(tA)))
                : null;
              return (
                <div key={p.id}>
                  <div style={{ fontSize: "0.7rem", color: "rgba(167,120,255,0.7)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "0.3rem", fontWeight: 700 }}>
                    {p.label}
                  </div>
                  <Row k={symOf(tA)} v={fmt(rA, decOf(tA))} />
                  <Row k={symOf(tB)} v={fmt(rB, decOf(tB))} />
                  {spotA && (
                    <Row
                      k="Harga"
                      v={
                        <div className="price-display">
                          <span className="price-main">{fmtPrice(spotA)}</span>
                          <span className="price-sub">{symOf(tB)}/{symOf(tA)}</span>
                        </div>
                      }
                    />
                  )}
                  <div className="hr" />
                </div>
              );
            })}
          </Glass>
        </div>
      </div>

      {/* ═══ LOG + HISTORY ═══ */}
      <Glass className="card">
        <div className="subtabs logtabs">
          <button id="log-tab-btn" className={`subtab ${logTab === "log" ? "subtab--active" : ""}`} onClick={() => setLogTab("log")}>📋 Log</button>
          <button id="history-tab-btn" className={`subtab ${logTab === "history" ? "subtab--active" : ""}`} onClick={() => setLogTab("history")}>🕐 Riwayat ({history.length})</button>
        </div>
        {logTab === "log" ? (
          <pre className="log">{logLines.length ? logLines.join("\n") : "Belum ada aktivitas."}</pre>
        ) : (
          <div className="history">
            {history.length === 0
              ? <p className="hist-empty">🌊 Belum ada transaksi.</p>
              : (history as Record<string, unknown>[]).map((h, i) => <HistRow key={i} h={h} />)}
          </div>
        )}
      </Glass>
    </div>
  );
}

// ── Small Components ──────────────────────────────────────────
function Glass({ className = "", inner = "col-inner", children }: { className?: string; inner?: string; children: ReactNode }) {
  return (
    <section className={`glass ${className}`}>
      <div className={`glass-content ${inner}`}>{children}</div>
    </section>
  );
}

function Row({ k, v }: { k: ReactNode; v: ReactNode }) {
  return (
    <div className="row">
      <span className="k">{k}</span>
      <span className="v mono">{v}</span>
    </div>
  );
}

function TokenSelect({ value, exclude, onChange, id }: {
  value: TokenSymbol;
  exclude: TokenSymbol;
  onChange: (s: TokenSymbol) => void;
  id?: string;
}) {
  const options = TOKEN_SYMBOLS.filter((s) => s !== exclude);
  return (
    <div className="token-select-wrap">
      <select
        id={id}
        className="token-select"
        value={value}
        onChange={(e) => onChange(e.target.value as TokenSymbol)}
      >
        {options.map((sym) => (
          <option key={sym} value={sym}>{sym}</option>
        ))}
      </select>
      <div className="token-chip token-chip-select" style={{ pointerEvents: "none", position: "absolute" }}>
        <img className="token-logo" src={CONFIG.TOKENS[value].logo} alt="" />
        {value}
        <span style={{ opacity: 0.6, fontSize: "0.7rem" }}>▾</span>
      </div>
    </div>
  );
}

function RouteDisplay({ route, symOf }: { route: Route; symOf: (s: TokenSymbol) => string }) {
  return (
    <div className="route-display">
      <div className="route-label">
        {route.type === "multihop" ? "🔀 Multi-hop Route" : "⚡ Direct Route"}
      </div>
      <div className="route-path">
        {route.path.map((sym, i) => (
          <span key={i} className="route-path-item">
            <img className="route-token-logo" src={CONFIG.TOKENS[sym].logo} alt="" />
            <span>{symOf(sym)}</span>
            {i < route.path.length - 1 && (
              <span className="route-arrow">
                →<span className="route-pool-label">
                  {route.hops[i]?.poolLabel.split("/").join("/")}
                </span>
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

function SlippageWarn({ level, pct }: { level: "low" | "medium" | "high"; pct: number }) {
  const icon = { low: "✅", medium: "⚠️", high: "🚨" };
  const msg = { low: "Slippage rendah — aman", medium: "Slippage sedang — hati-hati", high: "Slippage tinggi!" };
  return (
    <div className={`slippage-warning ${level}`}>
      <span className="slippage-icon">{icon[level]}</span>
      <span>{msg[level]}</span>
      <span className="slippage-pct">{pct.toFixed(2)}%</span>
    </div>
  );
}

function PoolStat({ label, val, cyan = false, green = false }: { label: string; val: string; cyan?: boolean; green?: boolean }) {
  return (
    <div className="chart-stat">
      <span className="chart-stat-label">{label}</span>
      <span className={`chart-stat-val ${cyan ? "cyan" : green ? "green" : ""}`}>{val}</span>
    </div>
  );
}

function HistRow({ h }: { h: Record<string, unknown> }) {
  const url = h.hash ? "https://sepolia.etherscan.io/tx/" + h.hash : "#";
  const dt = h.ts ? new Date(h.ts as number) : null;
  const date = dt?.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" }) ?? "";
  const time = dt?.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) ?? "";
  const mid = h.type === "swap" ? "⟳" : h.type === "remove" ? "↑" : "+";
  const via = h.type === "swap" ? (h.route ? String(h.route) : "Swap") : h.type === "remove" ? "Tarik LP" : "Tambah LP";
  return (
    <div className="hist-row">
      <span className="hist-token">
        <img className="hist-logo" src={h.aLogo as string} alt="" />
        <span className="hist-amt">{h.aAmt as string} {h.aSym as string}</span>
      </span>
      <span className="hist-arrow">{mid}</span>
      <span className="hist-token">
        <img className="hist-logo" src={h.bLogo as string} alt="" />
        <span className="hist-amt">{h.bAmt as string} {h.bSym as string}</span>
      </span>
      <span className="hist-via">
        <span className="hist-via-top">via <b>XevoSwap</b></span>
        <span className="hist-sub2">{via}</span>
      </span>
      <a className="hist-date" href={url} target="_blank" rel="noopener noreferrer">
        <span className="hist-d">{date} ↗</span>
        <span className="hist-t">{time}</span>
      </a>
      <span className="hist-check">✓</span>
    </div>
  );
}
