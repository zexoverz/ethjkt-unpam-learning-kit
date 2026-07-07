# LAPORAN TEMUAN - BUG BOUNTY: PASAR PAGI

Nama: Ghani
Tanggal: 7 Juli 2026
Misi: Hari 2 - Bug Bounty

---

## Temuan #1: BUG - Format Total Tidak Konsisten

**Kategori**: BUG

**Masalahnya apa**:
Di modal review checkout (line 231 `main.js`), total ditampilkan tanpa format desimal yang konsisten. Variabel `total` bisa menampilkan banyak angka desimal yang tidak rapi (misalnya `$4.500000000000001`) karena floating point arithmetic error.

**Cara buktiinnya**:
1. Buka `index.html` di browser
2. Tambahkan beberapa barang ke cart (misal: Apel Fuji $1.5 + Jeruk Navel $2.0 + Pisang $1.2)
3. Klik "Lanjut ke Pembayaran"
4. Perhatikan angka Total di modal review - bisa menampilkan desimal yang sangat panjang

**Kenapa ini bahaya / nggak adil**:
- Tampilan tidak profesional dan membingungkan pembeli
- Pembeli tidak yakin dengan keakuratan harga yang harus dibayar
- Mengurangi kepercayaan terhadap sistem pembayaran

**Cara betulinnya**:
Tambahkan `.toFixed(2)` pada line 231 di `main.js`:
```javascript
// Sebelum
<div class="row grand"><span>Total</span><span>$${total}</span></div>

// Sesudah
<div class="row grand"><span>Total</span><span>$${total.toFixed(2)}</span></div>
```

---

## Temuan #2: BUG - Input Quantity Bisa Menghasilkan NaN

**Kategori**: BUG

**Masalahnya apa**:
Di line 283 `main.js`, fungsi `updateQuantity()` menggunakan `parseInt()` pada input quantity tanpa validasi. Jika user mengosongkan field quantity, `parseInt("")` akan menghasilkan `NaN`, yang menyebabkan cart error dan tidak bisa berfungsi dengan benar.

**Cara buktiinnya**:
1. Tambahkan barang ke cart
2. Di sidebar cart, hapus semua angka di field quantity input (kosongkan)
3. Cart akan menampilkan NaN dan fungsi cart rusak
4. User tidak bisa melanjutkan pembelian

**Kenapa ini bahaya / nggak adil**:
- Cart bisa rusak total jika user melakukan kesalahan input
- User tidak bisa melanjutkan transaksi
- Pengalaman pengguna buruk dan bisa kehilangan pelanggan

**Cara betulinnya**:
Tambahkan validasi untuk cek `isNaN()` dan set default ke 1:
```javascript
function updateQuantity(id, quantity) {
  if (!cart[id]) return;
  if (isNaN(quantity) || quantity <= 0) {
    delete cart[id];
  } else {
    cart[id].count = quantity;
  }
  renderCart();
}
```

---

## Temuan #3: KEAMANAN - XSS pada Catatan User

**Kategori**: KEAMANAN

**Masalahnya apa**:
Line 115 `main.js` menggunakan `innerHTML` untuk menampilkan catatan user tanpa sanitasi: `preview.innerHTML = "Catatan: " + note`. Ini memungkinkan attacker untuk inject malicious script melalui field catatan.

**Cara buktiinnya**:
1. Buka DevTools (F12) > Console
2. Di field "Catatan buat petani", masukkan: `<script>alert('XSS berhasil!')</script>`
3. Script akan dieksekusi dan alert akan muncul
4. Bisa juga inject HTML lain seperti `<img src=x onerror=alert('XSS')>`

**Kenapa ini bahaya / nggak adil**:
- Attacker bisa inject malicious JavaScript untuk curi cookie/session
- Bisa redirect user ke phishing site
- Bisa mengubah tampilan website secara malicious
- Sangat berbahaya untuk keamanan data pembeli

**Cara betulinnya**:
Gunakan `textContent` atau `innerText` instead of `innerHTML`:
```javascript
// Sebelum (line 115)
preview.innerHTML = "Catatan: " + note;

// Sesudah
preview.textContent = "Catatan: " + note;
```

