# LOG HARI 4

---

## CHECKPOINT 6 — Jelaskan Contract Sendiri

### TokenKu
Jadi TokenKu ini koin yang saya buat sendiri di blockchain. Isinya cuma constructor yang cetak 1 juta token ke wallet saya, sama fungsi mint buat latihan. Yang paling penting dari ERC20 itu: transfer buat kirim-kirim token, approve buat izinin orang lain atau contract ambil token dari dompet kita, sama balanceOf buat cek saldo. Kalau mint itu sengaja dibuka biar gampang latihan.

### SimpleAMM
SimpleAMM itu pasar tukar-tukaran token. Jadi ada pool yang isi dua token, harga nya ditentukan rumus x*y=k. Kalau mau isi pool, panggil addLiquidity, nanti saya dapet shares sebagai bukti kalau saya nyetor token ke pool. Kalau mau tukar token, tinggal panggil swapAforB atau swapBforA. Tiap swap kena fee 0.3%, fee itu masuk ke pool jadi keuntungan buat yang nyetor likuiditas.

Baris kode yang kemarin saya nggak ngerti:
```solidity
uint256 amountInWithFee = amountIn * FEE_NUM;
```
Saya bingung kok dikali 997, bukan 1000? Ternyata ini cara ngitung fee 0.3%. Jadi dari 1000 token yang masuk, cuma 997 yang dihitung. Sisa 3 itu fee yang masuk ke pool.

---

## CHECKPOINT 7 — Bukti x*y=k

**Sebelum swap:**
```
reserveA = 2.100 TokenKu
reserveB = 1.905,03 ETHJKT
k_sebelum = 4.000.571.510.215.745.106.444.600.000.000.000.000.000.000
```

**Sesudah swap:**
```
reserveA = 3.311 TokenKu
reserveB = 1.209,63 ETHJKT
k_sesudah = 4.005.091.285.417.046.653.235.869.000.000.000.000.000.000
```

**Hasil:** k_sesudah > k_sebelum (naik karena fee 0.3% masuk ke pool).

---

## CHECKPOINT 8 — AI vs Kenyataan

**Data:** reserveA = 3.311, reserveB = 1.209,63, amountIn = 50 TokenKu.

| Sumber | Hasil | Selisih |
|--------|-------|---------|
| getAmountOut (on-chain) | ~17,95 ETHJKT | — |
| AI (simulasi) | ~18,60 ETHJKT | +3,6% meleset |

AI sering salah urutan reserve, lupa fee, atau lupa 18 desimal. Selalu verifikasi pakai `getAmountOut()` di Remix sebelum swap.

---

## LOG PEMAHAMAN (WAJIB)

### 1. DeFi itu apa, bedanya sama bank?

DeFi = sistem keuangan di blockchain tanpa bank/broker. Aturan ada di smart contract.

| Bank | DeFi |
|------|------|
| Butuh rekening + KYC | Cukup punya wallet |
| Buka jam kerja | Buka 24/7 |
| Bisa blokir akun | Tidak ada yang bisa blokir |
| Fee ditentukan bank | Fee ditentukan rumus di kode |

### 2. ERC20 kasih fungsi apa? Kenapa swap butuh approve?

Fungsi: `transfer`, `approve`, `transferFrom`, `balanceOf`, `totalSupply`, `name/symbol/decimals`.

Swap butuh approve karena SimpleAMM harus `transferFrom` token dari dompet Anda ke pool. Tanpa approve, transaksi gagal.

### 3. Bukti x*y=k

```
Sebelum: k = 2.100 × 1.905,03 = 4.000.571.510.215.745.106.444.600.000.000.000.000.000.000
Sesudah: k = 3.311 × 1.209,63 = 4.005.091.285.417.046.653.235.869.000.000.000.000.000.000
```
k_sesudah > k_sebelum karena fee 0.3%.

### 4. Seberapa meleset AI vs getAmountOut?

AI meleset +3,6% dari getAmountOut on-chain. Artinya: jangan percaya AI 100%, selalu cek ke contract.

### 5. Slippage itu apa?

Slippage = selisih harga yang diharapkan vs yang didapat. Rugi kalau swap sekaligus besar → harga makin jelek. Tips: tukar dalam batch kecil.

---

*Dibuat: Hari 4 — ETHJKT Unpam Learning Kit*
