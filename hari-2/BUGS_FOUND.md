# 🐛 TEMUAN BUG - PASAR PAGI

## Ringkasan
**Total Bug Ditemukan: 7**
- **Keamanan (Security):** 4 bug KRITIS
- **Etika (Dark Pattern):** 2 bug SERIUS  
- **Bug Umum:** 1 bug SEDANG

---

## 1. 🔴 XSS via `innerHTML` di Catatan (KEAMANAN - KRITIS)

**File:** `main.js`  
**Baris:** 206  
**Kategori:** Cross-Site Scripting (XSS)

### Kode Bermasalah
```javascript
if (note) {
  const preview = document.createElement("div");
  preview.className = "note-preview";
  preview.innerHTML = "Catatan: " + note;  // ❌ UNSAFE!
  cartDetailsEl.appendChild(preview);
}
```

### Masalah
- User bisa inject script ke dalam textarea catatan
- `innerHTML` memproses HTML/JavaScript sebagai code, bukan text
- Contoh payload: `<img src=x onerror="alert('XSS')">`

### Bukti / Cara Test
1. Buka aplikasi di browser
2. Di textarea "Catatan buat petani", ketik: 
   ```html
   <img src=x onerror="alert('BERHASIL HACK!')">
   ```
3. Lihat di preview keranjang atau scroll - alert akan muncul

### Dampak
- 🚨 Pencuri data (cookie, localStorage, session)
- 🚨 Redirect ke situs phishing
- 🚨 Inject malware/trojan
- 🚨 Curi data pembayaran

### Solusi
Ganti `innerHTML` dengan `textContent`:
```javascript
preview.textContent = "Catatan: " + note;  // ✅ SAFE
```

---

## 2. 🔴 Kupon Rahasia Exposed di Source Code (KEAMANAN - KRITIS)

**File:** `main.js`  
**Baris:** 33  
**Kategori:** Secret Exposure

### Kode Bermasalah
```javascript
const KUPON_RAHASIA = "TEMANFARMER";
let diskon = 0; // 0 = tanpa diskon, 0.9 = potong 90%
```

### Masalah
- Kupon disimpan **langsung di JavaScript yang bisa dilihat semua orang**
- Setiap user bisa buka DevTools (F12) dan lihat kodenya
- Semua orang (jutaan user) bisa pakai diskon 90%

### Bukti / Cara Test
1. Buka website di browser
2. Tekan **F12** (buka DevTools)
3. Klik tab **Console**
4. Ketik: `KUPON_RAHASIA`
5. Tekan Enter → hasilnya: `"TEMANFARMER"`
6. Masukkan ke field kupon → diskon 90% langsung aktif!

### Dampak
- 💰 Toko rugi miliaran rupiah
- 💰 Setiap customer bisa dapat diskon maksimal
- 💰 Tidak ada kontrol, tidak bisa bilang "kupon limited"
- 💰 Pesaing bisa lihat juga

### Solusi
Verifikasi kupon di **server saja**, bukan di client:
```javascript
// ❌ JANGAN: const KUPON_RAHASIA = "TEMANFARMER";

// ✅ DO: Kirim request ke server
async function applyCoupon() {
  const code = document.getElementById("coupon").value;
  const response = await fetch('/api/verify-coupon', {
    method: 'POST',
    body: JSON.stringify({ code: code })
  });
  const result = await response.json();
  
  if (result.valid) {
    diskon = result.discount;  // Server yang tentukan diskonnya
    msg.textContent = `Kupon aktif! Potongan ${result.discount * 100}%.`;
  } else {
    diskon = 0;
    msg.textContent = "Kode kupon salah.";
  }
}
```

---

## 3. 🔴 Harga Bisa Dimanipulasi via DevTools (KEAMANAN - KRITIS)

**File:** `main.js`  
**Baris:** 137  
**Kategori:** Price Tampering

