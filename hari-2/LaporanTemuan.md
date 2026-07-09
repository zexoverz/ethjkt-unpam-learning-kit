# Laporan Temuan Keamanan, Bug, dan Etika - Hari 2

## Ringkasan

Audit: file UI, CSS, layout, warna, dan desain tidak diubah. Perubahan source code difokuskan pada   `main.js`.

## Findings #1 - Matematika Uang

-Masalah: Total harga berisiko salah karena logika subtotal dan total dihitung langsung di beberapa tempat. Pola ini rawan membuat accumulator tidak di-reset dengan benar atau menghasilkan nilai yang tidak konsisten setelah checkout berikutnya.

-Lokasi penyebab: Variabel accumulator `totalPrice` di `renderCart()` dan `subtotal` di `openReview()` sebelumnya dihitung terpisah. Total juga langsung ditulis tanpa format uang yang konsisten.

-Perbaikan: Perhitungan dipusatkan ke fungsi `calculateSubtotal()` dan `calculateTotal(subtotal)`. Total selalu dihitung dari isi `cart` saat ini, bukan dari nilai tampilan atau state lama. Output uang diformat melalui `formatMoney()`.

-Alasan bug terjadi: Perhitungan uang yang tersebar membuat state dan accumulator mudah tidak sinkron. Jika accumulator tidak dibuat dari sumber data saat ini, total lama dapat ikut terbawa ke transaksi baru.

-Prinsip : Accumulator harus dimulai dari nilai netral, seperti `0`, pada setiap perhitungan baru. Nilai turunan seperti subtotal dan total sebaiknya dihitung ulang dari sumber data utama, bukan disimpan sebagai state permanen.

## Findings #2 - BUG Input NaN

-Masalah: Input jumlah barang menerima nilai seperti `+` atau `-`, lalu total dapat menjadi `$NaN`.

-Lokasi penyebab: Event `input` pada `.edit-quantity-input` sebelumnya menggunakan `parseInt(target.value, 10)`, lalu meneruskan hasilnya ke `updateQuantity()`.

-Perbaikan: Input sekarang dikonversi dengan `Number(target.value)` dan divalidasi menggunakan `Number.isInteger(quantity)` serta `quantity > 0`. Nilai tidak valid ditolak sebelum masuk ke `cart`.

-Alasan bug terjadi: Karakter seperti `+` dan `-` dapat muncul sementara pada input bertipe number di browser. Ketika diparse, nilainya menjadi `NaN`. Jika `NaN` masuk ke `cart[id].count`, semua perhitungan yang memakai nilai tersebut ikut menjadi `NaN`.

-Prinsip : Validasi input harus dilakukan sebelum data masuk ke state aplikasi. Data numerik harus diperiksa tipe, rentang, dan formatnya. Nilai yang gagal validasi tidak boleh dipakai untuk perhitungan.

## Findings #3 - XSS pada Notes for Farmers

-Masalah: Catatan pengguna seperti `<b>nangka</b>` sebelumnya dirender sebagai HTML pada preview keranjang.

-Lokasi penyebab: Preview catatan di `renderCart()` sebelumnya memakai `preview.innerHTML = "Catatan: " + note`.

-Perbaikan: Rendering catatan diganti menjadi `preview.textContent = "Catatan: " + note`.

-Alasan risiko XSS: `innerHTML` meminta browser menafsirkan string sebagai markup HTML. Jika input pengguna berisi tag atau script berbahaya, browser dapat menjalankannya sebagai bagian dari halaman.

-Mengapa solusi aman: `textContent` memperlakukan input sebagai teks biasa. Karakter seperti `<` dan `>` tidak dieksekusi sebagai HTML.

-Prinsip : Sanitization dan output encoding harus diterapkan sesuai konteks. Untuk menampilkan input pengguna sebagai teks, gunakan API teks seperti `textContent`, bukan HTML parser seperti `innerHTML`.

## Findings #4 - Hardcoded Secret

-Masalah: Kode kupon `TEMANFARMER` disimpan langsung di JavaScript sehingga bisa dilihat lewat DevTools.

-Lokasi penyebab: Konstanta `KUPON_RAHASIA` sebelumnya berada di sisi client.

-Perbaikan: Secret dihapus dari JavaScript. Validasi kupon dipindahkan ke fungsi `validateCouponOnServer(code)` yang mengirim kode ke endpoint server `/api/coupons/validate`.

