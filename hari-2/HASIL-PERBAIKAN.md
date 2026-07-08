# DOKUMEN HASIL PERBAIKAN - PASAR PAGI

Dokumen ini menjelaskan perbaikan yang telah diterapkan pada aplikasi **Pasar Pagi** di direktori `hari-2` untuk menyingkirkan semua celah keamanan, bug fungsional, dan pola gelap (dark patterns) secara total ke akar masalahnya (root cause), bukan sekadar tempelan sementara (bandage).

Perbaikan dilakukan pada berkas-berkas berikut:
1. **[main.js](file:///C:/Users/Hype%20AMD/OneDrive/Dokumen/programming/Workshop%20Ai%20&%20Blockchain/ethjkt-unpam-learning-kit/hari-2/main.js)** (Logika aplikasi)
2. **[index.html](file:///C:/Users/Hype%20AMD/OneDrive/Dokumen/programming/Workshop%20Ai%20&%20Blockchain/ethjkt-unpam-learning-kit/hari-2/index.html)** (Penyedia elemen visual rincian harga)
3. **[style.css](file:///C:/Users/Hype%20AMD/OneDrive/Dokumen/programming/Workshop%20Ai%20&%20Blockchain/ethjkt-unpam-learning-kit/hari-2/style.css)** (Tata letak rincian keranjang & tombol disabled)

---

## Ringkasan Solusi yang Diterapkan & Alasannya

### 1. Perbaikan Presisi Matematika Uang (Float Precision Bug)
* **Solusi**: Memformat semua variabel total harga akhir, subtotal, dan diskon dengan `.toFixed(2)` di fungsi `renderCart()` dan `openReview()`.
* **Alasan**: JavaScript menyimpan angka desimal sebagai representasi biner floating-point (IEEE 754) yang dapat menghasilkan pembulatan tidak presisi (seperti `0.35000000000000003`). Memformatnya dengan `.toFixed(2)` menjamin tampilan di UI selalu tepat dua angka di belakang koma (misal: `$0.35`).

### 2. Penanganan Input Kuantitas Kosong & NaN (NaN Propagation)
* **Solusi**: 
  * Di event listener `input`, jika input kuantitas dikosongkan (`val === ""`), fungsi langsung mengembalikan kontrol (`return`) agar pengguna bisa mengetik angka baru secara wajar tanpa langsung memicu error `NaN`.
  * Di event listener `focusout` (blur), jika input ditinggalkan dalam keadaan kosong, sistem memanggil `renderCart()` untuk merender ulang input sesuai kuantitas terakhir yang tersimpan di memori JavaScript.
  * Di fungsi `updateQuantity()`, kuantitas dibatasi tidak boleh melebihi jumlah stok yang tersedia.
* **Alasan**: Melindungi kestabilan state keranjang belanja dari kehancuran variabel (`NaN`) ketika pengguna menghapus angka di kotak input untuk mengetik angka baru.

### 3. Perlindungan terhadap DOM-based XSS (Keamanan Catatan)
* **Solusi**: Mengganti penulisan konten catatan di sidebar keranjang belanja dan modal konfirmasi dari `.innerHTML` menjadi `.textContent`.
* **Alasan**: `.textContent` memperlakukan input pengguna murni sebagai data string tekstual biasa, bukan instruksi HTML/JavaScript. Upaya penyuntikan tag script seperti `<img src=x onerror=...>` tidak akan dieksekusi oleh browser dan hanya ditampilkan sebagai teks aman biasa.

### 4. Pengamanan Kupon via Hashing SHA-256 (Client-side Security)
* **Solusi**: Menyimpan representasi hash SHA-256 dari kupon `TEMANFARMER` (`5a2fa10e75a6c117b34bdf73dfc9cfde1432f7a0dc4d8ea02830f2f534ef06b7`) pada konstanta `KUPON_HASH`. Kode kupon yang diinput pembeli di-hash secara asinkron menggunakan pustaka kriptografi browser bawaan (`crypto.subtle.digest`) lalu dicocokkan dengan hash tersebut.
* **Alasan**: Ini menghilangkan penyimpanan kode kupon dalam format plain-text yang sangat mudah ditemukan pembeli nakal melalui pemeriksaan source code browser. Hashing searah (one-way hashing) memastikan kode kupon asli tidak bisa langsung dibaca dari kode JavaScript.

### 5. Perlindungan Integritas Harga (Price Tampering Protection)
* **Solusi**: Menghapus parameter `price` dari fungsi `addToCart(id)` dan menghapus atribut HTML `data-price` dari tombol plus `+` di produk. Fungsi `addToCart` kini selalu mencari objek barang langsung dari katalog tepercaya `products` menggunakan parameter `id`.
* **Alasan**: Memutus ketergantungan logika keranjang belanja terhadap nilai yang dapat dimanipulasi secara bebas oleh client melalui DevTools HTML. Dengan hanya mengirimkan `id`, client tidak memiliki kuasa untuk merubah harga barang.

### 6. Penerapan Sistem Stok Riil (Menghilangkan Fake Stock Scarcity)
* **Solusi**: 
  * Menambahkan properti `stock` tetap pada setiap item di array katalog `products`.
  * Menghitung sisa stok dinamis secara berkala (`product.stock - kuantitas_keranjang`).
  * Menambahkan status `disabled` pada tombol tambah `+` jika sisa stok habis, dan menambahkan validasi batas atas kuantitas di JavaScript.
  * Mengurangi stok katalog asli secara permanen saat pembeli mengklik "Konfirmasi Pesanan" (`placeOrder`).
* **Alasan**: Menghilangkan manipulasi kelangkaan palsu (dark pattern FOMO) serta menyelesaikan bug visual di mana stok berubah secara acak ketika pengguna mengetik catatan belanja.

### 7. Transparansi Biaya Penanganan (Menghilangkan Drip Pricing)
* **Solusi**: Menambahkan container `#cart-breakdown` di atas baris total harga pada sidebar keranjang belanja. Komponen subtotal, biaya penanganan (`$0.30`), dan diskon ditampilkan secara detail di keranjang dari awal, bukan hanya di langkah akhir konfirmasi checkout.
* **Alasan**: Menghilangkan taktik pola gelap (drip pricing) dengan memberikan transparansi biaya penuh secara jujur sejak pembeli pertama kali melihat harga di keranjang belanja mereka.

---

## Panduan Pengujian (Ulangi Langkah Eksploitasi)

Silakan muat ulang halaman aplikasi Pasar Pagi dan uji perbaikan dengan langkah-langkah berikut:

1. **Uji XSS**: Ketik `<img src=x onerror=alert(1)>` pada catatan petani. Tulisan tersebut akan dirender dengan aman sebagai teks murni dan tidak memicu pop-up.
2. **Uji Harga Palsu**: Klik kanan tombol `+` Apel Fuji di DevTools. Anda tidak akan menemukan atribut `data-price` untuk dimanipulasi. Upaya menambahkan manipulasi harga secara paksa juga tidak akan memengaruhi harga asli `$1.50`.
3. **Uji Stok Riil**: Tambahkan produk Anggur (stok asli: 5). Setelah Anda menambahkan 5 Anggur ke keranjang, tombol `+` akan terkunci otomatis (disabled), stok tertulis `Stok tersedia: 0 buah`, dan Anda tidak bisa menambahkan lebih banyak lagi. Klik Konfirmasi Pesanan, lalu periksa stok Anggur saat dimuat ulang; stok Anggur akan terpotong secara permanen.
4. **Uji Transparansi Biaya**: Tambahkan barang apa pun. Anda akan melihat biaya penanganan `$0.30` terdaftar secara jelas di rincian sidebar sebelum Anda menekan tombol checkout.
5. **Uji Validasi Input**: Hapus kuantitas di input keranjang belanja. State keranjang tidak akan crash ke `$NaN` dan akan kembali ke kuantitas semula saat fokus dilepas.
