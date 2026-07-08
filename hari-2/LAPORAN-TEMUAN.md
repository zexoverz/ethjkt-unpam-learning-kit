# LAPORAN TEMUAN — MISI HARI 2 (BUG BOUNTY PASAR PAGI)

Nama: Alta Lariksyah

---

# Temuan #1 — BUG

## Masalahnya apa
Input jumlah barang menerima nilai yang bukan angka sehingga hasil perhitungan dapat menjadi `NaN`.

## Cara membuktikannya
1. Jalankan aplikasi.
2. Tambahkan satu produk ke keranjang.
3. Pada kolom jumlah di keranjang, hapus isi angka atau masukkan huruf.
4. Nilai jumlah menjadi tidak valid dan perhitungan dapat menghasilkan `NaN`.

## Kenapa ini bahaya / tidak adil
Perhitungan harga menjadi rusak sehingga pengguna mendapatkan informasi yang salah.

## Cara membetulkannya
Validasi input menggunakan `Number.isInteger()` dan abaikan input yang bukan angka sampai pengguna memasukkan nilai yang valid.

---

# Temuan #2 — BUG

## Masalahnya apa
Jumlah barang dapat melebihi stok yang tersedia.

## Cara membuktikannya
1. Tambahkan produk ke keranjang.
2. Edit jumlah barang menjadi lebih besar dari stok.
3. Sistem sebelumnya tetap menerima jumlah tersebut.

## Kenapa ini bahaya / tidak adil
Pembeli dapat membeli barang yang sebenarnya sudah tidak tersedia sehingga stok menjadi tidak akurat.

## Cara membetulkannya
Batasi jumlah maksimum sesuai nilai `product.stock`. Jika melebihi stok, tampilkan pesan dan ubah jumlah menjadi batas maksimal.

---

# Temuan #3 — KEAMANAN

## Masalahnya apa
Harga transaksi diambil dari atribut HTML (`data-price`) yang dapat dimodifikasi melalui DevTools.

## Cara membuktikannya
1. Buka DevTools (F12).
2. Pilih tab Elements.
3. Ubah nilai atribut `data-price`.
4. Total belanja ikut berubah.

## Kenapa ini bahaya / tidak adil
Pengguna dapat memanipulasi harga sehingga membayar lebih murah dari harga sebenarnya.

## Cara membetulkannya
Harga harus selalu diambil dari data resmi produk (`products`) atau divalidasi kembali oleh server.

---

# Temuan #4 — KEAMANAN

## Masalahnya apa
Data yang dimasukkan pengguna ditampilkan menggunakan `innerHTML` sehingga berpotensi menyebabkan Cross Site Scripting (XSS).

## Cara membuktikannya
1. Masukkan script HTML/JavaScript pada kolom catatan.
2. Jika ditampilkan menggunakan `innerHTML`, kode dapat ikut dirender.

## Kenapa ini bahaya / tidak adil
Penyerang dapat menyisipkan script berbahaya untuk mencuri data atau mengubah tampilan halaman.

## Cara membetulkannya
Gunakan `textContent` atau lakukan sanitasi input sebelum ditampilkan.

---

# Temuan #5 — KEAMANAN

## Masalahnya apa
Validasi kupon dan besar diskon dilakukan di sisi client (browser).

## Cara membuktikannya
1. Buka file `main.js`.
2. Cari variabel `KUPON_HASH` dan `DISKON_KUPON`.
3. Terlihat bahwa proses validasi kupon dilakukan langsung di browser.

## Kenapa ini bahaya / tidak adil
Pengguna dapat memodifikasi JavaScript melalui DevTools sehingga logika diskon dapat dimanipulasi.

## Cara membetulkannya
Validasi kupon harus dilakukan di server. Browser hanya mengirimkan kode kupon dan menerima hasil validasi dari server.

---

# Temuan #6 — ETIKA

## Masalahnya apa
Informasi stok dibuat menggunakan angka acak (`Math.random()`), bukan stok sebenarnya.

## Cara membuktikannya
1. Refresh halaman beberapa kali.
2. Nilai stok berubah-ubah walaupun tidak ada transaksi.

## Kenapa ini bahaya / tidak adil
Pengguna dapat merasa harus segera membeli karena mengira stok hampir habis, padahal angka tersebut tidak nyata.

## Cara membetulkannya
Gunakan stok asli dari data produk dan kurangi stok hanya ketika terjadi transaksi yang valid.

---

# Temuan #7 — ETIKA

## Masalahnya apa
Biaya penanganan baru terlihat saat proses checkout sehingga total pembayaran lebih besar dari jumlah harga barang.

## Cara membuktikannya
1. Tambahkan beberapa produk ke keranjang.
2. Hitung total harga secara manual.
3. Bandingkan dengan total checkout.
4. Muncul biaya penanganan yang tidak dijelaskan sejak awal.

## Kenapa ini bahaya / tidak adil
Pembeli dapat merasa tertipu karena biaya tambahan baru muncul di tahap akhir transaksi.

## Cara membetulkannya
Tampilkan seluruh komponen biaya sejak awal sehingga pembeli mengetahui total pembayaran secara transparan.

---

# Refleksi

Setelah mengerjakan tugas ini saya memahami bahwa kode yang dapat dijalankan belum tentu merupakan kode yang benar dan jujur. Sebuah aplikasi dapat terlihat rapi, tetapi masih memiliki bug, celah keamanan, maupun dark pattern yang merugikan pengguna. Oleh karena itu setiap kode hasil AI tetap harus dibaca, diuji, diverifikasi, dan dipastikan aman sebelum digunakan pada aplikasi nyata.
