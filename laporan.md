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

## 2. Catatan pesanan bisa menyisipkan HTML berbahaya

**Kategori:** Keamanan

**Masalah:**
Input pada kolom "Catatan buat petani" ditampilkan kembali di preview keranjang. Jika pengguna memasukkan teks seperti tag HTML, browser bisa membacanya sebagai markup, bukan sebagai teks biasa.

**Penyebab:**
Preview catatan memakai `innerHTML`:

```js
preview.innerHTML = "Catatan: " + note;
```

Karena nilai `note` berasal langsung dari input pengguna, cara ini membuka risiko XSS atau manipulasi tampilan.

**Cara menyelesaikan:**
Ganti `innerHTML` menjadi `textContent` agar semua isi catatan diperlakukan sebagai teks biasa.

**Status:** Sudah diperbaiki di `hari-2/main.js`.

## 3. Harga produk bisa dimanipulasi dari DevTools

**Kategori:** Keamanan

**Masalah:**
Harga yang masuk ke keranjang berasal dari atribut `data-price` pada tombol `+`. Pengguna bisa membuka DevTools, mengubah nilai `data-price`, lalu menambahkan produk dengan harga palsu.

**Penyebab:**
Event tombol mengirim harga dari DOM ke fungsi `addToCart()`:

```js
addToCart(target.dataset.id, Number(target.dataset.price));
```

Lalu fungsi tersebut menyimpan harga dari parameter:

```js
cart[id].price = price;
```

DOM berada di sisi client dan bisa dimodifikasi pengguna, jadi tidak boleh dijadikan sumber kebenaran untuk harga.

**Cara menyelesaikan:**
`addToCart()` hanya menerima `id`, lalu mengambil harga resmi dari array `products`.

**Status:** Sudah diperbaiki di `hari-2/main.js`.

## 4. Total pembayaran tidak diformat konsisten

**Kategori:** Bug

**Masalah:**
Total pembayaran bisa tampil sebagai angka mentah JavaScript, bukan format uang dua desimal. Contohnya total berpotensi muncul seperti `1.7999999999999998`, sementara harga item lain tampil rapi seperti `$1.50`.

**Penyebab:**
Nilai total langsung dimasukkan ke tampilan:

```js
totalPriceEl.textContent = total;
```

Di modal checkout juga total akhir langsung memakai `${total}`.

**Cara menyelesaikan:**
Gunakan `toFixed(2)` saat menampilkan total di sidebar dan modal checkout.

**Status:** Sudah diperbaiki di `hari-2/main.js`.

## 5. Kupon rahasia tersimpan di kode client

**Kategori:** Keamanan

**Masalah:**
Kode kupon internal tersimpan langsung di JavaScript:

```js
const KUPON_RAHASIA = "TEMANFARMER";
```

Karena file JavaScript dikirim ke browser, pengguna bisa membaca kode tersebut lewat DevTools atau file source, lalu memakai diskon 90%.

**Penyebab:**
Rahasia bisnis ditempatkan di sisi client. Semua data di sisi client harus dianggap bisa dilihat dan dimodifikasi pengguna.

**Cara menyelesaikan:**
- Hapus kupon rahasia/backdoor dari kode client.
- Gunakan kupon publik dengan diskon wajar untuk demo.
- Di aplikasi produksi, validasi kupon dan hitung diskon di server, bukan di browser.

**Status:** Sudah diperbaiki di `hari-2/main.js` untuk versi demo statis.
