# LAPORAN TEMUAN — PASAR PAGI (Security Audit & Bug Bounty)

Dokumen ini berisi daftar temuan dari audit keamanan dan peninjauan kode pada aplikasi Pasar Pagi. Setiap temuan telah diverifikasi secara langsung melalui browser dan DevTools.

---

### Finding 1: Input Jumlah Non-Angka Menghasilkan Nilai `NaN`

* **Category:** BUG
* **Severity:** Medium
* **Location:** `main.js` (dalam fungsi `updateQuantity` dan event listener `input` pada `.edit-quantity-input`)
* **Description:** Kolom input jumlah barang pada keranjang menerima karakter non-angka (seperti huruf atau ketika dikosongkan). Hal ini menyebabkan fungsi `parseInt()` menghasilkan nilai `NaN`. Karena tidak ada validasi pengecekan `NaN` (misalnya `Number.isNaN`), nilai `NaN` ini disimpan ke dalam properti `count` dari item keranjang, yang merusak perhitungan subtotal, biaya penanganan, diskon, dan total akhir menjadi `NaN`.
* **Steps to Reproduce:**
  1. Buka aplikasi, masukkan satu atau lebih buah ke dalam keranjang.
  2. Pada input jumlah barang di keranjang belanja (sidebar), hapus angka yang ada hingga kosong atau masukkan huruf (misal: "abc").
  3. Perhatikan nilai total belanja dan badge keranjang di header berubah menjadi `NaN`.
* **Root Cause:** Kode melakukan parsing nilai input secara langsung menggunakan `parseInt(target.value, 10)` tanpa memeriksa apakah hasil parsing tersebut valid (bukan `NaN`) sebelum memperbarui state `cart[id].count`.
* **Impact:** Tampilan total belanja rusak menjadi `NaN`, mengacaukan antarmuka pengguna, dan jika data ini dikirim ke sistem checkout backend, transaksi akan gagal atau menyimpan data pesanan yang tidak valid.
* **Evidence:** Mengetik karakter kosong atau huruf pada input kuantitas di keranjang mengubah seluruh tampilan angka biaya menjadi `$NaN`.
* **Recommended Fix:** Tambahkan pengecekan `Number.isNaN()` atau gunakan `Number.isInteger()` pada hasil parsing kuantitas sebelum memperbarui data keranjang. Jika tidak valid, batalkan pembaruan (return) agar nilai kuantitas valid terakhir tetap dipertahankan.
* **Status:** Fixed

---

### Finding 2: Ketiadaan Batas Maksimum Kuantitas dan Penegakan Stok Produk

* **Category:** BUG
* **Severity:** Medium
* **Location:** `main.js` (dalam fungsi `updateQuantity` dan penanganan tombol kuantitas)
* **Description:** Input manual kuantitas barang di keranjang tidak memiliki validasi batas atas. Pembeli dapat memasukkan kuantitas yang jauh melebihi batas stok nyata produk yang tersedia di katalog (misal memasukkan "999999" padahal stok hanya 12). Selain itu, input angka negatif tidak ditolak dengan pesan kesalahan, melainkan menghapus item dari keranjang secara diam-diam.
* **Steps to Reproduce:**
  1. Tambahkan satu buah Apel Fuji (stok: 12) ke dalam keranjang.
  2. Pada input kuantitas di sidebar, ketik angka manual `999999`.
  3. Total harga akan membengkak drastis melebihi batas ketersediaan stok tanpa ada peringatan atau penolakan.
  4. Ketik angka `-5` pada input kuantitas, item akan langsung terhapus dari keranjang secara instan tanpa konfirmasi.
* **Root Cause:** Fungsi `updateQuantity` tidak memeriksa batas stok maksimum produk yang didefinisikan dalam katalog saat memperbarui kuantitas secara manual dari elemen input.
* **Impact:** Pembeli dapat memesan barang melebihi stok fisik yang tersedia, menyebabkan ketidakkonsistenan data pesanan yang dikirim ke petani/penjual, serta pengalaman pengguna yang buruk saat pesanan dibatalkan sepihak.
* **Evidence:** Pengguna dapat memasukkan kuantitas `999999` untuk Apel Fuji dan total biaya langsung terhitung sebesar `$1499998.80` meskipun stok barang hanya ada 12 buah.
* **Recommended Fix:** Di dalam fungsi `updateQuantity()`, dapatkan batas stok maksimum produk dari array `products` resmi, lalu batasi (clamp) nilai kuantitas baru agar tidak melebihi stok tersebut menggunakan `Math.min(quantity, stock)`. Tampilkan pesan toast jika kuantitas disesuaikan ke batas stok maksimum.
* **Status:** Fixed

---

### Finding 3: Format Angka Uang Tidak Konsisten (Floating-point)

