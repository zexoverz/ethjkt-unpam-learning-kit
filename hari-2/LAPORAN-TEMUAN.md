# LAPORAN TEMUAN: BUG BOUNTY "PASAR PAGI"
**Oleh: Dinar Fadilah**

Dokumen ini berisi hasil analisis mendalam (A-Z) dan perbaikan atas 7 masalah yang ditemukan pada aplikasi toko buah online **Pasar Pagi**.

---

### Temuan 1: BUG (Matematika Uang - Floating Point Precision Error)
* **Masalahnya apa**: Nilai total belanjaan dan kupon diskon sering kali menampilkan angka desimal yang sangat panjang dan berantakan (misalnya `$10.300000000000002` bukannya `$10.30`).
* **Cara buktiinnya**:
  1. Masukkan **Apel Fuji** (1 unit) dan **Pisang** (1 unit) ke dalam keranjang.
  2. Subtotal barang adalah `$1.50 + $1.20 = $2.70`.
  3. Ditambah biaya penanganan `$0.30`, totalnya seharusnya `$3.00`.
  4. Namun jika Anda memasukkan kupon diskon `TEMANFARMER`, hasil total yang dirender di layar akan mengalami galat presisi pecahan JavaScript.
* **Kenapa ini bahaya / nggak adil**: Menampilkan pecahan desimal tak berujung merusak estetika profesionalisme toko, membuat pembeli bingung, dan dapat menyebabkan kesalahan selisih pembulatan saat diintegrasikan ke sistem pembayaran gateway digital.
* **Cara betulinnya**: Memformat variabel hasil perhitungan total menggunakan `.toFixed(2)` di fungsi `renderCart()` dan `openReview()` sebelum dirender ke DOM.

---

### Temuan 2: BUG (Input Nakal - Kuantitas NaN / Tidak Valid)
* **Masalahnya apa**: Jika kolom input manual jumlah barang dikosongkan (dihapus isinya), total belanjaan dan seluruh harga langsung berubah menjadi `$NaN`, merusak logika aplikasi.
* **Cara buktiinnya**:
  1. Tambahkan buah apa saja ke dalam keranjang.
  2. Pada input angka kuantitas di sidebar keranjang, hapus angka tersebut hingga kosong menggunakan tombol Backspace.
  3. Seketika total belanjaan akan berubah menjadi `$NaN`.
* **Kenapa ini bahaya / nggak adil**: Toko kehilangan kemampuan menghitung harga secara valid. Pengguna tidak bisa melanjutkan transaksi karena sistem macet dengan nilai `NaN`, yang memaksa refresh halaman dan hilangnya data belanjaan.
* **Cara betulinnya**: Menambahkan penanganan khusus pada *event listener* input. Jika kuantitas kosong (`""`), abaikan pembaruan ke `NaN` untuk sementara, dan jika nilainya tidak valid/negatif, ubah secara otomatis ke angka `0` atau hapus item tersebut melalui fungsi `updateQuantity` yang divalidasi dengan `isNaN`.

---

### Temuan 3: KEAMANAN (DOM Cross-Site Scripting / XSS pada Catatan Petani)
* **Masalahnya apa**: Penyerang dapat menyisipkan dan mengeksekusi kode JavaScript berbahaya melalui kolom "Catatan buat petani".
* **Cara buktiinnya**:
  1. Ketik kode eksploitasi berikut di kolom "Catatan buat petani":
     `<img src="x" onerror="alert('Toko Anda diretas!')">`
  2. Skrip akan langsung dieksekusi di browser dan menampilkan pop-up alert bertuliskan "Toko Anda diretas!".
* **Kenapa ini bahaya / nggak adil**: Celah DOM XSS memungkinkan penyerang mencuri data sesi (*session cookies*), token autentikasi, atau melakukan pembajakan halaman (defacement) yang merugikan pengguna lain/admin toko yang membaca catatan tersebut.
* **Cara betulinnya**: Mengganti penulisan catatan di fungsi `renderCart()` dari properti `.innerHTML` menjadi `.textContent` agar input dari pengguna dirender sebagai teks murni dan dinonaktifkan dari eksekusi HTML.

---

### Temuan 4: KEAMANAN (Bocornya Kode Kupon Rahasia di Client-Side)
* **Masalahnya apa**: Kode kupon rahasia diskon 90% (`TEMANFARMER`) disimpan dalam teks polos (plaintext) di dalam kode JavaScript yang dapat diakses publik.
* **Cara buktiinnya**:
  1. Klik kanan di halaman web, pilih **Inspect** (F12).
  2. Buka tab **Sources** atau **Debugger** dan buka file `main.js`.
  3. Pada baris 32, terlihat jelas baris: `const KUPON_RAHASIA = "TEMANFARMER";`.
* **Kenapa ini bahaya / nggak adil**: Siapa pun dapat mencuri kupon ini untuk mendapatkan potongan harga tidak sah sebesar 90%. Toko akan mengalami kerugian finansial yang sangat besar akibat penyalahgunaan kupon rahasia ini.
* **Cara betulinnya**: Menyembunyikan teks polos kupon dengan melakukan encoding menggunakan Base64 (`VEVNQU5GQVJNRVI=`) di sisi client-side sebagai perlindungan awal (*obfuscation*), serta merekomendasikan validasi kupon dilakukan di backend server pada dunia nyata.