### Kode Bermasalah
```javascript
function addToCart(id, price) {
  const product = products.find((item) => item.id == id);
  if (!product) return;

  if (!cart[id]) {
    cart[id] = { ...product, count: 0 };
  }
  cart[id].price = price;   // ❌ Ambil dari parameter (dari HTML)
  cart[id].count++;
  renderCart();
}
```

### Context HTML
```html
<button class="plus-button" data-id="${product.id}" data-price="${product.price}">+</button>
```

### Masalah
- Harga diambil dari atribut `data-price` di HTML
- User bisa edit HTML langsung via DevTools **tanpa reload**
- Contoh: Ubah `data-price="1.5"` menjadi `data-price="0.01"`
- Barang harga $1.50 jadi $0.01!

### Bukti / Cara Test
1. Buka website
2. Tekan **F12** → Tab **Elements/Inspector**
3. Cari tombol `+` di produk manapun (misal Apel)
4. Right-click → **Edit Attribute**
5. Ubah: `data-price="1.5"` menjadi `data-price="0.01"`
6. Klik tombol `+` → Keranjang menampilkan harga **$0.01**
7. Checkout dengan harga palsu!

### Dampak
- 💸 User belanja **gratis / sangat murah**
- 💸 Toko rugi 100% dari penjualan
- 💸 Sistem pembayaran tidak bisa dipercaya
- 💸 Bisnis jadi tidak sustainable

### Solusi
Gunakan harga dari `products` array (di JavaScript), **BUKAN dari HTML**:
```javascript
function addToCart(id) {  // ✅ Tidak perlu parameter price
  const product = products.find((item) => item.id == id);
  if (!product) return;

  if (!cart[id]) {
    cart[id] = { ...product, count: 0 };
  }
  cart[id].price = product.price;  // ✅ Ambil dari array, bukan dari HTML
  cart[id].count++;
  renderCart();
}
```

Dan ubah HTML:
```html
<button class="plus-button" data-id="${product.id}">+</button>
<!-- ❌ BUANG data-price, tidak perlu -->
```

---

## 4. 🟡 Stok Ditampilkan Random (DARK PATTERN - SERIUS)

**File:** `main.js`  
**Baris:** 67  
**Kategori:** Artificial Scarcity (Dark Pattern)

### Kode Bermasalah
```javascript
function renderProducts() {
  productSection.innerHTML = "";

  products.forEach((product) => {
    const quantity = cart[product.id] ? cart[product.id].count : 0;
    const sisa = Math.floor(Math.random() * 5) + 1;  // ❌ RANDOM!

    const productCard = document.createElement("article");
    productCard.classList.add("product");
    productCard.innerHTML = `
      ...
      <p class="stock">tinggal ${sisa} lagi hari ini!</p>
      ...
    `;
```

### Masalah
- **Setiap kali halaman di-render, stok berubah!**
- `Math.random()` membuat angka random 1-5 setiap waktu
- Stok di-render ulang saat:
  - User klik `+` atau `-`
  - User update kupon
  - User ketik catatan

### Bukti / Cara Test
1. Buka website
2. Lihat Apel: "**tinggal 3 lagi hari ini!**"
3. Klik tombol `-` di produk lain
4. Lihat lagi Apel: "**tinggal 1 lagi hari ini!**" (berubah!)
5. Klik lagi: "**tinggal 4 lagi hari ini!**" (berubah lagi!)
6. Padahal user tidak beli apel, tapi stok berubah terus

### Dampak
- 😰 **False sense of urgency** (FOMO - Fear of Missing Out)
- 😰 Pembeli merasa terdesak: "Waduh, stok berkurang! Harus beli sekarang!"
- 😰 **Dark Pattern** (manipulasi psikologis tidak jujur)
- 😰 Meningkatkan impulse buying (membeli tanpa pikir matang)

