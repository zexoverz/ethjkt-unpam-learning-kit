# LOG HARI 4 — KampusSwap (SimpleAMM)

Nama: Ghani
Tanggal: 10 Juli 2026
Misi: Hari 4 - Build AMM + Swap, lalu Paham

---

## Ringkasan

Berhasil deploy SimpleAMM (KampusSwap) ke jaringan Sepolia, menambahkan likuiditas, dan melakukan swap antara GhaniCoin (GC) dan ETHJKT. Interface web KampusSwap berjalan dengan baik dan dapat melakukan transaksi on-chain secara real-time.

---

## Alamat Kontrak

- **GhaniCoin (GC)**: `0xEE95d449822892c25e68103B6937C21065667876`
- **ETHJKT**: `0x7E96fed902B0A26b62DA78e8112253920Fc55936`
- **SimpleAMM (KampusSwap)**: `0xE032F0D7D94f302A55500e73aa21059b5e274AfC`

---

## Checkpoint 6 — Penjelasan Bahasa Manusia

### GhaniCoin (ERC20 Token)
GhaniCoin adalah token ERC20 yang saya buat sendiri. Token ini menyimpan:
- **Total supply**: 1,000,000 GC
- **Balance**: Saldo token di setiap alamat wallet
- **Allowance**: Izin untuk kontrak lain mengambil token dari wallet

Fungsi penting:
- `transfer()`: Kirim token ke alamat lain
- `approve()`: Beri izin ke kontrak lain (misal SimpleAMM) untuk mengambil token
- `transferFrom()`: Kontrak mengambil token dari wallet yang sudah approve

### Pool (Likuiditas)
Pool adalah "kolam" yang berisi dua token yang terkunci. Di pool saya:
- **Token A**: GhaniCoin (GC)
- **Token B**: ETHJKT

Pool ini berfungsi sebagai "pasar" otomatis - tidak ada penjual/pembeli manual, hanya rumus matematika yang menentukan harga.

### addLiquidity
Fungsi ini untuk menambahkan likuiditas ke pool:
- Saya menyetor 1000 GC dan 1000 ETHJKT
- Contract mengunci token tersebut di pool
- Saya mendapatkan "shares" sebagai bukti kepemilikan atas likuiditas
- LP pertama menentukan harga awal pool (1 GC = 1 ETHJKT)

### swap
Fungsi ini untuk menukar token:
- Saya swap 1 GC → ETHJKT
- Contract menghitung output berdasarkan rumus x*y=k
- Contract mengambil GC dari wallet saya dan memberikan ETHJKT
- Reserve pool berubah sesuai rumus

### 1 Baris Kode yang Paham
```solidity
reserveA += amountIn;  // Effects dulu
reserveB -= amountOut;
tokenA.transferFrom(msg.sender, address(this), amountIn);  // Interactions belakangan
tokenB.transfer(msg.sender, amountOut);
```

Awalnya saya bingung kenapa harus update reserve dulu baru transfer. Setelah diskusi dengan Claude, saya paham:
- **Effects dulu**: Update state lokal (reserve) SEBELUM panggil kontrak luar
- **Interactions belakangan**: Transfer token ke kontrak luar SETELAH state aman
- Ini mencegah reentrancy - penyerang tidak bisa re-enter sebelum reserve terupdate

---

## Checkpoint 7 — Bukti x*y=k dengan Data Sendiri

### Data dari Pool (Screenshot Akhir)
- **Pool GC**: 664.63
- **Pool ETHJKT**: 1,507.07

### Perhitungan x*y=k
```
k = reserveA × reserveB
k = 664.63 × 1,507.07
k ≈ 1,001,000 (dalam satuan token dengan 18 desimal)
```

Setelah swap, k akan sedikit bertambah karena fee 0.3% yang masuk ke pool. Ini bukti bahwa:
1. Rumus constant product berjalan dengan benar
2. Fee 0.3% ditambahkan ke pool (LP mendapat keuntungan dari fee)
3. Harga berubah secara otomatis berdasarkan rasio reserve

---

## Checkpoint 8 — AI vs Contract

### Prediksi AI vs Hasil On-Chain

**Scenario**: Swap 1 GC ke ETHJKT dengan reserve awal 1000:1000

**Prediksi AI**:
```
amountIn = 1 token (1 × 10^18)
reserveA = 1000 token
reserveB = 1000 token
amountOut = (1 × 997 × 1000) / (1000 × 1000 + 1 × 997)
amountOut ≈ 0.996 token ETHJKT
```

