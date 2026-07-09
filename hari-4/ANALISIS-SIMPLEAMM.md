# Analisis SimpleAMM.sol - Laporan Keamanan & Verifikasi

Nama: Ghani
Tanggal: 9 Juli 2026
Misi: Hari 4 - Analisis & Verifikasi SimpleAMM (KampusSwap)

---

## Ringkasan

Laporan ini berisi analisis mendalam terhadap kontrak `SimpleAMM.sol`, sebuah implementasi Automated Market Maker (AMM) menggunakan constant product formula (x*y=k). Analisis mencakup verifikasi rumus matematika, identifikasi isu keamanan, dan rekomendasi perbaikan.

---

## 1. Verifikasi Rumus AMM

### Rumus Constant Product dengan Fee 0.3%

Fungsi `getAmountOut()` (lines 133-144) menggunakan rumus:

```solidity
function getAmountOut(
    uint256 amountIn,
    uint256 reserveIn,
    uint256 reserveOut
) public pure returns (uint256) {
    require(amountIn > 0, "input nol");
    require(reserveIn > 0 && reserveOut > 0, "pool kosong");
    uint256 amountInWithFee = amountIn * FEE_NUM; // 997
    uint256 numerator = amountInWithFee * reserveOut;
    uint256 denominator = reserveIn * FEE_DEN + amountInWithFee; // 1000
    return numerator / denominator;
}
```

**Verifikasi**: Rumus ini **BENAR** dan sesuai dengan standar Uniswap V2.

Rumus matematika yang diimplementasikan:
```
amountOut = (amountIn × 997 × reserveOut) / (reserveIn × 1000 + amountIn × 997)
```

Ini adalah implementasi constant product formula (x*y=k) dengan fee 0.3%:
- Fee numerator: 997 (99.7% dari input yang dihitung)
- Fee denominator: 1000 (100% dari input)
- Fee efektif: (1000 - 997) / 1000 = 0.3%

**Contoh perhitungan**:
- Reserve A: 1000 token
- Reserve B: 1000 token
- Swap 100 token A → B
- amountInWithFee = 100 × 997 = 99,700
- numerator = 99,700 × 1000 = 99,700,000
- denominator = 1000 × 1000 + 99,700 = 1,099,700
- amountOut = 99,700,000 / 1,099,700 ≈ 90.66 token B

Hasil ini konsisten dengan slippage yang diharapkan dari AMM constant product.

---

## 2. Isu Keamanan: Reentrancy Risk (Kritis)

### Masalah: Urutan CEI Tidak Benar

Kontrak melanggar pattern **Checks-Effects-Interactions (CEI)** di fungsi swap.

**Pattern CEI yang benar**:
1. **Checks**: Validasi dengan `require()`
2. **Effects**: Update state/variable lokal
3. **Interactions**: Panggil kontrak luar (transfer token)

**Implementasi saat ini di `swapAforB()` (lines 149-159)**:
```solidity
function swapAforB(uint256 amountIn) external returns (uint256 amountOut) {
    require(amountIn > 0, "input nol");  // ✓ Check
    amountOut = getAmountOut(amountIn, reserveA, reserveB);

    tokenA.transferFrom(msg.sender, address(this), amountIn);  // ✗ Interaction dulu
    tokenB.transfer(msg.sender, amountOut);                     // ✗ Interaction dulu

    reserveA += amountIn;   // ✗ Effect belakangan
    reserveB -= amountOut;  // ✗ Effect belakangan
    emit Swapped(msg.sender, address(tokenA), amountIn, amountOut);
}
```

**Masalah yang terjadi**:
1. Transfer token dilakukan SEBELUM update reserve
2. Jika salah satu token adalah ERC-777 atau token custom dengan hook, penyerang bisa re-enter ke fungsi swap
3. Pada re-entry, `reserveA` dan `reserveB` belum terupdate, sehingga penyerang bisa swap berulang kali dengan reserve yang "stuck"

**Contoh serangan (teoretis)**:
1. Penyerang swap 100 token A → B
2. Token B adalah ERC-777 dengan hook `tokensReceived()`
3. Hook tersebut memanggil `swapAforB()` lagi sebelum reserve terupdate
4. Penyerang swap lagi dengan reserve yang sama (cheat)
5. Ini bisa menguras pool (drain attack)

**Risiko praktis**:
- **Rendah** untuk token ERC-20 standar (tidak punya hook)
- **Tinggi** untuk token ERC-777 atau token custom dengan callback

### Perbaikan yang Disarankan

