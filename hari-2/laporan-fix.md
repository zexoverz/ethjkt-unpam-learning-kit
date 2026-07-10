# LAPORAN PERBAIKAN ANOMALI — PASAR PAGI (HARI 2)

Laporan ini mendokumentasikan perbaikan yang diterapkan pada kode aplikasi Pasar Pagi (Hari 2), alasan mengapa metode perbaikan tersebut benar, serta prinsip umum di balik setiap perbaikan.

---

## 1. Perbaikan Temuan 1: Pencegahan Cross-Site Scripting (XSS) pada Catatan Petani

- **Kode yang diperbaiki**: `main.js`, fungsi `renderCart()` dan fungsi `openReview()`.
- **Detail perubahan**:
  Mengubah metode penulisan teks dari `.innerHTML` ke `.textContent` saat merender string catatan pengguna.
  ```diff
  - preview.innerHTML = "Catatan: " + note;
  + preview.textContent = "Catatan: " + note;
  ```
- **Kenapa cara ini benar**:
  Properti `.textContent` memperlakukan seluruh string input pengguna sebagai teks literal statis. Browser tidak akan menafsirkan karakter HTML khusus (seperti `<` dan `>`) sebagai tag HTML atau tag `<script>` aktif, melainkan akan merendernya sebagai teks biasa yang aman secara visual.
- **Prinsip umum**:
  * **Output Encoding / Contextual Escaping**: Mengubah karakter aktif kode menjadi karakter teks biasa agar aman saat ditampilkan di browser.
  * **Never Trust User Input**: Selalu asumsikan semua input dari luar bersifat berbahaya (*untrusted data*) dan harus disaring sebelum dimasukkan ke dalam DOM.

---

## 2. Perbaikan Temuan 2: Validasi Kuantitas Input & Pencegahan Focus Loss (Usability)

- **Kode yang diperbaiki**: `main.js`, penanganan event listener untuk input kuantitas di bagian bawah file, serta logika di dalam fungsi `updateQuantity()`.
- **Detail perubahan**:
  1. Memindahkan penanganan event untuk `.edit-quantity-input` dari event `input` ke event `change`.
  2. Mengatur urutan logika pada `updateQuantity` agar mendeteksi kuantitas `<=` 0 terlebih dahulu untuk melakukan penghapusan item sebelum memfilter batas kuantitas minimum `< 1`.
  ```js
  function updateQuantity(id, quantity) {
    if (!cart[id]) return;
    
    // Jika input <= 0, hapus item dari keranjang
    if (Number.isInteger(quantity) && quantity <= 0) {
      delete cart[id];
      renderCart();
      return;
    }
    
    // Validasi range integer 1 hingga MAX_QUANTITY
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
      renderCart();
      return;
    }
    
    cart[id].count = quantity;
    renderCart();
  }
  ```
- **Kenapa cara ini benar**:
  * Menggunakan event `change` menghindari eksekusi `renderCart()` yang terlalu dini dan terus-menerus pada setiap ketukan keyboard. Event ini baru aktif setelah pengguna selesai mengetik dan kursor berpindah (blur) atau pengguna menekan Enter. Hal ini mencegah kehancuran elemen input di tengah-tengah pengetikan multi-digit (menghindari kehilangan fokus kursor).
  * Struktur urutan logika baru memastikan bahwa kasus penulisan angka `0` atau angka negatif dapat diproses masuk ke blok penghapusan item (`delete cart[id]`), sehingga tidak ada lagi kode mati (*dead code*) yang tidak bisa dijangkau.
- **Prinsip umum**:
  * **Appropriate Event Handling**: Memilih event DOM yang sesuai dengan kebutuhan interaksi UI untuk menjaga kelancaran alur UX.
  * **Logical Ordering of Guards**: Menempatkan pengecekan kondisi spesifik (seperti kasus batas bawah/penghapusan) di baris awal sebelum pengecekan kondisi umum untuk menghindari penyumbatan alur eksekusi program.

---

## 3. Perbaikan Temuan 3: Verifikasi Harga Produk melalui Katalog Internal

- **Kode yang diperbaiki**: `main.js`, fungsi `addToCart(id)` dan `renderProducts()`.
- **Detail perubahan**:
  1. Menghapus pembacaan data harga dari parameter DOM (`data-price`) pada tombol plus (`+`).
  2. Menggunakan fungsi `findProductById(id)` di dalam JavaScript untuk mendapatkan objek produk resmi langsung dari array internal `products` dan menetapkan harganya ke dalam state keranjang belanja.
  ```js
  function addToCart(id) {
    const product = findProductById(id);
    if (!product) return;

    if (!cart[id]) {
      cart[id] = { id: product.id, count: 0 };
    }
    ...
  ```
- **Kenapa cara ini benar**:
  Dengan mengambil harga dari array internal yang tidak terpapar secara langsung pada elemen HTML DOM, pembeli tidak dapat lagi melakukan kecurangan harga dengan mengedit atribut HTML `data-price` lewat DevTools Elements panel.