---

## Temuan #4: KEAMANAN - Kupon Rahasia di Client-Side

**Kategori**: KEAMANAN

**Masalahnya apa**:
Line 32 `main.js` menyimpan kupon rahasia `KUPON_RAHASIA = "TEMANFARMER"` di JavaScript client-side. Kupon ini bisa dilihat oleh siapa saja dengan membuka View Source atau DevTools.

**Cara buktiinnya**:
1. Klik kanan di browser > View Source
2. Cari "TEMANFARMER" atau "KUPON_RAHASIA"
3. Kupon langsung terlihat di kode JavaScript
4. Bisa juga dilihat di DevTools > Sources > main.js

**Kenapa ini bahaya / nggak adil**:
- Siapa saja bisa melihat dan menggunakan kupon yang seharusnya rahasia
- Kehilangan kontrol atas promosi yang ditujukan untuk kelompok tertentu
- Potensi penyalahgunaan massal oleh publik
- Tidak ada mekanisme keamanan untuk melindungi aset bisnis

**Cara betulinnya**:
Validasi kupon harus dilakukan di server-side, bukan client-side:
```javascript
// Di client-side, hanya kirim kode kupon ke server
async function applyCoupon() {
  const code = document.getElementById("coupon").value;
  const msg = document.getElementById("coupon-msg");
  
  // Kirim ke server untuk validasi
  const response = await fetch('/api/validate-coupon', {
    method: 'POST',
    body: JSON.stringify({ code })
  });
  
  const result = await response.json();
  
  if (result.valid) {
    diskon = result.discount;
    msg.textContent = "Kupon aktif! Potongan " + (result.discount * 100) + "%.";
    msg.style.color = "#6e7b61";
  } else {
    diskon = 0;
    msg.textContent = "Kode kupon salah.";
    msg.style.color = "#b96f5c";
  }
  renderCart();
}
```

---

## Temuan #5: KEAMANAN - Harga Diambil dari DOM yang Bisa Dimanipulasi

**Kategori**: KEAMANAN

**Masalahnya apa**:
Line 136 `main.js` mengambil harga dari `data-price` attribute di tombol plus: `cart[id].price = price`. Harga ini diambil dari DOM yang bisa diedit oleh user melalui DevTools, memungkinkan pembeli memanipulasi harga semurah yang mereka mau.

**Cara buktiinnya**:
1. Buka DevTools (F12) > Elements
2. Cari tombol "+" pada produk
3. Ubah `data-price` attribute menjadi nilai sangat kecil (misal: `data-price="0.01"`)
4. Klik tombol "+" untuk menambahkan ke cart
5. Harga di cart akan ikut berubah menjadi $0.01
6. Total pembayaran akan sangat murah

**Kenapa ini bahaya / nggak adil**:
- Pembeli bisa memanipulasi harga semurah yang mereka mau
- Kerugian finansial besar untuk toko
- Tidak ada validasi harga dari sumber yang terpercaya
- Sistem pembayaran sangat rentan terhadap fraud

**Cara betulinnya**:
Harga harus diambil dari data produk yang aman (server-side), bukan dari DOM:
```javascript
function addToCart(id, priceFromDOM) {
  const product = products.find((item) => item.id == id);
  if (!product) return;

  if (!cart[id]) {
    cart[id] = { ...product, count: 0 };
  }
  
  // Gunakan harga dari data produk yang aman, bukan dari DOM
  cart[id].price = product.price;  // Ambil dari array products, bukan parameter
  cart[id].count++;
  renderCart();
}
```

---

## Temuan #6: ETIKA - Stok Palsu (Fake Urgency)

**Kategori**: ETIKA / DARK PATTERN

**Masalahnya apa**:
Line 47 `main.js` menghasilkan angka stok secara acak: `const sisa = Math.floor(Math.random() * 5) + 1`. Ini adalah dark pattern untuk membuat pembeli merasa panik dan membeli cepat dengan alasan stok menipis, padahal stoknya palsu.

