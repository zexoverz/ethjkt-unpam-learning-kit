# AUDIT ANOMALI - PASAR PAGI (POST-FIX)

Laporan ini mencatat anomali yang sebelumnya ditemukan di `hari-2`, lalu status perbaikannya setelah patch terbaru.

---

## Ringkasan Status

| No | Area | Status | Perubahan Utama |
| --- | --- | --- | --- |
| 1 | Validasi quantity kosong | Fixed | Input invalid sekarang menghapus item, bukan menyimpan `count = 0` |
| 2 | Kupon rahasia | Fixed untuk static demo | Secret/hash client dihapus; kupon tidak lagi memberi diskon di browser |
| 3 | Checkout dipercaya sebagai transaksi nyata | Fixed untuk static demo | UI diubah menjadi estimasi/simulasi lokal, bukan pembayaran/order nyata |
| 4 | Laporan lama tidak sinkron | Fixed | Audit ini menggantikan status lama dengan status post-fix |
| 5 | XSS note | Tetap aman | Note tetap dirender memakai `textContent` |
| 6 | CDN tanpa SRI | Fixed | Font Awesome CDN dan Google Fonts dihapus |
| 7 | Missing CSP | Fixed | CSP ditambahkan di `index.html` |
| 8 | `innerHTML` future risk | Fixed | Render dinamis dipindahkan ke `createElement` + `textContent` |
| 9 | Resource eksternal gambar/font | Partially fixed / accepted risk | Font/icon eksternal dihapus; gambar produk Cloudinary dipertahankan karena dibutuhkan untuk tampilan |

---

## 1. Validasi Quantity Kosong

### Sebelum

Input quantity kosong bisa menghasilkan item `count = 0`, tetapi cart masih dianggap berisi item. Akibatnya user bisa membuka checkout dengan item nol dan tetap melihat biaya penanganan.

### Perbaikan

`updateQuantity()` sekarang menolak nilai invalid, non-integer, dan nilai `<= 0` dengan menghapus item dari cart.

```javascript
if (!Number.isInteger(quantity) || quantity <= 0) {
  delete cart[product.id];
  showToast("Item dihapus karena jumlah tidak valid.");
}
```

### Status

Fixed. Keranjang kosong tidak bisa lanjut ke review estimasi.

---

## 2. Kupon Rahasia dan Validasi Diskon di Client

### Sebelum

Kode lama menyimpan hash kupon di client dan komentar membocorkan nilai kupon. Browser juga langsung mengubah `diskon = 0.9`.

### Perbaikan

Hash, secret, dan logika diskon client-side dihapus. Input kupon sekarang hanya memberi pesan bahwa validasi diskon harus dilakukan server.

```javascript
couponMsg.textContent = "Kupon tidak diterapkan di demo statis. Validasi diskon harus dilakukan server.";
```

### Status

Fixed untuk aplikasi static demo. Tidak ada lagi kupon rahasia atau diskon finansial yang diputuskan browser.

Catatan: untuk toko produksi, fitur kupon harus dibuat di backend.

---

## 3. Checkout Terlalu Dipercaya Sebagai Transaksi Nyata

### Sebelum

UI memakai bahasa pembayaran/order sehingga terlihat seperti transaksi nyata, padahal semua harga, stok, total, dan kupon hanya ada di browser.

### Perbaikan

Bahasa UI diubah menjadi simulasi/estimasi:

- `Lanjut ke Pembayaran` menjadi `Review Estimasi`
- `Konfirmasi Pesanan` menjadi `Simpan Simulasi`
- modal menjelaskan bahwa ini simulasi lokal, bukan pembayaran
- toast akhir menjelaskan belum ada pembayaran atau order nyata

### Status

Fixed untuk static demo. Aplikasi tidak lagi berpura-pura sebagai flow pembayaran produksi.

---

## 4. Laporan Lama Tidak Sinkron

### Sebelum

