# CHANGELOG — Pasar Pagi (hari-2)

Semua perubahan penting pada proyek ini didokumentasikan di sini.  
Format mengacu pada [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.1.0] — 2026-07-08

### Fixed

#### Bug Fixes

- **`69a456d`** `fix: format total price with toFixed(2) to prevent floating-point display`  
  Total harga di sidebar kini selalu ditampilkan dengan 2 desimal (misal `$1.80`), mencegah angka floating-point mentah seperti `$1.7999999999...` tampil ke pengguna.  
  _File: `main.js` L123_

- **`f9ecf5b`** `fix: validate quantity input to handle NaN and non-positive values`  
  Input jumlah barang di keranjang kini divalidasi. Nilai kosong, huruf, atau angka negatif tidak lagi menyebabkan total menjadi `NaN`. Item otomatis dihapus jika quantity diset ke 0 atau kosong.  
  _File: `main.js` L282–288_

- **`93a3dd7`** `fix: apply toFixed(2) to modal grand total for consistent price formatting`  
  Grand total di modal review kini juga menggunakan `.toFixed(2)`, menyelaraskan format dengan tampilan di sidebar.  
  _File: `main.js` L255_

#### Security Fixes

- **`34b6fa0`** `security: replace innerHTML with textContent to prevent XSS in note preview`  
  Preview "Catatan buat petani" kini menggunakan `textContent` (bukan `innerHTML`) untuk merender input pengguna. Payload XSS seperti `<img src=x onerror="...">` tidak lagi dieksekusi browser.  
  _File: `main.js` L115_

- **`fee428e`** `security: remove hardcoded coupon secret from client-side code`  
  Konstanta `KUPON_RAHASIA = "TEMANFARMER"` yang tersimpan plaintext di JavaScript client telah dihapus. Fungsi `applyCoupon` kini bersifat `async` dan mensimulasikan validasi ke server. Di produksi, harus diganti dengan `fetch("/api/validate-coupon")`.  
  _File: `main.js` L31–66_

- **`8fe4c0d`** `security: fix price manipulation by removing data-price from DOM elements`  
  Atribut `data-price` dihapus dari tombol `+` di HTML yang dirender. Fungsi `addToCart` kini tidak menerima parameter harga dari DOM — harga selalu diambil langsung dari `products` array (sumber terpercaya).  
  _File: `main.js` L87, L163–170, L281_

#### Ethics / Dark Pattern Fixes

- **`14315fb`** `fix(ethics): replace fake random stock with real static stock data per product`  
  Angka stok yang dihasilkan `Math.random()` (fake urgency) diganti dengan field `stock` statis per produk. Stok kini berkurang sesuai jumlah item di keranjang. Label berbeda ditampilkan: *"tinggal X lagi"* hanya muncul saat stok ≤ 5 unit.  
  _File: `main.js` L13–24, L81–87 · `style.css` (`.stock-ok`)_

- **`bd9d512`** `fix(ethics): show handling fee breakdown in sidebar before checkout`  
  Biaya penanganan `$0.30` kini ditampilkan secara transparan di sidebar sebelum pengguna menekan tombol checkout. Sidebar menampilkan: Subtotal → Biaya penanganan → Total. Pengguna tidak lagi dikejutkan dengan biaya tersembunyi di momen terakhir.  
  _File: `index.html` L56–68 · `main.js` L156–162 · `style.css` (`.handling-row`, `.total-final`)_

### Docs

- **`68607c3`** `docs: add security audit report LAPORAN-TEMUAN.md`  
  Menambahkan laporan audit keamanan lengkap yang mendokumentasikan 7 temuan (+ 1 bonus): 2 Bug, 3 Keamanan, 2 Etika — beserta cara membuktikan dan memperbaiki masing-masing.

---

## [1.0.0] — 2026-07-08

### Added

- **`762f064`** Implementasi awal "Pasar Pagi" — toko buah online dengan keranjang belanja, modal checkout, toast notifikasi, dan sistem kupon.

---

> **Catatan:** Versi 1.0.0 sengaja mengandung bug, celah keamanan, dan dark pattern sebagai bahan latihan bug bounty workshop ETHJKT × UNPAM. Semua masalah telah diperbaiki di versi 1.1.0.
