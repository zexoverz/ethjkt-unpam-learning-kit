// @ts-nocheck -- contract configuration is intentionally data-driven for the workshop.
import { useMemo, useState, type ReactNode } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useChainId, useReadContracts } from "wagmi";
import { readContract, waitForTransactionReceipt, writeContract } from "@wagmi/core";
import { formatUnits, parseUnits } from "viem";
import { CONFIG } from "../config";
import { AMM_ABI, ERC20_ABI, ROUTER_ABI } from "./abi";
import { wagmiConfig } from "./wagmi";

const HKEY = "ks_hist_multi_v1";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const tokenById = Object.fromEntries(CONFIG.TOKENS.map((t) => [t.id, t]));
const poolById = Object.fromEntries(CONFIG.POOLS.map((p) => [p.id, p]));

function amountOut(amountIn, reserveIn, reserveOut) {
  if (amountIn <= 0n || reserveIn <= 0n || reserveOut <= 0n) return 0n;
  const withFee = amountIn * 997n;
  return (withFee * reserveOut) / (reserveIn * 1000n + withFee);
}
function fmt(raw, decimals, digits = 2) {
  if (raw == null || decimals == null) return "—";
  return Number(formatUnits(raw, decimals)).toLocaleString("id-ID", { maximumFractionDigits: digits });
}
function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HKEY) || "[]"); } catch { return []; }
}
function shortError(e) { return e?.shortMessage || e?.message || String(e); }

