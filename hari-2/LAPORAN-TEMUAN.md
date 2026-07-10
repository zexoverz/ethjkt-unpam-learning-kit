# LAPORAN TEMUAN — PASAR PAGI (Bug Bounty Hari 2)

## Ruang lingkup dan validasi

Audit dilakukan pada skrip inline di `hari-2/index.html` (baris 85–222),
bukan pada `main.js`. Halaman ini adalah versi latihan yang sengaja rentan
untuk dianalisis secara lokal. Sintaks skrip telah diperiksa dengan
`node --check`; temuan di bawah divalidasi dari alur data dan langkah
reproduksi yang dapat dilakukan di browser/DevTools.

| Kategori | Jumlah |
| --- | ---: |
| Bug inti | 2 |
| Keamanan | 3 |
| Etika | 2 |
| Stretch (validasi batas) | 1 |

---

## Temuan #1 — [BUG] Jumlah kosong membuat keranjang dan total menjadi `NaN`

**Lokasi:** `index.html:177–181` dan `215–217`.

Input jumlah diparsing dengan `parseInt()` lalu langsung diberikan ke
`updateQuantity()`. Nilai kosong menghasilkan `NaN`; perbandingan
`NaN <= 0` bernilai `false`, sehingga `cart[id].count` diisi `NaN`. Nilai itu
kemudian dipakai pada subtotal dan badge keranjang.

**Bukti:** tambahkan produk, kosongkan input jumlah, lalu lihat total dan badge
menjadi `NaN`.

**Dampak dan perbaikan:** pesanan dan nominal pembayaran dapat rusak. Tolak
nilai yang bukan integer dengan `Number.isInteger(quantity)` sebelum mengubah state.

---

## Temuan #2 — [BUG / STRETCH] Jumlah tidak dibatasi stok, negatif menghapus diam-diam

**Lokasi:** `index.html:147`, `163–169`, dan `177–181`.

Atribut `min="1"` hanya bantuan UI. Tidak ada `max`, `step`, atau pemeriksaan
stok di `updateQuantity()` dan `addToCart()`. Angka `999999` diterima; angka
negatif atau nol malah menghapus item tanpa penjelasan. Nilai desimal juga
dipangkas oleh `parseInt()`.

**Bukti:** ketik `999999` pada jumlah, lalu coba `-3`. Total membesar tanpa
batas dan item hilang pada nilai negatif.

**Dampak dan perbaikan:** jumlah pesanan tidak dapat dipercaya. Validasi integer
positif dan clamp jumlah ke `product.stock`, sambil memberi pesan yang jelas.

---

## Temuan #3 — [BUG] Total akhir tidak diformat sebagai uang

**Lokasi:** `index.html:157–158` dan `201–202`.

Harga per item memakai `toFixed(2)`, tetapi nilai `total` langsung dirender.
Akibatnya format bisa `1.8` alih-alih `1.80`, atau memperlihatkan artefak
floating-point pada kombinasi harga tertentu.

**Bukti:** tambahkan Apel Fuji; sidebar menampilkan `$1.8`, bukan `$1.80`.

**Dampak dan perbaikan:** tampilan uang tidak konsisten. Selalu tampilkan
`total.toFixed(2)`; untuk produksi, hitung uang dalam sen (integer).

---

## Temuan #4 — [KEAMANAN] Harga dipercaya dari atribut DOM yang bisa dimanipulasi

**Lokasi:** `index.html:120`, `163–168`, dan `205–208`.

Harga disimpan pada `data-price` tombol `+`, kemudian dibaca dari DOM dan
menimpa `cart[id].price`. Pengguna menguasai DOM melalui DevTools, sehingga
harga resmi katalog tidak lagi menjadi sumber kebenaran.

**Bukti:** ubah `data-price` tombol Apel menjadi `0.01` di DevTools, lalu klik
`+`. Keranjang menggunakan harga tersebut.

**Dampak dan perbaikan:** pembeli dapat memalsukan harga. `addToCart(id)` harus
mengambil harga dari katalog/server; server wajib menghitung ulang total checkout.

---

## Temuan #5 — [KEAMANAN] Catatan pengguna dirender dengan `innerHTML` (XSS)

**Lokasi:** `index.html:150–155`.

Catatan pengguna digabungkan ke `preview.innerHTML`, sehingga browser
mem-parsingnya sebagai HTML, bukan teks. Handler event pada elemen HTML dapat
dieksekusi di sidebar.

**Bukti:** setelah ada barang di keranjang, masukkan HTML pada kolom catatan;
elemen tersebut dirender sebagai elemen DOM, bukan tulisan literal.

**Dampak dan perbaikan:** dalam aplikasi nyata ini dapat menjadi stored XSS
pada dashboard petani/admin. Gunakan `preview.textContent` atau sanitasi HTML.

---

## Temuan #6 — [KEAMANAN] Rahasia kupon dan keputusan diskon ada di client

**Lokasi:** `index.html:94–96` dan `183–188`.

`KUPON_RAHASIA` disimpan sebagai teks biasa dan diskon 90% diputus seluruhnya
di browser. View Source cukup untuk memperoleh kode kupon dan client dapat
memodifikasi logika maupun nilai `diskon`.

**Bukti:** cari `KUPON_RAHASIA` di source lalu masukkan `TEMANFARMER`; diskon
90% aktif.

**Dampak dan perbaikan:** kupon internal dapat dipakai siapa saja. Perbaikan
tuntas membutuhkan server untuk memvalidasi kupon dan menghitung total final.

---

## Temuan #7 — [ETIKA] Stok palsu dibuat ulang secara acak

**Lokasi:** `index.html:105–123` dan `130–160`.

Pesan “tinggal X lagi” dibuat oleh `Math.random()` saat produk dirender.
`renderCart()` selalu memanggil `renderProducts()`, sehingga angka stok dapat
naik atau turun setiap pengguna menambah/mengurangi barang.

**Bukti:** perhatikan angka stok lalu klik `+` atau `−` berulang kali. Nilainya
berubah tanpa hubungan dengan keranjang.

**Dampak dan perbaikan:** ini false scarcity yang tidak jujur. Gunakan stok
nyata dari inventaris, atau jangan tampilkan klaim kelangkaan.

---

## Temuan #8 — [ETIKA] Biaya penanganan tersembunyi di sidebar

**Lokasi:** `index.html:94`, `157–158`, dan `201–202`.

`HANDLING_FEE` ditambahkan ke total sidebar, tetapi sidebar hanya menampilkan
baris “Total”. Rincian biaya baru tampil dalam modal review sehingga biaya
tambahan diketahui terlambat.

**Bukti:** masukkan Apel Fuji seharga `$1.50`; sidebar menampilkan `$1.8` tanpa
menjelaskan tambahan `$0.30`, sedangkan modal merinci biaya penanganan.

**Dampak dan perbaikan:** ini drip pricing yang mengurangi transparansi.
Tampilkan subtotal, biaya penanganan, diskon, dan total sejak awal dengan satu
fungsi perhitungan yang juga dipakai modal checkout.

---

## Refleksi

Kode dapat terlihat berfungsi saat kondisi normal, tetapi belum tentu benar,
aman, atau jujur. Validasi input, sumber data tepercaya, perlindungan XSS,
keputusan uang di server, dan transparansi harga perlu diuji secara sengaja.
