# HASIL PERBAIKAN RIVALDI - PASAR PAGI

Dokumen ini mencatat perbaikan untuk temuan pada `LAPORAN-TEMUAN-RIALDI.md`.
Kondisi `hari-2/main.js` saat ini sudah berisi perbaikan utama.

---

## Ringkasan Perbaikan

| # | Area | Perbaikan | Status |
|---|------|-----------|--------|
| 1 | BUG | Validasi input jumlah agar `NaN` tidak masuk ke keranjang | Selesai |
| 2 | BUG | Jumlah item dibatasi stok resmi | Selesai |
| 3 | KEAMANAN | Harga diambil dari katalog, bukan DOM | Selesai |
| 4 | KEAMANAN | Catatan user ditampilkan dengan `textContent` | Selesai |
| 5 | KEAMANAN | Kupon tidak lagi plain-text; catatan server tetap wajib | Parsial |
| 6 | ETIKA | Stok memakai data nyata, bukan angka acak | Selesai |
| 7 | ETIKA | Rincian biaya tampil sejak awal | Selesai |

---

## Detail Perbaikan

## 1. Input jumlah divalidasi

Perbaikan:
- `updateQuantity` mengecek `Number.isInteger(quantity)`.
- Nilai kosong, huruf, dan `NaN` tidak mengubah state keranjang.
- Nilai `<= 0` menghapus item dengan jelas.

Kenapa benar:
State keranjang tidak boleh menerima nilai rusak. Validasi dilakukan di satu
fungsi agar semua jalur perubahan jumlah memakai aturan yang sama.

Cara cek:
1. Tambahkan barang ke keranjang.
2. Kosongkan input jumlah atau isi huruf.
3. Total tidak berubah menjadi `NaN`.

---

## 2. Jumlah dibatasi stok

Perbaikan:
- Produk memiliki field `stock`.
- Tombol plus disabled saat stok habis.
- Input manual yang melebihi stok dipotong ke stok maksimal dan menampilkan
  toast.

Kenapa benar:
Stok harus ditegakkan di UI dan logic, bukan hanya ditampilkan sebagai teks.

Cara cek:
1. Tambahkan Apel Fuji.
2. Ubah jumlah menjadi `999`.
3. Jumlah dipaksa kembali ke stok maksimal.

---

## 3. Harga tidak dipercaya dari DOM

Perbaikan:
- Tombol plus hanya mengirim `data-id`.
- `addToCart(id)` mencari produk dari `products`.
- Saat render keranjang, nama dan harga disinkronkan ulang dari katalog resmi.

Kenapa benar:
DOM bisa diedit user. Harga harus berasal dari sumber data resmi, bukan atribut
HTML yang bisa dimanipulasi.

Cara cek:
1. Edit atribut tombol lewat DevTools.
2. Klik plus.
3. Harga tetap mengikuti katalog.

---

## 4. XSS catatan dicegah

Perbaikan:
- Preview catatan memakai `textContent`.
- Modal review juga memakai `textContent`.

Kenapa benar:
`textContent` memperlakukan input user sebagai teks biasa, sehingga payload
seperti `<img onerror=...>` tidak dieksekusi.

Cara cek:
1. Isi catatan dengan `<img src=x onerror=alert('xss')>`.
2. Payload tampil sebagai teks.
3. Alert tidak muncul.

---

## 5. Kupon dipisahkan dari plain-text client

Perbaikan:
- Kode kupon tidak disimpan sebagai string polos.
- Client membandingkan hash SHA-256 dari input.
- Komentar kode menjelaskan bahwa validasi server tetap wajib untuk produksi.

Kenapa statusnya parsial:
Aplikasi ini masih statis. Selama diskon diputus di browser, keamanan penuh
belum mungkin. Perbaikan tuntas adalah server menghitung kupon dan total final.

Cara cek:
1. Cari kode kupon plain-text di `main.js`.
2. String rahasia tidak muncul lagi.

---

## 6. Stok dibuat jujur

Perbaikan:
- Stok berasal dari `product.stock`.
- Sisa stok dihitung dari stok dikurangi jumlah di keranjang.
- Angka stok tidak lagi memakai random.

Kenapa benar:
Pembeli menerima informasi yang stabil dan dapat dijelaskan, bukan angka palsu
untuk menciptakan urgensi.

Cara cek:
1. Perhatikan stok produk.
2. Klik plus satu kali.
3. Stok turun satu dan tidak berubah acak.

---

## 7. Biaya dibuat transparan

Perbaikan:
- Fungsi `buildBreakdown` menjadi sumber hitungan biaya.
- Fungsi `renderBreakdownRows` dipakai di sidebar dan modal.
- Subtotal, biaya penanganan, diskon, dan total tampil jelas.

Kenapa benar:
Pembeli melihat biaya tambahan sebelum checkout, bukan saat langkah terakhir.
Sidebar dan modal juga memakai hitungan yang sama, jadi tidak mudah tidak
sinkron.

Cara cek:
1. Tambahkan Apel Fuji.
2. Sidebar langsung menampilkan subtotal, biaya penanganan, dan total.
3. Buka checkout, rinciannya sama.

---

## Catatan Akhir

Perbaikan client-side membantu mencegah bug dan manipulasi sederhana, tetapi
untuk toko sungguhan total pembayaran, harga, stok, dan kupon tetap harus
divalidasi ulang di server.
