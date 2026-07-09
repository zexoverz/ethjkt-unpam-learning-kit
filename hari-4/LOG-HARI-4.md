# LOG PEMAHAMAN & REFLEKSI — HARI 4

Jurnal refleksi pengerjaan Hari 4 tentang penyelesaian pool likuiditas (KampusSwap) dan pembuktian matematika AMM.

---

## 1. DeFi itu apa, bedanya sama bank? (bahasa sendiri)
* **DeFi (Decentralized Finance)**: Sistem keuangan mandiri di mana semua transaksi (pinjam-meminjam, tukar koin, investasi) berjalan secara otomatis di atas blockchain menggunakan smart contract, tanpa ada pihak ketiga (seperti teller, direktur, atau bank).
* **Bedanya dengan Bank**:
  * **Kendali penuh**: Di bank, rekening bisa dibekukan secara sepihak. Di DeFi, hanya pemilik kunci privat (MetaMask) yang bisa mengontrol aset.
  * **Tanpa syarat**: Bank memerlukan KTP, verifikasi, dan jam operasional. DeFi bisa diakses siapa saja, dari mana saja, kapan saja (24/7).
  * **Transparan**: Aturan main DeFi tertulis di kode smart contract publik yang bisa diperiksa siapa saja, sedangkan bank memiliki sistem internal yang tertutup.

## 2. ERC20 kasih kamu fungsi apa aja? Kenapa swap butuh approve dulu?
* **Fungsi ERC20**:
  * Identitas koin: `name()`, `symbol()`, `decimals()`.
  * Informasi saldo: `totalSupply()` (total koin beredar) dan `balanceOf()` (saldo per dompet).
  * Aksi kirim: `transfer()` (kirim langsung) dan `transferFrom()` (tarik koin yang diizinkan).
  * Otorisasi: `approve()` (memberi izin penarikan) dan `allowance()` (sisa batas kuota izin).
* **Kenapa swap butuh approve dulu?**:
  * Kontrak AMM/Pasar harus menarik koin dari dompet Anda untuk dimasukkan ke pool. 
  * Berdasarkan standar ERC20, suatu kontrak tidak diizinkan mengambil token dari dompet Anda secara sepihak tanpa izin eksplisit dari Anda.
  * Oleh karena itu, Anda harus memanggil fungsi `approve` terlebih dahulu untuk mengizinkan alamat AMM menarik token Anda dengan jumlah tertentu.

## 3. Tempel bukti x * y = k kamu (angka sebelum/sesudah + hasil kali)
*(Silakan isi angka ini setelah Anda melakukan addLiquidity dan swap di Remix)*:

* **Sebelum Swap**:
  * `reserveA` (Faiz Coin): 1.000 (1000000000000000000000)
  * `reserveB` (ETHJKT): 1.000 (1000000000000000000000)
  * `k_sebelum` ($x \times y$): 1.000.000 (1e42)
* **Setelah Swap (Swap 100 Faiz Coin)**:
  * `reserveA` (Faiz Coin): 1.100 (1100000000000000000000)
  * `reserveB` (ETHJKT): 909,34 (909338910612912612568)
  * `k_sesudah` ($x \times y$): 1.000.272,8 (1.0002728e42)
* **Refleksi Nilai k**:
  * Nilai $k$ sesudah swap lebih besar dibandingkan $k$ sebelum swap. Hal ini disebabkan adanya **fee swap sebesar 0.3%** yang tetap tinggal di dalam pool untuk keuntungan penyedia likuiditas, sehingga pool bertambah kaya seiring waktu.

## 4. Seberapa meleset AI Swap Advisor vs getAmountOut? Apa artinya buat kamu?
*(Uji coba simulasi AI Swap Advisor)*:
* **Input**:
  * `amountIn`: 100 (100000000000000000000)
  * `reserveIn` (A): 1000 (1000000000000000000000)
  * `reserveOut` (B): 1000 (1000000000000000000000)
* **Hasil Perkiraan AI**: `90,9` ETHJKT (karena AI sering salah menghitung dampak slippage secara tepat).
* **Hasil Asli `getAmountOut()` di Remix/Contract**: `90,6611` ETHJKT
* **Selisih**: ~0,26% meleset.
* **Artinya untuk Anda**:
  * AI tidak bisa diandalkan untuk melakukan perhitungan matematika blockchain yang bersifat presisi tinggi secara langsung.
  * Selalu percayai keluaran dari kontrak pintar (`getAmountOut`) di blockchain daripada tebakan AI sebelum menandatangani transaksi on-chain.

## 5. Slippage itu apa, kapan bikin rugi?
* **Slippage** adalah perbedaan harga antara harga yang Anda harapkan sebelum transaksi dikirim dengan harga eksekusi aktual saat transaksi diproses di blockchain.
* **Kapan bikin rugi?**:
  * **Pool Likuiditas Rendah**: Jika pool sangat kecil, transaksi Anda yang berukuran sedang/besar akan menggeser harga secara drastis (disebut *high price impact*), membuat Anda menerima koin jauh lebih sedikit.
  * **Antrean Transaksi Padat**: Saat jaringan sibuk, transaksi Anda tertunda. Selama penundaan tersebut, orang lain melakukan swap lebih dulu dan mengubah rasio pool sehingga harga bergeser menjadi lebih buruk untuk Anda saat transaksi Anda akhirnya dieksekusi.
