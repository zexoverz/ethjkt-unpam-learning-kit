import { useMemo, useState, type ReactNode } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useChainId, useReadContracts } from "wagmi";
import { readContract, writeContract, waitForTransactionReceipt } from "@wagmi/core";
import { formatUnits, parseUnits, type Address } from "viem";

import { CONFIG } from "../config";
import { ERC20_ABI, AMM_ABI } from "./abi";
import { wagmiConfig } from "./wagmi";
import { PriceChart } from "./PriceChart";
import { findBestRoute, type RoutingPool } from "./smartRouter";

const SEPOLIA = CONFIG.SEPOLIA_CHAIN_ID;
const tokenA = { address: CONFIG.TOKEN_A.address, abi: ERC20_ABI };
const tokenB = { address: CONFIG.TOKEN_B.address, abi: ERC20_ABI };
const amm = { address: CONFIG.AMM_ADDRESS, abi: AMM_ABI };
const HKEY = "ks_hist_v2_" + String(CONFIG.AMM_ADDRESS).toLowerCase();
const EMPTY_ADDRESS: Address = "0x0000000000000000000000000000000000000000";

// ---------- helpers ----------
type BusyState = { key: "swap" | "add" | "remove"; text: string };
type HistoryEntry = {
  type: "swap" | "add" | "remove";
  hash: string;
  ts: number;
  aLogo: string;
  aAmt: string;
  aSym: string;
  bLogo: string;
  bAmt: string;
  bSym: string;
};

function fmt(raw: bigint | undefined, dec: number | undefined) {
  if (raw == null || dec == null) return "-";
  const [whole, fraction = ""] = formatUnits(raw, dec).split(".");
  const grouped = BigInt(whole).toLocaleString("id-ID");
  const visibleFraction = fraction.slice(0, 2).replace(/0+$/, "");
  return visibleFraction ? `${grouped},${visibleFraction}` : grouped;
}
function fmtNum(x: number) {
  return Number(x).toLocaleString("id-ID", { maximumFractionDigits: 4 });
}
// Rumus x*y=k dengan total fee dari konfigurasi contract.
function getAmountOut(amountIn: bigint, reserveIn: bigint, reserveOut: bigint, totalFeeBps: bigint) {
  if (amountIn <= 0n || reserveIn <= 0n || reserveOut <= 0n) return 0n;
  if (totalFeeBps >= 10_000n) return 0n;
  const inWithFee = amountIn * (10_000n - totalFeeBps);
  return (inWithFee * reserveOut) / (reserveIn * 10_000n + inWithFee);
}
function loadHistory(): HistoryEntry[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(HKEY) || "[]");
    return Array.isArray(stored) ? stored as HistoryEntry[] : [];
  } catch {
    return [];
  }
}

