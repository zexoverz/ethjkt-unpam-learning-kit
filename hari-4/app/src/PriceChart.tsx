import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type PricePoint = { time: string; price: number };

const POINTS = 36;
const UPDATE_MS = 3_500;

function formatPrice(price: number) {
  if (price >= 1_000) return price.toLocaleString("id-ID", { maximumFractionDigits: 2 });
  if (price >= 1) return price.toLocaleString("id-ID", { maximumFractionDigits: 4 });
  return price.toLocaleString("id-ID", { maximumFractionDigits: 6 });
}

function makeHistory(basePrice: number): PricePoint[] {
  let price = basePrice;
  const now = Date.now();

  return Array.from({ length: POINTS }, (_, index) => {
    // Random walk kecil + kecenderungan kembali ke harga pool.
    price *= 1 + (Math.random() - 0.5) * 0.018;
    price += (basePrice - price) * 0.07;
    return {
      time: new Date(now - (POINTS - index) * UPDATE_MS).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      price: Math.max(price, Number.EPSILON),
    };
  });
}

export function PriceChart({
  marketPrice,
  baseSymbol,
  quoteSymbol,
}: {
  marketPrice: number | null;
  baseSymbol: string;
  quoteSymbol: string;
}) {
  const targetPrice = marketPrice && Number.isFinite(marketPrice) && marketPrice > 0 ? marketPrice : 1;
  const [points, setPoints] = useState<PricePoint[]>(() => makeHistory(targetPrice));

  useEffect(() => {
    setPoints(makeHistory(targetPrice));
  }, [targetPrice]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPoints((previous) => {
        const lastPrice = previous[previous.length - 1]?.price ?? targetPrice;
        // Pergerakan maksimal ±0,9% per tick, lalu perlahan kembali ke harga pool.
        const randomMove = (Math.random() - 0.5) * 0.018;
        const nextPrice = Math.max(
          Number.EPSILON,
          lastPrice * (1 + randomMove) + (targetPrice - lastPrice) * 0.12,
        );

        const next: PricePoint = {
          time: new Date().toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
          price: nextPrice,
        };
        return [...previous.slice(-(POINTS - 1)), next];
      });
    }, UPDATE_MS);

    return () => window.clearInterval(timer);
  }, [targetPrice]);

  const change = useMemo(() => {
    const first = points[0]?.price;
    const last = points[points.length - 1]?.price;
    return first && last ? ((last - first) / first) * 100 : 0;
  }, [points]);
  const rising = change >= 0;

  return (
    <section className="price-chart" aria-label="Grafik harga simulasi">
      <div className="price-chart__head">
        <div>
          <p className="price-chart__eyebrow">Market trend · simulasi</p>
          <h2>{baseSymbol} / {quoteSymbol}</h2>
        </div>
        <div className="price-chart__quote">
          <strong>{formatPrice(points[points.length - 1]?.price ?? targetPrice)}</strong>
          <span className={rising ? "price-chart__change price-chart__change--up" : "price-chart__change price-chart__change--down"}>
            {rising ? "+" : ""}{change.toFixed(2)}%
          </span>
        </div>
      </div>
      <p className="price-chart__caption">1 {baseSymbol} ≈ {quoteSymbol} · mock, bukan harga historis on-chain</p>
      <div className="price-chart__canvas">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 10, right: 4, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.42} />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="time" hide />
            <YAxis domain={["dataMin - 1%", "dataMax + 1%"]} hide />
            <Tooltip
              labelFormatter={(label) => `Waktu ${label}`}
              formatter={(value) => [`${formatPrice(Number(value))} ${quoteSymbol}`, `1 ${baseSymbol}`]}
              contentStyle={{ background: "#10172b", border: "1px solid rgba(165,243,252,.35)", borderRadius: 12 }}
              labelStyle={{ color: "#a5f3fc" }}
            />
            <Area type="monotone" dataKey="price" stroke="#22d3ee" strokeWidth={2.5} fill="url(#priceGradient)" animationDuration={450} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
