# Laporan Audit Keamanan — Aplikasi "Pasar Pagi"

**Jenis aplikasi:** Front-end keranjang belanja (vanilla JS)
**Auditor:** Tim Keamanan
**Status:** Semua temuan di bawah sudah diperbaiki di `pasar-pagi-fixed.js`

---

## Ringkasan Eksekutif

Kode ini berjalan mulus secara fungsional, tapi **seluruh logika bisnis — harga, stok, diskon, total — berjalan 100% di sisi client** tanpa ada validasi ulang. Ini adalah masalah arsitektural mendasar: siapa pun yang membuka DevTools browser bisa mengubah harga barang, memberi diri sendiri diskon, atau menembus batas stok. Ditambah lagi ada satu celah XSS nyata dan beberapa dark pattern yang merugikan pembeli.

Ditemukan **9 isu** yang dikelompokkan ke 5 kategori sesuai permintaan audit.

---

## 1. Input Validation

### 1.1 Kuantitas bisa berupa `NaN` atau negatif
**Lokasi:** `updateQuantity()`, dipicu dari `<input type="number" class="edit-quantity-input">`

**Masalah:**
```js
const quantity = parseInt(target.value, 10);
if (quantity <= 0) { delete cart[id]; }
else { cart[id].count = quantity; }
```
Atribut `min="1"` di HTML hanyalah *hint* visual pada browser desktop — tidak mencegah pengguna mengetik `"abc"`, mengosongkan field, atau memakai DevTools/`fetch`-like manipulation untuk mengirim nilai apa pun. `parseInt("abc")` menghasilkan `NaN`. Karena `NaN <= 0` bernilai **false**, kode masuk ke cabang `else` dan menyimpan `cart[id].count = NaN`.

**Dampak:**
Begitu satu item punya `count = NaN`, maka `itemTotal = item.count * item.price` menjadi `NaN`, dan `totalPrice` (hasil `reduce`) ikut menjadi `NaN` untuk **seluruh keranjang** — bukan cuma satu item. Ini adalah bug penolakan-layanan (DoS) ringan pada level UI: total belanja rusak dan checkout menampilkan `$NaN`.

Selain itu, karena validasi hanya mengecek `<= 0`, pengguna sebenarnya bisa mengetik angka desimal (`2.7`) yang lolos `parseInt` menjadi `2` secara diam-diam — bukan bug parah, tapi menunjukkan tidak ada validasi tipe/rentang yang eksplisit.

**Root cause:** Validasi mengandalkan implisit falsy/truthy JavaScript, bukan pengecekan tipe eksplisit.

**Perbaikan yang diterapkan:**
```js
const quantity = Number(rawValue);
if (rawValue === "" || !Number.isInteger(quantity) || quantity < 0) {
  showToast("Jumlah tidak valid.");
  renderCart(); // reset ke nilai valid terakhir
  return;
}
```
Ditambah pengecekan batas atas terhadap stok asli produk (lihat temuan 3.3).

---

### 1.2 Tidak ada batas atas kuantitas (melampaui stok)
**Lokasi:** `updateQuantity()`, `addToCart()`

**Masalah:** Pengguna bisa mengetik `999999` di kolom kuantitas dan sistem menerimanya tanpa mengecek stok yang ditampilkan di kartu produk ("tinggal X lagi hari ini!").

**Dampak:** Pemesanan bisa melebihi stok riil toko — masalah operasional (over-selling) yang berdampak langsung ke bisnis, bukan cuma ke keamanan data.

**Perbaikan yang diterapkan:** Stok kini disimpan sebagai field nyata (`product.stock`) per produk, dan `updateQuantity`/`addToCart` menolak kuantitas yang melebihi stok tersedia, sekaligus menonaktifkan tombol "+" saat stok habis.

---

## 2. Cross-Site Scripting (XSS)

### 2.1 XSS tersimpan lewat kolom "Catatan"
**Lokasi:** `renderCart()`

**Masalah:**
```js
const note = document.getElementById("note").value;
if (note) {
  const preview = document.createElement("div");
  preview.innerHTML = "Catatan: " + note; // <-- celah
  cartDetailsEl.appendChild(preview);
}
```
Nilai dari input pengguna (`note`) digabung langsung ke dalam `innerHTML`. Browser akan mem-parsing string ini sebagai HTML sungguhan, bukan teks polos.

