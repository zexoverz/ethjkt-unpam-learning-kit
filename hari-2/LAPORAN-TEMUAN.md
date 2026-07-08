# LAPORAN TEMUAN - BUG BOUNTY: PASAR PAGI

Laporan ini merinci hasil audit keamanan, fungsionalitas (bug), dan etika desain (dark pattern) pada aplikasi web Pasar Pagi. Ditemukan **7 temuan utama** yang terbagi menjadi **2 Bug**, **3 Celah Keamanan**, dan **2 Pelanggaran Etika (Dark Pattern)**.

---

## Temuan 1: Floating Point Precision Bug (Total Harga Pecah)
* **Kategori**: `BUG`
* **Masalah**: 
  Dalam perhitungan total harga di [main.js:renderCart](file:///C:/Users/Hype%20AMD/OneDrive/Dokumen/programming/Workshop%20Ai%20&%20Blockchain/ethjkt-unpam-learning-kit/hari-2/main.js#L76-L126) dan [main.js:openReview](file:///C:/Users/Hype%20AMD/OneDrive/Dokumen/programming/Workshop%20Ai%20&%20Blockchain/ethjkt-unpam-learning-kit/hari-2/main.js#L195-L235), nilai total akhir dihitung dan langsung ditampilkan tanpa diformat menggunakan `.toFixed(2)`. Karena sifat operasi matematika floating-point di JavaScript, hal ini sering kali memunculkan angka desimal yang sangat panjang (misalnya `$1.8000000000000003`).
* **Cara Membuktikan**:
  1. Jalankan aplikasi web Pasar Pagi.
  2. Tambahkan **Semangka (Potong)** sebanyak 1 buah ke keranjang (Harga: $3.20).
  3. Masukkan kupon `TEMANFARMER` lalu klik **Pakai** (potongan 90%).
  4. Perhatikan angka Total di keranjang. Angkanya akan tampil sebagai `$0.35000000000000003` bukan `$0.35`.
* **Kenapa Ini Bahaya / Nggak Adil**:
  Tampilan harga yang tidak presisi terlihat tidak profesional dan membingungkan pengguna mengenai jumlah uang yang sebenarnya akan ditarik dari rekening mereka.
* **Cara Betulin**:
  Ubah baris kode yang menetapkan `textContent` untuk total harga di `renderCart` dan `openReview` dengan menambahkan `.toFixed(2)` agar selalu menampilkan 2 digit di belakang koma.
  ```diff
  - totalPriceEl.textContent = total;
  + totalPriceEl.textContent = total.toFixed(2);
  ```

---

## Temuan 2: NaN Propagation (Input Kuantitas Tidak Tervalidasi)
* **Kategori**: `BUG`
* **Masalah**: 
  Fungsi [main.js:updateQuantity](file:///C:/Users/Hype%20AMD/OneDrive/Dokumen/programming/Workshop%20Ai%20&%20Blockchain/ethjkt-unpam-learning-kit/hari-2/main.js#L158-L166) menerima parameter `quantity` dari event listener tanpa memvalidasi apakah input tersebut adalah angka yang valid. Jika pengguna menghapus total input hingga kosong di keranjang, `parseInt("", 10)` menghasilkan `NaN`. Nilai `NaN` ini lolos dari pengecekan `quantity <= 0` dan disimpan ke dalam keranjang belanja.
* **Cara Membuktikan**:
  1. Tambahkan 1 buah apa saja (misalnya Apel Fuji) ke keranjang.
  2. Di bagian input angka di sidebar keranjang, hapus angka tersebut (kosongkan input).
  3. Seketika itu juga, harga barang, total belanja, dan badge jumlah keranjang akan berubah menjadi `NaN` atau `$NaN`.
* **Kenapa Ini Bahaya / Nggak Adil**:
  Hal ini merusak keseluruhan state keranjang belanja aplikasi (aplikasi crash secara visual) dan menghentikan proses belanja pengguna secara total sebelum mereka melakukan refresh halaman.
* **Cara Betulin**:
  Tambahkan validasi `isNaN(quantity)` di event listener atau di dalam fungsi `updateQuantity`. Jika input kosong/invalid, kembalikan nilai ke default `1` atau hapus item tersebut dari keranjang.
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

## Temuan 3: DOM-based Cross-Site Scripting / XSS (Catatan Petani)
* **Kategori**: `KEAMANAN`
* **Masalah**: 
  Catatan yang diinput oleh pengguna di textarea dituliskan langsung ke dalam elemen DOM menggunakan `.innerHTML` pada fungsi [main.js:renderCart](file:///C:/Users/Hype%20AMD/OneDrive/Dokumen/programming/Workshop%20Ai%20&%20Blockchain/ethjkt-unpam-learning-kit/hari-2/main.js#L110-L117) tanpa adanya sanitasi atau validasi input.
* **Cara Membuktikan**:
  1. Ketik payload XSS berikut pada kolom "Catatan buat petani":
     ```html
     <img src=x onerror=alert(1)>
     ```
  2. Setiap kali tombol keyboard ditekan (memicu event `input`), fungsi `renderCart` akan dipanggil dan payload tersebut langsung dieksekusi oleh browser, memunculkan dialog pop-up `alert(1)`.
* **Kenapa Ini Bahaya / Nggak Adil**:
  Ini adalah celah keamanan XSS yang sangat berbahaya. Penyerang dapat menyuntikkan script berbahaya untuk mencuri data session/cookie pengguna lain, melakukan pembajakan akun (session hijacking), atau mengalihkan transaksi ke situs penipuan.
* **Cara Betulin**:
  Ubah penggunaan `.innerHTML` menjadi `.textContent` untuk merender catatan secara aman sebagai teks biasa, bukan sebagai kode HTML.
  ```diff
  - preview.innerHTML = "Catatan: " + note;
  + preview.textContent = "Catatan: " + note;
  ```

---

## Temuan 4: Hardcoded Secret Coupon (Kupon Bocor di Client)
* **Kategori**: `KEAMANAN`
* **Masalah**: 
  Kode kupon diskon internal petani (`TEMANFARMER`) dideklarasikan sebagai konstanta hardcoded langsung di file JavaScript client-side [main.js](file:///C:/Users/Hype%20AMD/OneDrive/Dokumen/programming/Workshop%20Ai%20&%20Blockchain/ethjkt-unpam-learning-kit/hari-2/main.js#L32).
* **Cara Membuktikan**:
  1. Buka DevTools di browser (F12) -> tab **Sources** atau **Network** dan periksa isi file `main.js`.
  2. Pada baris ke-32, terlihat jelas kode: `const KUPON_RAHASIA = "TEMANFARMER";`.
  3. Masukkan kode tersebut pada kolom kupon di halaman web, maka pengguna akan mendapatkan diskon 90% secara instan.
* **Kenapa Ini Bahaya / Nggak Adil**:
  Siapa pun yang memiliki pengetahuan dasar tentang web dev dapat mencuri kupon ini untuk berbelanja dengan harga diskon yang tidak sah, yang menyebabkan kerugian finansial yang signifikan bagi toko/petani.
* **Cara Betulin**:
  Di dunia nyata, validasi kupon harus dilakukan di server-side (backend). Untuk aplikasi front-end sederhana, setidaknya kupon tidak disimpan dalam bentuk plain-text melainkan dienkripsi/dihash (misal SHA-256) dan pencocokan dilakukan dengan membandingkan nilai hash input pengguna dengan hash yang tersimpan.

---

## Temuan 5: Price Manipulation via DOM Attributes (Manipulasi Harga)
* **Kategori**: `KEAMANAN`
* **Masalah**: 
  Fungsi [main.js:addToCart](file:///C:/Users/Hype%20AMD/OneDrive/Dokumen/programming/Workshop%20Ai%20&%20Blockchain/ethjkt-unpam-learning-kit/hari-2/main.js#L129-L139) menggunakan parameter `price` yang diambil langsung dari atribut HTML `data-price` pada tombol plus-button di halaman web, bukannya mengambil harga resmi dari database/katalog internal `products`.
* **Cara Membuktikan**:
  1. Klik kanan pada tombol `+` di produk **Apel Fuji** dan pilih **Inspect Element**.
  2. Di DevTools, ubah atribut `data-price="1.5"` menjadi `data-price="0.01"`.
  3. Klik tombol `+` tersebut.
  4. Lihat di keranjang belanja: Apel Fuji akan ditambahkan dengan harga `$0.01` per buah, bukan harga aslinya `$1.50`.
* **Kenapa Ini Bahaya / Nggak Adil**:
  Pengguna nakal dapat memanipulasi harga barang sesuka hati mereka sebelum checkout, memaksa sistem memproses transaksi ilegal dengan harga sangat murah atau bahkan negatif.
* **Cara Betulin**:
  Jangan pernah mempercayai data harga yang dikirim dari DOM client. Ambil data harga langsung dari katalog tepercaya `products` menggunakan ID barang yang dicari di dalam fungsi `addToCart`:
  ```javascript
  function addToCart(id) {
    const product = products.find((item) => item.id == id);
    if (!product) return;

    if (!cart[id]) {
      cart[id] = { ...product, count: 0 };
    }
    // Selalu gunakan harga resmi dari katalog tepercaya, bukan dari DOM
    cart[id].price = product.price; 
    cart[id].count++;
    renderCart();
  }
  ```

---

## Temuan 6: Fake Stock (Dark Pattern: Artificial Scarcity / FOMO)
* **Kategori**: `ETIKA`
* **Masalah**: 
  Informasi sisa stok produk yang ditampilkan di halaman web ("tinggal X lagi hari ini!") adalah angka palsu yang dihasilkan secara acak menggunakan fungsi `Math.random()` pada fungsi [main.js:renderProducts](file:///C:/Users/Hype%20AMD/OneDrive/Dokumen/programming/Workshop%20Ai%20&%20Blockchain/ethjkt-unpam-learning-kit/hari-2/main.js#L42-L67). Tidak ada pengurangan stok yang riil saat barang dimasukkan ke keranjang belanja.
* **Cara Membuktikan**:
  1. Perhatikan sisa stok dari salah satu produk, misalnya **Jeruk Navel** tertulis "tinggal 3 lagi".
  2. Klik tombol `+` untuk menambahkan Jeruk Navel ke keranjang.
  3. Setelah halaman me-render ulang keranjang, perhatikan kembali sisa stok Jeruk Navel. Angkanya akan berubah secara acak (misal menjadi "tinggal 5 lagi" atau "tinggal 1 lagi").
* **Kenapa Ini Bahaya / Nggak Adil**:
  Ini adalah taktik manipulatif (Dark Pattern) yang disebut *Artificial Scarcity* (Kelangkaan Buatan). Tujuannya adalah menakut-nakuti pembeli (menciptakan efek FOMO) agar terburu-buru membeli barang tanpa berpikir panjang, padahal stok aslinya aman.
* **Cara Betulin**:
  Kelola jumlah stok riil di dalam objek produk di array `products`. Kurangi stok tersebut secara dinamis ketika barang dimasukkan ke keranjang belanja, dan tampilkan sisa stok yang sesungguhnya. Jika stok habis, nonaktifkan tombol `+`.

---

## Temuan 7: Hidden Handling Fee (Dark Pattern: Drip Pricing)
* **Kategori**: `ETIKA`
* **Masalah**: 
  Toko secara diam-diam menambahkan biaya penanganan (`HANDLING_FEE` sebesar `$0.30`) ke dalam total harga di keranjang belanja sidebar [main.js:renderCart](file:///C:/Users/Hype%20AMD/OneDrive/Dokumen/programming/Workshop%20Ai%20&%20Blockchain/ethjkt-unpam-learning-kit/hari-2/main.js#L119-L123), tanpa menuliskannya secara eksplisit di rincian sidebar keranjang tersebut. Informasi biaya penanganan ini baru dimunculkan di detik-detik terakhir pada modal review checkout.
* **Cara Membuktikan**:
  1. Tambahkan **Apel Fuji** sebanyak 1 buah ke keranjang (Harga: $1.50).
  2. Perhatikan rincian di sidebar keranjang. Tidak ada keterangan biaya tambahan, namun total harga langsung tertera sebesar `$1.80`. Ada kelebihan `$0.30` yang tidak jelas asal-usulnya dari mana.
  3. Setelah mengeklik "Lanjut ke Pembayaran", barulah rincian `Biaya penanganan $0.30` muncul di modal review.
* **Kenapa Ini Bahaya / Nggak Adil**:
  Ini adalah Dark Pattern jenis *Drip Pricing* (Pemberian harga bertahap/tersembunyi). Pembeli merasa ditipu karena harga akhir yang harus mereka bayar lebih mahal daripada akumulasi harga barang yang mereka pilih secara sadar, tanpa pemberitahuan transparansi di awal.
* **Cara Betulin**:
  Tampilkan rincian biaya penanganan secara transparan di sidebar keranjang belanja (di atas total harga) sehingga pembeli tahu persis komponen apa saja yang membentuk total harga tersebut sebelum melangkah ke proses checkout.

---

## Temuan 8 (STRETCH): Negative and Overflow Boundaries (Batas Nilai Negatif & Overflow)
* **Kategori**: `BUG` / `KEAMANAN`
* **Masalah**: 
  Aplikasi Pasar Pagi tidak membatasi kuantitas maksimum pembelian (overflow) dan tidak membatasi total harga agar tidak bernilai negatif. 
* **Cara Membuktikan**:
  1. Melalui celah manipulasi harga (Temuan 5), ubah `data-price` pada salah satu buah menjadi nilai negatif ekstrim, misalnya `-100.00`.
  2. Tambahkan buah tersebut ke keranjang.
  3. Total harga akhir keranjang akan bernilai minus (misalnya `-$99.70`). Pembeli dapat melakukan konfirmasi pesanan dengan total minus, yang berarti toko secara logika berutang kepada pembeli.
* **Kenapa Ini Bahaya / Nggak Adil**:
  Toko dapat mengalami kerugian finansial yang tidak terbatas karena sistem membiarkan transaksi dengan nilai total negatif diproses.
* **Cara Betulin**:
  Batasi total harga akhir agar minimal bernilai `0` (atau berikan error jika total belanja tidak masuk akal), dan pastikan kuantitas input dibatasi pada batas wajar (misal maks 100 per barang).

---

## Temuan 9 (STRETCH): Unsynchronized UI Prices (Angka Tidak Sinkron di Dua Tempat)
* **Kategori**: `BUG`
* **Masalah**: 
  Ketika harga diubah via DOM (Temuan 5), harga barang di sidebar keranjang berubah mengikuti harga manipulasi (misalnya `$0.01`), tetapi harga barang pada kartu produk katalog utama tetap menampilkan harga asli (misalnya `$1.50`). Hal ini menciptakan ketidaksinkronan tampilan data pada halaman yang sama.
* **Cara Membuktikan**:
  1. Edit `data-price` pada tombol Apel Fuji di DevTools menjadi `0.01`.
  2. Klik tombol `+`.
  3. Perhatikan: Kartu Apel Fuji di katalog tetap menampilkan harga `$1.50`, tetapi di keranjang sidebar tertulis `$0.01 / buah`. Data harga untuk produk yang sama menjadi tidak sinkron di layar.
* **Kenapa Ini Bahaya / Nggak Adil**:
  Ini membingungkan pengguna biasa dan membocorkan inkonsistensi data state aplikasi yang bisa menjadi petunjuk bagi penyerang bahwa aplikasi tersebut rentan terhadap eksploitasi parameter harga.
* **Cara Betulin**:
  Dengan memperbaiki Temuan 5 (membaca harga langsung dari katalog internal `products`), masalah sinkronisasi ini akan langsung teratasi karena kedua bagian UI akan selalu membaca dari sumber data tepercaya yang sama.

---

## Temuan 10 (STRETCH): typing Note Randomizes Stock (Keystroke Render Bug)
* **Kategori**: `BUG`
* **Masalah**: 
  Setiap ketukan tombol keyboard saat mengetik catatan di text area "Catatan buat petani" memicu pemanggilan fungsi `renderCart()`, yang di dalamnya langsung memanggil `renderProducts()`. Karena sisa stok dihasilkan acak pada saat render produk, mengetik catatan akan merandom sisa stok semua produk secara real-time pada setiap keystroke.
* **Cara Membuktikan**:
  1. Tambahkan buah ke keranjang belanja.
  2. Ketik sebuah catatan panjang di textarea "Catatan buat petani".
  3. Perhatikan angka-angka sisa stok di katalog produk (misalnya "tinggal X lagi"). Angka-angka tersebut akan berkedip dan berganti secara acak setiap kali Anda menekan tombol keyboard.
* **Kenapa Ini Bahaya / Nggak Adil**:
  Membuat pengalaman pengguna terasa aneh dan tidak profesional (stok berganti-ganti saat mengetik catatan), serta mempertegas fakta bahwa stok yang ditampilkan adalah manipulasi fiktif.
* **Cara Betulin**:
  Stok harus di-render sekali saja saat halaman dimuat atau menggunakan data state yang persisten, bukan dihitung acak setiap kali fungsi render dipanggil.

---

## Solusi Harga Versi Aman: Validasi di Sisi Server (Backend Validation)

Untuk memastikan pembeli sama sekali tidak dapat memanipulasi harga barang, arsitektur aplikasi harus menerapkan aturan berikut:
1. **Never Trust the Client**: Front-end (browser) hanya digunakan untuk menampilkan data dan mengumpulkan input ID produk dan kuantitas dari pengguna.
2. **Server-side Catalog Lookup**: Saat checkout/proses pembayaran, front-end mengirimkan payload minimal yang hanya berisi daftar ID produk dan kuantitasnya (misalnya `[{ id: 1, qty: 5 }, { id: 3, qty: 2 }]`) dan kode kupon.
3. **Database Verification**: Server akan membaca ID produk tersebut, mencocokkannya dengan harga resmi yang tersimpan di database aman milik server, memvalidasi kupon di server, lalu menghitung total harga akhir secara mandiri di sisi server.
4. **Secure Payment Intent**: Server mengirimkan nominal total yang valid tersebut langsung ke payment gateway pihak ketiga (misal Midtrans, Stripe) untuk diproses, tanpa membiarkan client-side mengirimkan nominal harga sendiri.

---

## 5 Aturan Review Kode Buat Kode Hasil Buatan AI (AI Code Review Rules)

Setiap kali menggunakan kode belanja/keuangan yang dihasilkan oleh AI, ikuti 5 aturan audit berikut sebelum naik ke production:

1. **Audit Sanitasi Input & Output (Mencegah XSS/Injeksi)**:
   * Periksa setiap variabel input pengguna yang ditampilkan kembali ke UI. Pastikan menggunakan `.textContent` atau `.innerText`, bukan `.innerHTML`, kecuali telah disanitasi menggunakan pustaka khusus seperti DOMPurify.
2. **Verifikasi Sumber Kebenaran Data (Price & State Integrity)**:
   * Pastikan perhitungan harga, diskon, dan saldo selalu merujuk pada objek state tepercaya di memori JavaScript client-side (atau dikonfirmasi ke server) dan tidak pernah dibaca dari atribut DOM HTML (`data-*`, `value`, atau teks UI) yang mudah dimanipulasi oleh pengguna via DevTools.
3. **Validasi Tipe Data & Edge Cases (NaN & Boundary Checking)**:
   * Periksa konversi tipe data (seperti `parseInt`, `parseFloat`). Pastikan ada pengecekan `isNaN()` dan pembatasan nilai ekstrem (nilai negatif, nilai `0`, nilai overflow) agar sistem tidak menerima data yang merusak logika perhitungan keuangan.
4. **Hilangkan Rahasia Hardcoded (No Client-side Secrets)**:
   * Larang penyimpanan kunci API, rahasia kupon internal, password, atau logika otorisasi sensitif secara mentah di kode client-side yang dapat dibaca publik dengan mudah melalui fitur "View Source".
5. **Evaluasi Etika Tampilan & UX (No Dark Patterns)**:
   * Pastikan tidak ada data palsu yang disajikan untuk memanipulasi emosi pengguna (seperti fake timer, fake stock, fake reviews) dan semua komponen biaya (biaya admin, biaya layanan) dipaparkan secara transparan di awal, bukan disembunyikan hingga halaman pembayaran akhir.

---

## Refleksi Penutup

### Bedanya "Kode Jalan" dengan "Kode Benar & Jujur"
Setelah menyelidiki Pasar Pagi, terlihat jelas perbedaan mendasar antara kedua konsep ini:
* **"Kode Jalan" (Functional Code)** hanya fokus pada hasil akhir yang tampak di permukaan: tombol bisa diklik, modal bisa muncul, data terhitung, dan tidak ada error merah di console saat alur normal dijalankan. Kode jenis ini sering kali dihasilkan oleh AI secara cepat karena AI memprioritaskan penyelesaian tugas secara visual dan fungsional dasar.
* **"Kode Benar & Jujur" (Secure, Robust & Ethical Code)** melangkah jauh lebih dalam:
  1. **Benar (Secure & Robust)**: Kode ditulis dengan memperhitungkan *edge cases* (seperti input kosong, tipe data salah/`NaN`), mematuhi prinsip keamanan dasar (tidak mempercayai input pengguna di DOM, mencegah XSS, memvalidasi state di tempat yang tepercaya), serta menangani kesalahan dengan anggun.
  2. **Jujur (Ethical)**: Desain sistem menghormati otonomi pengguna. Tidak menggunakan data fiktif untuk memanipulasi psikologis pembeli (fake stock scarcity), dan transparan mengenai biaya yang ditanggung pembeli sejak awal (no drip pricing).

Sebagai engineer, tugas kita bukan sekadar membuat fitur yang "bisa jalan", melainkan memastikan fitur tersebut aman dari eksploitasi, tangguh menghadapi input tidak terduga, dan etis dalam berinteraksi dengan pengguna nyata.
