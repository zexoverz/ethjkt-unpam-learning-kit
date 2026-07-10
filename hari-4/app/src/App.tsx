import { useMemo, useState, useEffect, type ReactNode } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useChainId, useReadContracts } from "wagmi";
import { readContract, writeContract, waitForTransactionReceipt } from "@wagmi/core";
import { formatUnits, parseUnits } from "viem";

import { CONFIG, AMM_ADDRESS, TOKEN_A, TOKEN_B } from "../config";
import { ERC20_ABI, AMM_ABI } from "./abi";
import { wagmiConfig } from "./wagmi";
import PriceChart, { savePrice, loadPrices, type PricePoint } from "./PriceChart";
import SlippageGauge from "./SlippageGauge";
import XYKCurve from "./XYKCurve";

const SEPOLIA = CONFIG.SEPOLIA_CHAIN_ID;
const tokenA = { address: TOKEN_A.address, abi: ERC20_ABI };
const tokenB = { address: TOKEN_B.address, abi: ERC20_ABI };
const amm = { address: AMM_ADDRESS, abi: AMM_ABI };
const HKEY = "ks_hist_v2_" + String(AMM_ADDRESS).toLowerCase();

// ---------- helpers ----------
function fmt(raw, dec) {
  if (raw == null || dec == null) return "-";
  return Number(formatUnits(raw, dec)).toLocaleString("id-ID", { maximumFractionDigits: 2 });
}
function fmtNum(x) {
  return Number(x).toLocaleString("id-ID", { maximumFractionDigits: 4 });
}
function getAmountOut(amountIn, reserveIn, reserveOut) {
  if (amountIn <= 0n || reserveIn <= 0n || reserveOut <= 0n) return 0n;
  const inWithFee = amountIn * 997n;
  return (inWithFee * reserveOut) / (reserveIn * 1000n + inWithFee);
}
function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HKEY) || "[]");
  } catch {
    return [];
  }
}