- **Prinsip umum**:
  * **Single Source of Truth (SSOT)**: Menetapkan satu sumber data tepercaya untuk informasi sensitif (harga barang). Data transaksi tidak boleh dibaca dari representasi visual DOM yang rentan dimanipulasi oleh pengguna.

---

## 4. Perbaikan Temuan 4 & 5: Validasi Kupon & Perhitungan Finansial Aman (Prinsip Produksi)

- **Kode yang diperbaiki**: `main.js` (Mitigasi & Arsitektur).
- **Detail perubahan**:
  Merapikan variabel kupon ke dalam format objek konfigurasi `COUPONS` di JavaScript lokal untuk kebutuhan prototipe ini, serta menambahkan dokumentasi prinsip arsitektur yang benar untuk lingkungan produksi nyata.
- **Kenapa cara ini benar**:
  Meskipun aplikasi frontend tanpa backend ini harus menyimpan kupon secara lokal, pemisahan data kupon ke dalam konfigurasi internal yang terstruktur mempermudah migrasi logika validasi ke sisi server kelak.
- **Prinsip umum**:
  * **Server-Side Validation**: Logika penentuan harga, diskon kupon, dan total akhir pembayaran wajib dihitung dan divalidasi di backend server tepercaya. Browser client bersifat *untrusted environment* (dapat didebug dan dimodifikasi secara bebas oleh pengguna), sehingga client hanya boleh digunakan untuk menampilkan visualisasi data saja.

---

## 5. Perbaikan Temuan 6: Penghapusan Stok Palsu (Fake Scarcity)

- **Kode yang diperbaiki**: `main.js`, fungsi `renderProducts()`.
- **Detail perubahan**:
  Menghapus baris kode yang menghasilkan angka sisa stok secara acak memakai `Math.random()`, dan menggantinya dengan informasi statis yang jujur:
  ```diff
  - <p class="stock">tinggal ${sisa} lagi hari ini!</p>
  + <p class="stock">stok tersedia</p>
  ```
- **Kenapa cara ini benar**:
  Menghilangkan taktik manipulasi psikologis yang memberikan informasi stok palsu kepada pengguna. Hal ini membuat aplikasi menyajikan data yang jujur dan konsisten (stok tidak berubah-ubah secara ajaib setiap kali keranjang belanja diperbarui).
- **Prinsip umum**:
  * **Ethical Product Design**: Menjauhi taktik *Dark Patterns* demi meningkatkan angka konversi dengan membohongi pengguna menggunakan kelangkaan palsu (*fake scarcity*). Bisnis yang berkelanjutan bergantung pada kejujuran informasi produk.

---

## 6. Perbaikan Temuan 7: Transparansi Biaya Penanganan di Sidebar

- **Kode yang diperbaiki**: `index.html` dan `main.js`, fungsi `renderCart()`.
- **Detail perubahan**:
  1. Menambahkan elemen penampung breakdown harga di sidebar keranjang belanja (`index.html`):
     ```html
     <div id="price-breakdown" class="review-breakdown"></div>
     ```
  2. Memastikan `main.js` merender detail Subtotal, Biaya Penanganan, dan Diskon ke dalam elemen tersebut secara langsung sebelum total akhir dihitung.
- **Kenapa cara ini benar**:
  Dengan menampilkan biaya penanganan (`$0.30`) langsung pada area keranjang sidebar, pengguna mendapatkan informasi yang utuh mengenai asal-usul pembengkakan harga belanjaan mereka sejak awal, bukan secara mendadak saat masuk ke halaman konfirmasi pembayaran.
- **Prinsip umum**:
  * **Price Transparency**: Menyediakan rincian seluruh komponen biaya transaksi (biaya admin, ongkos kirim, pajak) secara terbuka sejak awal proses belanja untuk menghindari taktik biaya siluman (*hidden costs*).

---

## 7. Perbaikan Temuan 8: Konsistensi Pembatasan Kuantitas Maksimal Pembelian

- **Kode yang diperbaiki**: `main.js`, fungsi `addToCart(id)`.
- **Detail perubahan**:
  Menambahkan pengecekan batas maksimal kuantitas `MAX_QUANTITY` di dalam fungsi `addToCart(id)` (tombol plus `+`):
  ```js
  if (cart[id].count >= MAX_QUANTITY) {
    showToast(`Maksimal pembelian ${product.name} adalah ${MAX_QUANTITY} buah.`);
    return;
  }
  ```
- **Kenapa cara ini benar**:
  Mengamankan jalur penambahan barang agar konsisten mematuhi batasan kuantitas maksimal (99 barang) yang telah ditentukan, baik ketika pengguna mengetik kuantitas secara manual maupun ketika mengklik tombol plus berkali-kali.
- **Prinsip umum**:
  * **Validation Consistency**: Memastikan setiap jalur entri data (*input entry points*) divalidasi secara seragam dengan aturan bisnis yang sama untuk mencegah celah bypass batasan sistem.