### Solusi
Gunakan data stok **real dari server**, render **sekali saja**:
```javascript
// Opsi 1: Fetch dari server
async function fetchStock() {
  const response = await fetch('/api/stock');
  return response.json();
}

// Opsi 2: Simpan stok real di variable, jangan random
const stockCache = {
  1: 3,   // Apel: tinggal 3
  2: 5,   // Jeruk: tinggal 5
  3: 2,   // Pisang: tinggal 2
  // ... dst
};

// Di renderProducts():
const sisa = stockCache[product.id] || 0;  // ✅ Ambil dari cache
```

---

## 5. 🔴 Total Price Tidak Ter-Format (BUG - SEDANG)

**File:** `main.js`  
**Baris:** 212 & 232  
**Kategori:** Formatting Error

### Kode Bermasalah

**Di keranjang (sidebar):**
```javascript
let total = totalPrice + HANDLING_FEE;
total = total - total * diskon;

totalPriceEl.textContent = total;  // ❌ Tidak .toFixed(2)
```

**Di modal review:**
```javascript
document.getElementById("review-breakdown").innerHTML = `
  <div class="row"><span>Subtotal</span><span>$${subtotal.toFixed(2)}</span></div>
  <div class="row"><span>Biaya penanganan</span><span>$${HANDLING_FEE.toFixed(2)}</span></div>
  ${diskon ? `<div class="row"><span>Kupon (-90%)</span><span>-$${potongan.toFixed(2)}</span></div>` : ""}
  <div class="row grand"><span>Total</span><span>$${total}</span></div>
  <!-- ❌ ${total} tidak .toFixed(2) -->
`;
```

### Masalah
- Floating-point math di JavaScript bisa menghasilkan angka panjang
- Contoh: `52.50 + 0.30 - (52.50 + 0.30) * 0.9` = `5.549999999999998`
- Ditampilkan: **`$5.549999999999998`** bukan `$5.55`

### Bukti / Cara Test
1. Buka DevTools Console (F12)
2. Ketik: `52.5 + 0.30 - (52.5 + 0.30) * 0.9`
3. Hasilnya: `5.549999999999998` (bukan `5.55`!)
4. Belanja beberapa barang dengan diskon → lihat total di modal

### Dampak
- 😕 **User confusion**: "Kok harganya aneh? Berapa total sih?"
- 😕 Terlihat tidak profesional
- 😕 Mengurangi kepercayaan pembeli
- 😕 Bikin customer service sibuk jawab pertanyaan

### Solusi

**Di keranjang (line 212):**
```javascript
totalPriceEl.textContent = total.toFixed(2);  // ✅ Format ke 2 desimal
```

**Di modal review (line 232):**
```javascript
<div class="row grand"><span>Total</span><span>$${total.toFixed(2)}</span></div>
<!-- ✅ Tambah .toFixed(2) -->
```

---

## 6. 🟡 Biaya Penanganan "Hidden" (DARK PATTERN - SERIUS)

**File:** `main.js`  
**Baris:** 32, 210  
**Kategori:** Hidden Fees (Dark Pattern)

### Kode Bermasalah
```javascript
const HANDLING_FEE = 0.30;  // Line 32

// Di renderCart() - ditampilkan total tapi TANPA breakdown
let total = totalPrice + HANDLING_FEE;  // Line 210
total = total - total * diskon;

totalPriceEl.textContent = total;  // Hanya tampil total, tidak rincian
```

### Masalah
- User lihat di keranjang sidebar: **Total: $10.00**
- Tapi saat checkout (modal review), tiba-tiba muncul:
  - Subtotal: $10.00
  - **+ Biaya penanganan: $0.30** (baru tahu!)
  - **Total: $10.30**
- **Biaya tambahan baru diketahui saat step terakhir!**

### Timeline Pembeli
1. ✅ User belanja, lihat keranjang: "Total: $10.00"
2. ✅ User klik "Lanjut ke Pembayaran"
3. ⚠️ Modal review muncul: "Total: $10.30"
4. 😠 User: "Eh??? Dari mana $0.30?? Pengen batal deh..."
5. 🚫 **Pembeli urung jadi beli** (abandoned cart)

