# HASIL PERBAIKAN — PASAR PAGI

Dokumen ini menjelaskan rangkuman seluruh perbaikan, berkas yang diubah, perbedaan perilaku sebelum vs sesudah, peningkatan dari sisi keamanan, validasi, dan pengalaman pengguna (UX) untuk aplikasi Pasar Pagi.

---

## Ringkasan Perbaikan

| # | Kategori | Temuan Masalah | Sebelum Perbaikan | Setelah Perbaikan | Status |
|---|----------|----------------|-------------------|-------------------|--------|
| 1 | BUG | Input non-angka → total `NaN` | Input kosong/huruf di-parse jadi `NaN`, merusak total belanja. | Divalidasi dengan `Number.isInteger()`. Input tidak valid ditolak. | ✅ Fixed |
| 2 | BUG | Ketiadaan batas stok/kuantitas | Input manual bebas tanpa batas, angka negatif menghapus item. | Kuantitas manual dibatasi maksimal sesuai stok katalog, angka `<= 0` menghapus item secara bersih. | ✅ Fixed |
| 3 | BUG | Total desimal tidak konsisten | Total akhir dihitung mentah tanpa `.toFixed(2)`, memicu galat floating-point. | Semua render uang disatukan ke fungsi breakdown terformat `.toFixed(2)`. | ✅ Fixed |
| 4 | KEAMANAN | Manipulasi harga via DOM | Harga diambil dari atribut HTML `data-price` (mudah dimanipulasi). | Atribut `data-price` dihapus. Harga dibaca langsung dari array produk resmi. | ✅ Fixed |
| 5 | KEAMANAN | Celah Stored XSS | Input catatan dirender menggunakan `innerHTML` tanpa sanitasi. | Menggunakan `textContent` untuk render catatan pembeli secara aman. | ✅ Fixed |
| 6 | KEAMANAN | Kebocoran kupon & diskon client | Kode kupon disimpan plaintext di JS klien (`TEMANFARMER`). | Plaintext kupon dihapus, validasi menggunakan pencocokan hash SHA-256 klien. | ✅ Hardened |
| 7 | ETIKA | Taktik Stok Palsu | Sisa stok diacak menggunakan `Math.random()`, tidak stabil & palsu. | Menggunakan stok riil berbasis data katalog dikurangi barang di keranjang. | ✅ Fixed |
| 8 | ETIKA | Biaya tersembunyi (drip pricing) | Biaya penanganan operasional `$0.30` tersembunyi di sidebar, mendadak muncul di checkout. | Sidebar menampilkan rincian lengkap (Subtotal, Biaya penanganan, Diskon, Total) secara transparan. | ✅ Fixed |

---

## Berkas yang Dimodifikasi

