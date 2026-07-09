// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ============================================================
// SIMPLE AMM - MESIN TUKER OTOMATIS (Hari 3 build)  ->  ini KampusSwap
//
// AMM = Automated Market Maker. Ini "mesin" di balik Uniswap dkk.
// Nggak ada penjual & pembeli yang harus ketemu. Yang ada cuma KOLAM
// (pool) berisi 2 token, dan sebuah RUMUS yang nentuin harga otomatis.
//
// RUMUS AJAIBNYA: x * y = k  (constant product)
//   x = jumlah token A di pool
//   y = jumlah token B di pool
//   k = hasil kali keduanya, harus TETAP setelah tiap swap.
//
// Intuisi (besok kita bedah pelan-pelan): kalau kamu AMBIL banyak
// token B dari pool, B jadi langka -> jadi mahal. Makin banyak yang
// kamu tuker sekaligus, makin jelek kursnya. Itu namanya SLIPPAGE /
// price impact. Nggak ada admin yang set harga -- semuanya matematika.
//
// SIAPA YANG ISI POOL? Liquidity Provider (LP). Mereka nyetor token A
// & B ke pool, dapet "shares" (bukti kepemilikan). Tiap swap kena fee
// 0.3% yang numpuk di pool -> LP untung dari fee.
//
// ALUR PAKAI (di Remix):
//   1. Deploy TokenKu (koin kamu) + pakai alamat ETHJKT dari pengajar.
//   2. Deploy contract ini, isi (alamat TokenKu, alamat ETHJKT).
//   3. approve() di MASING-MASING token ke alamat AMM ini.
//   4. addLiquidity() -> pool kamu terisi (ini "pasar" koinmu lahir).
//   5. approve lagi -> swapAforB() / swapBforA() -> tukeran jalan.
//
// CATATAN VERIFIKASI (dibahas Hari 4): AMM itu tempat AI PALING SERING
// salah rumus (fee ketuker, slippage salah, urutan reserve kebalik).
// JANGAN percaya bulet kode AMM dari AI. Cocokin outputnya sama
// getAmountOut() di bawah SEBELUM kamu swap beneran.
//
// (Ini versi belajar. Di produksi masih kurang: SafeERC20, reentrancy
//  guard, pola checks-effects-interactions, slippage protection. Besok
//  kita omongin kenapa.)
// ============================================================

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SimpleAMM {
    IERC20 public tokenA; // TokenKu (koin kamu)
    IERC20 public tokenB; // ETHJKT (mata uang kampus)

    // "reserve" = catatan berapa token yang ADA di pool sekarang.
    uint256 public reserveA;
    uint256 public reserveB;

    // "shares" = bukti kepemilikan LP atas pool (mirip saham).
    uint256 public totalShares;
    mapping(address => uint256) public shares;

    // fee 0.3%: dari tiap 1000 token masuk, 997 dihitung, 3 jadi fee.
    uint256 public constant FEE_NUM = 997;
    uint256 public constant FEE_DEN = 1000;

    event LiquidityAdded(address indexed lp, uint256 amountA, uint256 amountB, uint256 sharesMinted);
    event LiquidityRemoved(address indexed lp, uint256 amountA, uint256 amountB, uint256 sharesBurned);
    event Swapped(address indexed user, address tokenIn, uint256 amountIn, uint256 amountOut);

    constructor(address _tokenA, address _tokenB) {
        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);
    }

    // ---------- LIKUIDITAS ----------

    // Nyetor token A & B ke pool, dapet shares.
    // WAJIB approve() dulu di KEDUA token sebelum manggil ini.
    function addLiquidity(uint256 amountA, uint256 amountB) external returns (uint256 minted) {
        require(amountA > 0 && amountB > 0, "jumlah nol");

        // tarik token dari dompet LP ke contract ini.
        tokenA.transferFrom(msg.sender, address(this), amountA);
        tokenB.transferFrom(msg.sender, address(this), amountB);

        if (totalShares == 0) {
            // LP pertama: shares = akar dari (A * B). Dia yang nentuin
            // harga awal pool lewat perbandingan A:B yang dia setor.
            minted = _sqrt(amountA * amountB);
        } else {
            // LP berikutnya: shares proporsional, ambil yang paling
            // kecil biar nggak bisa curang lewat rasio timpang.
            minted = _min(
                (amountA * totalShares) / reserveA,
                (amountB * totalShares) / reserveB
            );
        }
        require(minted > 0, "shares nol");

        shares[msg.sender] += minted;
        totalShares += minted;
        reserveA += amountA;
        reserveB += amountB;

        emit LiquidityAdded(msg.sender, amountA, amountB, minted);
    }

    // Tarik likuiditas: "bakar" shares, ambil balik token A & B secara
    // PROPORSIONAL sama besar share yang kamu punya. Nggak perlu approve
    // (yang keluar itu token milik pool, dikirim ke kamu).
    function removeLiquidity(uint256 shareAmount)
        external
        returns (uint256 amountA, uint256 amountB)
    {
        require(shareAmount > 0, "nol");
        require(shares[msg.sender] >= shareAmount, "shares kurang");

        // porsi kamu dari pool = shareAmount / totalShares.
        amountA = (shareAmount * reserveA) / totalShares;
        amountB = (shareAmount * reserveB) / totalShares;
        require(amountA > 0 && amountB > 0, "output nol");

        // kurangi dulu catatan (checks-effects), baru kirim token.
        shares[msg.sender] -= shareAmount;
        totalShares -= shareAmount;
        reserveA -= amountA;
        reserveB -= amountB;

        tokenA.transfer(msg.sender, amountA);
        tokenB.transfer(msg.sender, amountB);
        emit LiquidityRemoved(msg.sender, amountA, amountB, shareAmount);
    }

    // ---------- HARGA (PREVIEW - baca doang, gratis) ----------

    // Rumus x*y=k lengkap dengan fee 0.3%. Ini fungsi "view" -> kamu
    // bisa PANGGIL DULU buat NGINTIP dapet berapa, SEBELUM swap beneran.
    // Ini padanan "cek sebelum aksi permanen" dari pelajaran immutable.
    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) public pure returns (uint256) {
        require(amountIn > 0, "input nol");
        require(reserveIn > 0 && reserveOut > 0, "pool kosong");
        uint256 amountInWithFee = amountIn * FEE_NUM;
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = reserveIn * FEE_DEN + amountInWithFee;
        return numerator / denominator;
    }

    // ---------- SWAP ----------

    // Tuker token A -> token B. WAJIB approve() tokenA dulu.
    function swapAforB(uint256 amountIn) external returns (uint256 amountOut) {
        require(amountIn > 0, "input nol");
        amountOut = getAmountOut(amountIn, reserveA, reserveB);

        tokenA.transferFrom(msg.sender, address(this), amountIn);
        tokenB.transfer(msg.sender, amountOut);

        reserveA += amountIn;
        reserveB -= amountOut;
        emit Swapped(msg.sender, address(tokenA), amountIn, amountOut);
    }

    // Tuker token B -> token A. WAJIB approve() tokenB dulu.
    function swapBforA(uint256 amountIn) external returns (uint256 amountOut) {
        require(amountIn > 0, "input nol");
        amountOut = getAmountOut(amountIn, reserveB, reserveA);

        tokenB.transferFrom(msg.sender, address(this), amountIn);
        tokenA.transfer(msg.sender, amountOut);

        reserveB += amountIn;
        reserveA -= amountOut;
        emit Swapped(msg.sender, address(tokenB), amountIn, amountOut);
    }

    // ---------- HELPER MATEMATIKA ----------

    function _sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }

    function _min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
}
