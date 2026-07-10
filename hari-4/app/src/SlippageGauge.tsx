import { useMemo } from "react";

interface Props {
  amountIn: number;
  amountOut: number;
  reserveIn: number;
  reserveOut: number;
  swapDir: string;
  symA: string;
  symB: string;
}

function getSlippageColor(impact: number): string {
  if (impact < 1) return "#7ef0c2";
  if (impact < 3) return "#ffd666";
  if (impact < 5) return "#ffa94d";
  return "#ff6b6b";
}

function getSlippageLabel(impact: number): string {
  if (impact < 1) return "Rendah";
  if (impact < 3) return "Sedang";
  if (impact < 5) return "Tinggi";
  return "Sangat Tinggi";
}

function getSlippageEmoji(impact: number): string {
  if (impact < 1) return "🟢";
  if (impact < 3) return "🟡";
  if (impact < 5) return "🟠";
  return "🔴";
}

export default function SlippageGauge({
  amountIn,
  amountOut,
  reserveIn,
  reserveOut,
  swapDir,
  symA,
  symB,
}: Props) {
  const { spotPrice, execPrice, impact, isHighImpact, isVeryHighImpact } = useMemo(() => {
    if (!amountIn || amountIn <= 0 || !reserveIn || !reserveOut) {
      return {
        spotPrice: 0,
        execPrice: 0,
        impact: 0,
        isHighImpact: false,
        isVeryHighImpact: false,
      };
    }

    const sp = reserveOut / reserveIn;
    const ep = amountOut / amountIn;
    const imp = sp > 0 ? Math.abs((sp - ep) / sp) * 100 : 0;

    return {
      spotPrice: sp,
      execPrice: ep,
      impact: imp,
      isHighImpact: imp >= 3,
      isVeryHighImpact: imp >= 5,
    };
  }, [amountIn, amountOut, reserveIn, reserveOut]);

  if (!amountIn || amountIn <= 0 || !reserveIn || !reserveOut) return null;

  const color = getSlippageColor(impact);
  const label = getSlippageLabel(impact);
  const emoji = getSlippageEmoji(impact);
  const gaugePercent = Math.min((impact / 10) * 100, 100);

  const inSym = swapDir === "AtoB" ? symA : symB;
  const outSym = swapDir === "AtoB" ? symB : symA;

  return (
    <div
      className={
        "slippage-panel " +
        (isVeryHighImpact
          ? "slippage-panel--danger"
          : isHighImpact
            ? "slippage-panel--warn"
            : "")
      }
    >
      <div className="slippage-header">
        <span className="slippage-title">
          {emoji} Price Impact:{" "}
          <b style={{ color: color }}>{impact.toFixed(2)}%</b>
        </span>
        <span
          className="slippage-badge"
          style={{ color: color, borderColor: color }}
        >
          {label}
        </span>
      </div>

      <div className="slippage-gauge-track">
        <div
          className="slippage-gauge-fill"
          style={{
            width: gaugePercent + "%",
            background: "linear-gradient(90deg, #7ef0c2, " + color + ")",
          }}
        />
      </div>

      <div className="slippage-details">
        <div className="slippage-row">
          <span>Spot price</span>
          <span className="mono">
            {spotPrice.toFixed(6)} {outSym}/{inSym}
          </span>
        </div>
        <div className="slippage-row">
          <span>Execution price</span>
          <span className="mono" style={{ color: color }}>
            {execPrice.toFixed(6)} {outSym}/{inSym}
          </span>
        </div>
        <div className="slippage-row">
          <span>Price impact</span>
          <span className="mono" style={{ color: color }}>
            {impact.toFixed(2)}%
          </span>
        </div>
      </div>

      {isHighImpact && (
        <div
          className={
            "slippage-warning " + (isVeryHighImpact ? "slippage-warning--danger" : "")
          }
        >
          ⚠️ Slippage tinggi! Kamu akan mendapat{" "}
          <b>lebih sedikit {outSym}</b> dibanding harga pasar.
          {isVeryHighImpact && (
            <div className="slippage-warning__sub">
              Swap jumlah besar membuat harga bergerak signifikan. Pertimbangkan
              swap dengan jumlah lebih kecil.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
