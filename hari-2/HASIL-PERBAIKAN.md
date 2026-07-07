# HASIL PERBAIKAN - BUG BOUNTY: PASAR PAGI

Nama: Ghani
Tanggal: 7 Juli 2026
Misi: Hari 2 - Bug Bounty

---

## Ringkasan Perbaikan

Kode di branch ini sudah mengandung perbaikan advanced untuk semua 7 temuan bug/celah keamanan/dark pattern. Perbaikan dilakukan dengan pendekatan yang lebih robust dan production-ready:

1. **Bug #1**: Format total tidak konsisten - semua angka menggunakan `.toFixed(2)`
2. **Bug #2**: Input quantity bisa menghasilkan NaN - validasi dengan `Number.isInteger()`
3. **Keamanan #3**: XSS pada catatan user - menggunakan `textContent` di semua tempat
4. **Keamanan #4**: Kupon rahasia di client-side - menggunakan SHA-256 hash (hardening)
5. **Keamanan #5**: Harga diambil dari DOM - harga selalu diambil dari katalog resmi
6. **Etika #6**: Stok palsu - menggunakan stok nyata dari data produk
7. **Etika #7**: Biaya penanganan tersembunyi - ditampilkan eksplisit dengan breakdown lengkap

---

## Detail Perbaikan Kode

### Perbaikan #1: Format Total Tidak Konsisten

**File**: `main.js` line 69, 271

**Implementasi**:
```javascript
// Di renderBreakdownRows (line 69)
<div class="row grand"><span>Total</span><span>$${sums.total.toFixed(2)}</span></div>

// Di openReview (line 271)
row.innerHTML = `<span>${item.name} x ${item.count}</span><span>$${line.toFixed(2)}</span>`;
```

**Penjelasan**: Semua angka uang menggunakan `.toFixed(2)` untuk konsistensi. Fungsi `buildBreakdown()` dan `renderBreakdownRows()` memastikan semua angka diformat dengan benar di sidebar dan modal.

---

### Perbaikan #2: Input Quantity Bisa Menghasilkan NaN

**File**: `main.js` line 206-225

**Implementasi**:
```javascript
function updateQuantity(id, quantity) {
  if (!cart[id]) return;
  // Input nakal: kosong / huruf → parseInt = NaN. Jangan korupsi keranjang.
  // Biarkan user lanjut ngetik; nilai valid terakhir tetap dipakai.
  if (!Number.isInteger(quantity)) return;
  if (quantity <= 0) {
    delete cart[id];
  } else {
    // Stok nyata juga ditegakkan lewat input manual
    const product = products.find((item) => item.id == id);
    const maks = product ? product.stock : quantity;
    if (quantity > maks) {
      showToast(`Stok ${cart[id].name} tinggal ${maks}.`);
      quantity = maks;
    }
    cart[id].count = quantity;
  }
  renderCart();
}
```

**Penjelasan**: Validasi dengan `Number.isInteger()` lebih robust daripada `isNaN()`. Jika input invalid, fungsi return tanpa mengubah cart. Juga menambahkan validasi stok maksimal.

---

### Perbaikan #3: XSS pada Catatan User

**File**: `main.js` line 158, 281

**Implementasi**:
```javascript
// Di renderCart (line 158)
preview.textContent = "Catatan: " + note; // textContent = input user diperlakukan sbg TEKS, cegah XSS

// Di openReview (line 281)
n.textContent = "Catatan: " + note;
```

**Penjelasan**: Menggunakan `textContent` di kedua tempat (sidebar cart dan modal review) untuk mencegah XSS. Input user selalu diperlakukan sebagai plain text.

---

### Perbaikan #4: Kupon Rahasia di Client-Side

**File**: `main.js` line 31-47, 228-244

**Implementasi**:
```javascript
// Kupon divalidasi lewat HASH, bukan string mentah
const KUPON_HASH = "a12497e637e42764b41e7c6de1b07a8906d8e8841c7522f471a48a1ee74d61cd";
const DISKON_KUPON = 0.9;

async function hashSha256(text) {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function applyCoupon() {
  const code = document.getElementById("coupon").value.trim();
  const msg = document.getElementById("coupon-msg");
  const hash = await hashSha256(code);
  if (hash === KUPON_HASH) {
    diskon = DISKON_KUPON;
    msg.textContent = "Kupon aktif! Potongan 90%.";
    msg.style.color = "#6e7b61";
  } else {
    diskon = 0;
    msg.textContent = "Kode kupon salah.";
    msg.style.color = "#b96f5c";
  }
  renderCart();
}
```

**Penjelasan**: Menggunakan SHA-256 hash untuk menyembunyikan kupon rahasia dari plain text view. Ini adalah hardening client-side, tapi tetap mencatat bahwa validasi sebenarnya harus di server-side.

---

### Perbaikan #5: Harga Diambil dari DOM yang Bisa Dimanipulasi

**File**: `main.js` line 124-130, 184

**Implementasi**:
```javascript
// Di renderCart (line 124-130)
Object.values(cart).forEach((item) => {
  // Harga & nama SELALU diambil ulang dari katalog resmi tiap render.
  // Kalau ada yang ngutak-atik object `cart` di console, langsung ketimpa.
  const official = products.find((p) => p.id == item.id);
  if (official) {
    item.price = official.price;
    item.name = official.name;
  }
  // ...
});

// Di addToCart (line 184)
cart[id].price = product.price;   // harga RESMI dari katalog, bukan dari DOM (anti manipulasi)
```

