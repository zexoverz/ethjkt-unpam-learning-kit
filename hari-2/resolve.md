# Resolve - Hari 2: Pasar Pagi

Dokumen ini menjelaskan perbaikan yang dilakukan berdasarkan `bug-board.md`.

## Ringkasan Perubahan

- `main.js` ditulis ulang agar render DOM lebih aman, perhitungan uang memakai cents, dan validasi keranjang berada di satu alur.
- `index.html` diberi Content Security Policy dan tidak lagi memuat Font Awesome dari CDN.
- `style.css` tidak lagi memakai Google Fonts eksternal, serta ditambah mode carousel, animasi expand, dan breakdown harga.
- Katalog produk sekarang tampil sebagai satu card carousel. Tombol `Expand` membuat card bergetar lalu berubah menjadi grid/list produk seperti sebelumnya.

---

## Resolve Temuan 1 - Total uang tidak konsisten

Perbaikan:
- Harga produk disimpan sebagai integer cents, misalnya `$1.50` menjadi `150`.
- Semua tampilan uang melewati helper `money(cents)` yang mengembalikan format dua desimal.

Alasan:
- Floating point JavaScript tidak cocok untuk menyimpan uang secara langsung karena bisa menghasilkan angka seperti `3.0999999999999996`.
- Integer cents membuat operasi penjumlahan, diskon, dan total lebih stabil.

---

## Resolve Temuan 2 - Input jumlah bisa menjadi `NaN`

Perbaikan:
- `updateQuantity` sekarang memakai `Number(value)` lalu memeriksa `Number.isInteger(quantity)`.
- Input kosong, huruf, desimal, angka kurang dari 1, dan angka melebihi batas ditolak atau dikoreksi.

Alasan:
- Input user tidak boleh langsung dipercaya walaupun tipe HTML-nya `number`.
- Validasi eksplisit mencegah cart count dan total berubah menjadi `NaN`.

---

## Resolve Temuan 3 - XSS dari catatan pembeli

Perbaikan:
- Semua output yang berasal dari user dibuat dengan `textContent` melalui helper `createEl`.
- Preview catatan dan review modal tidak lagi memakai `innerHTML`.

Alasan:
- `innerHTML` akan menafsirkan input user sebagai HTML.
- `textContent` menampilkan input sebagai teks biasa, sehingga payload seperti `<img src=x onerror=alert('xss')>` tidak dieksekusi.

---

## Resolve Temuan 4 - Kupon rahasia bocor di client

Perbaikan:
- Kode kupon rahasia dan diskon 90% dihapus dari JavaScript client.
- Pada demo statis ini, input kupon hanya dicatat dan diberi pesan bahwa diskon harus divalidasi saat pembayaran.

Alasan:
- Browser tidak bisa menjadi tempat menyimpan rahasia atau memutuskan diskon penting.
- Karena proyek ini belum punya backend, keputusan paling aman adalah tidak memberi diskon client-side palsu.

---

## Resolve Temuan 5 - Harga bisa dimanipulasi dari DOM

Perbaikan:
- Tombol tambah hanya membawa `data-id`.
- `addToCart` mengambil harga dari katalog resmi di memori berdasarkan `id`, bukan dari `data-price` di DOM.

Alasan:
- Atribut DOM bisa diedit lewat DevTools.
- Harga harus berasal dari sumber data yang dipercaya. Pada aplikasi produksi, validasi akhir tetap wajib di server.

---

## Resolve Temuan 6 - Klaim stok acak

Perbaikan:
- `Math.random()` untuk stok dihapus.
- Setiap produk memiliki `stock` tetap di katalog.
- UI menampilkan "Stok tersedia: X dari Y".

Alasan:
- Klaim stok harus berasal dari data, bukan angka acak.
- Ini menghapus dark pattern scarcity palsu dan membuat informasi stok bisa diaudit.

---

## Resolve Temuan 7 - Biaya penanganan tersembunyi

Perbaikan:
- Sidebar keranjang sekarang menampilkan breakdown: subtotal, biaya penanganan, kupon bila ada, dan total.
- Modal review memakai breakdown yang sama.

Alasan:
- Biaya tambahan harus terlihat sebelum user masuk ke langkah konfirmasi.
- Satu fungsi `renderBreakdown` mengurangi risiko angka sidebar dan modal tidak sinkron.

---

## Resolve Temuan 8 - Klaim stok tidak ditegakkan

Perbaikan:
- Tombol `+` otomatis disabled saat jumlah item mencapai stok produk.
- `addToCart` juga menolak penambahan jika jumlah sudah sama dengan stok.

Alasan:
- UI disabled saja tidak cukup karena DOM bisa dimanipulasi.
- Validasi tetap dilakukan di fungsi yang mengubah state keranjang.

---

## Resolve Temuan 9 - Tidak ada batas maksimum jumlah barang

Perbaikan:
- Ditambahkan `MAX_TOTAL_ITEMS = 24`.
- Input jumlah punya `max`, dan `updateQuantity` membatasi jumlah berdasarkan stok item serta batas total pesanan.

Alasan:
- Order perlu batas kewajaran agar UI dan transaksi tidak rusak.
- Validasi dilakukan pada input dan pada state update agar tidak bergantung pada atribut HTML saja.

---

## Resolve Temuan 10 - Dependensi eksternal tanpa integritas

Perbaikan:
- Link Font Awesome CDN dihapus dari `index.html`.
- Import Google Fonts dihapus dari `style.css`; aplikasi memakai system font dan Georgia.
- `index.html` diberi Content Security Policy yang membatasi script/style ke `self` dan image ke `self` + Cloudinary.

Alasan:
- Menghapus dependensi eksternal lebih sederhana dan lebih kuat daripada memasang SRI untuk aset yang tidak wajib.
- CSP mengurangi dampak jika ada injeksi markup atau aset yang tidak diharapkan.

---

## Resolve UI Baru - Carousel dan Expand

Perbaikan:
- Katalog default sekarang menampilkan satu card produk.
- Tombol kiri/kanan mengganti produk aktif.
- Tombol `Expand` menambahkan animasi shake/burst lalu mengubah katalog menjadi grid produk.

Alasan:
- Permintaan UI menginginkan satu card yang bisa dislide, tetapi tetap bisa kembali ke daftar lengkap.
- Mode carousel membuat katalog lebih fokus, sementara expand menjaga workflow belanja cepat seperti versi sebelumnya.
