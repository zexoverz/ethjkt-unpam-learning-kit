# LOG PEMAHAMAN — HARI 4

**Nama koin:** DikaToken (DKT)
**Alamat DikaToken:** `0x52BB960d6c0e57ff09897E0a02A560B3e81b7509`
**Alamat ETHJKT:** `0x7E96fed902B0A26b62DA78e8112253920Fc55936`
**Alamat SimpleAMM (pasar):** `0x519A58F552d4aF1400cF40E3505c55BFC3Dcb78e`

---

## 1. DeFi itu apa, bedanya sama bank?

DeFi (Decentralized Finance) itu layanan keuangan — kayak nabung, pinjam, tuker
uang — tapi jalannya lewat kode (smart contract) di blockchain, bukan lewat
orang atau lembaga. Kalau di bank, aku percaya sama pihak bank buat nyimpen
duitku dan ngejalanin transaksi dengan jujur. Di DeFi, aku gak perlu percaya
sama siapa-siapa, karena aturannya udah ditulis di kode (contract) yang bisa
dibaca dan dicek semua orang, dan gak ada yang bisa diem-diem ngubah aturannya
setelah di-deploy. Contohnya di pasar (SimpleAMM) yang aku bikin: gak ada
"admin bank" yang nentuin harga tuker DKT ke ETHJKT — harganya ditentuin
otomatis sama rumus `x*y=k` berdasarkan jumlah token yang ada di pool.

## 2. ERC20 kasih kamu fungsi apa aja? Kenapa swap butuh approve dulu?

ERC20 itu "standar" buat bikin token, isinya fungsi-fungsi dasar kayak:
- `transfer` — kirim token dari dompetku ke orang lain
- `balanceOf` — cek berapa saldo token yang dimiliki suatu alamat
- `approve` — ngasih izin ke alamat lain (misal contract) buat narik sejumlah
  token dari dompetku
- `transferFrom` — dipakai sama pihak yang udah di-approve tadi buat benar-benar
  narik tokennya

Swap butuh `approve` dulu karena SimpleAMM itu contract, bukan aku sendiri.
Waktu aku manggil `swapAforB`, contract itu perlu narik token DKT dari
dompetku ke pool. Tapi demi keamanan, ERC20 didesain supaya gak ada contract
manapun yang bisa asal narik token dari dompet orang tanpa izin eksplisit.
Makanya harus `approve` dulu — itu kayak aku bilang "oke, SimpleAMM boleh
narik maksimal segini dari dompetku". Kalau lupa approve, muncul error
`insufficient allowance` — ini justru fitur keamanan, bukan bug.

## 3. Bukti x*y=k (angka sebelum/sesudah swap)

**Sebelum swap kedua:**
- reserveA (DKT) = 10.100
- reserveB (ETHJKT) = 9.901,284196...
- k_sebelum = 10.100 × 9.901,284196 ≈ **100.002.970**

**Sesudah swap kedua** (swap 10 DKT → 96,78 ETHJKT):
- reserveA (DKT) = 10.200
- reserveB (ETHJKT) = 9.804,501150...
- k_sesudah = 10.200 × 9.804,501150 ≈ **100.005.912**

**Perbandingan:** k_sesudah (100.005.912) lebih besar dikit dari k_sebelum
(100.002.970) — naik sekitar 2.941, atau cuma ~0,003%.

**Kenapa k naik sedikit, bukan tetap persis?**
Karena tiap swap kena fee 0,3%, dan fee itu gak ditarik keluar dari pool,
malah nambahin sedikit token ke reserve. Jadi `k` gak bener-bener konstan
100% — dia justru naik pelan-pelan tiap ada transaksi swap. Ini juga yang
bikin aku (sebagai liquidity provider) untung, karena tiap swap orang lain
ninggalin sedikit "sisa" fee di pool yang jadi milik LP bareng-bareng.

## 4. Seberapa meleset AI Swap Advisor vs getAmountOut?

Tes: swap 50 DKT, dengan reserveA = 10.200 DKT dan reserveB = 9.804,50115
ETHJKT.

| Sumber | Hasil (ETHJKT) |
|---|---|
| Tebakan ala-AI (rasio simpel, fee diabaikan) | 48,06 |
| Hasil asli dari `getAmountOut` (Remix, on-chain) | 47,684052 |

**Selisih:** ~0,376 ETHJKT, atau sekitar **0,79% lebih tinggi** dari angka
sebenarnya.

**Artinya buat aku:** AI yang cuma ngitung kasar pakai rasio simpel
(`amountIn × reserveOut/reserveIn`) itu SALAH, karena gak masukin fee 0,3%
dan gak ngitung efek slippage dari rumus constant product. Kelihatannya
kecil (0,79%), tapi kalau dipakai buat swap dengan nominal gede atau
berulang-ulang, selisihnya bisa jadi kerugian nyata. Pelajarannya: jangan
percaya mentah-mentah angka perkiraan dari AI buat urusan finansial —
selalu cocokin dulu ke `getAmountOut()` on-chain sebelum benar-benar
tanda tangan transaksi.

## 5. Slippage itu apa, kapan bikin rugi?

Slippage itu selisih antara harga yang aku *harapkan* pas mau swap dengan
harga *aktual* yang aku dapet setelah swap benar-benar jalan. Ini kejadian
karena rumus `x*y=k`: makin gede jumlah yang aku swap dibanding ukuran pool,
makin besar juga pergeseran harganya — jadi token yang aku terima per unit
makin sedikit dibanding swap kecil.

Slippage bikin rugi kalau:
- Aku swap jumlah gede di pool yang likuiditasnya kecil (reserve dikit),
  hasilnya jauh lebih dikit dari perkiraan awal.
- Ada orang lain yang nge-swap duluan tepat sebelum transaksiku diproses
  (front-running), jadi harga udah keburu geser pas transaksiku eksekusi.
- Aku gak set batas minimum penerimaan (slippage tolerance), jadi transaksi
  tetap jalan walau hasilnya jauh lebih buruk dari yang diharapkan.

---

## Ringkasan AI Market Vibe (Checkpoint 9)

Dari event `Swapped` dan `LiquidityAdded` di Etherscan (tab Events, contract
SimpleAMM), datanya:
- Pool dibuka dengan modal awal 1000 DKT : 1000 ETHJKT (rasio 1:1)
- 2 transaksi swap kecil tercatat (~9-10 DKT tiap kali)

> Pool baru aja dibuka dengan modal awal 1000:1000, jadi masih fresh dan
> harga masih anteng di rasio 1:1. Udah ada 2 transaksi swap kecil-kecilan,
> nunjukin trader lagi coba-coba nyicipin likuiditas, belum ada gerakan besar
> yang bikin harga miring drastis. Overall vibe-nya: pasar early-stage yang
> masih tenang dan stabil, cocok buat yang mau observe dulu sebelum swap
> gede-gedean.
>
> *Disclaimer: ini cuma hiburan berdasarkan pola transaksi, bukan saran
> finansial atau analisis investasi beneran.*
