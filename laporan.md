# Laporan Temuan Pasar Pagi

## 1. Keranjang bisa melebihi stok produk

**Kategori:** Bug

**Masalah:**
Saat produk menampilkan stok kecil, misalnya "tinggal 2 lagi hari ini", pengguna tetap bisa menekan tombol `+` lebih dari 2 kali. Jumlah di keranjang bisa menjadi 5 atau lebih walaupun stok yang ditampilkan tidak cukup.

**Penyebab:**
Nilai stok hanya dibuat sebagai teks tampilan dari `Math.random()` di `renderProducts()`. Nilai itu tidak disimpan sebagai data produk dan tidak pernah dicek oleh fungsi `addToCart()` atau `updateQuantity()`. Karena `renderCart()` memanggil `renderProducts()` ulang, angka stok juga bisa berubah-ubah setiap kali keranjang diperbarui.

**Cara menyelesaikan:**
- Tambahkan properti `stock` tetap di setiap produk.
- Tampilkan stok dari data produk, bukan dari `Math.random()`.
- Blokir `addToCart()` saat jumlah di keranjang sudah sama dengan stok.
- Batasi input manual quantity agar tidak bisa melebihi stok produk.
- Nonaktifkan tombol `+` saat jumlah produk di keranjang sudah mencapai stok.

**Status:** Sudah diperbaiki di `hari-2/main.js` dan `hari-2/style.css`.