* **Category:** BUG
* **Severity:** Low
* **Location:** `main.js` (pada rendering total harga di sidebar dan modal review)
* **Description:** Nilai total akhir belanja di sidebar dan modal review tidak diformat menggunakan tingkat presisi desimal tetap (`.toFixed(2)`). Akibatnya, nilai desimal floating-point bawaan JavaScript terkadang muncul, seperti menampilkan `$4.8` alih-alih `$4.80`, atau memunculkan artefak angka desimal yang panjang seperti `$5.699999999999999`.
* **Steps to Reproduce:**
  1. Tambahkan beberapa barang ke keranjang belanja yang menghasilkan subtotal dengan pecahan desimal.
  2. Perhatikan teks angka Total di bagian bawah sidebar keranjang dan Total di modal review terkadang menampilkan satu angka di belakang koma atau deretan angka panjang hasil galat floating-point.
* **Root Cause:** Properti textContent dari elemen total akhir di-assign langsung menggunakan variabel numerik mentah tanpa diformat menggunakan metode `.toFixed(2)`.
* **Impact:** Tampilan mata uang tidak konsisten, kurang profesional, dan dapat membingungkan pembeli mengenai jumlah uang riil yang harus dibayarkan.
* **Evidence:** Total belanjaan tertentu menampilkan format seperti `$4.8` atau angka desimal panjang, tidak seragam dengan harga produk lainnya yang menggunakan `$X.XX`.
* **Recommended Fix:** Gunakan fungsi helper pembuat rincian terpusat (`buildBreakdown`) yang mengembalikan objek angka terformat, lalu pastikan setiap nilai uang yang dirender ke DOM selalu dipanggil dengan metode `.toFixed(2)`.
* **Status:** Fixed

---

### Finding 4: Kerentanan Manipulasi Harga Melalui Atribut DOM (`data-price`)

* **Category:** SECURITY
* **Severity:** High
* **Location:** `index.html` dan `main.js` (pada tombol plus-button dan fungsi `addToCart`)
* **Description:** Harga produk yang akan ditambahkan ke keranjang diambil dari atribut `data-price` pada tombol tambah (`+`) di DOM. Karena kode sisi klien (DOM HTML) dapat dimanipulasi sepenuhnya oleh pengguna (misalnya menggunakan F12 Inspect Element), pembeli dapat mengubah nilai `data-price` menjadi angka yang sangat kecil (bahkan negatif atau nol) sebelum mengeklik tombol tambah, sehingga harga produk di keranjang berubah sesuai keinginan mereka.
* **Steps to Reproduce:**
  1. Klik kanan pada tombol `+` untuk Apel Fuji di halaman toko, lalu pilih **Inspect Element**.
  2. Ubah nilai atribut `data-price="1.5"` menjadi `data-price="0.01"`.
  3. Klik tombol `+` tersebut. Apel Fuji akan ditambahkan ke keranjang dengan harga `$0.01` per buah.
* **Root Cause:** Fungsi `addToCart` menerima parameter harga dari DOM (`Number(target.dataset.price)`) dan langsung menggunakannya sebagai harga produk di keranjang belanja, alih-alih merujuk ke data harga resmi di array `products` internal.
* **Impact:** Pembeli dapat memanipulasi total harga pesanan sesuka hati dan melakukan kecurangan pembayaran (pembelian barang dengan harga sangat murah atau bahkan gratis).
* **Evidence:** Atribut `data-price` pada tombol plus-button dapat diubah melalui DevTools dan sistem keranjang langsung menerima harga hasil manipulasi tersebut untuk kalkulasi total.
* **Recommended Fix:** Hapus atribut `data-price` dari elemen HTML tombol tambah. Di dalam fungsi `addToCart(id)`, ambil harga resmi produk langsung dari array katalog produk `products` berdasarkan `id` yang dikirimkan. Lakukan juga sinkronisasi ulang data keranjang dengan katalog resmi setiap kali render keranjang dilakukan.
* **Status:** Fixed

---

### Finding 5: Celah Keamanan Stored Cross-Site Scripting (XSS) pada Input Catatan Pembeli

* **Category:** SECURITY
* **Severity:** High
* **Location:** `main.js` (pada rendering preview catatan di keranjang sidebar)
* **Description:** Input catatan pembeli ("Catatan buat petani") dirender ke dalam elemen preview di sidebar menggunakan properti `innerHTML` tanpa proses pembersihan (sanitasi) atau pengkodean (escaping). Hal ini memungkinkan penyerang menyisipkan tag HTML berbahaya atau skrip JavaScript (seperti tag `<img src=x onerror=...>` atau `<script>`) yang akan dieksekusi di browser pengguna.
* **Steps to Reproduce:**
  1. Tambahkan minimal satu barang ke dalam keranjang (agar preview catatan dirender di keranjang).
  2. Ketik payload berikut pada kolom input "Catatan buat petani":
     `<img src=x onerror="alert('XSS-Pasar-Pagi')">`
  3. Begitu teks diketik, skrip akan langsung dieksekusi secara otomatis dan menampilkan kotak dialog alert di layar browser.
