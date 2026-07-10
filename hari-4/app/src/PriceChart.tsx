import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from "recharts";

export interface PricePoint {
  ts: number;
  price: number;
  poolAddress: string;
  direction: string;
  amountIn: number;
  amountOut: number;
  symA: string;
  symB: string;
}

interface Props {
  history: PricePoint[];
  poolAddress: string;
  symA: string;
  symB: string;
  currentPrice?: number;
}

const PRICE_KEY = (addr: string) => "ks_prices_v1_" + addr.toLowerCase();

export function savePrice(point: PricePoint) {
  try {
    const key = PRICE_KEY(point.poolAddress);
    const prev = JSON.parse(localStorage.getItem(key) || "[]");
    const next = [...prev, point].slice(-200);
    localStorage.setItem(key, JSON.stringify(next));
  } catch {}
}

export function loadPrices(poolAddress: string): PricePoint[] {
  try {
    return JSON.parse(localStorage.getItem(PRICE_KEY(poolAddress)) || "[]");
  } catch {
    return [];
  }
}

export default function PriceChart({ history, poolAddress, symA, symB, currentPrice }: Props) {
  const data = useMemo(() => {
    const filtered = history.filter(
      (p) => p.poolAddress.toLowerCase() === poolAddress.toLowerCase()
    );
    if (filtered.length === 0) return [];
    return filtered.map((p, i) => {
      const prev = i > 0 ? filtered[i - 1].price : p.price;
      const up = p.price >= prev;
      const dt = new Date(p.ts);
      const label = dt.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const dateLabel = dt.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
      });
      return {
        ts: p.ts,
        price: p.price,
        up,
        label,
        dateLabel,
        fullLabel: dateLabel + " " + label,
        direction: p.direction,
        amountIn: p.amountIn,
        amountOut: p.amountOut,
      };
    });
  }, [history, poolAddress]);

  if (data.length === 0) {
    return (
      <div className="chart-empty">
        <div className="chart-empty__icon">📊</div>
        <p className="chart-empty__title">Belum ada data harga</p>
        <p className="chart-empty__hint">
          Lakukan beberapa swap dulu di pool <b>{symA}/{symB}</b> buat mulai tracking harga!
        </p>
      </div>
    );
  }

  const avgPrice = data.reduce((s, d) => s + d.price, 0) / data.length;
  const lastPrice = data[data.length - 1].price;
  const firstPrice = data[0].price;
  const priceChange = ((lastPrice - firstPrice) / firstPrice) * 100;

  return (
    <div className="price-chart">
      <div className="chart-stats">
        <div className="chart-stat">
          <span className="chart-stat__label">Harga Terakhir</span>
          <span className="chart-stat__value">{lastPrice.toFixed(4)}</span>
        </div>
        <div className="chart-stat">
          <span className="chart-stat__label">Perubahan</span>
          <span
            className={
              "chart-stat__value " +
              (priceChange >= 0 ? "chart-stat--up" : "chart-stat--down")
            }
          >
            {priceChange >= 0 ? "▲" : "▼"} {Math.abs(priceChange).toFixed(2)}%
          </span>
        </div>
        <div className="chart-stat">
          <span className="chart-stat__label">Rata-rata</span>
          <span className="chart-stat__value">{avgPrice.toFixed(4)}</span>
        </div>
        <div className="chart-stat">
          <span className="chart-stat__label">Transaksi</span>
          <span className="chart-stat__value">{data.length}</span>
        </div>
      </div>

      <p className="chart-pair-label">
        Harga <b>{symB}</b> per <b>{symA}</b>
      </p>

      <div className="chart-canvas">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis
              dataKey="label"
              tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }}
              axisLine={{ stroke: "rgba(255,255,255,0.15)" }}
              tickLine={false}
              interval={Math.max(0, Math.floor(data.length / 6))}
            />
            <YAxis
              tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }}
              axisLine={{ stroke: "rgba(255,255,255,0.15)" }}
              tickLine={false}
              domain={["auto", "auto"]}
              tickFormatter={(v: any) => Number(v).toFixed(3)}
              width={50}
            />
            <Tooltip
              contentStyle={{
                background: "rgba(15, 30, 60, 0.95)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "0.75rem",
                color: "#fff",
                fontSize: "0.8rem",
              }}
              labelStyle={{
                color: "rgba(255,255,255,0.6)",
                marginBottom: 4,
              }}
              labelFormatter={(label: any, items: any) =>
                items?.[0]?.payload?.fullLabel || label
              }
            />
            {currentPrice != null && currentPrice > 0 && (
              <ReferenceLine
                y={currentPrice}
                stroke="rgba(143, 194, 255, 0.5)"
                strokeDasharray="4 4"
              />
            )}
            <Bar dataKey="price" radius={[4, 4, 0, 0]} maxBarSize={32}>
              {data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={
                    entry.up
                      ? "rgba(126, 240, 194, 0.85)"
                      : "rgba(255, 123, 123, 0.85)"
                  }
                  stroke={
                    entry.up ? "rgba(126, 240, 194, 1)" : "rgba(255, 123, 123, 1)"
                  }
                  strokeWidth={1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-legend">
        <span className="chart-legend__item">
          <span className="chart-legend__dot chart-legend__dot--up" /> Harga naik
        </span>
        <span className="chart-legend__item">
          <span className="chart-legend__dot chart-legend__dot--down" /> Harga turun
        </span>
        {currentPrice != null && currentPrice > 0 && (
          <span className="chart-legend__item">
            <span className="chart-legend__line" /> Spot price
          </span>
        )}
      </div>
    </div>
  );
}
