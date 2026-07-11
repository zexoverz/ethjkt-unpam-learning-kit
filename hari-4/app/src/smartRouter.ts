/** Pool minimal yang diperlukan Auto-Router untuk menghitung quote AMM. */
export type RoutingPool = {
  id: string;
  token0: string;
  token1: string;
  reserve0: bigint;
  reserve1: bigint;
  /** Total fee dalam basis points. Contoh: 35 = 0,35%. */
  feeBps: number;
};

export type RouteQuote = {
  tokenPath: string[];
  poolPath: string[];
  amountOut: bigint;
};

const BPS_DENOMINATOR = 10_000n;

function quotePool(pool: RoutingPool, tokenIn: string, amountIn: bigint) {
  const inIsToken0 = pool.token0.toLowerCase() === tokenIn.toLowerCase();
  const inIsToken1 = pool.token1.toLowerCase() === tokenIn.toLowerCase();
  if (!inIsToken0 && !inIsToken1 || amountIn <= 0n) return null;

  const reserveIn = inIsToken0 ? pool.reserve0 : pool.reserve1;
  const reserveOut = inIsToken0 ? pool.reserve1 : pool.reserve0;
  const feeBps = BigInt(pool.feeBps);
  if (reserveIn <= 0n || reserveOut <= 0n || feeBps >= BPS_DENOMINATOR) return null;

  const amountInAfterFee = amountIn * (BPS_DENOMINATOR - feeBps);
  const amountOut = (amountInAfterFee * reserveOut) /
    (reserveIn * BPS_DENOMINATOR + amountInAfterFee);
  if (amountOut <= 0n) return null;

  return {
    tokenOut: inIsToken0 ? pool.token1 : pool.token0,
    amountOut,
  };
}

/**
 * Mencari rute dengan output terbesar melalui seluruh kombinasi pool.
 * Token/pool tidak boleh dikunjungi dua kali agar rute tidak berputar.
 * maxHops=3 berarti contoh A > C > B masih dapat dipilih.
 */
export function findBestRoute({
  tokenIn,
  tokenOut,
  amountIn,
  pools,
  maxHops = 3,
}: {
  tokenIn: string;
  tokenOut: string;
  amountIn: bigint;
  pools: RoutingPool[];
  maxHops?: number;
}): RouteQuote | null {
  if (amountIn <= 0n || tokenIn.toLowerCase() === tokenOut.toLowerCase()) return null;

  let bestRoute: RouteQuote | null = null;
  const target = tokenOut.toLowerCase();

  function visit(
    currentToken: string,
    currentAmount: bigint,
    tokenPath: string[],
    poolPath: string[],
  ) {
    if (poolPath.length >= maxHops) return;

    for (const pool of pools) {
      if (poolPath.includes(pool.id)) continue;
      const quote = quotePool(pool, currentToken, currentAmount);
      if (!quote) continue;

      const nextToken = quote.tokenOut;
      if (tokenPath.some((token) => token.toLowerCase() === nextToken.toLowerCase())) continue;
      const nextTokenPath = [...tokenPath, nextToken];
      const nextPoolPath = [...poolPath, pool.id];

      if (nextToken.toLowerCase() === target) {
        const candidate: RouteQuote = {
          tokenPath: nextTokenPath,
          poolPath: nextPoolPath,
          amountOut: quote.amountOut,
        };
        if (!bestRoute || candidate.amountOut > bestRoute.amountOut) bestRoute = candidate;
      } else {
        visit(nextToken, quote.amountOut, nextTokenPath, nextPoolPath);
      }
    }
  }

  visit(tokenIn, amountIn, [tokenIn], []);
  return bestRoute;
}