export default function App() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const chainOk = chainId === SEPOLIA;
  const userAddress = address ?? EMPTY_ADDRESS;

  const [tab, setTab] = useState("swap"); // swap | liquidity
  const [liqSub, setLiqSub] = useState("add"); // add | remove
  const [logTab, setLogTab] = useState("history"); // log | history
  const [swapDir, setSwapDir] = useState("AtoB");
  const [amountIn, setAmountIn] = useState("");
  const [addA, setAddA] = useState("");
  const [addB, setAddB] = useState("");
  const [removeShares, setRemoveShares] = useState("");
  const [busy, setBusy] = useState<BusyState | null>(null); // { key, text }
  const [logLines, setLogLines] = useState<string[]>([]);
  const [history, setHistory] = useState(loadHistory);

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
      { ...amm, functionName: "swapFeeBps" },
    ],
    query: { refetchInterval: 10000 },
  });
  const user = useReadContracts({
    contracts: [
      { ...tokenA, functionName: "balanceOf", args: [userAddress] },
      { ...tokenB, functionName: "balanceOf", args: [userAddress] },
      { ...amm, functionName: "shares", args: [userAddress] },
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
  // Contract lama hanya memakai fee statis 0,30%. Contract baru menyediakan
  // swapFeeBps dan selalu menambahkan protocol fee 0,05%.
  const configuredSwapFeeBps = d?.[7]?.result;
  const totalFeeBps = configuredSwapFeeBps == null ? 30n : configuredSwapFeeBps + 5n;
  const balA = user.data?.[0]?.result;
  const balB = user.data?.[1]?.result;
  const myShares = user.data?.[2]?.result;

  const ready = isConnected && chainOk && decA != null && decB != null;
  const hasPool = reserveA > 0n && reserveB > 0n;
  const marketPrice = hasPool && decA != null && decB != null
    ? Number(formatUnits(reserveB, decB)) / Number(formatUnits(reserveA, decA))
    : null;
  const routingPools = useMemo<RoutingPool[]>(() => hasPool ? [{
    id: CONFIG.AMM_ADDRESS,
    token0: CONFIG.TOKEN_A.address,
    token1: CONFIG.TOKEN_B.address,
    reserve0: reserveA,
    reserve1: reserveB,
    feeBps: Number(totalFeeBps),
  }] : [], [hasPool, reserveA, reserveB, totalFeeBps]);
  const route = useMemo(() => {
    if (!amountIn || decA == null || decB == null) return null;
    try {
      const inToken = swapDir === "AtoB" ? CONFIG.TOKEN_A.address : CONFIG.TOKEN_B.address;
      const outToken = swapDir === "AtoB" ? CONFIG.TOKEN_B.address : CONFIG.TOKEN_A.address;
      const inDecimals = swapDir === "AtoB" ? decA : decB;
      return findBestRoute({ tokenIn: inToken, tokenOut: outToken, amountIn: parseUnits(amountIn, inDecimals), pools: routingPools });
    } catch {
      return null;
    }
  }, [amountIn, decA, decB, routingPools, swapDir]);

  function refresh() {
    pool.refetch();
    user.refetch();
  }
  async function waitForSuccess(hash: `0x${string}`) {
    const receipt = await waitForTransactionReceipt(wagmiConfig, { hash });
    if (receipt.status !== "success") throw new Error("Transaksi tidak berhasil dieksekusi on-chain.");
    return receipt;
  }
  function log(msg: string) {
    const t = new Date().toLocaleTimeString();
    setLogLines((prev) => [`[${t}] ${msg}`, ...prev].slice(0, 40));
  }
  function pushHistory(entry: HistoryEntry) {
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
        const out = getAmountOut(parseUnits(amountIn, decA), reserveA, reserveB, totalFeeBps);
        return fmt(out, decB);
      }
      const out = getAmountOut(parseUnits(amountIn, decB), reserveB, reserveA, totalFeeBps);
      return fmt(out, decA);
    } catch {
      return "";
    }
  }, [amountIn, swapDir, reserveA, reserveB, decA, decB, totalFeeBps]);

  // ---------- liquidity auto-pair ----------
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

  // ---------- write flows ----------
  async function ensureAllowance(
    token: { address: Address; abi: typeof ERC20_ABI },
    amount: bigint,
    sym: string,
    setStep: (text: string) => void,
  ) {
    if (!address) throw new Error("Wallet belum terhubung.");
    const cur = await readContract(wagmiConfig, {
      address: token.address,
      abi: ERC20_ABI,
      functionName: "allowance",
      args: [address, CONFIG.AMM_ADDRESS],
    });
    if (cur >= amount) return;
    setStep(`Approve ${sym} — cek MetaMask`);
    log(`Approve ${sym}... konfirmasi di wallet`);
    const hash = await writeContract(wagmiConfig, {
      address: token.address,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [CONFIG.AMM_ADDRESS, amount],
    });
    setStep(`Approve ${sym} terkirim, nunggu…`);
    await waitForSuccess(hash);
    log(`Approve ${sym} sukses.`);
  }

  async function doSwap() {
    if (!guard()) return;
    if (!amountIn || Number(amountIn) <= 0) return alert("Isi jumlah swap dulu.");
    if (decA == null || decB == null) return alert("Data token belum siap. Coba lagi.");
    if (route && route.poolPath.length > 1) {
      return alert("Rute multi-hop baru berupa simulasi. Router contract belum tersedia untuk mengeksekusinya.");
    }
    const inSym = swapDir === "AtoB" ? symA : symB;
    const outSym = swapDir === "AtoB" ? symB : symA;
    const inDec = swapDir === "AtoB" ? decA : decB;
    const outDec = swapDir === "AtoB" ? decB : decA;
    const rIn = swapDir === "AtoB" ? reserveA : reserveB;
    const rOut = swapDir === "AtoB" ? reserveB : reserveA;
    const token = swapDir === "AtoB" ? tokenA : tokenB;
    const setStep = (t: string) => setBusy({ key: "swap", text: t });
    setStep("...");
    try {
      const amount = parseUnits(amountIn, inDec);
      const balance = swapDir === "AtoB" ? balA : balB;
      if (balance != null && amount > balance) throw new Error(`Saldo ${inSym} tidak cukup.`);
      await ensureAllowance(token, amount, inSym, setStep);
      setStep("Konfirmasi swap di MetaMask");
      log("Kirim swap... konfirmasi di wallet");
      const hash = await writeContract(wagmiConfig, {
        address: CONFIG.AMM_ADDRESS,
        abi: AMM_ABI,
        functionName: swapDir === "AtoB" ? "swapAforB" : "swapBforA",
        args: [amount],
      });
      setStep("Menukar… (nunggu blok)");
      await waitForSuccess(hash);
      const outRaw = getAmountOut(amount, rIn, rOut, totalFeeBps);
      const amtIn = Number(amountIn);
      const amtOut = Number(formatUnits(outRaw, outDec));
      log("Swap sukses!");
      pushHistory({
        type: "swap", hash, ts: Date.now(),
        aLogo: swapDir === "AtoB" ? CONFIG.TOKEN_A.logo : CONFIG.TOKEN_B.logo,
        aAmt: fmtNum(amtIn), aSym: inSym,
        bLogo: swapDir === "AtoB" ? CONFIG.TOKEN_B.logo : CONFIG.TOKEN_A.logo,
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
    if (decA == null || decB == null) return alert("Data token belum siap. Coba lagi.");
    const setStep = (t: string) => setBusy({ key: "add", text: t });
    setStep("...");
    try {
      const amtA = parseUnits(addA, decA);
      const amtB = parseUnits(addB, decB);
      if (balA != null && amtA > balA) throw new Error(`Saldo ${symA} tidak cukup.`);
      if (balB != null && amtB > balB) throw new Error(`Saldo ${symB} tidak cukup.`);
      await ensureAllowance(tokenA, amtA, symA, setStep);
      await ensureAllowance(tokenB, amtB, symB, setStep);
      setStep("Konfirmasi tambah di MetaMask");
      log("Kirim addLiquidity...");
      const hash = await writeContract(wagmiConfig, {
        address: CONFIG.AMM_ADDRESS, abi: AMM_ABI,
        functionName: "addLiquidity", args: [amtA, amtB],
      });
      setStep("Menambah… (nunggu blok)");
      await waitForSuccess(hash);
      log("Tambah likuiditas sukses!");
      pushHistory({
        type: "add", hash, ts: Date.now(),
        aLogo: CONFIG.TOKEN_A.logo, aAmt: fmtNum(Number(addA)), aSym: symA,
        bLogo: CONFIG.TOKEN_B.logo, bAmt: fmtNum(Number(addB)), bSym: symB,
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
    const setStep = (t: string) => setBusy({ key: "remove", text: t });
    setStep("Konfirmasi tarik di MetaMask");
    try {
      const shareAmount = parseUnits(removeShares, 18);
      if (myShares != null && shareAmount > myShares) throw new Error("Jumlah share melebihi kepemilikanmu.");
      log("Kirim removeLiquidity...");
      const hash = await writeContract(wagmiConfig, {
        address: CONFIG.AMM_ADDRESS, abi: AMM_ABI,
        functionName: "removeLiquidity", args: [shareAmount],
      });
      setStep("Menarik… (nunggu blok)");
      await waitForSuccess(hash);
      log("Tarik likuiditas sukses!");
      pushHistory({
        type: "remove", hash, ts: Date.now(),
        aLogo: CONFIG.TOKEN_A.logo, aAmt: "", aSym: symA,
        bLogo: CONFIG.TOKEN_B.logo, bAmt: "", bSym: symB,
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
  const fromLogo = swapDir === "AtoB" ? CONFIG.TOKEN_A.logo : CONFIG.TOKEN_B.logo;
  const toLogo = swapDir === "AtoB" ? CONFIG.TOKEN_B.logo : CONFIG.TOKEN_A.logo;

  const multiHopRoute = route != null && route.poolPath.length > 1;
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
          <Glass className="pill tabs" inner="tabs-row">
            <button className={`tab ${tab === "swap" ? "tab--active" : ""}`} onClick={() => setTab("swap")}>Swap</button>
            <button className={`tab ${tab === "liquidity" ? "tab--active" : ""}`} onClick={() => setTab("liquidity")}>Liquidity</button>
          </Glass>

          <PriceChart marketPrice={marketPrice} baseSymbol={symA} quoteSymbol={symB} />

          <Glass className="card main">
            {tab === "swap" ? (
              <div className="view">
                <div className="box">
                  <div className="box-top"><span className="box-label">Kamu bayar</span></div>
                  <div className="box-mid">
                    <input type="text" inputMode="decimal" placeholder="0.0" value={amountIn} onChange={(e) => setAmountIn(e.target.value)} />
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

                <RouteLabel route={route} tokenA={symA} tokenB={symB} />

                <div className="actions">
                  <button className="act act--primary" disabled={!ready || busy?.key === "swap" || multiHopRoute} onClick={doSwap}>
                    {busy?.key === "swap" ? <><span className="spinner" />{busy.text}</> : actLabel || (multiHopRoute ? "Multi-hop belum tersedia" : "Swap")}
                  </button>
                </div>
              </div>
            ) : (
              <div className="view">
                <div className="subtabs">
                  <button className={`subtab ${liqSub === "add" ? "subtab--active" : ""}`} onClick={() => setLiqSub("add")}>Tambah</button>
                  <button className={`subtab ${liqSub === "remove" ? "subtab--active" : ""}`} onClick={() => setLiqSub("remove")}>Tarik</button>
                </div>

                {liqSub === "add" ? (
                  <div className="view">
                    <div className="box">
                      <div className="box-top"><span className="box-label">Setor</span></div>
                      <div className="box-mid">
                        <input type="text" inputMode="decimal" placeholder="0.0" value={addA} onChange={(e) => onAddA(e.target.value)} />
                        <span className="token-chip"><img className="token-logo" src={CONFIG.TOKEN_A.logo} alt="" />{symA}</span>
                      </div>
                    </div>
                    <div className="flip flip--plus">+</div>
                    <div className="box">
                      <div className="box-top"><span className="box-label">Setor</span></div>
                      <div className="box-mid">
                        <input type="text" inputMode="decimal" placeholder="0.0" value={addB} onChange={(e) => onAddB(e.target.value)} />
                        <span className="token-chip"><img className="token-logo" src={CONFIG.TOKEN_B.logo} alt="" />{symB}</span>
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
                        <input type="text" inputMode="decimal" placeholder="0.0" value={removeShares} onChange={(e) => setRemoveShares(e.target.value)} />
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
            <Row k="Jaringan" v={!isConnected ? "-" : chainOk ? "Sepolia" : `chainId ${chainId} (bukan Sepolia)`} />
            <div className="hr" />
            <Row k={<>Saldo <b>{symA}</b></>} v={fmt(balA, decA)} />
            <Row k={<>Saldo <b>{symB}</b></>} v={fmt(balB, decB)} />
            <div className="hr" />
            <Row k={<>Pool <b>{symA}</b></>} v={fmt(reserveA, decA)} />
            <Row k={<>Pool <b>{symB}</b></>} v={fmt(reserveB, decB)} />
            <Row k="Share kamu / total" v={`${fmt(myShares, 18)} / ${fmt(totalShares, 18)}`} />
          </Glass>
        </div>
      </div>

      {/* ===== LOG + HISTORY ===== */}
      <Glass className="card">
        <div className="subtabs logtabs">
          <button className={`subtab ${logTab === "log" ? "subtab--active" : ""}`} onClick={() => setLogTab("log")}>Log</button>
          <button className={`subtab ${logTab === "history" ? "subtab--active" : ""}`} onClick={() => setLogTab("history")}>History</button>
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
    <section className={`glass ${className}`}>
      <span className="glass-filter" /><span className="glass-overlay" /><span className="glass-specular" />
      <div className={`glass-content ${inner}`}>{children}</div>
    </section>
  );
}
function Row({ k, v }: { k: ReactNode; v: ReactNode }) {
  return (
    <div className="row"><span className="k">{k}</span><span className="v mono">{v}</span></div>
  );
}
function HistRow({ h }: { h: HistoryEntry }) {
  const short = h.hash ? h.hash.slice(0, 6) + "…" + h.hash.slice(-4) : "";
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
function trim(s: string) {
  if (!/^\d+(?:\.\d+)?$/.test(s)) return "";
  const [whole, fraction = ""] = s.split(".");
  const shortened = fraction.slice(0, 6).replace(/0+$/, "");
  return shortened ? `${whole}.${shortened}` : whole;
}
function short(e: unknown) {
  if (e && typeof e === "object") {
    const error = e as { shortMessage?: string; message?: string };
    return error.shortMessage || error.message || String(e);
  }
  return String(e);
}

function RouteLabel({ route, tokenA, tokenB }: { route: ReturnType<typeof findBestRoute>; tokenA: string; tokenB: string }) {
  const symbols = new Map([
    [CONFIG.TOKEN_A.address.toLowerCase(), tokenA],
    [CONFIG.TOKEN_B.address.toLowerCase(), tokenB],
  ]);
  const displayRoute = route?.tokenPath.map((token) => symbols.get(token.toLowerCase()) ?? token).join("  >  ");
  return (
    <p className="route-label">
      <span>Routing:</span> {displayRoute ?? "Masukkan jumlah untuk mencari rute terbaik"}
      {route && route.poolPath.length > 1 ? <em> · multi-hop simulasi</em> : null}
    </p>
  );
}