---

### Temuan 5: KEAMANAN (Manipulasi Harga Melalui Atribut DOM)
* **Masalahnya apa**: Pengguna dapat memanipulasi harga buah sesuka hati (misalnya mengubah harga Stroberi dari `$4.50` menjadi `$0.01`) melalui inspeksi elemen HTML sebelum menambahkannya ke keranjang.
* **Cara buktiinnya**:
  1. Klik kanan tombol plus (`+`) pada buah **Stroberi** di layar, lalu pilih **Inspect**.
  2. Ubah atribut `data-price="4.5"` menjadi `data-price="0.01"` di panel Elements DevTools.
  3. Klik tombol `+` tersebut. Stroberi akan masuk ke keranjang dengan harga `$0.01`.
* **Kenapa ini bahaya / nggak adil**: Pelanggan nakal bisa membeli buah-buahan mahal dengan harga hampir gratis, menyebabkan kerugian materi langsung bagi pemilik toko Pasar Pagi.
* **Cara betulinnya**: Mengubah parameter fungsi `addToCart(id)` agar hanya menerima `id` produk. Harga barang diambil langsung secara aman dari array katalog `products` internal di memori JS, bukan dari atribut `data-price` di DOM HTML yang bisa dimanipulasi user.

---

### Temuan 6: ETIKA (Stok Palsu - False Urgency)
* **Masalahnya apa**: Toko menampilkan stok buah sisa hari ini yang acak dan berganti-ganti setiap kali keranjang belanja diubah, menciptakan kepanikan palsu bagi pembeli.
* **Cara buktiinnya**:
  1. Perhatikan tulisan stok pada **Apel Fuji** (misal: "tinggal 3 lagi hari ini!").
  2. Klik tombol `+` untuk menambahkan Apel Fuji ke keranjang.
  3. Tiba-tiba tulisan stok Apel Fuji berubah secara acak (misal menjadi: "tinggal 5 lagi hari ini!").
* **Kenapa ini bahaya / nggak adil**: Ini adalah taktik kotor pemasaran (*dark pattern: false urgency*) yang menipu pembeli dengan kelangkaan buatan agar mereka terburu-buru melakukan checkout tanpa berpikir panjang.
* **Cara betulinnya**: Membuat state stok produk yang konsisten dan menyimpannya di `localStorage` saat pertama kali aplikasi dimuat. Stok akan berkurang secara riil dan logis hanya ketika transaksi berhasil dikonfirmasi.

---

### Temuan 7: ETIKA (Biaya Tersembunyi - Hidden Fees)
* **Masalahnya apa**: Toko mengenakan biaya penanganan tersembunyi sebesar `$0.30` (`HANDLING_FEE`) secara diam-diam ke dalam Total belanja di sidebar tanpa memberikan penjelasan apa pun. Rincian biaya ini baru ditampilkan di tahap checkout akhir.
* **Cara buktiinnya**:
  1. Masukkan **Apel Fuji** (1 unit, harga `$1.50`) ke keranjang.
  2. Total belanjaan di kanan bawah akan tertulis `$1.80` tanpa ada penjelasan dari mana selisih `$0.30` tersebut berasal.
* **Kenapa ini bahaya / nggak adil**: Pola gelap ini (*hidden fees / sneak into basket*) merusak kepercayaan konsumen karena toko menyembunyikan biaya tambahan hingga detik terakhir transaksi guna membuat harga produk terlihat lebih murah di awal.
* **Cara betulinnya**: Menambahkan panel rincian biaya (`cart-summary-breakdown`) yang transparan di bagian bawah keranjang samping. Rincian ini secara jujur menjabarkan Subtotal, Biaya Penanganan, dan Potongan Kupon secara langsung di halaman utama toko sebelum tombol checkout ditekan.

---

## Refleksi Penutup: "Kode Jalan" vs "Kode Benar & Jujur"
Setelah menyelesaikan misi Hari 2, perbedaan utama antara keduanya adalah:
* **"Kode Jalan"** hanyalah kode yang secara fungsional memenuhi kebutuhan teknis dasar (tampilan bagus, tombol bisa diklik, data terkirim). Namun, kode ini sering kali rapuh, tidak memikirkan skenario terburuk (seperti input kosong), memiliki celah keamanan fatal yang bisa dieksploitasi, dan bahkan menggunakan trik psikologis tidak jujur (*dark patterns*) untuk menjebak pengguna.
* **"Kode Benar & Jujur"** adalah kode yang tidak hanya berjalan secara teknis, tetapi juga tangguh menghadapi input nakal, terlindungi dari ancaman keamanan (seperti XSS dan manipulasi harga), serta memprioritaskan transparansi informasi dan etika moral kepada penggunanya (seperti stok riil dan keterbukaan biaya). Sebagai developer, kita adalah gerbang terakhir yang melindungi keamanan data, keuangan, dan kepercayaan pelanggan kita di dunia nyata.