`LAPORAN-TEMUAN.md` mendeskripsikan beberapa celah historis yang tidak lagi cocok dengan kode aktif.

### Perbaikan

Audit post-fix ini menjadi sumber status terbaru. Jika `LAPORAN-TEMUAN.md` tetap dipakai sebagai dokumen pembelajaran historis, pembaca harus membedakannya dari status kode saat ini.

### Status

Fixed melalui laporan post-fix ini. Rekomendasi tambahan: jadikan `LAPORAN-TEMUAN.md` sebagai arsip historis atau update total agar tidak rancu.

---

## 5. XSS di Note

### Hasil Verifikasi

Note tetap aman karena ditampilkan dengan `textContent`, bukan `innerHTML`.

Payload seperti ini akan tampil sebagai teks biasa:

```html
<img src=x onerror=alert('XSS_NOTE')>
```

### Status

Tetap aman.

---

## 6. CDN Tanpa SRI

### Sebelum

Halaman memakai Font Awesome CDN dan CSS memakai Google Fonts.

### Perbaikan

Dependency eksternal dihapus:

- link Font Awesome dihapus dari `index.html`
- `@import` Google Fonts dihapus dari `style.css`
- font diganti ke system font

### Status

Fixed. Tidak ada dependency CSS/font dari CDN.

---

## 7. Content Security Policy

### Sebelum

Tidak ada CSP.

### Perbaikan

`index.html` sekarang punya CSP:

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'">
```

### Status

Fixed untuk static site ini.

---

## 8. Pemakaian `innerHTML`

### Sebelum

Render produk, cart, dan review memakai template string dengan `innerHTML`.

### Perbaikan

Render dinamis sekarang memakai:

- `document.createElement`
- `textContent`
- `appendChild`
- helper `clearChildren()`

### Status

Fixed. Tidak ada `innerHTML` di `main.js`.

---

## 9. Resource Eksternal Gambar dan Font

### Sebelum

Produk memakai gambar dari Cloudinary dan font dari Google Fonts.

### Perbaikan

Font dan icon eksternal dihapus:

- Font Awesome CDN dihapus dari `index.html`
- Google Fonts `@import` dihapus dari `style.css`
- font memakai system font

Gambar produk nyata dipulihkan memakai Cloudinary karena visual buah asli dibutuhkan untuk pengalaman website. Risiko dibatasi dengan:

- CSP hanya mengizinkan gambar dari `https://res.cloudinary.com`
- setiap image memakai `referrerPolicy = "no-referrer"`
- gambar dimuat sebagai konten tampilan, bukan script/style executable

### Status

Partially fixed / accepted risk. Tidak ada font/icon eksternal, tetapi gambar produk tetap memakai Cloudinary dengan pembatasan CSP.

---

## Checklist Verifikasi

Gunakan checklist ini setelah membuka `index.html`:

1. Tambah produk, hapus angka quantity sampai kosong. Item harus hilang dan checkout tidak boleh lanjut jika cart kosong.
2. Isi note dengan `<img src=x onerror=alert('XSS_NOTE')>`. Payload harus tampil sebagai teks, tidak menjalankan alert.
3. Isi kode kupon apa pun, lalu klik `Cek`. Tidak boleh ada diskon client-side.
4. Klik `Review Estimasi`. Modal harus menyatakan ini simulasi lokal, bukan pembayaran.
5. Cari di source: tidak boleh ada `innerHTML`, `TEMANFARMER`, `KUPON_HASH`, `@import`, atau Font Awesome.
6. Pastikan satu-satunya domain eksternal yang tersisa di active source adalah `https://res.cloudinary.com` untuk gambar produk.

---

## Kesimpulan

Semua anomali yang tercatat di audit sebelumnya sudah ditangani untuk konteks static demo. Batas pentingnya: aplikasi ini tetap bukan toko produksi. Jika ingin menjadi toko nyata, backend tetap wajib menghitung harga, stok, kupon, total, dan order.