```solidity
function swapAforB(uint256 amountIn) external returns (uint256 amountOut) {
    require(amountIn > 0, "input nol");  // ✓ Check
    amountOut = getAmountOut(amountIn, reserveA, reserveB);

    // ✓ Effects dulu
    reserveA += amountIn;
    reserveB -= amountOut;

    // ✓ Interactions belakangan
    tokenA.transferFrom(msg.sender, address(this), amountIn);
    tokenB.transfer(msg.sender, amountOut);

    emit Swapped(msg.sender, address(tokenA), amountIn, amountOut);
}
```

**Lapisan pertahanan tambahan** (untuk produksi):
```solidity
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract SimpleAMM is ReentrancyGuard {
    function swapAforB(uint256 amountIn) external nonReentrant returns (uint256 amountOut) {
        // ... implementasi
    }
}
```

---

## 3. Slippage Protection (Belum Ada)

### Masalah: Tidak Ada Minimum Amount Out

Fungsi swap saat ini tidak memiliki parameter `minAmountOut` untuk melindungi user dari slippage ekstrem.

**Risiko**:
- User bisa mendapatkan jauh lebih sedikit dari perkiraan jika:
  - Ada orang lain swap besar duluan
  - Transaksi di-front-run oleh bot
  - Harga berubah drastis sebelum transaksi diproses

**Perbaikan yang disarankan**:
```solidity
function swapAforB(uint256 amountIn, uint256 minAmountOut) 
    external 
    returns (uint256 amountOut) 
{
    require(amountIn > 0, "input nol");
    amountOut = getAmountOut(amountIn, reserveA, reserveB);
    require(amountOut >= minAmountOut, "slippage terlalu tinggi");  // ✓ Slippage protection

    reserveA += amountIn;
    reserveB -= amountOut;

    tokenA.transferFrom(msg.sender, address(this), amountIn);
    tokenB.transfer(msg.sender, amountOut);

    emit Swapped(msg.sender, address(tokenA), amountIn, amountOut);
}
```

**Penggunaan**:
- User memanggil `swapAforB(100, 90)` untuk swap 100 token A dengan minimum 90 token B
- Jika slippage menyebabkan output < 90, transaksi revert (dibatalkan)

---

## 4. Akurasi Fungsi `_sqrt()`

### Implementasi Babylonian Method

Fungsi `_sqrt()` (lines 176-187) menggunakan **Babylonian method** (metode Newton) untuk menghitung akar kuadrat integer.

```solidity
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
```

**Verifikasi**: Implementasi ini **BENAR** dan sama persis dengan yang dipakai di Uniswap V2 (`Math.sol`).

**Karakteristik**:
- Mengembalikan `floor(sqrt(y))` (pembulatan ke bawah)
- Akurat untuk semua `uint256`
- Menangani edge case: `y = 0, 1, 2, 3`
- Konvergen cepat (biasanya < 20 iterasi)

**Contoh**:
- `_sqrt(16)` → 4
- `_sqrt(15)` → 3 (floor)
- `_sqrt(0)` → 0

---

## 5. Overflow di `_sqrt(amountA * amountB)`

### Analisis Potensi Overflow

Di line 83:
```solidity
minted = _sqrt(amountA * amountB);
```

**Potensi masalah**: `amountA * amountB` bisa melebihi kapasitas `uint256` (2^256 - 1).

**Namun, ini BUKAN celah keamanan** karena:
1. Kontrak menggunakan **Solidity ^0.8.20**
2. Di Solidity 0.8+, overflow otomatis menyebabkan **revert** (transaksi dibatalkan)
3. Tidak ada "wrap around" seperti di Solidity < 0.8

**Implikasi praktis**:
- Transaksi akan gagal jika `amountA * amountB` terlalu besar
- Secara praktis mustahil terjadi untuk token dengan supply wajar (misal 1,000,000 GC)
- Ini adalah safety mechanism, bukan bug

**Contoh**:
- Untuk token dengan supply 1,000,000 (10^6), maksimal `amountA * amountB` = 10^12
- Kapasitas `uint256` ≈ 10^77
- Jarak sangat besar, overflow tidak realistis

---

## 6. Optimasi Gas (Opsional)

### Rekomendasi Optimasi

**1. Cache storage ke memory**
```solidity
function swapAforB(uint256 amountIn) external returns (uint256 amountOut) {
    uint256 _reserveA = reserveA;  // ✓ Cache ke memory
    uint256 _reserveB = reserveB;  // ✓ Cache ke memory
    
    require(amountIn > 0, "input nol");
    amountOut = getAmountOut(amountIn, _reserveA, _reserveB);
    
    _reserveA += amountIn;
    _reserveB -= amountOut;
    
    reserveA = _reserveA;  // ✓ Single write ke storage
    reserveB = _reserveB;  // ✓ Single write ke storage
    
    tokenA.transferFrom(msg.sender, address(this), amountIn);
    tokenB.transfer(msg.sender, amountOut);
    
    emit Swapped(msg.sender, address(tokenA), amountIn, amountOut);
}
```

