# Log Hari 4

## Checkpoint 6 — Pemahaman Contract

1. Koin menyimpan nilai token. `transfer` digunakan untuk transaksi antar-wallet, sedangkan `approve` digunakan untuk memberi izin/menandatangani proses transaksi.

2. Pool digunakan untuk mengisi liquidity sebuah ekosistem yang dibuat. `addLiquidity` digunakan untuk memasukkan value pada kolam ekosistem, sedangkan `swap` adalah tukar-menukar sebuah alat transaksi.

3. Satu baris kode yang sebelumnya saya tidak mengerti dan sekarang saya pahami adalah tentang jumlah sebuah token sebelum di-swap dan sesudah di-swap.

---

## Catatan Interaksi

### Perintah pengguna

Mulai sekarang, semua perintah pengguna, jawaban asisten, dan interaksi yang terjadi dicatat ke log ini. Pengguna meminta Checkpoint 8 (uji AI Swap Advisor vs kenyataan) diselesaikan dengan reserveA `1100 SGM` dan reserveB `909.338910611985086842 ETHJKT`.

### Respons dan asumsi asisten

Checkpoint 8 juga memerlukan `amountIn`, tetapi nilainya belum diberikan. Saya menggunakan asumsi swap `100 SGM`, mengikuti contoh swap pada README Hari 4. Arah swap yang diuji adalah SGM (token A) ke ETHJKT (token B).

## Checkpoint 8 — Uji AI Swap Advisor vs Kenyataan

### Data pool

- `reserveIn`: 1100 SGM
- `reserveOut`: 909.338910611985086842 ETHJKT
- `amountIn`: 100 SGM (asumsi berdasarkan contoh README)

### Jawaban AI Swap Advisor

```json
{"perkiraanTerima": 75.569800273414114493, "priceImpactPersen": 8.585479703259157, "verdict": "kurs jelek, pikir ulang"}
```

### Verifikasi dengan rumus `getAmountOut()` contract

Rumus contract:

```solidity
amountOut = (amountIn * 997 * reserveOut) /
            (reserveIn * 1000 + amountIn * 997)
```

Dengan angka di atas, hasil `getAmountOut(100 SGM, 1100 SGM, 909.338910611985086842 ETHJKT)` adalah:

```text
75569800273414114493 wei
= 75.569800273414114493 ETHJKT
```

### Perbandingan dan refleksi

- Perkiraan AI: `75.569800273414114493 ETHJKT`
- Hasil contract: `75.569800273414114493 ETHJKT`
- Selisih: `0 ETHJKT` (0%)

Pada pengujian ini, AI tidak meleset karena perhitungannya menggunakan rumus fee 0,3% yang sama dengan contract. Namun, hasil contract tetap menjadi acuan sebelum melakukan swap karena transaksi on-chain bersifat final. Price impact sekitar `8,59%`, jadi untuk swap sebesar 100 SGM pada pool ini kursnya tergolong jelek dan perlu dipikir ulang.

### Hasil tindakan asisten

Log diperbarui dengan perintah pengguna, asumsi yang digunakan, jawaban AI Swap Advisor, hasil verifikasi rumus contract, serta perbandingan hasilnya.

---

## Checkpoint 9 (Bonus) — AI Market Vibe

### Perintah pengguna

Pengguna memberikan event `Transfer` dari `0x563648F57217469d14B338479F053d6bac5093c2` ke `0x4178Be82d3b1193588fDf19ab02cAca7D06318Fe` sebesar `100000000000000000000` wei token (100 token), lalu meminta ringkasan vibe pasar tiga kalimat santai dengan disclaimer.

### Market vibe

Ada pergerakan 100 token dari satu wallet ke wallet lain, jadi pasar kelihatan mulai ada aktivitas. Nilainya belum cukup untuk menyimpulkan tren besar, tetapi transfer ini menunjukkan tokennya benar-benar dipakai. Pantau event berikutnya untuk melihat apakah aktivitasnya makin ramai atau cuma transaksi sekali lewat.

_Disclaimer: hiburan, bukan saran finansial._

### Hasil tindakan asisten

Ringkasan tiga kalimat dan disclaimer telah ditempelkan ke log.

---

## Log Pemahaman — Jawaban Peserta

1. DeFi atau *decentralized finance* adalah perkembangan/revolusi dari *traditional finance*. DeFi berjalan tanpa pihak ketiga atau perantara seperti bank. Berbeda dengan bank yang terlalu terpusat (*centralized*), transaksi DeFi transparan dan tercatat resmi di blockchain, sebanyak atau sesedikit apa pun transaksinya. Pada perbankan tradisional, kita tidak mengetahui seluruh transaksi yang terjadi.

2. Standar ERC-20 menyediakan fungsi seperti `transfer()` untuk mengirim token ke wallet lain, `balanceOf()` untuk melihat saldo, `approve()` untuk memberi izin kepada smart contract menggunakan token kita, `allowance()` untuk melihat jumlah izin yang telah diberikan, dan `transferFrom()` untuk memindahkan token berdasarkan izin tersebut. Saat *swap*, contract AMM tidak bisa mengambil token langsung dari wallet kita. Karena itu kita perlu memakai `approve()` agar contract memperoleh izin menggunakan token sejumlah yang ditentukan; setelah ada izin, contract dapat menjalankan proses *swap*.

3. Bukti reserve sebelum dan sesudah swap:
   - Sebelum: Reserve SGM = 1000, Reserve ETHJKT = 1000.
   - Sesudah: Reserve SGM = 1100, Reserve ETHJKT = 909,34.

4. AI hanya memberi perkiraan berdasarkan data yang diberikan, sedangkan hasil yang benar-benar dipakai saat transaksi adalah hasil perhitungan smart contract di blockchain. Sebelum bertransaksi, saya harus selalu mengecek hasil dari contract.

5. Slippage adalah selisih antara jumlah token yang diperkirakan akan diterima dengan jumlah yang benar-benar diterima saat transaksi berhasil diproses. Slippage merugikan jika selisihnya terlalu besar, sehingga token yang diterima lebih sedikit daripada yang diharapkan.
