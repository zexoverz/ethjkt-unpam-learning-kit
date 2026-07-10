import { useEffect, useRef, useState, useMemo } from "react";
import { createChart, ColorType, CrosshairMode, ISeriesApi, IChartApi, CandlestickSeries, HistogramSeries } from "lightweight-charts";
import { Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";

interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TradingChartProps {
  currentPrice: number;
  pairName: string;
  reserveA: number;
  reserveB: number;
}

const TIMEFRAMES = [
  { label: "1m", value: 60 },
  { label: "5m", value: 300 },
  { label: "15m", value: 900 },
  { label: "1H", value: 3600 },
  { label: "4H", value: 14400 },
  { label: "1D", value: 86400 },
];

export default function TradingChart({ currentPrice, pairName, reserveA, reserveB }: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  
  const [timeframe, setTimeframe] = useState(300); // Default 5m
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [candles, setCandles] = useState<CandleData[]>([]);

  // Generate historical candles on mount / timeframe change based on currentPrice
  useEffect(() => {
    if (!currentPrice || currentPrice <= 0) return;
    
    const generatedCandles: CandleData[] = [];
    const now = Math.floor(Date.now() / 1000);
    const count = 100;
    
    let tempPrice = currentPrice;
    
    // Seed generator
    for (let i = count; i >= 0; i--) {
      const candleTime = now - i * timeframe;
      const rawChange = Math.random() - 0.48;
      const clampedChange = Math.max(-0.02, Math.min(0.02, rawChange));
      const change = tempPrice * 0.005 * clampedChange;
      const open = tempPrice;
      const close = tempPrice + change;
      const high = Math.max(open, close) + Math.random() * tempPrice * 0.003;
      const low = Math.min(open, close) - Math.random() * tempPrice * 0.003;
      const volume = (reserveA + reserveB) * 0.0005 * (0.3 + Math.random() * 1.7);
      
      generatedCandles.push({
        time: candleTime,
        open,
        high,
        low,
        close,
        volume,
      });
      tempPrice = close;
    }
    
    setCandles(generatedCandles);
  }, [timeframe, currentPrice === 0]); // only reset on timeframe change or when price becomes available

  // Initialize and update Lightweight Chart
  useEffect(() => {
    if (!chartContainerRef.current || candles.length === 0) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#18181B" },
        textColor: "#A1A1AA",
      },
      grid: {
        vertLines: { color: "rgba(39, 39, 42, 0.4)" },
        horzLines: { color: "rgba(39, 39, 42, 0.4)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          labelBackgroundColor: "#2563EB",
        },
        horzLine: {
          labelBackgroundColor: "#2563EB",
        },
      },
      rightPriceScale: {
        borderColor: "#27272A",
        visible: true,
      },
      timeScale: {
        borderColor: "#27272A",
        timeVisible: true,
        secondsVisible: false,
      },
    }) as any;

    chartRef.current = chart;

    // Add candlestick series
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#10B981",
      downColor: "#EF4444",
      borderVisible: false,
      wickUpColor: "#10B981",
      wickDownColor: "#EF4444",
      lastValueVisible: false, // Prevents duplicate label overlap with the price line label
    });
    candleSeriesRef.current = candlestickSeries;

    // Add volume series
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: "rgba(56, 189, 248, 0.25)",
      priceFormat: {
        type: "volume",
      },
      priceScaleId: "", // Overlay on main pane
      lastValueVisible: false, // Prevents stray volume label on price scale
    });
    volumeSeriesRef.current = volumeSeries;

    // Set scale margins for volume
    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    // Populate data
    const chartCandles = candles.map(c => ({
      time: c.time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));
    candlestickSeries.setData(chartCandles);

    const chartVolumes = candles.map(c => ({
      time: c.time,
      value: c.volume,
      color: c.close >= c.open ? "rgba(16, 185, 129, 0.25)" : "rgba(239, 68, 68, 0.25)",
    }));
    volumeSeries.setData(chartVolumes);

    // Fit content
    chart.timeScale().fitContent();

    // Resize handler
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.resize(
          chartContainerRef.current.clientWidth,
          chartContainerRef.current.clientHeight
        );
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, [candles]);

  // Handle live price updates and reserves updates progressively
  useEffect(() => {
    if (!currentPrice || currentPrice <= 0 || !candleSeriesRef.current || !volumeSeriesRef.current) return;

    setCandles(prev => {
      if (prev.length === 0) return prev;
      
      const now = Math.floor(Date.now() / 1000);
      const lastCandle = prev[prev.length - 1];
      const timeDiff = now - lastCandle.time;
      
      let updatedCandles = [...prev];

      if (timeDiff < timeframe) {
        // Update the current last candle
        const updatedLast = {
          ...lastCandle,
          close: currentPrice,
          high: Math.max(lastCandle.high, currentPrice),
          low: Math.min(lastCandle.low, currentPrice),
          volume: lastCandle.volume + (reserveA + reserveB) * 0.00001, // progressive volume accumulation
        };
        updatedCandles[updatedCandles.length - 1] = updatedLast;
        
        // Push single update to active chart series
        candleSeriesRef.current.update({
          time: updatedLast.time,
          open: updatedLast.open,
          high: updatedLast.high,
          low: updatedLast.low,
          close: updatedLast.close,
        });
        volumeSeriesRef.current.update({
          time: updatedLast.time,
          value: updatedLast.volume,
          color: updatedLast.close >= updatedLast.open ? "rgba(16, 185, 129, 0.25)" : "rgba(239, 68, 68, 0.25)",
        });
      } else {
        // Create a new candle
        const newCandle = {
          time: lastCandle.time + timeframe,
          open: lastCandle.close,
          high: Math.max(lastCandle.close, currentPrice),
          low: Math.min(lastCandle.close, currentPrice),
          close: currentPrice,
          volume: (reserveA + reserveB) * 0.00005,
        };
        updatedCandles = [...updatedCandles.slice(1), newCandle];
        
        candleSeriesRef.current.update({
          time: newCandle.time,
          open: newCandle.open,
          high: newCandle.high,
          low: newCandle.low,
          close: newCandle.close,
        });
        volumeSeriesRef.current.update({
          time: newCandle.time,
          value: newCandle.volume,
          color: newCandle.close >= newCandle.open ? "rgba(16, 185, 129, 0.25)" : "rgba(239, 68, 68, 0.25)",
        });
      }
      return updatedCandles;
    });
  }, [currentPrice, timeframe, reserveA, reserveB]);

  // Chart control actions
  const zoomIn = () => {
    (chartRef.current as any)?.timeScale().scaleBy(1.2);
  };

  const zoomOut = () => {
    (chartRef.current as any)?.timeScale().scaleBy(0.85);
  };

  const resetView = () => {
    chartRef.current?.timeScale().fitContent();
  };

  const toggleFullscreen = () => {
    setIsFullscreen(prev => !prev);
    // Timeout to allow DOM container sizes to settle before chart resize
    setTimeout(() => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.resize(
          chartContainerRef.current.clientWidth,
          chartContainerRef.current.clientHeight
        );
        chartRef.current.timeScale().fitContent();
      }
    }, 100);
  };

  if (candles.length === 0 || !currentPrice) {
    return (
      <div className="glass-panel h-[490px] w-full rounded-md flex flex-col items-center justify-center space-y-3 text-center select-none text-xs font-mono border-zinc-800 bg-[#121214]">
        <span className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
        <span className="text-zinc-500 font-semibold tracking-wide animate-pulse">Loading Market Data...</span>
      </div>
    );
  }

  const latestCandle = candles[candles.length - 1];

  return (
    <div 
      className={`glass-panel rounded-md flex flex-col overflow-hidden transition-all duration-150 relative border-zinc-800 ${
        isFullscreen 
          ? "fixed inset-4 z-50 bg-[#121214] border-zinc-700 shadow-2xl" 
          : "h-[490px] w-full"
      }`}
    >
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between px-5 py-3 border-b border-zinc-800 bg-[#121214] z-10">
        <div className="flex items-center space-x-3">
          <span className="font-bold text-[#FAFAFA] tracking-tight">{pairName} Chart</span>
          <div className="flex bg-zinc-900/40 p-1 rounded-md border border-zinc-800 relative">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.value}
                onClick={() => setTimeframe(tf.value)}
                className={`relative px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
                  timeframe === tf.value ? "text-white" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {timeframe === tf.value && (
                  <motion.div
                    layoutId="active-timeframe"
                    className="absolute inset-0 bg-blue-600 rounded-md shadow-md"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{tf.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Chart Actions */}
        <div className="flex items-center space-x-1">
          <button
            onClick={zoomIn}
            title="Zoom In"
            className="p-2 rounded-md hover:bg-zinc-800/60 text-zinc-400 hover:text-[#FAFAFA] transition-colors duration-150"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={zoomOut}
            title="Zoom Out"
            className="p-2 rounded-md hover:bg-zinc-800/60 text-zinc-400 hover:text-[#FAFAFA] transition-colors duration-150"
          >
            <ZoomOut size={16} />
          </button>
          <button
            onClick={resetView}
            title="Reset View"
            className="p-2 rounded-md hover:bg-zinc-800/60 text-zinc-400 hover:text-[#FAFAFA] transition-colors duration-150"
          >
            <RotateCcw size={16} />
          </button>
          <div className="w-[1px] h-4 bg-zinc-850 mx-1" />
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            className="p-2 rounded-md hover:bg-zinc-800/60 text-zinc-400 hover:text-[#FAFAFA] transition-colors duration-150"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* OHLC sub-header info row */}
      {latestCandle && (
        <div className="flex items-center space-x-4 px-5 py-2 bg-zinc-900/10 border-b border-zinc-800 text-[10px] sm:text-[11px] font-mono text-zinc-400 select-none flex-wrap flex-shrink-0">
          <div className="flex items-center space-x-1.5 mr-2">
            <span className="font-bold text-zinc-200">{pairName}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div>
            <span className="text-zinc-550 mr-0.5">O</span>
            <span className="text-zinc-300 tabular-nums">{latestCandle.open.toFixed(4)}</span>
          </div>
          <div>
            <span className="text-zinc-550 mr-0.5">H</span>
            <span className="text-zinc-300 tabular-nums">{latestCandle.high.toFixed(4)}</span>
          </div>
          <div>
            <span className="text-zinc-550 mr-0.5">L</span>
            <span className="text-zinc-300 tabular-nums">{latestCandle.low.toFixed(4)}</span>
          </div>
          <div>
            <span className="text-zinc-550 mr-0.5">C</span>
            <span className={`tabular-nums font-semibold ${latestCandle.close >= latestCandle.open ? "text-emerald-450 glow-text-green" : "text-rose-455 glow-text-red"}`}>
              {latestCandle.close.toFixed(4)}
            </span>
          </div>
          {(() => {
            const change = latestCandle.close - latestCandle.open;
            const changePercent = latestCandle.open > 0 ? (change / latestCandle.open) * 100 : 0;
            const isUp = change >= 0;
            return (
              <div className={`tabular-nums ${isUp ? "text-emerald-450" : "text-rose-455"}`}>
                {isUp ? "+" : ""}{change.toFixed(4)} ({isUp ? "+" : ""}{changePercent.toFixed(2)}%)
              </div>
            );
          })()}
        </div>
      )}

      {/* Main container */}
      <div 
        ref={chartContainerRef} 
        className="flex-1 w-full bg-[#18181B]"
        style={{ minHeight: "100px" }}
      />
    </div>
  );
}