* **Root Cause:** Penggunaan properti `innerHTML` untuk merender input teks bebas dari pengguna (`preview.innerHTML = "Catatan: " + note`) tanpa melakukan sanitasi input terlebih dahulu.
* **Impact:** Jika catatan ini disimpan ke database dan ditampilkan di panel admin/petani, hal ini menjadi kerentanan **Stored XSS** yang dapat digunakan untuk mencuri cookie sesi (session hijacking), melakukan pengalihan situs (redirection), atau merusak tampilan halaman admin.
* **Evidence:** Memasukkan payload tag gambar rusak dengan handler `onerror` memicu eksekusi kode JavaScript langsung di browser pengguna.
* **Recommended Fix:** Ganti penggunaan `innerHTML` dengan properti `textContent` untuk merender catatan pengguna secara aman. Properti `textContent` akan memperlakukan seluruh input sebagai teks murni dan secara otomatis meng-escape karakter-karakter khusus HTML.
* **Status:** Fixed

---

### Finding 6: Kebocoran Kode Kupon Rahasia dan Evaluasi Diskon di Sisi Klien (Client-Side)

* **Category:** SECURITY
* **Severity:** High
* **Location:** `main.js` (variabel `KUPON_RAHASIA` dan fungsi `applyCoupon`)
* **Description:** Kode kupon rahasia khusus petani disimpan dalam bentuk plaintext di file JavaScript klien (`const KUPON_RAHASIA = "TEMANFARMER"`). Akibatnya, siapa pun dapat dengan mudah melihat kode kupon tersebut melalui fitur "View Source" browser. Selain itu, logika perhitungan diskon (90%) dilakukan sepenuhnya di sisi browser klien tanpa validasi server.
* **Steps to Reproduce:**
  1. Buka aplikasi, lalu buka tab **Sources** di DevTools atau klik kanan halaman dan pilih **View Page Source**.
  2. Cari file `main.js` and temukan deklarasi variabel `KUPON_RAHASIA` yang bernilai `"TEMANFARMER"`.
  3. Masukkan kode `"TEMANFARMER"` pada input kupon di sidebar, lalu klik "Pakai". Diskon besar 90% akan langsung diaktifkan.
* **Root Cause:** Penyimpanan data rahasia (kupon diskon) dan logika otorisasi diskon diletakkan sepenuhnya di sisi klien yang tidak aman.
* **Impact:** Kode kupon rahasia bocor ke publik dengan cepat. Pengguna jahat dapat memicu diskon secara ilegal atau memanipulasi variabel status diskon langsung dari console browser.
* **Evidence:** String kupon rahasia `"TEMANFARMER"` tercantum secara polos di dalam source code JavaScript dan dapat dibaca oleh siapa saja yang mengakses situs tersebut.
* **Recommended Fix:** Untuk aplikasi statis murni, lakukan hardening dengan cara menghapus plaintext kupon dari kode sumber dan ganti dengan representasi hash satu arah (misal SHA-256). Pengguna harus memasukkan kode kupon, lalu kode tersebut di-hash dan dicocokkan dengan nilai hash yang disimpan di kode. Untuk sistem produksi yang aman, kode kupon dan kalkulasi diskon wajib divalidasi dan dihitung ulang di sisi server.
* **Status:** Fixed

---

### Finding 7: Stok Palsu Berbasis Nilai Acak (Fake Scarcity Dark Pattern)

* **Category:** ETHICAL
* **Severity:** Medium
* **Location:** `main.js` (dalam fungsi `renderProducts`)
* **Description:** Tampilan jumlah sisa produk ("tinggal X lagi hari ini!") tidak mencerminkan stok fisik yang sebenarnya. Nilai sisa tersebut dihitung menggunakan fungsi acak `Math.random()` setiap kali katalog produk dirender ulang. Hal ini sengaja dirancang untuk menciptakan kepanikan buatan (false urgency) agar pembeli terburu-buru melakukan checkout.
* **Steps to Reproduce:**
  1. Perhatikan angka sisa stok pada produk Apel Fuji (misal: "tinggal 4 lagi hari ini!").
  2. Klik tombol `+` untuk menambahkan barang ke keranjang atau lakukan refresh halaman.
  3. Perhatikan sisa stok pada produk tersebut berubah-ubah secara acak tanpa adanya korelasi logis dengan pembelian.