**Hasil getAmountOut() On-Chain**:
```
amountOut = 0.996011... token ETHJKT
```

**Selisih**: Hampir tidak ada (perbedaan < 0.01%)

**Refleksi**:
AI memberikan prediksi yang sangat akurat karena rumusnya benar. Namun, saya tetap harus verifikasi dengan `getAmountOut()` di contract SEBELUM swap beneran, karena:
1. AI bisa salah dalam implementasi
2. Contract adalah sumber kebenaran mutlak
3. Transaksi on-chain bersifat permanen

Ini sesuai dengan "Aturan Emas" course: **AI untuk berpikir, contract untuk percaya**.

---

## Bukti dari App KampusSwap

### Screenshot Hasil Akhir
- **Swap berhasil**: 1 GC → 2.2642 ETHJKT (sesuai dengan rasio pool saat itu)
- **Pool state akhir**: GC: 664.63, ETHJKT: 1,507.07
- **History transaksi**: Terlihat di UI KampusSwap

### Interface Berjalan
- Connect wallet: Berhasil
- Swap: Berhasil dengan preview harga
- Pool data: Terbaca secara real-time dari blockchain
- History: Transaksi tercatat dengan link Etherscan

---

## Refleksi Keamanan (Versi Pengalaman Sendiri)

### Reentrancy & CEI
Dari analisis teknis, saya menemukan bahwa fungsi swap di SimpleAMM memiliki urutan CEI yang salah (Interactions dulu, Effects belakangan).

**Relevansi untuk saya**:
Karena GhaniCoin dan ETHJKT adalah token ERC-20 standar tanpa hook callback, risiko reentrancy secara praktis rendah. Namun, saya sekarang paham bahwa:
- Urutan CEI bukan sekadar gaya penulisan kode
- Ini adalah mekanisme keamanan yang penting
- Untuk produksi, WAJIB perbaiki urutan ini atau tambahkan ReentrancyGuard

**Pelajaran**:
Kode yang jalan ≠ kode yang aman. Kontrak bisa berfungsi dengan baik tapi punya celah keamanan yang tidak terlihat saat testing normal.

---

## Testing Checklist

- [x] Deploy GhaniCoin ke Sepolia
- [x] Deploy SimpleAMM ke Sepolia
- [x] Approve GhaniCoin ke SimpleAMM (1.000.000 token)
- [x] Approve ETHJKT ke SimpleAMM (1.000.000 token)
- [x] Add liquidity (1000 GC + 1000 ETHJKT)
- [x] Test swap GC → ETHJKT
- [x] Test swap ETHJKT → GC
- [x] Verifikasi reserve berubah sesuai rumus x*y=k
- [x] Jalankan interface web KampusSwap
- [x] Test swap via interface web

---

## Screenshot & Bukti

- [x] Screenshot deployment di Remix
- [x] Screenshot token di MetaMask
- [x] Screenshot pool reserve setelah addLiquidity
- [x] Screenshot swap via KampusSwap app
- [x] Link kontrak di Etherscan:
  - GhaniCoin: https://sepolia.etherscan.io/address/0xEE95d449822892c25e68103B6937C21065667876
  - SimpleAMM: https://sepolia.etherscan.io/address/0xE032F0D7D94f302A55500e73aa21059b5e274AfC

---

## Refleksi Akhir

Hari ini saya belajar:
1. **AMM itu matematika murni** - Harga ditentukan oleh rumus x*y=k, bukan admin
2. **Likuiditas = pasar** - Tanpa LP, tidak ada yang bisa swap
3. **Fee 0.3% = insentif LP** - LP mendapat keuntungan dari fee swap
4. **Verifikasi itu wajib** - Jangan percaya AI 100%, cek di contract dulu
5. **Keamanan itu urutan** - CEI pattern bukan sekadar konvensi
6. **Transaksi on-chain final** - Cek dulu, baru klik

**Kesimpulan**: SimpleAMM adalah implementasi yang baik untuk belajar konsep AMM. Rumusnya benar, interface berjalan, tapi ada isu keamanan (urutan CEI) yang perlu diperbaiki untuk produksi.

---

## Catatan untuk Pengembangan Lanjut

Jika ingin melanjutkan ke produksi:
1. Perbaiki urutan CEI di fungsi swap
2. Tambah parameter `minAmountOut` untuk slippage protection
3. Tambah `ReentrancyGuard` modifier
4. Pertimbangkan penggunaan SafeERC20
5. Tambah fitur removeLiquidity di interface web
