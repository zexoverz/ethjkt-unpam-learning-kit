// ============================================================
// router.ts — XevoSwap Routing Engine
//
// Membangun graph token → pool, lalu cari rute swap terbaik.
// Mendukung:
//   - Direct swap  : A → B via 1 pool
//   - 2-hop route  : A → mid → B via 2 pool
//
// Rumus x*y=k + fee 0.3% persis sama dengan contract SimpleAMM.
// ============================================================

import { formatUnits, parseUnits } from "viem";
import { CONFIG, type TokenSymbol, type PoolConfig } from "../config";

// ── Pure AMM math ────────────────────────────────────────────
export function getAmountOut(
  amountIn: bigint,
  reserveIn: bigint,
  reserveOut: bigint
): bigint {
  if (amountIn <= 0n || reserveIn <= 0n || reserveOut <= 0n) return 0n;
  const inWithFee = amountIn * 997n;
  return (inWithFee * reserveOut) / (reserveIn * 1000n + inWithFee);
}

export function calcSlippage(
  amountIn: bigint,
  amountOut: bigint,
  reserveIn: bigint,
  reserveOut: bigint
): number {
  if (amountIn <= 0n || amountOut <= 0n || reserveIn <= 0n || reserveOut <= 0n)
    return 0;
  const spotPrice = Number(reserveOut) / Number(reserveIn);
  const effectivePrice = Number(amountOut) / Number(amountIn);
  return Math.max(0, ((spotPrice - effectivePrice) / spotPrice) * 100);
}

// ── Types ────────────────────────────────────────────────────
export interface PoolReserves {
  poolId: string;
  reserveA: bigint; // reserve of tokenA in this pool
  reserveB: bigint; // reserve of tokenB in this pool
}

export interface RouteHop {
  poolId: string;
  poolLabel: string;
  ammAddress: `0x${string}`;
  fromToken: TokenSymbol;
  toToken: TokenSymbol;
  /** Which direction: "AtoB" = swap tokenA→tokenB in this pool */
  direction: "AtoB" | "BtoA";
  reserveIn: bigint;
  reserveOut: bigint;
}

export interface Route {
  hops: RouteHop[];
  path: TokenSymbol[];           // [fromToken, ...mid, toToken]
  amountIn: bigint;
  amountOut: bigint;
  totalSlippage: number;
  priceImpact: number;
  type: "direct" | "multihop";
}

// ── Graph builder ────────────────────────────────────────────
/**
 * Build adjacency list: tokenSymbol → list of pool configs that include it.
 * Only includes pools that have live reserves (> 0).
 */
export function buildGraph(
  reserves: Record<string, PoolReserves>
): Map<TokenSymbol, { pool: PoolConfig; otherToken: TokenSymbol }[]> {
  const graph = new Map<TokenSymbol, { pool: PoolConfig; otherToken: TokenSymbol }[]>();

  for (const pool of CONFIG.POOLS) {
    const r = reserves[pool.id];
    if (!r || r.reserveA <= 0n || r.reserveB <= 0n) continue; // skip empty pools

    const tA = pool.tokenA as TokenSymbol;
    const tB = pool.tokenB as TokenSymbol;

    if (!graph.has(tA)) graph.set(tA, []);
    if (!graph.has(tB)) graph.set(tB, []);

    graph.get(tA)!.push({ pool, otherToken: tB });
    graph.get(tB)!.push({ pool, otherToken: tA });
  }

  return graph;
}

// ── Route finder ─────────────────────────────────────────────
/**
 * Find the best route from `from` to `to` given current pool reserves.
 * Returns null if no route exists (pool not deployed / no liquidity).
 *
 * Strategy:
 *   1. Try all direct routes (1 hop)
 *   2. Try all 2-hop routes through each intermediate token
 *   3. Return the route with highest amountOut
 */