export default function App() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const chainOk = chainId === CONFIG.SEPOLIA_CHAIN_ID;
  const [fromId, setFromId] = useState("getoken");
  const [toId, setToId] = useState("ethjkt");
  const [amountIn, setAmountIn] = useState("");
  const [slippage, setSlippage] = useState("0.5");
  const [busy, setBusy] = useState("");
  const [history, setHistory] = useState(loadHistory);
  const [logLines, setLogLines] = useState([]);
  const [feedTab, setFeedTab] = useState("history");

  const reads = useReadContracts({
    contracts: [
      ...CONFIG.TOKENS.flatMap((t) => [
        { address: t.address, abi: ERC20_ABI, functionName: "symbol" },
        { address: t.address, abi: ERC20_ABI, functionName: "decimals" },
        { address: t.address, abi: ERC20_ABI, functionName: "balanceOf", args: [address || ZERO_ADDRESS] },
      ]),
      ...CONFIG.POOLS.flatMap((p) => [
        { address: p.address, abi: AMM_ABI, functionName: "reserveA" },
        { address: p.address, abi: AMM_ABI, functionName: "reserveB" },
      ]),
    ],
    query: { refetchInterval: 10000 },
  });

  const tokenState = useMemo(() => Object.fromEntries(CONFIG.TOKENS.map((t, i) => {
    const base = i * 3;
    return [t.id, { ...t, symbol: reads.data?.[base]?.result ?? t.symbol, decimals: reads.data?.[base + 1]?.result, balance: reads.data?.[base + 2]?.result }];
  })), [reads.data]);
  const poolOffset = CONFIG.TOKENS.length * 3;
  const poolState = useMemo(() => Object.fromEntries(CONFIG.POOLS.map((p, i) => [p.id, {
    ...p, reserveA: reads.data?.[poolOffset + i * 2]?.result ?? 0n, reserveB: reads.data?.[poolOffset + i * 2 + 1]?.result ?? 0n,
  }])), [reads.data]);

  const from = tokenState[fromId] || tokenById[fromId];
  const to = tokenState[toId] || tokenById[toId];
  const routes = useMemo(() => findRoutes(fromId, toId), [fromId, toId]);
  const quote = useMemo(() => {
    if (!amountIn || Number(amountIn) <= 0 || from?.decimals == null) return null;
    try {
      const raw = parseUnits(amountIn, from.decimals);
      const candidates = routes.map((route) => quoteRoute(raw, route, poolState)).filter((r) => r.output > 0n);
      return candidates.sort((a, b) => a.output > b.output ? -1 : 1)[0] || null;
    } catch { return null; }
  }, [amountIn, from?.decimals, routes, poolState]);

  const directPool = CONFIG.POOLS.find((p) => (p.tokenA === fromId && p.tokenB === toId) || (p.tokenA === toId && p.tokenB === fromId));
  const chartPool = directPool ? poolState[directPool.id] : quote?.route?.pools?.[0] ? poolState[quote.route.pools[0]] : poolState[CONFIG.POOLS[0].id];
  const chartA = tokenState[chartPool?.tokenA] || tokenById[chartPool?.tokenA];
  const chartB = tokenState[chartPool?.tokenB] || tokenById[chartPool?.tokenB];
  const spot = useMemo(() => {
    if (!chartPool || chartA?.decimals == null || chartB?.decimals == null) return 0;
    const a = Number(formatUnits(chartPool.reserveA, chartA.decimals));
    const b = Number(formatUnits(chartPool.reserveB, chartB.decimals));
    return a ? b / a : 0;
  }, [chartPool, chartA, chartB]);

  function log(message) {
    setLogLines((prev) => [`[${new Date().toLocaleTimeString("id-ID")}] ${message}`, ...prev].slice(0, 40));
  }
  function pushHistory(entry) {
    setHistory((prev) => {
      const next = [entry, ...prev].slice(0, 50);
      localStorage.setItem(HKEY, JSON.stringify(next));
      return next;
    });
    setFeedTab("history");
  }
  function flip() {
    setFromId(toId); setToId(fromId); setAmountIn("");
  }
  function guard() {
    if (!isConnected) { alert("Connect wallet dulu."); return false; }
    if (!chainOk) { alert("Pindah ke Sepolia dulu."); return false; }
    return true;
  }
  async function approveRouter(amount) {
    const allowance = await readContract(wagmiConfig, { address: from.address, abi: ERC20_ABI, functionName: "allowance", args: [address, CONFIG.ROUTER_ADDRESS] });
    if (allowance >= amount) return;
    setBusy(`Approve ${from.symbol}`); log(`Approve ${from.symbol} ke router…`);
    const hash = await writeContract(wagmiConfig, { address: from.address, abi: ERC20_ABI, functionName: "approve", args: [CONFIG.ROUTER_ADDRESS, amount] });
    await waitForTransactionReceipt(wagmiConfig, { hash });
  }
  async function doSwap() {
    if (!guard()) return;
    if (!quote || from?.decimals == null || to?.decimals == null) return alert("Tidak ada rute berlikuiditas untuk jumlah ini.");
    const raw = parseUnits(amountIn, from.decimals);
    const slipBps = BigInt(Math.round(Math.max(0, Math.min(50, Number(slippage) || 0)) * 100));
    const minOut = quote.output * (10000n - slipBps) / 10000n;
    try {
      await approveRouter(raw);
      setBusy("Konfirmasi routed swap"); log(`Rute: ${quote.route.path.map((id) => tokenState[id]?.symbol).join(" → ")}`);
      const hash = await writeContract(wagmiConfig, {
        address: CONFIG.ROUTER_ADDRESS, abi: ROUTER_ABI, functionName: "swapExactTokensForTokens",
        args: [raw, minOut, quote.route.pools.map((id) => poolById[id].address), quote.route.path.map((id) => tokenById[id].address)],
      });
      setBusy("Menunggu blok…"); await waitForTransactionReceipt(wagmiConfig, { hash });
      pushHistory({ type: "swap", hash, ts: Date.now(), aLogo: from.logo, aAmt: amountIn, aSym: from.symbol, bLogo: to.logo, bAmt: fmt(quote.output, to.decimals, 6), bSym: to.symbol, route: quote.route.path.map((id) => tokenState[id]?.symbol) });
      log("Routed swap sukses!"); setAmountIn(""); reads.refetch();
    } catch (e) { log("Swap gagal: " + shortError(e)); } finally { setBusy(""); }
  }

  const preview = quote && to?.decimals != null ? fmt(quote.output, to.decimals, 6) : "";
  const routeLabel = quote ? quote.route.path.map((id) => tokenState[id]?.symbol).join(" → ") : "Rute tidak tersedia";
  const ready = isConnected && chainOk && quote && !busy;

  return <div className="page">
    <header className="head"><div className="brand"><img className="brand-logo" src={CONFIG.BRAND_LOGO} alt="ETHJKT" /><div><p className="eyebrow">ETHJKT × UNPAM</p><h1>KampusSwap Router</h1></div></div><ConnectButton chainStatus="icon" showBalance={false} /></header>
    <div className="market-bar"><span className="live-dot" /> LIVE ON SEPOLIA <span>{CONFIG.POOLS.length} POOLS · 0.30% FEE/HOP</span><b>{routeLabel}</b></div>

    <TokenDirectory tokens={Object.values(tokenState)} selected={[fromId, toId]} onSelect={(id) => id !== toId && setFromId(id)} />

    <div className="cols multi-cols">
      <TokenPanel side="A" token={from} />
      <main className="col col-main">
        <Glass className="card history-card"><div className="chart-top"><SectionHead kicker="ACTIVITY FEED" title="Transaction History" /><div className="subtabs logtabs"><button className={`subtab ${feedTab === "history" ? "subtab--active" : ""}`} onClick={() => setFeedTab("history")}>History</button><button className={`subtab ${feedTab === "log" ? "subtab--active" : ""}`} onClick={() => setFeedTab("log")}>Console</button></div></div>{feedTab === "log" ? <pre className="log">{logLines.join("\n") || "Belum ada aktivitas."}</pre> : <div className="history">{history.length ? history.map((h, i) => <HistRow h={h} key={i} />) : <p className="hist-empty">Swap pertamamu akan muncul di sini.</p>}</div>}</Glass>
        <div className="chart-grid"><PriceChart price={spot} symA={chartA?.symbol || "—"} symB={chartB?.symbol || "—"} history={history} /><ActivityChart tokens={Object.values(tokenState)} history={history} /></div>
        <Glass className="card main"><SectionHead kicker="SMART ROUTER" title="Swap lintas pool" />
          <div className="view swap-view"><TokenInput label="Kamu bayar" value={amountIn} onChange={setAmountIn} token={from} tokens={Object.values(tokenState)} onToken={setFromId} exclude={toId} />
          <button className="flip" title="Balik arah" onClick={flip}>⇅</button>
          <TokenInput label="Kamu terima (perkiraan)" value={preview} token={to} tokens={Object.values(tokenState)} onToken={setToId} exclude={fromId} readOnly />
          <div className="route-card"><span>RUTE TERBAIK</span><strong>{routeLabel}</strong><small>{quote ? `${quote.route.pools.length} hop · minimum diterima ${fmt(quote.output * BigInt(10000 - Math.round(Math.max(0, Math.min(50, Number(slippage) || 0)) * 100)) / 10000n, to.decimals, 6)} ${to.symbol}` : "Pilih pasangan yang terhubung dan isi jumlah."}</small></div>
          <label className="slippage">Slippage tolerance <span><input type="number" min="0" max="50" step="0.1" value={slippage} onChange={(e) => setSlippage(e.target.value)} />%</span></label>
          <div className="actions"><button className="act act--primary" disabled={!ready} onClick={doSwap}>{busy ? <><span className="spinner" />{busy}</> : !isConnected ? "Connect dulu" : !chainOk ? "Jaringan salah" : quote ? `Swap via ${quote.route.pools.length} pool` : "Rute tidak tersedia"}</button></div></div>
        </Glass>
      </main>
      <TokenPanel side="B" token={to} />
    </div>
    <footer className="status-footer"><span>ROUTER {CONFIG.ROUTER_ADDRESS.slice(0, 8)}…{CONFIG.ROUTER_ADDRESS.slice(-6)}</span><span>Quotes dihitung dari reserve on-chain · update 10 detik</span></footer>
  </div>;
}

