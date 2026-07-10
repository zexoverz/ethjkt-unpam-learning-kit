import { useMemo, useState, useEffect, useRef, type ReactNode } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useChainId, useReadContracts } from "wagmi";
import { readContract, writeContract, waitForTransactionReceipt } from "@wagmi/core";
import { formatUnits, parseUnits } from "viem";

import { CONFIG } from "../config";
import { ERC20_ABI, AMM_ABI } from "./abi";
import { wagmiConfig } from "./wagmi";

const SEPOLIA = CONFIG.SEPOLIA_CHAIN_ID;
const tokenA = { address: CONFIG.TOKEN_A.address as `0x${string}`, abi: ERC20_ABI };
const tokenB = { address: CONFIG.TOKEN_B.address as `0x${string}`, abi: ERC20_ABI };
const amm = { address: CONFIG.AMM_ADDRESS as `0x${string}`, abi: AMM_ABI };
const HKEY = "ks_hist_v2_" + String(CONFIG.AMM_ADDRESS).toLowerCase();

// ---------- helpers ----------
function fmt(raw: any, dec: any) {
  if (raw == null || dec == null) return "-";
  return Number(formatUnits(raw, dec)).toLocaleString("id-ID", { maximumFractionDigits: 2 });
}
function fmtNum(x: any) {
  return Number(x).toLocaleString("id-ID", { maximumFractionDigits: 4 });
}
// rumus x*y=k + fee 0.3% (sama persis dengan contract getAmountOut)
function getAmountOut(amountIn: any, reserveIn: any, reserveOut: any) {
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

// Generate OHLC mock candles
function generateMockCandles(basePrice: any, count: any, intervalMs: any) {
  const list = [];
  let currentPrice = basePrice || 1.0;
  const now = Date.now();
  for (let i = count - 1; i >= 0; i--) {
    const volFactor = 0.5 + Math.random();
    const open = currentPrice + (Math.random() - 0.49) * (currentPrice * 0.015);
    const close = open + (Math.random() - 0.5) * (currentPrice * 0.012);
    const high = Math.max(open, close) + Math.random() * (currentPrice * 0.008);
    const low = Math.min(open, close) - Math.random() * (currentPrice * 0.008);
    const volume = Math.floor((100 + Math.random() * 900) * volFactor);
    const time = now - i * intervalMs;
    list.push({ time, open, high, low, close, volume });
    currentPrice = close;
  }
  return list;
}

// Binance-Style Candlestick & Volume Chart
// Order Book Component (Left Panel)
function OrderBook({ currentPrice, asks, bids, symA, symB }: any) {
  const maxTotal = Math.max(
    asks.length ? asks[asks.length - 1].total : 1,
    bids.length ? bids[bids.length - 1].total : 1
  );
  return (
    <aside className="col col-left">
      <div className="order-book-header">
        <div className="order-book-title">Buku Order</div>
        <div className="order-book-price-row">
          <span className={`order-book-live ${asks.length && bids.length && asks[0].price > bids[0].price ? "up" : "down"}`}>
            {currentPrice.toFixed(4)}
          </span>
        </div>
      </div>
      <div className="order-book-tbl-headers">
        <span style={{ width: "35%", textAlign: "left" }}>Harga({symB})</span>
        <span style={{ width: "35%", textAlign: "right" }}>Jumlah({symA})</span>
        <span style={{ width: "30%", textAlign: "right" }}>Total</span>
      </div>
      
      {/* Asks (Sells) */}
      <div className="order-book-list asks">
        {asks.map((row: any, i: any) => (
          <div key={i} className="ob-row">
            <div className="ob-depth-bar" style={{ width: `${(row.total / maxTotal) * 100}%` }}></div>
            <span className="ob-price" style={{ width: "35%", textAlign: "left", zIndex: 5 }}>{row.price.toFixed(4)}</span>
            <span className="ob-val" style={{ width: "35%", textAlign: "right", zIndex: 5 }}>{row.amount.toFixed(4)}</span>
            <span className="ob-total" style={{ width: "30%", textAlign: "right", zIndex: 5 }}>{row.total.toFixed(2)}</span>
          </div>
        ))}
      </div>
      
      {/* Spread Bar */}
      <div className="ob-spread-bar">
        <span className="ob-spread-label">Spread</span>
        <span className="ob-spread-price up">
          {asks.length && bids.length ? Math.abs(asks[asks.length - 1].price - bids[0].price).toFixed(4) : "0.0000"}
        </span>
      </div>

      {/* Bids (Buys) */}
      <div className="order-book-list bids">
        {bids.map((row: any, i: any) => (
          <div key={i} className="ob-row">
            <div className="ob-depth-bar" style={{ width: `${(row.total / maxTotal) * 100}%` }}></div>
            <span className="ob-price" style={{ width: "35%", textAlign: "left", zIndex: 5 }}>{row.price.toFixed(4)}</span>
            <span className="ob-val" style={{ width: "35%", textAlign: "right", zIndex: 5 }}>{row.amount.toFixed(4)}</span>
            <span className="ob-total" style={{ width: "30%", textAlign: "right", zIndex: 5 }}>{row.total.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}

// Market Trades Component (Right Panel Bottom)
function MarketTrades({ currentPrice, history, symA, symB }: any) {
  const [mockTrades, setMockTrades] = useState<any[]>([]);

  useEffect(() => {
    if (!currentPrice) return;
    const list = [];
    const now = Date.now();
    let price = currentPrice;
    for (let i = 0; i < 10; i++) {
      const isBuy = Math.random() > 0.5;
      price = price * (1 + (Math.random() - 0.5) * 0.0008);
      const amt = 0.1 + Math.random() * 5;
      const time = new Date(now - i * 45000).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      list.push({ price, amt, time, isBuy });
    }
    setMockTrades(list);
  }, [currentPrice]);

  useEffect(() => {
    if (history.length > 0) {
      const last = history[0];
      if (last.type === "swap") {
        const isBuy = last.bSym === symB;
        const amt = Number(last.aAmt);
        const time = new Date(last.ts).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        setMockTrades((prev) => [{ price: currentPrice, amt, time, isBuy }, ...prev].slice(0, 12));
      }
    }
  }, [history, currentPrice, symB]);

  return (
    <div className="market-trades-panel">
      <div className="market-trades-header">Transaksi Pasar</div>
      <div className="market-trades-tbl-headers">
        <span style={{ width: "35%", textAlign: "left" }}>Harga({symB})</span>
        <span style={{ width: "35%", textAlign: "right" }}>Jumlah({symA})</span>
        <span style={{ width: "30%", textAlign: "right" }}>Waktu</span>
      </div>
      <div className="market-trades-list">
        {mockTrades.map((t: any, i: any) => (
          <div key={i} className={`mt-row ${t.isBuy ? "buy" : "sell"}`}>
            <span className="mt-price" style={{ width: "35%", textAlign: "left" }}>{t.price.toFixed(4)}</span>
            <span className="mt-val" style={{ width: "35%", textAlign: "right" }}>{t.amt.toFixed(4)}</span>
            <span className="mt-time" style={{ width: "30%", textAlign: "right" }}>{t.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Swap Routing Component
function SwapRoute({ amountIn, previewOut, swapDir, symA, symB, fromLogo, toLogo }: any) {
  if (!amountIn || Number(amountIn) <= 0) return null;
  const isAtoB = swapDir === "AtoB";
  return (
    <div className="swap-route">
      <div className="route-title">Rute Transaksi</div>
      <div className="route-nodes">
        <div className="route-node">
          <img className="route-logo" src={fromLogo} alt="" />
          <span>{amountIn} {isAtoB ? symA : symB}</span>
          <span className="node-sub">Dompet</span>
        </div>
        <div className="route-arrow">
          <span className="arrow-line"></span>
          <span className="arrow-pulse"></span>
        </div>
        <div className="route-node node-amm">
          <div className="node-logo-pair">
            <img className="pair-logo logo-a" src={CONFIG.TOKEN_A.logo} alt="" />
            <img className="pair-logo logo-b" src={CONFIG.TOKEN_B.logo} alt="" />
          </div>
          <span>{symA}/{symB}</span>
          <span className="node-sub">AMM Pool</span>
        </div>
        <div className="route-arrow">
          <span className="arrow-line"></span>
          <span className="arrow-pulse"></span>
        </div>
        <div className="route-node">
          <img className="route-logo" src={toLogo} alt="" />
          <span>{previewOut} {isAtoB ? symB : symA}</span>
          <span className="node-sub">Dompet</span>
        </div>
      </div>
    </div>
  );
}

// Helper to calculate Moving Averages
function calculateMA(candles: any[], period: number) {
  const ma = [];
  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) {
      ma.push(null);
      continue;
    }
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += candles[i - j].close;
    }
    ma.push(sum / period);
  }
  return ma;
}

// Overridden BinanceChart with MA Indicator Support
function BinanceChart({ currentPrice, symA, symB }: any) {
  const [timeframe, setTimeframe] = useState("1m");
  const [chartType, setChartType] = useState("candle");
  const [candles, setCandles] = useState<any[]>([]);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement | null>(null);

  const intervalMs = useMemo(() => {
    switch (timeframe) {
      case "5m": return 5 * 60 * 1000;
      case "15m": return 15 * 60 * 1000;
      case "1H": return 60 * 60 * 1000;
      default: return 60 * 1000;
    }
  }, [timeframe]);

  useEffect(() => {
    if (currentPrice) {
      setCandles(generateMockCandles(currentPrice, 30, intervalMs));
    }
  }, [currentPrice, timeframe, intervalMs]);

  useEffect(() => {
    if (!currentPrice || candles.length === 0) return;
    setCandles((prev) => {
      const next = [...prev];
      const last = next[next.length - 1];
      if (!last) return prev;
      const now = Date.now();
      if (now - last.time >= intervalMs) {
        next.push({
          time: now,
          open: last.close,
          high: Math.max(last.close, currentPrice),
          low: Math.min(last.close, currentPrice),
          close: currentPrice,
          volume: Math.floor(50 + Math.random() * 150),
        });
        if (next.length > 40) next.shift();
      } else {
        last.high = Math.max(last.high, currentPrice);
        last.low = Math.min(last.low, currentPrice);
        last.close = currentPrice;
        last.volume += 5;
      }
      return next;
    });
  }, [currentPrice, intervalMs]);

  function handleMouseMove(e: any) {
    if (!svgRef.current || candles.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    const padding = 30;
    const chartWidth = rect.width - padding * 2;
    const percentX = (x - padding) / chartWidth;
    let idx = Math.round(percentX * (candles.length - 1));
    if (idx < 0) idx = 0;
    if (idx >= candles.length) idx = candles.length - 1;
    setHoverIdx(idx);
  }

  function handleMouseLeave() {
    setHoverIdx(null);
  }

  const activeCandle = hoverIdx !== null ? candles[hoverIdx] : candles[candles.length - 1];

  const width = 560;
  const height = 220;
  const padding = 30;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const priceHeight = chartHeight * 0.7;
  const volHeight = chartHeight * 0.25;

  const prices = candles.flatMap(c => [c.high, c.low]);
  const minPrice = prices.length ? Math.min(...prices) * 0.998 : 0.99;
  const maxPrice = prices.length ? Math.max(...prices) * 1.002 : 1.01;
  const priceRange = maxPrice - minPrice || 0.01;

  const volumes = candles.map(c => c.volume);
  const maxVol = volumes.length ? Math.max(...volumes) || 1 : 1;

  function getX(i: number) {
    return padding + (i / (candles.length - 1)) * chartWidth;
  }
  function getY(price: number) {
    return padding + (1 - (price - minPrice) / priceRange) * priceHeight;
  }
  function getVolY(vol: number) {
    return height - padding - (vol / maxVol) * volHeight;
  }

  const linePath = useMemo(() => {
    if (candles.length === 0) return "";
    return candles.map((c, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(c.close)}`).join(" ");
  }, [candles, minPrice, maxPrice]);

  const areaPath = useMemo(() => {
    if (candles.length === 0) return "";
    return `${linePath} L ${getX(candles.length - 1)} ${height - padding - volHeight} L ${getX(0)} ${height - padding - volHeight} Z`;
  }, [candles, linePath]);

  // Compute MA 7 & 25
  const ma7 = useMemo(() => calculateMA(candles, 7), [candles]);
  const ma25 = useMemo(() => calculateMA(candles, 25), [candles]);

  const ma7Path = useMemo(() => {
    return ma7.map((val: any, i: any) => {
      if (val === null) return "";
      return `${i === 7 - 1 ? "M" : "L"} ${getX(i)} ${getY(val)}`;
    }).join(" ");
  }, [ma7, minPrice, maxPrice]);

  const ma25Path = useMemo(() => {
    return ma25.map((val: any, i: any) => {
      if (val === null) return "";
      return `${i === 25 - 1 ? "M" : "L"} ${getX(i)} ${getY(val)}`;
    }).join(" ");
  }, [ma25, minPrice, maxPrice]);

  const firstPrice = candles[0]?.open || 1.0;
  const curPriceVal = candles[candles.length - 1]?.close || currentPrice || 1.0;
  const pctChange = ((curPriceVal - firstPrice) / firstPrice) * 100;
  const high24h = candles.length ? Math.max(...candles.map((c: any) => c.high)) : curPriceVal;
  const low24h = candles.length ? Math.min(...candles.map((c: any) => c.low)) : curPriceVal;
  const vol24h = candles.length ? candles.reduce((sum: any, c: any) => sum + c.volume, 0) : 0;

  const currentMA7 = candles.length && ma7[candles.length - 1] ? ma7[candles.length - 1] : curPriceVal;
  const currentMA25 = candles.length && ma25[candles.length - 1] ? ma25[candles.length - 1] : curPriceVal;

  return (
    <Glass className="card price-chart" inner="col-inner">
      <div className="chart-header">
        <div className="chart-title-area">
          <div className="chart-title">{symA}/{symB}</div>
        </div>
        <div className="chart-price-display">
          <span className="chart-live-price">{curPriceVal.toFixed(4)}</span>
          <span className={`chart-price-change ${pctChange >= 0 ? "up" : "down"}`}>
            {pctChange >= 0 ? "+" : ""}{pctChange.toFixed(2)}%
          </span>
        </div>
        <div className="chart-stats-hud">
          <span className="chart-stat-item">24h High: <b>{high24h.toFixed(4)}</b></span>
          <span className="chart-stat-item">24h Low: <b>{low24h.toFixed(4)}</b></span>
          <span className="chart-stat-item">24h Vol: <b>{vol24h.toLocaleString("id-ID")}</b></span>
        </div>
      </div>

      <div className="chart-controls">
        <div className="chart-tf-buttons">
          {["1m", "5m", "15m", "1H"].map((tf: any) => (
            <button key={tf} className={`chart-btn ${timeframe === tf ? "chart-btn--active" : ""}`} onClick={() => setTimeframe(tf)}>
              {tf}
            </button>
          ))}
        </div>
        <div className="chart-type-buttons">
          <button className={`chart-btn ${chartType === "candle" ? "chart-btn--active" : ""}`} onClick={() => setChartType("candle")}>
            Candles
          </button>
          <button className={`chart-btn ${chartType === "line" ? "chart-btn--active" : ""}`} onClick={() => setChartType("line")}>
            Line
          </button>
        </div>
      </div>

      {activeCandle && (
        <div className="chart-tooltip-hud">
          <span>O: <b className={activeCandle.close >= activeCandle.open ? "text-up" : "text-down"}>{activeCandle.open.toFixed(4)}</b></span>
          <span>H: <b className="text-up">{activeCandle.high.toFixed(4)}</b></span>
          <span>L: <b className="text-down">{activeCandle.low.toFixed(4)}</b></span>
          <span>C: <b className={activeCandle.close >= activeCandle.open ? "text-up" : "text-down"}>{activeCandle.close.toFixed(4)}</b></span>
          <span>Vol: <b>{activeCandle.volume.toFixed(0)}</b></span>
        </div>
      )}

      <div className="chart-wrapper">
        {/* MA legends displayed inside chart */}
        {chartType === "candle" && (
          <div className="ma-legend">
            <span className="ma-7">MA(7): {currentMA7.toFixed(4)}</span>
            <span className="ma-25">MA(25): {currentMA25.toFixed(4)}</span>
          </div>
        )}

        <svg ref={svgRef} className="chart-svg" viewBox={`0 0 ${width} ${height}`} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d4af37" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#d4af37" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map((p: any, i: any) => (
            <line key={i} x1={padding} y1={padding + p * priceHeight} x2={width - padding} y2={padding + p * priceHeight} stroke="rgba(255,255,255,0.03)" strokeDasharray="3,3" />
          ))}

          {candles.map((c: any, i: any) => {
            const isUp = c.close >= c.open;
            const strokeColor = isUp ? "var(--ok)" : "var(--warn)";
            const fillColor = isUp ? "var(--ok)" : "var(--warn)";
            const x = getX(i);

            return (
              <g key={i}>
                <rect x={x - 1} y={getVolY(c.volume)} width={2} height={height - padding - getVolY(c.volume)} fill={fillColor} opacity={0.2} />

                {chartType === "candle" ? (
                  <g>
                    <line x1={x} y1={getY(c.high)} x2={x} y2={getY(c.low)} stroke={strokeColor} strokeWidth={0.8} />
                    <rect x={x - 2} y={getY(Math.max(c.open, c.close))} width={4} height={Math.max(1, Math.abs(getY(c.close) - getY(c.open)))} fill={fillColor} />
                  </g>
                ) : null}
              </g>
            );
          })}

          {/* Render MA Lines */}
          {chartType === "candle" && ma7Path && (
            <path d={ma7Path} fill="none" stroke="#f2ca50" strokeWidth={1} />
          )}
          {chartType === "candle" && ma25Path && (
            <path d={ma25Path} fill="none" stroke="#e57373" strokeWidth={1} />
          )}

          {chartType === "line" && linePath && (
            <g>
              <path d={areaPath} fill="url(#areaGradient)" />
              <path d={linePath} fill="none" stroke="var(--primary-container)" strokeWidth={1.5} />
              <circle cx={getX(candles.length - 1)} cy={getY(curPriceVal)} r={3} fill="var(--primary-container)" />
              <circle cx={getX(candles.length - 1)} cy={getY(curPriceVal)} r={8} fill="none" stroke="var(--primary-container)" opacity={0.5}>
                <animate attributeName="r" values="3;8;3" dur="2.5s" repeatCount="indefinite" />
              </circle>
            </g>
          )}

          {hoverIdx !== null && (
            <g>
              <line x1={getX(hoverIdx)} y1={padding} x2={getX(hoverIdx)} y2={height - padding} stroke="rgba(255,255,255,0.12)" strokeDasharray="2,2" />
              <line x1={padding} y1={mousePos.y} x2={width - padding} y2={mousePos.y} stroke="rgba(255,255,255,0.12)" strokeDasharray="2,2" />
              <circle cx={getX(hoverIdx)} cy={getY(activeCandle.close)} r={2.5} fill="#fff" />
            </g>
          )}
        </svg>
      </div>
    </Glass>
  );
}

export default function App() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const chainOk = chainId === SEPOLIA;

  const [tab, setTab] = useState("swap"); // swap | liquidity
  const [liqSub, setLiqSub] = useState("add"); // add | remove
  const [logTab, setLogTab] = useState("history"); // log | history
  const [swapDir, setSwapDir] = useState("AtoB");
  const [amountIn, setAmountIn] = useState("");
  const [addA, setAddA] = useState("");
  const [addB, setAddB] = useState("");
  const [removeShares, setRemoveShares] = useState("");
  const [busy, setBusy] = useState<any>(null); // { key, text }
  const [logLines, setLogLines] = useState<string[]>([]);
  const [history, setHistory] = useState<any[]>(loadHistory);

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
      { ...tokenA, functionName: "balanceOf", args: [address as `0x${string}`] },
      { ...tokenB, functionName: "balanceOf", args: [address as `0x${string}`] },
      { ...amm, functionName: "shares", args: [address as `0x${string}`] },
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

  const currentPrice = useMemo(() => {
    if (reserveA > 0n && reserveB > 0n && decA != null && decB != null) {
      return Number(formatUnits(reserveB, Number(decB))) / Number(formatUnits(reserveA, Number(decA)));
    }
    return 1.0;
  }, [reserveA, reserveB, decA, decB]);

  const ready = isConnected && chainOk && decA != null && decB != null;
  const hasPool = reserveA > 0n && reserveB > 0n;

  // ---------- dynamic simulated orderbook ----------
  const [orderBook, setOrderBook] = useState<{ asks: any[]; bids: any[] }>({ asks: [], bids: [] });
  
  useEffect(() => {
    if (!currentPrice) return;
    const asks = [];
    const bids = [];
    let accumAsk = 0;
    let accumBid = 0;
    for (let i = 6; i >= 1; i--) {
      const askPrice = currentPrice * (1 + i * 0.0006 + (Math.random() - 0.5) * 0.0001);
      const askAmt = 0.1 + Math.random() * 4.0;
      accumAsk += askAmt;
      asks.push({ price: askPrice, amount: askAmt, total: accumAsk });
    }
    for (let i = 1; i <= 6; i++) {
      const bidPrice = currentPrice * (1 - i * 0.0006 - (Math.random() - 0.5) * 0.0001);
      const bidAmt = 0.1 + Math.random() * 4.0;
      accumBid += bidAmt;
      bids.push({ price: bidPrice, amount: bidAmt, total: accumBid });
    }
    setOrderBook({ asks: asks.reverse(), bids });
  }, [currentPrice]);

  function refresh() {
    pool.refetch();
    user.refetch();
  }
  function log(msg: any) {
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
    setLogTab("history");
  }

  // ---------- swap preview ----------
  const previewOut = useMemo(() => {
    if (!amountIn || Number(amountIn) <= 0 || decA == null || decB == null) return "";
    try {
      if (swapDir === "AtoB") {
        const out = getAmountOut(parseUnits(amountIn, decA ?? 18), reserveA, reserveB);
        return fmt(out, decB);
      }
      const out = getAmountOut(parseUnits(amountIn, decB ?? 18), reserveB, reserveA);
      return fmt(out, decA);
    } catch {
      return "";
    }
  }, [amountIn, swapDir, reserveA, reserveB, decA, decB]);

  // ---------- liquidity auto-pair ----------
  function onAddA(v: any) {
    setAddA(v);
    if (hasPool && v && Number(v) > 0 && decA != null && decB != null) {
      try {
        const amtA = parseUnits(v, decA ?? 18);
        const amtB = (amtA * reserveB) / reserveA;
        setAddB(trim(formatUnits(amtB, decB)));
      } catch {}
    } else if (!v) setAddB("");
  }
  function onAddB(v: any) {
    setAddB(v);
    if (hasPool && v && Number(v) > 0 && decA != null && decB != null) {
      try {
        const amtB = parseUnits(v, decB ?? 18);
        const amtA = (amtB * reserveA) / reserveB;
        setAddA(trim(formatUnits(amtA, decA)));
      } catch {}
    } else if (!v) setAddA("");
  }

  // ---------- write flows ----------
  async function ensureAllowance(token: any, amount: any, sym: any, setStep: any) {
    const cur = await readContract(wagmiConfig, {
      address: token.address,
      abi: ERC20_ABI,
      functionName: "allowance",
      args: [address as `0x${string}`, CONFIG.AMM_ADDRESS as `0x${string}`],
    });
    if (cur >= amount) return;
    setStep(`Approve ${sym} — cek MetaMask`);
    log(`Approve ${sym}... konfirmasi di wallet`);
    const hash = await writeContract(wagmiConfig, {
      address: token.address,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [CONFIG.AMM_ADDRESS as `0x${string}`, amount],
    });
    setStep(`Approve ${sym} terkirim, nunggu…`);
    await waitForTransactionReceipt(wagmiConfig, { hash });
    log(`Approve ${sym} sukses.`);
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
    const amount = parseUnits(amountIn, inDec ?? 18);
    const setStep = (t: any) => setBusy({ key: "swap", text: t });
    setStep("...");
    try {
      await ensureAllowance(token, amount, inSym, setStep);
      setStep("Konfirmasi swap di MetaMask");
      log("Kirim swap... konfirmasi di wallet");
      const hash = await writeContract(wagmiConfig, {
        address: CONFIG.AMM_ADDRESS as `0x${string}`,
        abi: AMM_ABI,
        functionName: swapDir === "AtoB" ? "swapAforB" : "swapBforA",
        args: [amount],
      });
      setStep("Menukar… (nunggu blok)");
      await waitForTransactionReceipt(wagmiConfig, { hash });
      const outRaw = getAmountOut(amount, rIn, rOut);
      const amtIn = Number(amountIn);
      const amtOut = Number(formatUnits(outRaw, outDec ?? 18));
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
    const amtA = parseUnits(addA, decA ?? 18);
    const amtB = parseUnits(addB, decB ?? 18);
    const setStep = (t: any) => setBusy({ key: "add", text: t });
    setStep("...");
    try {
      await ensureAllowance(tokenA, amtA, symA, setStep);
      await ensureAllowance(tokenB, amtB, symB, setStep);
      setStep("Konfirmasi tambah di MetaMask");
      log("Kirim addLiquidity...");
      const hash = await writeContract(wagmiConfig, {
        address: CONFIG.AMM_ADDRESS as `0x${string}`, abi: AMM_ABI,
        functionName: "addLiquidity", args: [amtA, amtB],
      });
      setStep("Menambah… (nunggu blok)");
      await waitForTransactionReceipt(wagmiConfig, { hash });
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
    const setStep = (t: any) => setBusy({ key: "remove", text: t });
    setStep("Konfirmasi tarik di MetaMask");
    try {
      log("Kirim removeLiquidity...");
      const hash = await writeContract(wagmiConfig, {
        address: CONFIG.AMM_ADDRESS as `0x${string}`, abi: AMM_ABI,
        functionName: "removeLiquidity", args: [parseUnits(removeShares, 18)],
      });
      setStep("Menarik… (nunggu blok)");
      await waitForTransactionReceipt(wagmiConfig, { hash });
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

  const actLabel = !isConnected ? "Connect dulu" : !chainOk ? "Jaringan salah" : null;

  return (
    <div className="page">
      <header className="head">
        <div className="brand">
          <img className="brand-logo" src={CONFIG.BRAND_LOGO} alt="ETHJKT" />
          <div>
            <p className="eyebrow">ETHJKT x UNPAM</p>
            <h1>KampusSwap Pro</h1>
          </div>
        </div>
        
        {/* Navigation links matching Binance style */}
        <nav style={{ display: "flex", gap: "1.5rem" }} className="hidden md:flex">
          <a style={{ color: "var(--primary-container)", textDecoration: "none", fontWeight: 700, fontSize: "0.82rem" }} href="#">Trade</a>
          <a style={{ color: "var(--on-surface-variant)", textDecoration: "none", fontSize: "0.82rem" }} href="#" onClick={(e) => { e.preventDefault(); alert("Fitur pasar lainnya segera hadir."); }}>Markets</a>
          <a style={{ color: "var(--on-surface-variant)", textDecoration: "none", fontSize: "0.82rem" }} href="#" onClick={(e) => { e.preventDefault(); alert("Fitur earn segera hadir."); }}>Earn</a>
        </nav>
        
        <ConnectButton.Custom>
          {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
            const ready = mounted;
            const connected = ready && account && chain;
            return (
              <div
                {...(!ready && {
                  'aria-hidden': true,
                  'style': {
                    opacity: 0,
                    pointerEvents: 'none',
                    userSelect: 'none',
                  },
                })}
              >
                {(() => {
                  if (!connected) {
                    return (
                      <button onClick={openConnectModal} type="button" className="gold-gradient">
                        Connect Wallet
                      </button>
                    );
                  }
                  if (chain.unsupported) {
                    return (
                      <button onClick={openChainModal} type="button" style={{ backgroundColor: 'var(--warn)', color: '#fff', border: 'none', padding: '0.45rem 1rem', borderRadius: '4px' }}>
                        Wrong network
                      </button>
                    );
                  }
                  return (
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button
                        onClick={openChainModal}
                        style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-container)', border: '1px solid var(--outline-variant)', borderRadius: '4px', padding: '0.45rem 1rem', color: '#fff', cursor: 'pointer', fontSize: '0.8rem' }}
                        type="button"
                      >
                        {chain.name}
                      </button>
                      <button onClick={openAccountModal} type="button" className="gold-gradient">
                        {account.displayName}
                      </button>
                    </div>
                  );
                })()}
              </div>
            );
          }}
        </ConnectButton.Custom>
      </header>

      <div className="cols">
        {/* LEFT COLUMN: Order Book */}
        <OrderBook currentPrice={currentPrice} asks={orderBook.asks} bids={orderBook.bids} symA={symA} symB={symB} />

        {/* CENTER COLUMN: Chart & Logs */}
        <main className="col col-center">
          <BinanceChart currentPrice={currentPrice} symA={symA} symB={symB} />

          <div className="logs-panel">
            <div className="subtabs logtabs">
              <button className={`subtab ${logTab === "history" ? "subtab--active" : ""}`} onClick={() => setLogTab("history")}>Riwayat Transaksi</button>
              <button className={`subtab ${logTab === "log" ? "subtab--active" : ""}`} onClick={() => setLogTab("log")}>Log Konsol</button>
            </div>
            <div className="log-content-area">
              {logTab === "log" ? (
                <pre className="log">{logLines.length ? logLines.join("\n") : "Belum ada aktivitas."}</pre>
              ) : (
                <div className="history">
                  {history.length === 0 ? (
                    <p className="hist-empty">Belum ada transaksi.</p>
                  ) : (
                    history.map((h: any, i: any) => <HistRow key={i} h={h} />)
                  )}
                </div>
              )}
            </div>
          </div>
        </main>

        {/* RIGHT COLUMN: Swap & Account Info */}
        <aside className="col col-right">
          {/* Quick Swap & Liquidity Widget */}
          <div className="quick-swap-widget">
            <div className="widget-inner-card">
              <div className="widget-tabs-row">
                <button className={`widget-tab ${tab === "swap" ? "widget-tab--active" : ""}`} onClick={() => setTab("swap")}>Swap</button>
                <button className={`widget-tab ${tab === "liquidity" ? "widget-tab--active" : ""}`} onClick={() => setTab("liquidity")}>Liquidity</button>
              </div>

              {tab === "swap" ? (
                <div className="view">
                  <div className="box">
                    <div className="box-top">
                      <span className="box-label">Kamu bayar</span>
                    </div>
                    <div className="box-mid">
                      <input type="number" min="0" placeholder="0.0" value={amountIn} onChange={(e) => setAmountIn(e.target.value)} />
                      <span className="token-chip"><img className="token-logo" src={fromLogo} alt="" />{fromSym}</span>
                    </div>
                  </div>

                  <button className="flip" title="Balik arah" onClick={() => setSwapDir(swapDir === "AtoB" ? "BtoA" : "AtoB")}>⇅</button>

                  <div className="box">
                    <div className="box-top">
                      <span className="box-label">Kamu terima (perkiraan)</span>
                    </div>
                    <div className="box-mid">
                      <input type="text" readOnly placeholder="0.0" value={previewOut} />
                      <span className="token-chip"><img className="token-logo" src={toLogo} alt="" />{toSym}</span>
                    </div>
                  </div>

                  <div className="actions">
                    <button className="act" disabled={!ready || busy?.key === "swap"} onClick={doSwap}>
                      {busy?.key === "swap" ? <><span className="spinner" />{busy.text}</> : actLabel || "Swap Now"}
                    </button>
                  </div>

                  <SwapRoute 
                    amountIn={amountIn} 
                    previewOut={previewOut} 
                    swapDir={swapDir} 
                    symA={symA} 
                    symB={symB} 
                    fromLogo={fromLogo} 
                    toLogo={toLogo} 
                  />
                </div>
              ) : (
                <div className="view">
                  <div className="widget-subtabs">
                    <button className={`widget-subtab ${liqSub === "add" ? "widget-subtab--active" : ""}`} onClick={() => setLiqSub("add")}>Tambah</button>
                    <button className={`widget-subtab ${liqSub === "remove" ? "widget-subtab--active" : ""}`} onClick={() => setLiqSub("remove")}>Tarik</button>
                  </div>

                  {liqSub === "add" ? (
                    <div className="view">
                      <div className="box">
                        <div className="box-top"><span className="box-label">Setor</span></div>
                        <div className="box-mid">
                          <input type="number" min="0" placeholder="0.0" value={addA} onChange={(e) => onAddA(e.target.value)} />
                          <span className="token-chip"><img className="token-logo" src={CONFIG.TOKEN_A.logo} alt="" />{symA}</span>
                        </div>
                      </div>
                      <div className="flip flip--plus">+</div>
                      <div className="box">
                        <div className="box-top"><span className="box-label">Setor</span></div>
                        <div className="box-mid">
                          <input type="number" min="0" placeholder="0.0" value={addB} onChange={(e) => onAddB(e.target.value)} />
                          <span className="token-chip"><img className="token-logo" src={CONFIG.TOKEN_B.logo} alt="" />{symB}</span>
                        </div>
                      </div>
                      <p className="hint">{hasPool ? "Otomatis mengikuti rasio pool." : "Penyetoran awal menentukan harga."}</p>
                      <div className="actions">
                        <button className="act" disabled={!ready || busy?.key === "add"} onClick={doAddLiquidity}>
                          {busy?.key === "add" ? <><span className="spinner" />{busy.text}</> : actLabel || "Tambah LP"}
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
                        <button className="act" disabled={!ready || busy?.key === "remove"} onClick={doRemoveLiquidity}>
                          {busy?.key === "remove" ? <><span className="spinner" />{busy.text}</> : actLabel || "Tarik LP"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Account Info Panel */}
          <div className="account-panel">
            <div className="account-row"><span className="k">Akun</span><span className="v">{address ? address.slice(0, 6) + "…" + address.slice(-4) : "belum connect"}</span></div>
            <div className="account-row"><span className="k">Saldo {symA}</span><span className="v">{fmt(balA, decA)}</span></div>
            <div className="account-row"><span className="k">Saldo {symB}</span><span className="v">{fmt(balB, decB)}</span></div>
            <div style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.06)', margin: '0.4rem 0' }} />
            <div className="account-row"><span className="k">Pool {symA}</span><span className="v">{fmt(reserveA, decA)}</span></div>
            <div className="account-row"><span className="k">Pool {symB}</span><span className="v">{fmt(reserveB, decB)}</span></div>
            <div className="account-row"><span className="k">LP Share Anda</span><span className="v">{fmt(myShares, 18)} / {fmt(totalShares, 18)}</span></div>
          </div>

          {/* Market Trades */}
          <MarketTrades currentPrice={currentPrice} history={history} symA={symA} symB={symB} />
        </aside>
      </div>

      <footer className="bottom-status-bar">
        <div className="status-connection">
          <span className="status-dot"></span>
          Sepolia Testnet Connected
        </div>
        <div className="footer-links">
          <span style={{ fontSize: "0.62rem" }}>Muhammad Faiz Rabbani - 231011402539</span>
        </div>
      </footer>
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
function HistRow({ h }: any) {
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
function trim(s: any) {
  const n = Number(s);
  if (!isFinite(n)) return "";
  return String(Math.round(n * 1e6) / 1e6);
}
function short(e: any) {
  return e?.shortMessage || e?.message || String(e);
}