**Bukti konsep (PoC):** Ketik ini di kolom catatan:
```html
<img src=x onerror="alert(document.cookie)">
```
Begitu `renderCart()` dipanggil (setiap kali kolom catatan berubah, lewat event `input`), payload ini langsung dieksekusi oleh browser korban.

**Dampak:** Ini adalah **DOM-based XSS** klasik. Jika aplikasi ini terhubung ke backend sungguhan (misalnya catatan ini dikirim ke admin/petani untuk dibaca di dashboard lain), payload yang sama bisa mengeksekusi script di sesi orang lain — berpotensi mencuri cookie/token sesi, melakukan aksi atas nama korban, atau mengarahkan ke situs phising.

Menariknya, di bagian `openReview()`, developer sudah memakai `textContent` untuk field yang sama (`n.textContent = "Catatan: " + note`) — jadi ini murni inkonsistensi, bukan keterbatasan teknis: solusinya sudah ada di kode yang sama, hanya tidak diterapkan konsisten.

**Root cause:** Pencampuran data pengguna ke dalam `innerHTML` tanpa escaping, di satu tempat spesifik yang luput dari pola aman yang sudah dipakai di tempat lain.

**Perbaikan yang diterapkan:** Fungsi `escapeHtml()` ditambahkan dan dipakai di semua tempat yang menyisipkan input pengguna (catatan) atau data dinamis ke `innerHTML`.
```js
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
...
preview.innerHTML = "Catatan: " + escapeHtml(note);
```

---

## 3. Logic Errors (Harga & Keranjang)

### 3.1 Harga barang bisa dimanipulasi dari sisi client (Kritis)
**Lokasi:** `addToCart(id, price)`, event listener tombol `plus-button`

**Masalah:**
```html
<button class="quantity-button plus-button" data-id="${product.id}" data-price="${product.price}">+</button>
```
```js
if (target.classList.contains("plus-button")) {
  addToCart(target.dataset.id, Number(target.dataset.price));
}
...
function addToCart(id, price) {
  ...
  cart[id].price = price; // <-- percaya nilai dari DOM, bukan dari katalog resmi
}
```
Harga yang dipakai untuk mengisi keranjang diambil dari atribut `data-price` di tombol HTML — bukan dari sumber data `products` yang tepercaya. Atribut DOM **sepenuhnya bisa diedit siapa pun** lewat DevTools ("Inspect Element") sebelum menekan tombol "+", atau bahkan lewat satu baris di Console:
```js
document.querySelector('[data-id="4"].plus-button').dataset.price = "0.01";
```

**Dampak:** Ini adalah **celah manipulasi harga** — kategori bug paling serius di aplikasi e-commerce. Siapa pun bisa membeli Blueberry seharga $5.00 dengan harga $0.01, atau bahkan harga negatif, tanpa perlu keahlian teknis tinggi (cukup edit atribut lewat Inspect Element, tidak perlu tahu JavaScript).

**Root cause:** Aplikasi memercayai data yang datang dari client (DOM) sebagai sumber kebenaran harga, padahal client sepenuhnya berada di bawah kendali pengguna.

**Perbaikan yang diterapkan:** `addToCart(id)` sekarang **hanya** menerima ID, lalu mencari harga dari array `products` yang didefinisikan di JS (bukan dari atribut DOM):
```js
function addToCart(id) {
  const product = products.find((item) => item.id == id);
  ...
  cart[id].price = product.price; // selalu dari katalog resmi
}
```
**Catatan penting:** Di aplikasi produksi sungguhan, katalog `products` pun sebenarnya harus divalidasi ulang di **server** saat checkout (harga akhir dihitung ulang di backend), karena file JS ini sendiri tetap bisa diedit di browser pengguna. Perbaikan di atas menghilangkan celah termudah (manipulasi atribut DOM), tapi arsitektur idealnya tetap butuh validasi harga di server.

---

### 3.2 Total uang tidak dibulatkan (bug floating-point)
**Lokasi:** `renderCart()` → `totalPriceEl.textContent = total;`

**Masalah:** Nilai `total` adalah hasil operasi pengurangan/perkalian desimal (`total - total * diskon`), yang di JavaScript rawan floating-point imprecision (misal `0.1 + 0.2 = 0.30000000000000004`). Karena tidak ada `.toFixed(2)`, tampilan total bisa menunjukkan angka seperti `12.700000000000001` kepada pembeli.