**2. Gunakan `unchecked` untuk operasi aman**
```solidity
require(shares[msg.sender] >= shareAmount, "shares kurang");
shares[msg.sender] -= shareAmount;  // ✓ Sudah divalidasi, aman untuk unchecked
```

**Catatan**: Optimasi gas opsional untuk versi belajar. Prioritas utama adalah keamanan.

---

## 7. Perhitungan Shares untuk Liquidity Provider

### Implementasi di `addLiquidity()`

**LP pertama** (lines 80-83):
```solidity
if (totalShares == 0) {
    minted = _sqrt(amountA * amountB);
}
```
- Shares = √(amountA × amountB)
- LP pertama menentukan harga awal pool

**LP berikutnya** (lines 84-90):
```solidity
else {
    minted = _min(
        (amountA * totalShares) / reserveA,
        (amountB * totalShares) / reserveB
    );
}
```
- Shares proporsional berdasarkan rasio yang lebih kecil
- Mencegah manipulasi rasio timpang

**Verifikasi**: Implementasi ini **BENAR** dan sesuai dengan standar Uniswap V2.

---

## 8. Kesimpulan & Rekomendasi

### Status Keamanan

| Aspek | Status | Prioritas |
|-------|--------|-----------|
| Rumus AMM | ✅ Benar | - |
| `_sqrt()` accuracy | ✅ Benar | - |
| Perhitungan shares | ✅ Benar | - |
| Overflow protection | ✅ Aman (Solidity 0.8+) | - |
| **Reentrancy protection** | ❌ **Ada isu** | **Kritis** |
| Slippage protection | ❌ Belum ada | Tinggi |
| Gas optimization | ⚠️ Bisa dioptimasi | Rendah |

### Rekomendasi Perbaikan (Urutan Prioritas)

1. **Kritis**: Perbaiki urutan CEI di fungsi swap (update reserve sebelum transfer)
2. **Tinggi**: Tambah parameter `minAmountOut` untuk slippage protection
3. **Sedang**: Tambah `ReentrancyGuard` modifier sebagai lapisan pertahanan kedua
4. **Rendah**: Optimasi gas dengan caching storage ke memory

### Catatan untuk Penggunaan

Untuk tujuan **belajar dan testing** (seperti kasus GhaniCoin & ETHJKT):
- Risiko reentrancy rendah karena keduanya token ERC-20 standar
- Kontrak bisa digunakan untuk latihan swap dan liquidity provision

Untuk **produksi**:
- WAJIB perbaiki urutan CEI
- WAJIB tambahkan slippage protection
- WAJIB tambahkan ReentrancyGuard
- Pertimbangkan penggunaan SafeERC20 untuk transfer token

---

## 9. Pembuktian

### Testing Checklist

- [ ] Deploy kontrak ke Sepolia
- [ ] Test `getAmountOut()` dengan berbagai input
- [ ] Test `addLiquidity()` untuk LP pertama
- [ ] Test `addLiquidity()` untuk LP kedua
- [ ] Test `swapAforB()` dan `swapBforA()`
- [ ] Verifikasi reserve berubah sesuai rumus
- [ ] Test `removeLiquidity()`
- [ ] Verifikasi slippage pada swap besar

### Screenshot & Bukti

- [ ] Screenshot deployment di Remix
- [ ] Screenshot token di MetaMask
- [ ] Screenshot pool reserve setelah addLiquidity
- [ ] Screenshot swap di Etherscan
- [ ] Link kontrak di Etherscan

---

## 10. Refleksi

Pelajaran penting dari analisis ini:
1. **Kode yang jalan ≠ kode yang aman** - Kontrak bisa berfungsi tapi punya celah keamanan
2. **Pattern CEI penting** - Urutan checks-effects-interactions bukan sekadar konvensi, tapi mekanisme keamanan
3. **Verifikasi AI itu wajib** - AI bisa salah dalam analisis keamanan (seperti klaim saya yang salah tentang urutan CEI)
4. **Solidity 0.8+ membantu** - Overflow otomatis revert, tapi tetap perlu perhatian pada logika
5. **AMM itu kompleks** - Rumus matematika benar tidak cukup, perlu pertimbangan edge case dan serangan

**Kesimpulan**: SimpleAMM.sol adalah implementasi yang baik untuk belajar konsep AMM, tapi memerlukan perbaikan keamanan sebelum digunakan di produksi.