* **Root Cause:** Nilai stok sisa dibuat secara dinamis menggunakan ekspresi acak `Math.floor(Math.random() * 5) + 1` setiap kali fungsi `renderProducts()` dipanggil.
* **Impact:** Memanipulasi emosi pengguna secara tidak etis dengan taktik kelangkaan palsu, menurunkan tingkat kepercayaan pelanggan apabila mereka menyadari inkonsistensi data stok tersebut.
* **Evidence:** Menambah barang ke keranjang menyebabkan angka sisa stok produk lain melompat naik atau turun secara acak di layar browser.
* **Recommended Fix:** Definisikan properti stok nyata (`stock`) untuk masing-masing item di array `products`. Tampilkan stok yang tersedia dengan menghitung `stok_katalog - jumlah_di_keranjang`, sehingga data stok bernilai konsisten, stabil, dan jujur.
* **Status:** Fixed

---

### Finding 8: Biaya Penanganan Tersembunyi (Drip Pricing Dark Pattern)

* **Category:** ETHICAL
* **Severity:** Medium
* **Location:** `main.js` (pada rendering total di sidebar vs modal review)
* **Description:** Biaya penanganan operasional (`HANDLING_FEE` sebesar `$0.30`) ditambahkan secara diam-diam ke dalam nilai Total akhir di sidebar tanpa adanya keterangan rincian biaya penanganan. Rincian biaya penanganan tersebut baru ditampilkan secara transparan di modal review checkout saat pembeli mengklik tombol pembayaran.
* **Steps to Reproduce:**
  1. Tambahkan 1 Pisang (harga resmi: `$1.20`) ke dalam keranjang belanja.
  2. Lihat total harga di bagian bawah sidebar belanja menunjukkan angka `$1.50`, bukan `$1.20`. Tidak ada penjelasan dari mana asal selisih `$0.30` tersebut.
  3. Klik tombol "Lanjut ke Pembayaran". Rincian biaya penanganan sebesar `$0.30` baru muncul di modal review checkout.
* **Root Cause:** Variabel `total` di sidebar dihitung langsung dengan menambahkan `HANDLING_FEE` tanpa merender elemen baris rincian biaya tersebut ke dalam penampang breakdown di sidebar.
* **Impact:** Menerapkan taktik *drip pricing* yang menyembunyikan biaya tambahan di awal untuk membuat harga terlihat lebih murah, yang berpotensi menimbulkan kekecewaan pembeli saat melihat total biaya di akhir checkout.
* **Evidence:** Total belanjaan 1 item seharga `$1.20` langsung tertera sebesar `$1.50` di sidebar tanpa rincian teks biaya penanganan `$0.30` di samping atau di bawahnya.
* **Recommended Fix:** Satukan logika pembuatan rincian biaya menggunakan fungsi helper terpusat yang merender seluruh baris biaya (Subtotal, Biaya penanganan, Diskon jika ada, dan Total akhir) baik di sidebar keranjang belanja maupun di modal review checkout sejak awal barang ditambahkan.
* **Status:** Fixed

---

## Refleksi Penutup

### Perbedaan "Kode Jalan" (Functional Code) vs "Kode Benar & Jujur" (Secure & Ethical Code)

Setelah melakukan audit dan perbaikan pada proyek Pasar Pagi, perbedaan antara kedua konsep ini menjadi sangat jelas:

1. **Kode Jalan (Functional Code):** Hanya mementingkan fungsionalitas utama di bawah skenario normal. Kode jenis ini berfokus pada "apakah tombol bekerja?", "apakah halaman tampil dengan baik?", dan "apakah alur pembelian selesai?". Kode ini rentan terhadap eksploitasi karena mempercayai input pengguna secara membabi buta, menyimpan rahasia di tempat terbuka, dan dapat mengorbankan kejujuran demi meningkatkan konversi penjualan (misalnya menggunakan trik stok palsu atau menyembunyikan biaya tambahan).
2. **Kode Benar & Jujur (Secure & Ethical Code):** Adalah kode yang dirancang dengan asumsi bahwa lingkungan klien tidak dapat dipercaya (zero-trust client-side). Kode ini menerapkan prinsip pertahanan berlapis (defense-in-depth), memvalidasi setiap input di batas sistem (fail fast), menyanitasi semua output teks bebas sebelum dirender to DOM untuk mencegah XSS, dan memperlakukan pengguna dengan hormat melalui transparansi harga dan ketersediaan stok produk secara jujur tanpa taktik manipulasi psikologis.

Sebagai pengembang, tanggung jawab kita bukan hanya membuat kode yang "bekerja", melainkan memastikan bahwa kode tersebut aman bagi pengguna, tangguh terhadap serangan, serta transparan dan jujur dalam model bisnisnya.
