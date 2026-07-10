# Log Tugas Hari-2: Perbaikan Bug Aplikasi Pasar Pagi

## Identitas Program

Nama aplikasi: Pasar Pagi  
Jenis aplikasi: Aplikasi belanja buah-buahan langsung dari petani  
File utama yang diperbaiki:

- `keranjang.js`
- `style.css`

## Ringkasan Pekerjaan

Pada tugas hari-2, dilakukan analisis dan perbaikan beberapa bug pada aplikasi belanja buah. Perbaikan difokuskan pada keamanan input, manipulasi harga, validasi jumlah barang, konsistensi stok, format harga, dan tampilan tombol saat stok habis.

Setelah setiap bagian penting diperbaiki, program dicek kembali menggunakan pemeriksaan sintaks JavaScript dengan:

```bash
node --check keranjang.js
```

Program juga dibuka kembali melalui browser untuk memastikan hasil akhir dapat dicoba langsung.

## Daftar Bug dan Solusi

### 1. Bug XSS pada Catatan untuk Petani

Masalah:
Input catatan dari pengguna sebelumnya ditampilkan menggunakan `innerHTML`. Hal ini berbahaya karena pengguna bisa memasukkan kode HTML atau JavaScript berbahaya.

Contoh risiko:

```html
<img src=x onerror=alert(1)>
```

Solusi:
Penggunaan `innerHTML` diganti menjadi `textContent`, sehingga input pengguna hanya dianggap sebagai teks biasa.

Hasil:
Catatan tetap tampil, tetapi tidak dapat menjalankan HTML atau script berbahaya.

### 2. Bug Manipulasi Harga dari Browser

Masalah:
Harga produk sebelumnya diambil dari atribut `data-price` pada tombol di halaman. Atribut ini bisa diubah melalui DevTools browser, sehingga pengguna bisa memanipulasi harga barang.

Solusi:
Fungsi tambah barang diubah agar selalu mengambil harga dari katalog resmi di dalam data `products`, bukan dari atribut HTML.

Hasil:
Harga barang di keranjang tetap mengikuti data resmi aplikasi meskipun atribut HTML dimanipulasi.

### 3. Bug Quantity Tidak Valid

Masalah:
Jumlah barang pada input keranjang bisa dikosongkan, diisi angka tidak valid, atau diisi angka terlalu besar. Hal ini bisa menyebabkan total menjadi `NaN` atau jumlah pembelian melebihi stok.

Solusi:
Ditambahkan validasi:

- Quantity harus berupa angka integer.
- Quantity tidak boleh melebihi stok produk.
- Jika input tidak valid, keranjang dirender ulang ke kondisi valid.

Hasil:
Jumlah barang menjadi lebih aman dan tidak menyebabkan total harga rusak.

### 4. Bug Stok Acak dan Tidak Konsisten

Masalah:
Jumlah stok sebelumnya dibuat menggunakan `Math.random()`, sehingga stok berubah setiap kali halaman dirender ulang. Ini membuat informasi stok tidak konsisten dan membingungkan pengguna.

Solusi:
Setiap produk diberi nilai `stock` tetap di katalog produk. Jumlah sisa stok dihitung dari:

```js
product.stock - quantity
```

Hasil:
Stok menjadi stabil, konsisten, dan dapat dipakai untuk membatasi pembelian.

### 5. Bug Pembelian Melebihi Stok

Masalah:
Walaupun halaman menampilkan sisa stok, aplikasi sebelumnya tidak benar-benar membatasi jumlah barang yang bisa dibeli.

Solusi:
Fungsi tambah barang sekarang mengecek batas stok. Jika jumlah barang sudah mencapai stok, tombol tambah tidak bisa digunakan dan aplikasi menampilkan pesan.

Hasil:
Pengguna tidak bisa membeli barang melebihi stok yang tersedia.

### 6. Bug Format Total Harga

Masalah:
Total harga sebelumnya ditampilkan langsung sebagai angka mentah. Pada JavaScript, operasi desimal bisa menghasilkan tampilan panjang seperti `3.0999999999999996`.

Solusi:
Ditambahkan helper:

```js
const formatMoney = (value) => value.toFixed(2);
```

Helper ini digunakan untuk menampilkan harga produk, subtotal, potongan kupon, dan total akhir.

Hasil:
Harga selalu tampil dalam format dua angka desimal, misalnya `$3.10`.

### 7. Bug Kupon Rahasia di Frontend

Masalah:
Kode kupon internal `TEMANFARMER` sebelumnya ditulis langsung di file JavaScript dan memberikan diskon 90%. Karena aplikasi frontend bisa dibaca oleh pengguna, kupon tersebut tidak benar-benar rahasia.

Solusi:
Kupon internal diganti menjadi kupon promosi publik:

```js
PASARPAGI10
```

Diskon juga dikurangi menjadi 10% agar lebih wajar untuk demo aplikasi.

Hasil:
Aplikasi tidak lagi menyimpan kupon internal berisiko tinggi di frontend.

Catatan:
Untuk aplikasi produksi, validasi kupon sebaiknya dilakukan di backend/server.

### 8. Bug Tampilan Tombol Saat Stok Habis

Masalah:
Ketika stok habis, pengguna sebelumnya masih bisa melihat tombol tambah seperti tombol aktif.

Solusi:
Tombol tambah diberi atribut `disabled` saat stok habis. Di `style.css`, ditambahkan style khusus untuk tombol disabled.

Hasil:
Tombol tambah terlihat tidak aktif dan tidak bisa diklik saat stok habis.

### 9. Bug Karakter Rusak pada Tombol Minus

Masalah:
Ada karakter minus yang tampil rusak akibat masalah encoding.

Solusi:
Karakter minus diganti menjadi karakter ASCII sederhana:

```text
-
```

Hasil:
Tombol minus tampil normal di browser.

## Hasil Pengujian

Pengujian yang dilakukan:

- Mengecek sintaks JavaScript dengan `node --check keranjang.js`.
- Mencari ulang pola bug lama seperti `Math.random`, `data-price`, kupon lama, dan penggunaan `innerHTML` untuk catatan.
- Membuka ulang aplikasi di browser.
- Mengecek alur dasar: tambah barang, kurangi barang, ubah quantity, gunakan kupon, dan checkout.

Hasil:
Program dapat berjalan kembali tanpa error sintaks, dan bug utama yang ditemukan pada hari sebelumnya sudah diperbaiki.

## Kesimpulan

Perbaikan hari-2 membuat aplikasi Pasar Pagi lebih aman dan stabil. Bug paling penting yang berhasil diperbaiki adalah XSS dari catatan pengguna, manipulasi harga dari browser, quantity tidak valid, stok acak, pembelian melebihi stok, dan format total harga yang tidak rapi.

Masih ada catatan penting untuk pengembangan berikutnya: jika aplikasi ingin dipakai secara nyata, validasi harga, stok, dan kupon sebaiknya dipindahkan ke backend agar tidak hanya bergantung pada JavaScript di browser.