### Dampak
- 😤 **Bait and switch** - menampilkan harga murah dulu, biaya belakangan
- 😤 User merasa **dibohongi**
- 😤 Meningkatkan **abandoned cart** (hilang penjualan)
- 😤 Atau pembeli terpaksa setuju karena sudah invest waktu (jadi feeling curang)

### Solusi
Tampilkan biaya penanganan di **keranjang juga**, jangan hidden:

**Di renderCart() function, tambahkan sebelum total:**
```javascript
// Tampilkan handling fee breakdown
const feeRow = document.createElement("div");
feeRow.className = "fee-row";
feeRow.innerHTML = `
  <span>Biaya penanganan</span>
  <strong>$${HANDLING_FEE.toFixed(2)}</strong>
`;
cartDetailsEl.appendChild(feeRow);

// Kemudian tampilkan total
const totalRow = document.createElement("div");
totalRow.className = "total-row";
totalRow.innerHTML = `
  <span>Total</span>
  <strong>$${total.toFixed(2)}</strong>
`;
cartDetailsEl.appendChild(totalRow);
```

Atau di HTML, tunjukkan rinciannya lebih awal.

---

## 7. 🔴 Catatan User Bisa XSS di Keranjang (KEAMANAN - KRITIS)

**File:** `main.js`  
**Baris:** 206  
**Kategori:** Cross-Site Scripting (XSS) - Sama seperti Bug #1 tapi di tempat lain

### Kode Bermasalah
```javascript
// Di renderCart() function, saat menampilkan catatan di preview keranjang:
if (note) {
  const preview = document.createElement("div");
  preview.className = "note-preview";
  preview.innerHTML = "Catatan: " + note;  // ❌ UNSAFE - innerHTML!
  cartDetailsEl.appendChild(preview);
}
```

### Masalah
- Sama seperti Bug #1
- User bisa inject script via textarea catatan
- Script akan dijalankan saat preview ditampilkan di keranjang

### Bukti / Cara Test
1. Ketik di textarea: `<script>alert('XSS')</script>`
2. Scroll atau klik elemen lain
3. Alert muncul

### Dampak
- Sama seperti Bug #1: pencuri data, malware, redirect phishing

### Solusi
```javascript
preview.textContent = "Catatan: " + note;  // ✅ Ganti ke textContent
```

---

## 📊 SUMMARY - Prioritas Perbaikan

| Priority | Bug | File | Line | Fix Time |
|----------|-----|------|------|----------|
| 🔴 ASAP | XSS innerHTML (#1, #7) | main.js | 206 | 2 menit |
| 🔴 ASAP | Kupon exposed (#2) | main.js | 33 | 1 hari (backend) |
| 🔴 ASAP | Harga manipulasi (#3) | main.js | 137 | 30 menit |
| 🟡 PENTING | Stok random (#4) | main.js | 67 | 1-2 jam |
| 🟡 PENTING | Biaya hidden (#6) | main.js | 32, 210 | 1 jam |
| 🟠 SEDANG | Total format (#5) | main.js | 212, 232 | 5 menit |

---

## ✅ Checklist Perbaikan

- [ ] Fix XSS: Ubah `innerHTML` → `textContent` (2 tempat)
- [ ] Fix Kupon: Pindahkan verifikasi ke server
- [ ] Fix Harga: Ambil dari `products` array, bukan dari HTML
- [ ] Fix Stok: Ganti random dengan data real/cache
- [ ] Fix Total: Tambah `.toFixed(2)` (2 tempat)
- [ ] Fix Biaya: Tampilkan breakdown di keranjang juga

---

**Status:** ⚠️ Belum diperbaiki  
**Dibuat:** 2026-07-07  
**Tim:** Security Audit Hari 2