**Dampak:** Bukan celah keamanan langsung, tapi merusak kepercayaan pembeli dan terlihat tidak profesional/mencurigakan — sering disalahartikan sebagai indikasi bug harga yang lebih dalam.

**Perbaikan yang diterapkan:** Fungsi `formatMoney()` dipakai konsisten di semua tempat yang menampilkan nominal uang (kartu produk, baris keranjang, total, breakdown review).

---

### 3.3 Stok ditampilkan acak, tidak konsisten dengan keranjang
**Lokasi:** `renderProducts()` → `const sisa = Math.floor(Math.random() * 5) + 1;`

**Masalah:** Angka "tinggal X lagi hari ini!" dihasilkan ulang secara acak **setiap kali** `renderProducts()` dipanggil — yaitu setiap kali keranjang berubah. Angka ini sama sekali tidak terhubung dengan jumlah barang yang sudah ada di keranjang pengguna, apalagi stok gudang sungguhan.

**Dampak:** Selain menjadi dark pattern (dibahas di §4), ini juga bug logika: dua render berturut-turut pada produk yang sama bisa menunjukkan stok berbeda, sehingga sistem tidak punya cara valid untuk menegakkan batas kuantitas maksimum.

**Perbaikan yang diterapkan:** Stok kini berupa field tetap `product.stock` per produk, dikurangi jumlah yang sudah ada di keranjang (`stock - inCart`), sehingga konsisten dan bisa dipakai untuk validasi batas atas (lihat §1.2).

---

## 4. Dark Patterns (Pola Manipulatif)

### 4.1 Stok palsu / urgensi palsu (fake scarcity)
**Terkait temuan 3.3.** Menampilkan "tinggal X lagi hari ini!" dengan angka acak — bukan data stok sungguhan — adalah taktik **urgensi palsu** yang dikenal luas sebagai dark pattern: mendorong pembeli buru-buru checkout karena takut kehabisan, padahal angkanya tidak berarti apa-apa (bahkan berubah tiap render).

**Dampak terhadap pengguna:** Memanipulasi keputusan pembelian berdasarkan informasi palsu — berpotensi melanggar prinsip perlindungan konsumen (representasi stok yang tidak benar).

**Perbaikan yang diterapkan:** Stok sekarang adalah data nyata dan konsisten, ditampilkan apa adanya (termasuk status "stok habis" saat memang habis).

---

### 4.2 Biaya penanganan disembunyikan sampai tahap akhir (drip pricing)
**Lokasi:** `HANDLING_FEE` hanya pertama kali terlihat di `openReview()` (modal review sebelum konfirmasi akhir), tidak pernah muncul di kartu produk maupun ringkasan keranjang sebelumnya.

**Masalah:** Pembeli menghitung-hitung belanjaannya di keranjang tanpa tahu akan ada biaya tambahan $0.30, dan biaya ini baru "muncul" saat mereka sudah commit untuk checkout. Ini adalah pola **drip pricing** — salah satu dark pattern paling umum dikeluhkan dalam riset UX dan regulasi perlindungan konsumen (mis. panduan FTC AS soal *hidden fees*).

**Dampak:** Merusak kepercayaan pembeli, berisiko dianggap praktik niaga tidak jujur.

**Perbaikan yang diterapkan:** Baris "Biaya penanganan: $0.30" kini ditampilkan langsung di daftar keranjang (`renderCart()`), bukan hanya di modal review — pembeli tahu total biaya sejak awal.

---

### 4.3 Kode kupon rahasia tertanam polos di client-side JavaScript
**Lokasi:** `const KUPON_RAHASIA = "TEMANFARMER";`

**Masalah:** Ini bukan XSS atau manipulasi harga secara langsung, tapi tetap sebuah celah keamanan/bisnis: kode "rahasia" untuk potongan 90% ditulis polos di file JavaScript yang **dikirim ke setiap browser pengunjung**. Siapa pun bisa membacanya lewat "View Page Source" dalam hitungan detik, tanpa perlu keahlian hacking sama sekali.

**Dampak:** Potongan harga yang dimaksudkan eksklusif untuk "teman-teman petani" bisa disebarluaskan ke publik dan dipakai siapa saja, menyebabkan kerugian finansial langsung ke toko.

