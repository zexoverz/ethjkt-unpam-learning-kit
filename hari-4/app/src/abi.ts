import { parseAbi } from "viem";

// ERC20: cuma fungsi yang kita pakai (viem juga punya erc20Abi bawaan,
// tapi kita tulis eksplisit biar gampang dibaca).
export const ERC20_ABI = parseAbi([
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
]);

// SimpleAMM (x*y=k).
export const AMM_ABI = parseAbi([
  "function tokenA() view returns (address)",
  "function tokenB() view returns (address)",
  "function reserveA() view returns (uint256)",
  "function reserveB() view returns (uint256)",
  "function totalShares() view returns (uint256)",
  "function shares(address) view returns (uint256)",
  "function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) pure returns (uint256)",
  "function addLiquidity(uint256 amountA, uint256 amountB) returns (uint256)",
  "function removeLiquidity(uint256 shareAmount) returns (uint256, uint256)",
  "function swapAforB(uint256 amountIn) returns (uint256)",
  "function swapBforA(uint256 amountIn) returns (uint256)",
]);

export const ROUTER_ABI = parseAbi([
  "function getAmountsOut(uint256 amountIn, address[] pools, address[] path) view returns (uint256[] amounts)",
  "function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] pools, address[] path) returns (uint256 amountOut)",
]);
