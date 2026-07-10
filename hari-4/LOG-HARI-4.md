# LOG HARI 4 — Pahami DeFi & Buktikan x∙y=k

## 1. DeFi itu apa, bedanya sama bank?

DeFi (Decentralized Finance) = layanan keuangan tanpa perantara. Bedanya sama bank:
- **Bank:** simpan duit di bank, bank yang pinjemin ke orang lain. Kita percaya bank bakal jaga duit kita (trust-based). Bunga dikasih bank. Kalau bank bangkrut? Susah.
- **DeFi:** simpen duit di SMART CONTRACT (kode terbuka). Kodenya yang ngatur semuanya otomatis — nggak ada manajer, nggak ada teller. Siapa pun bisa liat kodenya, siapa pun bisa pake. Bunga dari biaya transaksi (fee) yang numpuk di pool. Kalau contractnya bener, jalan terus 24/7 tanpa libur.

**Intinya:** Bank = "saya percaya sama orangnya". DeFi = "saya percaya sama kodenya (yang udit-audit, udah terbukti)."

## 2. ERC20 kasih kamu fungsi apa aja? Kenapa swap butuh approve dulu?

Fungsi inti ERC20 dari OpenZeppelin:
- `name()`, `symbol()`, `decimals()` — data diri token
- `totalSupply()` — total koin beredar
- `balanceOf(alamat)` — saldo seseorang
- `transfer(tujuan, jumlah)` — kirim koin langsung
- `approve(siapa, jumlah)` — KASIH IZIN contract lain buat narik koin kita
- `transferFrom(pengirim, tujuan, jumlah)` — narik koin yang udah di-approve

**Kenapa swap butuh approve?** Karena AMM (SimpleAMM) butuh "narik" token dari dompet kita ke pool. Tapi aturan ERC20 bilang: *"Si A nggak boleh ambil uang si B tanpa izin."* Jadi kita harus `approve()` dulu — kasih izin ke alamat AMM buat ambil token kita sejumlah tertentu. Kalau lupa approve, transaksi `swapAforB()` bakal gagal dengan error `insufficient allowance`. Ini FITUR keamanan, bukan bug.

Alur swap: **Approve (1x)** → **Swap (ambil dari kita, kirim ke kita)** → **Selesai.**

## 3. Bukti x∙y=k (angka sebelum/sesudah + hasil kali)

**Sebelum swap:**
- reserveA (RZH): 1000 RZH (1000000000000000000000 wei)
- reserveB (ETHJKT): 1000 ETHJKT (1000000000000000000000 wei)
- k_sebelum = 1000 × 1000 = 1.000.000

**Swap:** 100 RZH → ETHJKT (swapAforB)

**Sesudah swap:**
- reserveA: ~1100 RZH (1000000000000000000000 + 100000000000000000000 = 1100000000000000000000)
- reserveB: ~909,09 ETHJKT (reserveB berubah karena token B dikeluarkan)
- k_sesudah = 1100 × 909,09 ≈ 999.999 ≈ 1.000.000

**Kenapa k naik sedikit?** Fee 0.3% ninggal di pool. Dari 100 token in, cuma 99,7 yang "dihitung" buat swap -> 0,3 token fee numpuk di pool -> k naik sedikit. Ini untungnya Liquidity Provider.

Verifikasi: `getAmountOut(100000000000000000000, reserveA, reserveB)` di Remix balik ~90,66 ETHJKT (bukan 100).

## 4. AI Swap Advisor vs getAmountOut — seberapa meleset?

Saya kasih prompt ke AI: "reserveIn = 1000, reserveOut = 1000, amountIn = 100. Berapa perkiraan terima dan price impact?"

**AI jawab:** "Dapet ~90,8 ETHJKT, price impact ~9,2%"
**Contract (getAmountOut):** 90.660.000.000.000.000.000 (~90,66)

**Beda:** AI lumayan akurat (selisih ~0,15%). Tapi ini kasus sederhana. Pas saya coba amount gede (500 token), AI mulai meleset 1-2%. 

**Artinya:** AI bisa ngasih gambaran kasar, tapi JANGAN percaya buat transaksi beneran. Selalu verifikasi ke `getAmountOut()` di contract atau panggil lewat Etherscan. Di sinilah letak "kritis": AI alat bantu, contract sumber kebenaran.

## 5. Slippage itu apa, kapan bikin rugi?

Slippage = selisih antara harga yang kamu lihat sebelum swap vs harga realisasi pas swap jalan. Di AMM, makin besar jumlah swap dibanding ukuran pool, makin besar slippage.

**Contoh:** Pool 1000 RZH : 1000 ETHJKT. Kamu swap 100 RZH — dapet ~90,66 ETHJKT. Tapi kalau kamu swap 500 RZH — dapet cuma ~332 ETHJKT. Harga rata-rata jadi lebih jelek karena kamu "menggerakkan" harga pool secara signifikan.

**Kapan bikin rugi?**
- **Saat pool kecil + transaksi besar:** slippage gede, kamu dapet lebih sedikit dari yang kamu kira.
- **Saat ada frontrunning/bot:** bot bisa "nyelip" transaksi di depan kamu, bikin harga berubah sebelum transaksi kamu diproses (slippage tambahan).
- **Saat kena sandwich attack:** bot beli dulu (harga naik), transaksi kamu jalan (harga tinggi), bot jual (ambil untung). Kamu kena slippage maksimal.

**Cegah:** selalu cek preview (`getAmountOut`) dulu, dan pakai fitur "slippage tolerance" di DEX beneran (kalo di sini kita nggak punya, tapi di Uniswap ada).

---

## Langkah Karier Selanjutnya (dari KARIER.md)

**Pilih: Gabung Discord ETHJKT**

Langkah pertama yang bakal saya lakukan: **masuk Discord ETHJKT** (https://discord.gg/Bb7UF4vuK4), kenalin diri, dan share link GitHub repo ini. Ini gerbang utama buat dapet mentor, partner hackathon, dan update lowongan Web3. Satu langkah kecil yang bedain "cuma belajar" vs "serius masuk ekosistem."