function findRoutes(from, to) {
  const found = [];
  function walk(current, path, pools) {
    if (path.length > 4) return;
    if (current === to) { found.push({ path, pools }); return; }
    for (const pool of CONFIG.POOLS) {
      const next = pool.tokenA === current ? pool.tokenB : pool.tokenB === current ? pool.tokenA : null;
      if (next && !path.includes(next)) walk(next, [...path, next], [...pools, pool.id]);
    }
  }
  walk(from, [from], []);
  return found;
}
function quoteRoute(input, route, states) {
  let output = input;
  route.pools.forEach((id, i) => {
    const p = states[id];
    const forward = p.tokenA === route.path[i];
    output = amountOut(output, forward ? p.reserveA : p.reserveB, forward ? p.reserveB : p.reserveA);
  });
  return { route, output };
}
function Glass({ className = "", children }: { className?: string; children: ReactNode }) { return <section className={`glass ${className}`}><span className="glass-filter" /><span className="glass-overlay" /><span className="glass-specular" /><div className="glass-content col-inner">{children}</div></section>; }
function SectionHead({ kicker, title }) { return <div className="section-head"><span>{kicker}</span><h2>{title}</h2></div>; }
function TokenInput({ label, value, onChange, token, tokens, onToken, exclude, readOnly = false }) { return <div className="box"><div className="box-top"><span className="box-label">{label}</span><span className="box-bal">Balance {fmt(token?.balance, token?.decimals)}</span></div><div className="box-mid"><input type={readOnly ? "text" : "number"} min="0" placeholder="0.0" value={value} readOnly={readOnly} onChange={(e) => onChange?.(e.target.value)} /><label className="token-select"><img className="token-logo" src={token?.logo} alt="" /><select value={token?.id} onChange={(e) => onToken(e.target.value)}>{tokens.filter((t) => t.id !== exclude).map((t) => <option key={t.id} value={t.id}>{t.symbol}</option>)}</select></label></div></div>; }
function TokenPanel({ side, token }) { return <aside className={`token-panel token-panel--${side.toLowerCase()}`}><div className="token-kanji">{side === "A" ? "払" : "受"}</div><img className="token-hero-logo" src={token?.logo} alt={`${token?.symbol} logo`} /><span className="token-index">TOKEN {side}</span><h2>{token?.symbol}</h2><p className="token-role">{side === "A" ? "INPUT ASSET" : "OUTPUT ASSET"}</p><div className="token-stat"><span>Wallet balance</span><strong>{fmt(token?.balance, token?.decimals)}</strong></div><div className="token-stat"><span>Network</span><strong>Sepolia</strong></div><a className="contract-link" href={`https://sepolia.etherscan.io/token/${token?.address}`} target="_blank" rel="noreferrer">View token ↗</a></aside>; }
function TokenDirectory({ tokens, selected, onSelect }) { return <Glass className="token-directory"><div className="directory-head"><SectionHead kicker="ASSET DIRECTORY" title={`${tokens.length} token tersedia`} /><span>Klik untuk jadikan token input</span></div><div className="token-list">{tokens.map((t) => <button key={t.id} className={`token-list-item ${selected.includes(t.id) ? "selected" : ""}`} onClick={() => onSelect(t.id)}><img src={t.logo} alt="" /><span><strong>{t.symbol}</strong><small>{t.name}</small></span><b>{fmt(t.balance, t.decimals)}</b></button>)}</div></Glass>; }
function PriceChart({ price, symA, symB, history }) { const rising = history[0]?.type === "swap" ? history[0]?.aSym !== symB : true; const base = price || 1; const values = Array.from({ length: 18 }, (_, i) => base * (1 + Math.sin(i * .82) * .018 + (rising ? 1 : -1) * (i - 8.5) * .004)); const min = Math.min(...values) * .995, max = Math.max(...values) * 1.005; const points = values.map((v, i) => `${i / 17 * 100},${92 - (v - min) / (max - min || 1) * 76}`).join(" "); return <Glass className={`card chart-card ${rising ? "is-rising" : "is-falling"}`}><div className="chart-meme" /><div className="chart-top"><SectionHead kicker="POOL ORACLE" title={`${symA} / ${symB}`} /></div><div className="price-line"><strong>{price ? price.toLocaleString("id-ID", { maximumFractionDigits: 6 }) : "—"}</strong><span>{symB} per {symA}</span></div><svg className="price-chart" viewBox="0 0 100 100" preserveAspectRatio="none"><defs><linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={rising ? "#6af5cb" : "#ff6b9e"} stopOpacity=".38"/><stop offset="1" stopColor="#10111c" stopOpacity="0"/></linearGradient></defs><polygon className="chart-area" points={`0,100 ${points} 100,100`} /><polyline points={points} /></svg><div className="chart-axis"><span>24H AGO</span><span>NOW</span></div></Glass>; }
function ActivityChart({ tokens, history }) { const counts = Object.fromEntries(tokens.map((t) => [t.symbol, 0])); history.filter((h) => h.type === "swap").forEach((h) => { if (h.aSym in counts) counts[h.aSym]++; if (h.bSym in counts) counts[h.bSym]++; }); const max = Math.max(1, ...Object.values(counts)); return <Glass className="card activity-chart"><SectionHead kicker="LOCAL ACTIVITY" title="Token paling aktif" /><div className="bar-chart">{tokens.map((t) => <div className="bar-item" key={t.id}><div className="bar-track"><div className="bar-fill" style={{ height: `${Math.max(5, counts[t.symbol] / max * 100)}%` }}><span>{counts[t.symbol]}</span></div></div><img src={t.logo} alt="" /><small>{t.symbol}</small></div>)}</div><p className="chart-note">Berdasarkan riwayat swap di browser ini.</p></Glass>; }
function HistRow({ h }) { const high = Math.max(parseFloat(h.aAmt) || 0, parseFloat(String(h.bAmt).replace(/\./g, "").replace(",", ".")) || 0) >= 100; return <div className="hist-row"><div className="cortisol-pop"><img src={high ? "/high-cortisol.png" : "/low-cortisol.jpg"} alt="" /><span>{high ? "HIGH CORTISOL" : "LOW CORTISOL"}</span></div><span className="hist-token"><img className="hist-logo" src={h.aLogo} alt="" /><span className="hist-amt">{h.aAmt} {h.aSym}</span></span><span className="hist-arrow">→</span><span className="hist-token"><img className="hist-logo" src={h.bLogo} alt="" /><span className="hist-amt">{h.bAmt} {h.bSym}</span></span><span className="hist-via"><span className="hist-via-top">via <b>{h.route?.length > 2 ? `${h.route.length - 1} pools` : "KampusSwap"}</b></span><span className="hist-sub2">{h.route?.join(" → ") || "Swap"}</span></span><a className="hist-date" href={`https://sepolia.etherscan.io/tx/${h.hash}`} target="_blank" rel="noreferrer">TX ↗</a><span className="hist-check">✓</span></div>; }