* **[main.js](file:///C:/Users/Dika%20Rahmat%20Fadillah/OneDrive/Kuliah/Adelya%20Revalina/ethjkt-unpam-learning-kit/hari-2/main.js)**: Rekayasa ulang seluruh mesin keranjang belanja, penegakan validasi, validasi kupon menggunakan hash SHA-256, penghapusan atribut `data-price`, perubahan rendering catatan pembeli ke `textContent`, perbaikan taktik stok acak ke stok riil, serta implementasi rincian biaya terpusat.
* **[index.html](file:///C:/Users/Dika%20Rahmat%20Fadillah/OneDrive/Kuliah/Adelya%20Revalina/ethjkt-unpam-learning-kit/hari-2/index.html)**: Penyesuaian layout sidebar untuk mengakomodasi baris rincian breakdown biaya yang dinamis, penyesuaian markup, dan perbaikan penargetan ID elemen DOM.
* **[style.css](file:///C:/Users/Dika%20Rahmat%20Fadillah/OneDrive/Kuliah/Adelya%20Revalina/ethjkt-unpam-learning-kit/hari-2/style.css)**: Penyesuaian style untuk rincian breakdown harga di sidebar dan modal agar konsisten secara visual.

---

## Perbandingan Perilaku (Before vs After)

### 1. Keamanan & Sanitasi Input

```diff
- // Sebelum: Mengambil harga dari DOM dan merender catatan dengan innerHTML
- function addToCart(id, price) {
-   ...
-   cart[id].price = price;
- }
- preview.innerHTML = "Catatan: " + note;

+ // Sesudah: Mengambil harga dari katalog resmi dan merender catatan dengan textContent
+ function addToCart(id) {
+   const product = products.find((item) => item.id == id);
+   ...
+   cart[id].price = product.price;
+ }
+ preview.textContent = "Catatan: " + note;
```

### 2. Validasi Kuantitas Angka

```diff
- // Sebelum: Parse langsung tanpa penanganan NaN/stok
- const quantity = parseInt(target.value, 10);
- updateQuantity(target.dataset.id, quantity);

+ // Sesudah: Validasi ketat tipe integer, cegah NaN, clamp kuantitas ke stok maksimal
+ const quantity = parseInt(target.value, 10);
+ if (Number.isNaN(quantity)) return;
+ ...
+ const maks = product ? product.stock : quantity;
+ if (quantity > maks) {
+   showToast(`Stok ${cart[id].name} tinggal ${maks}.`);
+   quantity = maks;
+ }
+ cart[id].count = quantity;
```

### 3. Otentikasi Kupon

```diff
- // Sebelum: Plaintext kupon bocor di JS
- const KUPON_RAHASIA = "TEMANFARMER";
- if (code === KUPON_RAHASIA) { ... }

+ // Sesudah: Validasi aman menggunakan pencocokan hash SHA-256 klien
+ const KUPON_HASH = "a12497e637e42764b41e7c6de1b07a8906d8e8841c7522a471a48a1ee74d61cd";
+ const hash = await hashSha256(code);
+ if (hash === KUPON_HASH) { ... }
```

### 4. Kejujuran Bisnis & Transparansi Biaya

```diff
- // Sebelum: Stok palsu Math.random() dan biaya tersembunyi
- const sisa = Math.floor(Math.random() * 5) + 1;
- let total = totalPrice + HANDLING_FEE;
- total = total - total * diskon;
- totalPriceEl.textContent = total;

+ // Sesudah: Perhitungan tersinkronisasi di satu tempat dan transparan
+ function buildBreakdown(subtotal) {
+   const fee = subtotal > 0 ? HANDLING_FEE : 0;
+   const potongan = (subtotal + fee) * diskon;
+   const total = subtotal + fee - potongan;
+   return { subtotal, fee, potongan, total };
+ }
+ // Rincian biaya dirender transparan sejak pertama kali barang dimasukkan ke keranjang
```

---

## Checklist Verifikasi Akhir

* [x] **Bebas dari NaN**: Mengetik karakter non-angka atau mengosongkan input kuantitas keranjang tidak merusak total harga belanja.
* [x] **Penegakan Stok Nyata**: Kuantitas barang di keranjang belanja dibatasi maksimal sesuai dengan stok produk yang didefinisikan secara resmi pada katalog.
* [x] **Aman dari XSS**: Input catatan pembeli disanitasi sepenuhnya dengan dirender sebagai `textContent` murni, payload skrip HTML/JS tidak dieksekusi.
* [x] **Perlindungan Harga**: Atribut `data-price` telah dihapus dari DOM, harga produk dibaca langsung dari data katalog internal.
* [x] **Kupon Terlindungi**: Kode kupon plaintext tidak lagi berada di source code klien. Validasi diubah dengan hash SHA-256.
* [x] **Bebas Stok Palsu**: Sisa stok yang ditampilkan bernilai stabil dan berkurang secara konsisten seiring ditambahkannya buah ke keranjang belanja.
* [x] **Transparansi Harga**: Biaya penanganan operasional `$0.30` dirinci secara transparan sejak awal di sidebar belanja.
* [x] **Konsistensi Format**: Semua tampilan nominal uang seragam menggunakan format dua angka di belakang koma (`.toFixed(2)`).