-Pendekatan yang lebih aman: Server menyimpan daftar kupon dan aturan diskon, lalu client hanya mengirim kode yang dimasukkan pengguna. Server membalas status valid dan nilai diskon tanpa membocorkan daftar kupon.

-Prinsip : Browser adalah lingkungan yang dikendalikan pengguna. Secret, aturan promosi sensitif, dan otorisasi harus berada di server.

-Risiko jika tetap di browser: Pengguna dapat membaca secret, memakai kupon tanpa hak, membagikan kode internal, atau mengubah logika validasi di DevTools.

## Findings #5 - Client-Side Price Manipulation

-Masalah: Harga produk dapat dimanipulasi dengan mengubah atribut `data-price` pada tombol plus melalui DevTools.

-Lokasi penyebab: Tombol plus sebelumnya membawa `data-price`, lalu event click memanggil `addToCart(target.dataset.id, Number(target.dataset.price))`. Fungsi `addToCart()` kemudian menyimpan `cart[id].price = price`.

-Perbaikan: Atribut `data-price` dihapus. `addToCart(id)` sekarang mencari produk berdasarkan `id` dan mengambil harga dari katalog resmi `products`.

-Alasan perbaikan: Client DOM tidak boleh menjadi sumber kebenaran untuk harga. Dengan mengambil harga dari katalog aplikasi, manipulasi atribut tombol tidak lagi memengaruhi total.

-Prinsip : Ada trust boundary antara client dan server. Dalam aplikasi produksi, harga final tetap harus dihitung dan diverifikasi di server, karena semua data dari browser dapat dimodifikasi pengguna.

## Findings #6 - False Scarcity

-Masalah: Angka stok berubah setiap refresh karena dibuat acak, sehingga menciptakan kesan stok hampir habis meskipun nilainya tidak konsisten.

-Lokasi penyebab: `renderProducts()` sebelumnya memakai `Math.floor(Math.random() * 5) + 1` untuk membuat `sisa` stok.

-Perbaikan : Setiap produk sekarang memiliki properti `stock` tetap di katalog. Tampilan stok menggunakan nilai tersebut dan teksnya dibuat lebih netral: `stok tersedia: ...`.

-Mengapa ini dark pattern: Stok acak yang terlihat rendah dapat menekan pengguna agar cepat membeli berdasarkan kelangkaan palsu.

-Prinsip : Informasi ketersediaan barang harus akurat, stabil, dan dapat dipertanggungjawabkan. Jika stok real-time belum tersedia, aplikasi tidak boleh menampilkan klaim kelangkaan palsu.

-Dampak ke kepercayaan: Kelangkaan palsu dapat meningkatkan pembelian sesaat, tetapi merusak kredibilitas toko ketika pengguna menyadari angka berubah tanpa alasan nyata.

## Findings #7 - Hidden Cost

-Masalah: Biaya penanganan sebelumnya baru terlihat jelas pada modal checkout, sehingga pengguna baru mengetahui rincian biaya di tahap akhir.

-Lokasi penyebab: `HANDLING_FEE` ditambahkan pada total di `renderCart()` dan dirinci di `openReview()`, tetapi tidak ditampilkan sebagai komponen biaya pada keranjang sebelum checkout.

-Perbaikan: `renderCart()` sekarang menampilkan item `Biaya penanganan` di detail keranjang sebelum pengguna menekan checkout.

-Mengapa ini dark pattern: Biaya yang baru muncul di akhir proses dapat membuat pengguna merasa sudah terlalu jauh untuk batal, sehingga keputusan pembelian tidak sepenuhnya transparan.

Prinsip benar: Semua biaya wajib, termasuk handling fee, pajak, atau biaya layanan, harus terlihat sebelum pengguna masuk tahap akhir pembayaran.

-Dampak ke kepercayaan: Transparansi biaya mengurangi kejutan, komplain, dan pembatalan. Pengguna lebih mudah percaya ketika total yang terlihat sejak awal sama dengan total checkout.

#Kesimpulan 
# Kesimpulan
Berdasarkan hasil pengujian, masih ditemukan beberapa **bug**, **celah keamanan**, dan **masalah etika** pada aplikasi Pasar Pagi. Setelah dilakukan analisis, setiap temuan berhasil diidentifikasi penyebabnya serta diperbaiki tanpa mengubah tampilan maupun fitur utama aplikasi. Perbaikan ini membuat aplikasi menjadi lebih stabil, lebih aman, dan lebih transparan bagi pengguna.