**Penjelasan**: Harga selalu diambil ulang dari katalog resmi (`products` array) setiap kali render. Jika ada yang memanipulasi object cart di console, harga akan langsung dikembalikan ke harga resmi. Fungsi `addToCart()` juga tidak menggunakan parameter `price` dari DOM.

---

### Perbaikan #6: Stok Palsu (Fake Urgency)

**File**: `main.js` line 14-23, 79-82, 176-179, 216-221

**Implementasi**:
```javascript
// Data produk sekarang memiliki stok nyata (line 14-23)
const products = [
  { id: 1,  name: "Apel Fuji",       price: 1.5, stock: 12, ... },
  { id: 2,  name: "Jeruk Navel",     price: 2.0, stock: 9,  ... },
  // ...
];

// Di renderProducts (line 79-82)
const sisa = product.stock - quantity;
const habis = sisa <= 0;

// Tampilkan stok nyata (line 93)
<p class="stock">${habis ? "Stok habis" : `Stok tersedia: ${sisa}`}</p>

// Validasi stok di addToCart (line 176-179)
if (current >= product.stock) {
  showToast(`Stok ${product.name} tinggal ${product.stock}.`);
  return;
}

// Validasi stok di updateQuantity (line 216-221)
const maks = product ? product.stock : quantity;
if (quantity > maks) {
  showToast(`Stok ${cart[id].name} tinggal ${maks}.`);
  quantity = maks;
}
```

**Penjelasan**: Menggunakan stok nyata dari data produk. Stok dihitung sebagai `product.stock - quantity` (stok katalog dikurangi yang sudah di cart). Tombol plus disabled jika stok habis. Validasi stok dilakukan di `addToCart()` dan `updateQuantity()`.

---

### Perbaikan #7: Biaya Penanganan Tersembunyi

**File**: `main.js` line 57-71, `index.html` line 56

**Implementasi**:
```javascript
// Fungsi buildBreakdown untuk konsistensi (line 57-62)
function buildBreakdown(subtotal) {
  const fee = subtotal > 0 ? HANDLING_FEE : 0;
  const potongan = (subtotal + fee) * diskon;
  const total = subtotal + fee - potongan;
  return { subtotal, fee, potongan, total };
}

// Fungsi renderBreakdownRows untuk tampilan (line 64-71)
function renderBreakdownRows(target, sums) {
  target.innerHTML = `
    <div class="row"><span>Subtotal</span><span>$${sums.subtotal.toFixed(2)}</span></div>
    <div class="row"><span>Biaya penanganan</span><span>$${sums.fee.toFixed(2)}</span></div>
    ${sums.potongan ? `<div class="row"><span>Kupon (-90%)</span><span>-$${sums.potongan.toFixed(2)}</span></div>` : ""}
    <div class="row grand"><span>Total</span><span>$${sums.total.toFixed(2)}</span></div>
  `;
}

// Di renderCart (line 164)
renderBreakdownRows(cartSummaryEl, buildBreakdown(totalPrice));

// Di openReview (line 287)
renderBreakdownRows(document.getElementById("review-breakdown"), buildBreakdown(subtotal));
```

**Penjelasan**: Menambahkan elemen `<div class="cart-breakdown" id="cart-summary-breakdown"></div>` di index.html. Fungsi `buildBreakdown()` dan `renderBreakdownRows()` memastikan breakdown harga (subtotal, biaya penanganan, diskon, total) ditampilkan secara eksplisit dan konsisten di sidebar dan modal.

---

## File yang Dimodifikasi

1. **main.js** - Semua perbaikan diterapkan
2. **index.html** - Menambahkan elemen `cart-summary-breakdown` untuk menampilkan breakdown harga
3. **style.css** - Menambahkan styling untuk `.cart-breakdown` dan `.row`

---

## Testing Perbaikan

Setelah perbaikan, berikut adalah checklist untuk memverifikasi bahwa semua bug telah diperbaiki:

- [ ] **Bug #1**: Semua angka uang menampilkan 2 desimal yang konsisten
- [ ] **Bug #2**: Mengosongkan field quantity tidak menyebabkan cart error
- [ ] **Keamanan #3**: Memasukkan `<script>` di catatan tidak mengeksekusi script
- [ ] **Keamanan #4**: Kupon rahasia tidak terlihat sebagai plain text (hanya hash)
- [ ] **Keamanan #5**: Mengubah harga di DevTools tidak mempengaruhi harga di cart
- [ ] **Etika #6**: Stok menampilkan angka nyata yang konsisten, tidak acak
- [ ] **Etika #7**: Biaya penanganan ditampilkan secara eksplisit dengan breakdown lengkap

---

## Catatan Penting

Perbaikan di branch ini menggunakan pendekatan yang lebih advanced:

1. **Single Source of Truth**: Fungsi `buildBreakdown()` dan `renderBreakdownRows()` memastikan angka identik di sidebar dan modal
2. **Hardening Client-Side**: Kupon menggunakan SHA-256 hash untuk menyembunyikan dari plain text
3. **Defensive Programming**: Harga dan nama selalu diambil ulang dari katalog resmi setiap render
4. **Real Stock System**: Stok dihitung dari data produk nyata dengan validasi di semua titik
5. **Transparent Pricing**: Breakdown harga ditampilkan eksplisit sejak awal

Meskipun demikian, untuk production yang sebenarnya:

1. **Validasi kupon** tetap harus dilakukan di server-side
2. **Harga dan stok** harus divalidasi di server-side
3. **Semua logika bisnis** harus di server, bukan client
4. **Autentikasi dan otorisasi** harus ditambahkan
5. **Database** harus digunakan untuk persistence

Perbaikan di atas adalah hardening client-side yang baik, tapi tidak menggantikan kebutuhan arsitektur server-side yang proper.