export function findBestRoute(
  from: TokenSymbol,
  to: TokenSymbol,
  amountInHuman: string,
  reserves: Record<string, PoolReserves>
): Route | null {
  if (from === to) return null;

  const fromToken = CONFIG.TOKENS[from];
  if (!fromToken) return null;

  const amountIn = (() => {
    try { return parseUnits(amountInHuman, fromToken.decimals); }
    catch { return 0n; }
  })();
  if (amountIn <= 0n) return null;

  const graph = buildGraph(reserves);
  const candidates: Route[] = [];

  // ── 1-hop routes ──────────────────────────────────────────
  const neighbors = graph.get(from) ?? [];
  for (const { pool, otherToken } of neighbors) {
    if (otherToken !== to) continue;
    const r = reserves[pool.id];
    if (!r) continue;

    const isAtoB = pool.tokenA === from;
    const rIn  = isAtoB ? r.reserveA : r.reserveB;
    const rOut = isAtoB ? r.reserveB : r.reserveA;

    const out = getAmountOut(amountIn, rIn, rOut);
    if (out <= 0n) continue;

    const slip = calcSlippage(amountIn, out, rIn, rOut);
    const toToken = CONFIG.TOKENS[to];

    candidates.push({
      hops: [{
        poolId: pool.id,
        poolLabel: pool.label,
        ammAddress: pool.ammAddress,
        fromToken: from,
        toToken: to,
        direction: isAtoB ? "AtoB" : "BtoA",
        reserveIn: rIn,
        reserveOut: rOut,
      }],
      path: [from, to],
      amountIn,
      amountOut: out,
      totalSlippage: slip,
      priceImpact: slip,
      type: "direct",
    });
  }

  // ── 2-hop routes ──────────────────────────────────────────
  const allTokens = Array.from(graph.keys());
  for (const mid of allTokens) {
    if (mid === from || mid === to) continue;

    // Check hop1: from → mid
    const hop1Pools = (graph.get(from) ?? []).filter(e => e.otherToken === mid);
    // Check hop2: mid → to
    const hop2Pools = (graph.get(mid) ?? []).filter(e => e.otherToken === to);

    for (const { pool: p1 } of hop1Pools) {
      for (const { pool: p2 } of hop2Pools) {
        if (p1.id === p2.id) continue; // same pool — skip

        const r1 = reserves[p1.id];
        const r2 = reserves[p2.id];
        if (!r1 || !r2) continue;

        // Hop 1
        const isAtoB1 = p1.tokenA === from;
        const rIn1  = isAtoB1 ? r1.reserveA : r1.reserveB;
        const rOut1 = isAtoB1 ? r1.reserveB : r1.reserveA;
        const out1 = getAmountOut(amountIn, rIn1, rOut1);
        if (out1 <= 0n) continue;

        // Hop 2 (input = output of hop1)
        const isAtoB2 = p2.tokenA === mid;
        const rIn2  = isAtoB2 ? r2.reserveA : r2.reserveB;
        const rOut2 = isAtoB2 ? r2.reserveB : r2.reserveA;
        const out2 = getAmountOut(out1, rIn2, rOut2);
        if (out2 <= 0n) continue;

        const slip1 = calcSlippage(amountIn, out1, rIn1, rOut1);
        const slip2 = calcSlippage(out1, out2, rIn2, rOut2);
        const totalSlip = slip1 + slip2 - (slip1 * slip2) / 100; // combined

        candidates.push({
          hops: [
            {
              poolId: p1.id,
              poolLabel: p1.label,
              ammAddress: p1.ammAddress,
              fromToken: from,
              toToken: mid,
              direction: isAtoB1 ? "AtoB" : "BtoA",
              reserveIn: rIn1,
              reserveOut: rOut1,
            },
            {
              poolId: p2.id,
              poolLabel: p2.label,
              ammAddress: p2.ammAddress,
              fromToken: mid,
              toToken: to,
              direction: isAtoB2 ? "AtoB" : "BtoA",
              reserveIn: rIn2,
              reserveOut: rOut2,
            },
          ],
          path: [from, mid, to],
          amountIn,
          amountOut: out2,
          totalSlippage: totalSlip,
          priceImpact: totalSlip,
          type: "multihop",
        });
      }
    }
  }

  if (candidates.length === 0) return null;
  // Best = highest amountOut
  candidates.sort((a, b) => (b.amountOut > a.amountOut ? 1 : -1));
  return candidates[0];
}

// ── Format helpers ───────────────────────────────────────────
export function fmtToken(raw: bigint | undefined, sym: TokenSymbol): string {
  if (raw == null) return "–";
  const dec = CONFIG.TOKENS[sym]?.decimals ?? 18;
  return Number(formatUnits(raw, dec)).toLocaleString("id-ID", { maximumFractionDigits: 4 });
}

export function fmtRouteOut(route: Route | null, toSym: TokenSymbol): string {
  if (!route) return "";
  const dec = CONFIG.TOKENS[toSym]?.decimals ?? 18;
  return Number(formatUnits(route.amountOut, dec)).toLocaleString("id-ID", { maximumFractionDigits: 4 });
}