export default function App() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const chainOk = chainId === SEPOLIA;

  const [tab, setTab] = useState("swap");
  const [liqSub, setLiqSub] = useState("add");
  const [logTab, setLogTab] = useState("history");
  const [swapDir, setSwapDir] = useState("AtoB");
  const [amountIn, setAmountIn] = useState("");
  const [addA, setAddA] = useState("");
  const [addB, setAddB] = useState("");
  const [removeShares, setRemoveShares] = useState("");
  const [busy, setBusy] = useState(null);
  const [logLines, setLogLines] = useState([]);
  const [history, setHistory] = useState(loadHistory);
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>(() => loadPrices(AMM_ADDRESS));

  useEffect(() => {
    setPriceHistory(loadPrices(AMM_ADDRESS));
  }, [AMM_ADDRESS]);

  // ---------- reads ----------
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
    query: { refetchInterval: 10000 },
  });
  const user = useReadContracts({
    contracts: [
      { ...tokenA, functionName: "balanceOf", args: [address] },
      { ...tokenB, functionName: "balanceOf", args: [address] },
      { ...amm, functionName: "shares", args: [address] },
    ],
    query: { enabled: !!address },
  });

  const d = pool.data;
  const symA = d?.[0]?.result ?? "TOKEN A";
  const decA = d?.[1]?.result;
  const symB = d?.[2]?.result ?? "TOKEN B";
  const decB = d?.[3]?.result;
  const reserveA = d?.[4]?.result ?? 0n;
  const reserveB = d?.[5]?.result ?? 0n;
  const totalShares = d?.[6]?.result ?? 0n;
  const balA = user.data?.[0]?.result;
  const balB = user.data?.[1]?.result;
  const myShares = user.data?.[2]?.result;

  const ready = isConnected && chainOk && decA != null && decB != null;
  const hasPool = reserveA > 0n && reserveB > 0n;

  function refresh() {
    pool.refetch();
    user.refetch();
  }
  function log(msg) {
    const t = new Date().toLocaleTimeString();
    setLogLines((prev) => ["[" + t + "] " + msg, ...prev].slice(0, 40));
  }
  function pushHistory(entry) {
    setHistory((prev) => {
      const next = [entry, ...prev].slice(0, 50);
      try {
        localStorage.setItem(HKEY, JSON.stringify(next));
      } catch {}
      return next;
    });
    setLogTab("history");
  }

  // ---------- swap preview ----------
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

  // ---------- slippage data ----------
  const slippageData = useMemo(() => {
    if (!amountIn || Number(amountIn) <= 0 || !previewOut || decA == null || decB == null) {
      return null;
    }
    const amtIn = Number(amountIn);
    const amtOut = Number(previewOut);
    const rIn = swapDir === "AtoB"
      ? Number(formatUnits(reserveA, decA))
      : Number(formatUnits(reserveB, decB));
    const rOut = swapDir === "AtoB"
      ? Number(formatUnits(reserveB, decB))
      : Number(formatUnits(reserveA, decA));
    return { amtIn, amtOut, rIn, rOut };
  }, [amountIn, previewOut, swapDir, reserveA, reserveB, decA, decB]);

  // ---------- spot price ----------
  const spotPrice = useMemo(() => {
    if (!hasPool || decA == null || decB == null) return 0;
    const rA = Number(formatUnits(reserveA, decA));
    const rB = Number(formatUnits(reserveB, decB));
    return rB / rA;
  }, [reserveA, reserveB, decA, decB, hasPool]);

  // ---------- liquidity auto-pair ----------
  function onAddA(v) {
    setAddA(v);
    if (hasPool && v && Number(v) > 0 && decA != null && decB != null) {
      try {
        const amtA = parseUnits(v, decA);
        const amtB = (amtA * reserveB) / reserveA;
        setAddB(trim(formatUnits(amtB, decB)));
      } catch {}
    } else if (!v) setAddB("");
  }
  function onAddB(v) {
    setAddB(v);
    if (hasPool && v && Number(v) > 0 && decA != null && decB != null) {
      try {
        const amtB = parseUnits(v, decB);
        const amtA = (amtB * reserveA) / reserveB;
        setAddA(trim(formatUnits(amtA, decA)));
      } catch {}
    } else if (!v) setAddA("");
  }

  // ---------- write flows ----------
  async function ensureAllowance(token, amount, sym, setStep) {
    const cur = await readContract(wagmiConfig, {
      address: token.address,
      abi: ERC20_ABI,
      functionName: "allowance",
      args: [address, AMM_ADDRESS],
    });
    if (cur >= amount) return;
    setStep("Approve " + sym + " — cek MetaMask");
    log("Approve " + sym + "... konfirmasi di wallet");
    const hash = await writeContract(wagmiConfig, {
      address: token.address,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [AMM_ADDRESS, amount],
    });
    setStep("Approve " + sym + " terkirim, nunggu…");
    await waitForTransactionReceipt(wagmiConfig, { hash });
    log("Approve " + sym + " sukses.");
  }

  async function doSwap() {
    if (!guard()) return;
    if (!amountIn || Number(amountIn) <= 0) return alert("Isi jumlah swap dulu.");
    const inSym = swapDir === "AtoB" ? symA : symB;
    const outSym = swapDir === "AtoB" ? symB : symA;
    const inDec = swapDir === "AtoB" ? decA : decB;
    const outDec = swapDir === "AtoB" ? decB : decA;
    const rIn = swapDir === "AtoB" ? reserveA : reserveB;
    const rOut = swapDir === "AtoB" ? reserveB : reserveA;
    const token = swapDir === "AtoB" ? tokenA : tokenB;
    const amount = parseUnits(amountIn, inDec);
    const setStep = (t) => setBusy({ key: "swap", text: t });
    setStep("...");
    try {
      await ensureAllowance(token, amount, inSym, setStep);
      setStep("Konfirmasi swap di MetaMask");
      log("Kirim swap... konfirmasi di wallet");
      const hash = await writeContract(wagmiConfig, {
        address: AMM_ADDRESS,
        abi: AMM_ABI,
        functionName: swapDir === "AtoB" ? "swapAforB" : "swapBforA",
        args: [amount],
      });
      setStep("Menukar… (nunggu blok)");
      await waitForTransactionReceipt(wagmiConfig, { hash });
      const outRaw = getAmountOut(amount, rIn, rOut);
      const amtIn = Number(amountIn);
      const amtOut = Number(formatUnits(outRaw, outDec));

      const pricePoint: PricePoint = {
        ts: Date.now(),
        price: amtOut / amtIn,
        poolAddress: AMM_ADDRESS,
        direction: swapDir,
        amountIn: amtIn,
        amountOut: amtOut,
        symA,
        symB,
      };
      savePrice(pricePoint);
      setPriceHistory((prev) => [...prev, pricePoint].slice(-200));

      log("Swap sukses!");
      pushHistory({
        type: "swap", hash, ts: Date.now(),
        aLogo: swapDir === "AtoB" ? TOKEN_A.logo : TOKEN_B.logo,
        aAmt: fmtNum(amtIn), aSym: inSym,
        bLogo: swapDir === "AtoB" ? TOKEN_B.logo : TOKEN_A.logo,
        bAmt: fmtNum(amtOut), bSym: outSym,
      });
      refresh();
    } catch (e) {
      log("Swap gagal: " + short(e));
    } finally {
      setBusy(null);
    }
  }

  async function doAddLiquidity() {
    if (!guard()) return;
    if (!addA || !addB || Number(addA) <= 0 || Number(addB) <= 0) return alert("Isi jumlah A & B dulu.");
    const amtA = parseUnits(addA, decA);
    const amtB = parseUnits(addB, decB);
    const setStep = (t) => setBusy({ key: "add", text: t });
    setStep("...");
    try {
      await ensureAllowance(tokenA, amtA, symA, setStep);
      await ensureAllowance(tokenB, amtB, symB, setStep);
      setStep("Konfirmasi tambah di MetaMask");
      log("Kirim addLiquidity...");
      const hash = await writeContract(wagmiConfig, {
        address: AMM_ADDRESS, abi: AMM_ABI,
        functionName: "addLiquidity", args: [amtA, amtB],
      });
      setStep("Menambah… (nunggu blok)");
      await waitForTransactionReceipt(wagmiConfig, { hash });
      log("Tambah likuiditas sukses!");
      pushHistory({
        type: "add", hash, ts: Date.now(),
        aLogo: TOKEN_A.logo, aAmt: fmtNum(Number(addA)), aSym: symA,
        bLogo: TOKEN_B.logo, bAmt: fmtNum(Number(addB)), bSym: symB,
      });
      refresh();
    } catch (e) {
      log("Tambah gagal: " + short(e));
    } finally {
      setBusy(null);
    }
  }

  async function doRemoveLiquidity() {
    if (!guard()) return;
    if (!removeShares || Number(removeShares) <= 0) return alert("Isi jumlah share dulu.");
    const setStep = (t) => setBusy({ key: "remove", text: t });
    setStep("Konfirmasi tarik di MetaMask");
    try {
      log("Kirim removeLiquidity...");
      const hash = await writeContract(wagmiConfig, {
        address: AMM_ADDRESS, abi: AMM_ABI,
        functionName: "removeLiquidity", args: [parseUnits(removeShares, 18)],
      });
      setStep("Menarik… (nunggu blok)");
      await waitForTransactionReceipt(wagmiConfig, { hash });
      log("Tarik likuiditas sukses!");
      pushHistory({
        type: "remove", hash, ts: Date.now(),
        aLogo: TOKEN_A.logo, aAmt: "", aSym: symA,
        bLogo: TOKEN_B.logo, bAmt: "", bSym: symB,
      });
      refresh();
    } catch (e) {
      log("Tarik gagal: " + short(e));
    } finally {
      setBusy(null);
    }
  }

  function guard() {
    if (!isConnected) { alert("Connect wallet dulu."); return false; }
    if (!chainOk) { alert("Pindah ke Sepolia dulu (lewat tombol wallet)."); return false; }
    return true;
  }

  const fromSym = swapDir === "AtoB" ? symA : symB;
  const toSym = swapDir === "AtoB" ? symB : symA;
  const fromLogo = swapDir === "AtoB" ? TOKEN_A.logo : TOKEN_B.logo;
  const toLogo = swapDir === "AtoB" ? TOKEN_B.logo : TOKEN_A.logo;

  const actLabel = !isConnected ? "Connect dulu" : !chainOk ? "Jaringan salah" : null;

  return (
    <div className="page">
      <img className="hero-title" src={CONFIG.TITLE_IMG} alt="AI & BLOCKCHAIN" />

      <header className="head">
        <div className="brand">
          <img className="brand-logo" src={CONFIG.BRAND_LOGO} alt="ETHJKT" />
          <div>
            <p className="eyebrow">ETHJKT x UNPAM</p>
            <h1>KampusSwap</h1>
          </div>
        </div>
        <ConnectButton chainStatus="icon" showBalance={false} />
      </header>

      <div className="cols">
        {/* ===== MAIN ===== */}
        <div className="col col-main">
          <Glass className="card main">
            <div className="tabs">
              <button className={"tab " + (tab === "swap" ? "tab--active" : "")} onClick={() => setTab("swap")}>Swap</button>
              <button className={"tab " + (tab === "liquidity" ? "tab--active" : "")} onClick={() => setTab("liquidity")}>Liquidity</button>
            </div>

            {tab === "swap" && (
              <div className="view">
                <div className="box">
                  <div className="box-top"><span className="box-label">Kamu bayar</span></div>
                  <div className="box-mid">
                    <input type="number" min="0" placeholder="0.0" value={amountIn} onChange={(e) => setAmountIn(e.target.value)} />
                    <span className="token-chip"><img className="token-logo" src={fromLogo} alt="" />{fromSym}</span>
                  </div>
                </div>

                <button className="flip" title="Balik arah" onClick={() => setSwapDir(swapDir === "AtoB" ? "BtoA" : "AtoB")}>⇅</button>

                <div className="box">
                  <div className="box-top"><span className="box-label">Kamu terima (perkiraan)</span></div>
                  <div className="box-mid">
                    <input type="text" readOnly placeholder="0.0" value={previewOut} />
                    <span className="token-chip"><img className="token-logo" src={toLogo} alt="" />{toSym}</span>
                  </div>
                </div>

                {slippageData && (
                  <SlippageGauge
                    amountIn={slippageData.amtIn}
                    amountOut={slippageData.amtOut}
                    reserveIn={slippageData.rIn}
                    reserveOut={slippageData.rOut}
                    swapDir={swapDir}
                    symA={symA}
                    symB={symB}
                  />
                )}

                <div className="actions">
                  <button className="act act--primary" disabled={!ready || busy?.key === "swap"} onClick={doSwap}>
                    {busy?.key === "swap" ? <><span className="spinner" />{busy.text}</> : actLabel || "Swap"}
                  </button>
                </div>
              </div>
            )}

            {tab === "liquidity" && (
              <div className="view">
                <div className="subtabs">
                  <button className={"subtab " + (liqSub === "add" ? "subtab--active" : "")} onClick={() => setLiqSub("add")}>Tambah</button>
                  <button className={"subtab " + (liqSub === "remove" ? "subtab--active" : "")} onClick={() => setLiqSub("remove")}>Tarik</button>
                </div>

                {liqSub === "add" ? (
                  <div className="view">
                    <div className="box">
                      <div className="box-top"><span className="box-label">Setor</span></div>
                      <div className="box-mid">
                        <input type="number" min="0" placeholder="0.0" value={addA} onChange={(e) => onAddA(e.target.value)} />
                        <span className="token-chip"><img className="token-logo" src={TOKEN_A.logo} alt="" />{symA}</span>
                      </div>
                    </div>
                    <div className="flip flip--plus">+</div>
                    <div className="box">
                      <div className="box-top"><span className="box-label">Setor</span></div>
                      <div className="box-mid">
                        <input type="number" min="0" placeholder="0.0" value={addB} onChange={(e) => onAddB(e.target.value)} />
                        <span className="token-chip"><img className="token-logo" src={TOKEN_B.logo} alt="" />{symB}</span>
                      </div>
                    </div>
                    <p className="hint">{hasPool ? "Isi salah satu, satunya otomatis ngikut rasio pool." : "Pool baru: kamu yang tentuin harga awal (isi dua-duanya)."}</p>
                    <div className="actions">
                      <button className="act act--primary" disabled={!ready || busy?.key === "add"} onClick={doAddLiquidity}>
                        {busy?.key === "add" ? <><span className="spinner" />{busy.text}</> : actLabel || "Tambah Likuiditas"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="view">
                    <div className="box">
                      <div className="box-top">
                        <span className="box-label">Share ditarik</span>
                        <span className="box-bal">punya: {fmt(myShares, 18)}</span>
                      </div>
                      <div className="box-mid">
                        <input type="number" min="0" placeholder="0.0" value={removeShares} onChange={(e) => setRemoveShares(e.target.value)} />
                        <button className="token-chip chip-btn" onClick={() => myShares != null && setRemoveShares(formatUnits(myShares, 18))}>Max</button>
                      </div>
                    </div>
                    <div className="actions">
                      <button className="act act--primary" disabled={!ready || busy?.key === "remove"} onClick={doRemoveLiquidity}>
                        {busy?.key === "remove" ? <><span className="spinner" />{busy.text}</> : actLabel || "Tarik Likuiditas"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Glass>
        </div>

        {/* ===== SIDE ===== */}
        <div className="col col-side">
          <Glass className="card info">
            <Row k="Akun" v={address ? address.slice(0, 6) + "…" + address.slice(-4) : "belum connect"} />
            <Row k="Jaringan" v={!isConnected ? "-" : chainOk ? "Sepolia" : "chainId " + chainId + " (bukan Sepolia)"} />
            <div className="hr" />
            <Row k={<>{("Saldo ")}<b>{symA}</b></>} v={fmt(balA, decA)} />
            <Row k={<>{("Saldo ")}<b>{symB}</b></>} v={fmt(balB, decB)} />
            <div className="hr" />
            <Row k={<>{("Pool ")}<b>{symA}</b></>} v={fmt(reserveA, decA)} />
            <Row k={<>{("Pool ")}<b>{symB}</b></>} v={fmt(reserveB, decB)} />
            {hasPool && decA != null && decB != null && (
              <Row k="Spot price" v={(Number(formatUnits(reserveB, decB)) / Number(formatUnits(reserveA, decA))).toFixed(6) + " " + symB + "/" + symA} />
            )}
            <Row k="Share kamu / total" v={fmt(myShares, 18) + " / " + fmt(totalShares, 18)} />
          </Glass>
        </div>
      </div>

      {/* ===== CHARTS (always visible) ===== */}
      <div className="charts-row">
        <Glass className="card chart-card">
          <h3 className="chart-card__title">📊 Price History</h3>
          <PriceChart
            history={priceHistory}
            poolAddress={AMM_ADDRESS}
            symA={symA}
            symB={symB}
            currentPrice={spotPrice}
          />
        </Glass>
        <Glass className="card chart-card">
          <XYKCurve
            reserveA={hasPool && decA != null ? Number(formatUnits(reserveA, decA)) : 0}
            reserveB={hasPool && decB != null ? Number(formatUnits(reserveB, decB)) : 0}
            amountIn={slippageData?.amtIn || 0}
            amountOut={slippageData?.amtOut || 0}
            swapDir={swapDir}
            symA={symA}
            symB={symB}
          />
        </Glass>
      </div>

      {/* ===== LOG + HISTORY ===== */}
      <Glass className="card">
        <div className="subtabs logtabs">
          <button className={"subtab " + (logTab === "log" ? "subtab--active" : "")} onClick={() => setLogTab("log")}>Log</button>
          <button className={"subtab " + (logTab === "history" ? "subtab--active" : "")} onClick={() => setLogTab("history")}>History</button>
        </div>
        {logTab === "log" ? (
          <pre className="log">{logLines.length ? logLines.join("\n") : "Belum ada aktivitas."}</pre>
        ) : (
          <div className="history">
            {history.length === 0 ? (
              <p className="hist-empty">Belum ada transaksi.</p>
            ) : (
              history.map((h, i) => <HistRow key={i} h={h} />)
            )}
          </div>
        )}
      </Glass>
    </div>
  );
}

// ---------- small components ----------
function Glass({ className = "", inner = "col-inner", children }: { className?: string; inner?: string; children: ReactNode }) {
  return (
    <section className={"glass " + className}>
      <span className="glass-filter" /><span className="glass-overlay" /><span className="glass-specular" />
      <div className={"glass-content " + inner}>{children}</div>
    </section>
  );
}
function Row({ k, v }: { k: ReactNode; v: ReactNode }) {
  return (
    <div className="row"><span className="k">{k}</span><span className="v mono">{v}</span></div>
  );
}
function HistRow({ h }) {
  const shortHash = h.hash ? h.hash.slice(0, 6) + "…" + h.hash.slice(-4) : "";
  const url = h.hash ? "https://sepolia.etherscan.io/tx/" + h.hash : "#";
  const dt = h.ts ? new Date(h.ts) : null;
  const date = dt ? dt.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" }) : "";
  const time = dt ? dt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "";
  const mid = h.type === "swap" ? "→" : h.type === "remove" ? "↑" : "+";
  const via = h.type === "swap" ? "Swap" : h.type === "remove" ? "Tarik LP" : "Tambah LP";
  return (
    <div className="hist-row">
      <span className="hist-token"><img className="hist-logo" src={h.aLogo} alt="" /><span className="hist-amt">{h.aAmt} {h.aSym}</span></span>
      <span className="hist-arrow">{mid}</span>
      <span className="hist-token"><img className="hist-logo" src={h.bLogo} alt="" /><span className="hist-amt">{h.bAmt} {h.bSym}</span></span>
      <span className="hist-via"><span className="hist-via-top">via <b>KampusSwap</b></span><span className="hist-sub2">{via}</span></span>
      <a className="hist-date" href={url} target="_blank" rel="noopener noreferrer">
        <span className="hist-d">{date} ↗</span>
        <span className="hist-t">{time}</span>
      </a>
      <span className="hist-check">✓</span>
    </div>
  );
}

// ---------- utils ----------
function trim(s) {
  const n = Number(s);
  if (!isFinite(n)) return "";
  return String(Math.round(n * 1e6) / 1e6);
}
function short(e) {
  return e?.shortMessage || e?.message || String(e);
}
