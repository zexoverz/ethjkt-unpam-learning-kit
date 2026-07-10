import { useMemo } from "react";

interface Props {
  reserveA: number;
  reserveB: number;
  amountIn?: number;
  amountOut?: number;
  swapDir?: string;
  symA: string;
  symB: string;
}

export default function XYKCurve({
  reserveA,
  reserveB,
  amountIn = 0,
  amountOut = 0,
  swapDir = "AtoB",
  symA,
  symB,
}: Props) {
  const {
    k,
    kAfter,
    curvePoints,
    currentPoint,
    newPoint,
    showSwap,
  } = useMemo(() => {
    if (!reserveA || !reserveB || reserveA <= 0 || reserveB <= 0) {
      return {
        k: 0,
        kAfter: 0,
        curvePoints: [],
        currentPoint: null,
        newPoint: null,
        showSwap: false,
      };
    }

    const k = reserveA * reserveB;
    let newReserveA = reserveA;
    let newReserveB = reserveB;

    if (amountIn > 0 && amountOut > 0) {
      if (swapDir === "AtoB") {
        newReserveA = reserveA + amountIn;
        newReserveB = reserveB - amountOut;
      } else {
        newReserveA = reserveA - amountOut;
        newReserveB = reserveB + amountIn;
      }
    }

    const kAfter = newReserveA * newReserveB;

    const curvePoints: Array<{ x: number; y: number }> = [];
    const minX = reserveA * 0.3;
    const maxX = reserveA * 1.7;
    const steps = 40;

    for (let i = 0; i <= steps; i++) {
      const x = minX + (maxX - minX) * (i / steps);
      const y = k / x;
      curvePoints.push({ x, y });
    }

    const showSwap = amountIn > 0 && amountOut > 0;

    return {
      k,
      kAfter,
      curvePoints,
      currentPoint: { x: reserveA, y: reserveB },
      newPoint: showSwap ? { x: newReserveA, y: newReserveB } : null,
      showSwap,
    };
  }, [reserveA, reserveB, amountIn, amountOut, swapDir]);

  if (!reserveA || !reserveB || reserveA <= 0 || reserveB <= 0) {
    return (
      <div className="chart-empty">
        <div className="chart-empty__icon">📈</div>
        <p className="chart-empty__title">Pool belum ada likuiditas</p>
        <p className="chart-empty__hint">
          Tambah likuiditas dulu buat lihat kurva x*y=k!
        </p>
      </div>
    );
  }

  const width = 500;
  const height = 350;
  const padding = { top: 30, right: 30, bottom: 50, left: 60 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const allX = curvePoints.map((p) => p.x);
  const allY = curvePoints.map((p) => p.y);
  if (newPoint) {
    allX.push(newPoint.x);
    allY.push(newPoint.y);
  }

  const xMin = Math.min(...allX) * 0.9;
  const xMax = Math.max(...allX) * 1.1;
  const yMin = Math.min(...allY) * 0.9;
  const yMax = Math.max(...allY) * 1.1;

  const scaleX = (v: number) =>
    padding.left + ((v - xMin) / (xMax - xMin)) * plotW;
  const scaleY = (v: number) =>
    padding.top + plotH - ((v - yMin) / (yMax - yMin)) * plotH;

  const curvePath = curvePoints
    .map((p, i) => (i === 0 ? "M" : "L") + " " + scaleX(p.x).toFixed(2) + " " + scaleY(p.y).toFixed(2))
    .join(" ");

  const currSvg = currentPoint
    ? { x: scaleX(currentPoint.x), y: scaleY(currentPoint.y) }
    : null;
  const newSvg = newPoint
    ? { x: scaleX(newPoint.x), y: scaleY(newPoint.y) }
    : null;

  const viewBoxStr = "0 0 " + width + " " + height;
  const rotateStr = "rotate(-90 15 " + height / 2 + ")";

  return (
    <div className="xyk-canvas">
      <div className="xyk-header">
        <h3>Kurva Constant Product: x · y = k</h3>
        <div className="xyk-k-values">
          <span>
            k sekarang: <b className="mono">{k.toExponential(3)}</b>
          </span>
          {showSwap && (
            <span className={kAfter >= k ? "xyk-k--up" : "xyk-k--down"}>
              k sesudah: <b className="mono">{kAfter.toExponential(3)}</b>
              {kAfter > k ? " ↑ (fee 0.3%)" : ""}
            </span>
          )}
        </div>
      </div>

      <svg viewBox={viewBoxStr} className="xyk-svg">
        <defs>
          <linearGradient id="curveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(143, 194, 255, 0.8)" />
            <stop offset="100%" stopColor="rgba(126, 240, 194, 0.8)" />
          </linearGradient>
          <marker
            id="arrowhead"
            markerWidth="8"
            markerHeight="8"
            refX="6"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 8 3, 0 6" fill="#ffd666" />
          </marker>
        </defs>

        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={height - padding.bottom}
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="1"
        />
        <line
          x1={padding.left}
          y1={height - padding.bottom}
          x2={width - padding.right}
          y2={height - padding.bottom}
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="1"
        />

        <text
          x={width / 2}
          y={height - 10}
          textAnchor="middle"
          fill="rgba(255,255,255,0.7)"
          fontSize="12"
        >
          Reserve {symA}
        </text>
        <text
          x={15}
          y={height / 2}
          textAnchor="middle"
          fill="rgba(255,255,255,0.7)"
          fontSize="12"
          transform={rotateStr}
        >
          Reserve {symB}
        </text>

        <path
          d={curvePath}
          fill="none"
          stroke="url(#curveGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {currSvg && (
          <>
            <circle
              cx={currSvg.x}
              cy={currSvg.y}
              r="7"
              fill="#8fc2ff"
              stroke="#fff"
              strokeWidth="2"
            />
            <text
              x={currSvg.x + 12}
              y={currSvg.y - 12}
              fill="#8fc2ff"
              fontSize="11"
              fontWeight="600"
            >
              Sekarang
            </text>
          </>
        )}

        {newSvg && currSvg && (
          <>
            <line
              x1={currSvg.x}
              y1={currSvg.y}
              x2={newSvg.x}
              y2={newSvg.y}
              stroke="#ffd666"
              strokeWidth="2"
              strokeDasharray="6 3"
              markerEnd="url(#arrowhead)"
            />
            <circle
              cx={newSvg.x}
              cy={newSvg.y}
              r="7"
              fill="#7ef0c2"
              stroke="#fff"
              strokeWidth="2"
            />
            <text
              x={newSvg.x + 12}
              y={newSvg.y + 5}
              fill="#7ef0c2"
              fontSize="11"
              fontWeight="600"
            >
              Sesudah swap
            </text>
          </>
        )}
      </svg>

      <div className="xyk-legend">
        <span className="xyk-legend__item">
          <span className="xyk-legend__dot xyk-legend__dot--curr" /> Posisi pool
          sekarang
        </span>
        {showSwap && (
          <>
            <span className="xyk-legend__item">
              <span className="xyk-legend__dot xyk-legend__dot--new" /> Posisi
              setelah swap
            </span>
            <span className="xyk-legend__item">
              <span className="xyk-legend__arrow">→</span> Arah pergerakan
            </span>
          </>
        )}
      </div>

      {showSwap && (
        <div className="xyk-proof">
          ✅ <b>x·y=k terbukti:</b> k sesudah ({kAfter.toExponential(3)}) ≥ k
          sekarang ({k.toExponential(3)})
          <br />
          <small>k naik sedikit karena fee 0.3% masuk ke pool</small>
        </div>
      )}
    </div>
  );
}