**Root cause:** Kesalahpahaman fundamental bahwa "menyembunyikan" sesuatu di kode client-side membuatnya aman (*security through obscurity* yang gagal, karena kode client-side pada dasarnya publik).

**Perbaikan yang diterapkan:** Logika validasi kupon dipindahkan ke fungsi `validateCouponWithServer()` yang men-simulasikan pemanggilan API backend, dengan komentar eksplisit bahwa validasi kode kupon **wajib** dilakukan di server pada implementasi produksi, bukan di file JS yang bisa dibaca publik.

---

## 5. Anomali/Isu Lainnya

### 5.1 Tidak ada sumber kebenaran (source of truth) tunggal untuk data transaksi
Ini adalah rangkuman dari beberapa temuan di atas: harga (3.1), stok (3.3), dan diskon (4.3) semuanya dihitung dan divalidasi **hanya** di browser pengguna. Untuk aplikasi demo/portofolio ini boleh saja, tapi jika akan dihubungkan ke pembayaran sungguhan, **setiap** nilai uang harus dihitung ulang dan divalidasi di server saat checkout — jangan pernah memercayai angka yang dikirim dari client.

### 5.2 Duplikasi validasi yang inkonsisten
Ditemukan bahwa perlakuan yang benar terhadap input pengguna (`textContent` untuk catatan) sudah ada di satu fungsi (`openReview`) tapi tidak diterapkan di fungsi lain (`renderCart`) yang menangani data yang sama persis. Ini menunjukkan pentingnya membuat satu fungsi helper terpusat (`escapeHtml`) dipakai di semua tempat, alih-alih mengulang logika sanitasi secara manual di tiap fungsi — sudah diterapkan di versi perbaikan.

---

## Tabel Ringkasan

| # | Kategori | Temuan | Tingkat Risiko | Status |
|---|----------|--------|-----------------|--------|
| 1.1 | Validasi Input | Kuantitas `NaN`/negatif merusak total | Sedang | ✅ Diperbaiki |
| 1.2 | Validasi Input | Tidak ada batas atas kuantitas vs stok | Sedang | ✅ Diperbaiki |
| 2.1 | XSS | Catatan disisipkan ke `innerHTML` tanpa escape | **Tinggi** | ✅ Diperbaiki |
| 3.1 | Logika Harga | Harga diambil dari atribut DOM (`data-price`) | **Kritis** | ✅ Diperbaiki |
| 3.2 | Logika Harga | Total tidak dibulatkan (floating-point) | Rendah | ✅ Diperbaiki |
| 3.3 | Logika Harga | Stok acak, tidak konsisten | Sedang | ✅ Diperbaiki |
| 4.1 | Dark Pattern | Stok palsu / urgensi palsu | Sedang (etika/legal) | ✅ Diperbaiki |
| 4.2 | Dark Pattern | Biaya penanganan disembunyikan (drip pricing) | Sedang (etika/legal) | ✅ Diperbaiki |
| 4.3 | Kebocoran Info | Kode kupon rahasia tertanam di client JS | Tinggi (bisnis) | ✅ Diperbaiki (arsitektur) |
| 5.1 | Arsitektur | Tidak ada validasi server-side | **Kritis (jangka panjang)** | ⚠️ Perlu backend nyata |
| 5.2 | Konsistensi Kode | Sanitasi input tidak konsisten antar fungsi | Rendah | ✅ Diperbaiki |

---

## Rekomendasi Prioritas Selanjutnya

1. **Segera:** Jika aplikasi ini akan dipakai dengan pembayaran sungguhan, bangun backend yang menyimpan katalog harga/stok dan **hitung ulang total di server** saat checkout — jangan pernah percaya angka dari client.
2. **Segera:** Pindahkan validasi kode kupon ke endpoint server dengan rate-limiting (mencegah brute-force kode kupon).
3. **Jangka menengah:** Tambahkan Content Security Policy (CSP) header sebagai lapisan pertahanan tambahan terhadap XSS, di luar sanitasi input yang sudah diperbaiki.
4. **Jangka menengah:** Tambahkan unit test untuk fungsi `updateQuantity`, `addToCart`, dan kalkulasi total agar regresi seperti temuan 1.1–3.2 tertangkap otomatis di masa depan.