**Cara buktiinnya**:
1. Perhatikan angka stok di setiap produk (misal: "tinggal 3 lagi hari ini!")
2. Refresh halaman (F5)
3. Angka stok akan berubah-ubah secara acak
4. Coba refresh beberapa kali, angka selalu berbeda
5. Ini bukan stok nyata, tapi generated secara acak

**Kenapa ini bahaya / nggak adil**:
- Dark pattern untuk memanipulasi psikologi pembeli
- Membuat pembeli panik dan membeli tanpa berpikir
- Tidak jujur tentang ketersediaan produk
- Melanggar prinsip kejujuran dalam bisnis
- Menghancurkan kepercayaan jika ketahuan

**Cara betulinnya**:
Gunakan stok nyata dari database, atau hapus fitur stok jika tidak ada sistem inventory:
```javascript
// Opsi 1: Gunakan stok nyata dari database
const sisa = product.stock;  // Ambil dari data produk yang nyata

// Opsi 2: Hapus fitur stok palsu
// Hapus line 47-58 yang menampilkan stok acak
```

---

## Temuan #7: ETIKA - Biaya Penanganan Tersembunyi

**Kategori**: ETIKA / DARK PATTERN

**Masalahnya apa**:
Line 29 `main.js` ada `HANDLING_FEE = 0.30` yang ditambahkan ke total tanpa penjelasan yang jelas di UI. Biaya ini muncul diam-diam di detik terakhir tanpa disebutkan dari awal.

**Cara buktiinnya**:
1. Tambahkan barang ke cart (misal: Apel Fuji $1.5)
2. Hitung manual: $1.5
3. Lihat total di cart sidebar: $1.80 (ada selisih $0.30)
4. Tidak ada penjelasan tentang biaya tambahan ini di UI awal
5. Biaya hanya muncul di breakdown modal review

**Kenapa ini bahaya / nggak adil**:
- Hidden fee yang tidak dijelaskan dari awal
- Pembeli membayar lebih tanpa sadar
- Melanggar prinsip transparansi harga
- Bisa dianggap sebagai praktik penipuan
- Merusak kepercayaan pelanggan

**Cara betulinnya**:
Tampilkan biaya penanganan secara eksplisit di UI sebelum checkout:
```javascript
// Tampilkan biaya penanganan di cart sidebar
<div class="total-row">
  <span>Subtotal</span>
  <strong>$<span id="subtotal-price">0.00</span></strong>
</div>
<div class="total-row">
  <span>Biaya penanganan</span>
  <strong>$0.30</strong>
</div>
<div class="total-row grand">
  <span>Total</span>
  <strong>$<span id="modal-total-price">0.00</span></strong>
</div>
```

---

## Refleksi Penutup

**Bedanya "kode jalan" sama "kode benar & jujur" itu apa, menurutmu, setelah level ini?**

"Kode jalan" berarti kode bisa dieksekusi tanpa error dan memenuhi fungsionalitas dasar. Tapi "kode benar & jujur" lebih dari itu - kode harus:

1. **Aman**: Tidak memiliki celah keamanan yang bisa dimanfaatkan attacker
2. **Jujur**: Tidak menggunakan dark pattern untuk memanipulasi user
3. **Transparan**: Semua biaya dan informasi ditampilkan dengan jelas
4. **Valid**: Input divalidasi dengan benar untuk mencegah error
5. **Etis**: Menghormati user dan tidak menipu mereka

Kode AI seperti yang diberikan di level ini "jalan sempurna" tapi penuh dengan bug, celah keamanan, dan dark pattern. Ini menunjukkan bahwa AI bisa menghasilkan kode yang fungsional tapi tidak aman atau etis. Sebagai developer, kita harus selalu mereview kode AI dengan kritis, tidak langsung percaya bahwa kode yang "jalan" berarti kode yang "benar".

Kode yang benar-benar siap untuk production harus melewati review keamanan, testing yang menyeluruh, dan audit etika. Kode jalan hanyalah langkah pertama, bukan tujuan akhir.
