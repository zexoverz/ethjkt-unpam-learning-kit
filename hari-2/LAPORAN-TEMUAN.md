# LAPORAN TEMUAN — PASAR PAGI (Bug Bounty Hari 2)

**NIM Mahasiswa:** 251011450304  
**Nama Mahasiswa:** Muhammad Abiyasa  
**Email:** abi.vardhana@outlook.com  

Tim Keamanan. Setiap temuan dibuktiin sendiri di browser/DevTools, bukan cuma nebak dari baca kode.

Status target: **2 BUG / 3 KEAMANAN / 2 ETIKA**.
Terdapat 8 temuan yang berhasil dideteksi dan dibuktikan secara langsung.

---

## Temuan #1: [BUG] Input jumlah non-angka bikin Total & keranjang jadi `NaN`

- **Masalahnya apa (bahasa sendiri):**
  Kolom jumlah di keranjang (`<input type="number" class="edit-quantity-input">`) menerima input apa saja tanpa divalidasi. Jika kolom dikosongkan atau diisi huruf oleh user, `parseInt` akan mengembalikan `NaN`. Karena perbandingan `NaN <= 0` bernilai `false`, kode terus menyimpan `cart[id].count = NaN`. Akibatnya, seluruh penjumlahan harga di keranjang dan tampilan Total berubah menjadi `NaN`.

- **Lokasi kode:**
  - `main.js:283` (sebelum diperbaiki) → `const quantity = parseInt(target.value, 10);`
  - `main.js:158-166` (sebelum diperbaiki) → fungsi `updateQuantity` tidak memiliki guard check untuk `Number.isNaN`.

- **Cara buktiinnya (langkah persis):**
  1. Buka `index.html`, klik `+` di satu produk (misalnya Apel Fuji) agar masuk keranjang.
  2. Pada input box jumlah di dalam keranjang, hapus angkanya sampai kosong (atau ketik huruf seperti `xyz`).
  3. Perhatikan nilai **Total** di layar berubah menjadi `NaN` dan badge jumlah belanja di header ikut menjadi `NaN`.

- **Kenapa ini bahaya / siapa yang rugi:**
  Toko kelihatan rusak dan tidak profesional. Pembeli bingung berapa nominal uang yang harus dibayarkan. Jika data pesanan berharga `NaN` ini terkirim ke server/database transaksi, hal ini dapat merusak log database atau menggagalkan transaksi pembayaran.

- **Cara betulinnya:**
  Lakukan validasi sebelum data dimasukkan ke state.
  ```js
  if (!Number.isInteger(quantity)) return;
  ```
  Prinsip dasar: **Never trust user input**. Validasi tipe data dan integritas data di batas input sebelum memperbarui state internal.

---

## Temuan #2: [BUG] Tidak ada batas jumlah (min/max/integer) yang benar

- **Masalahnya apa (bahasa sendiri):**
  Jumlah barang belanjaan tidak dibatasi ke batas stok nyata. Pembeli bisa mengetikkan kuantitas fantastis seperti `999999` di input keranjang. Angka desimal (`2.9`) akan dibulatkan ke bawah menjadi `2` tanpa ada notifikasi. Lebih parah, input negatif (`-3`) langsung menghapus produk dari keranjang secara diam-diam tanpa ada pesan penolakan atau konfirmasi yang jelas kepada pembeli.

- **Lokasi kode:**
  - `main.js:158-166` (sebelum diperbaiki) → fungsi `updateQuantity` tidak memiliki batas atas/bawah stok.
  - `index.html` → atribut `min="1"` pada input HTML mudah sekali dilewati dengan mengetik langsung ke dalam box input.

- **Cara buktiinnya (langkah persis):**
  1. Masukkan buah Apel ke keranjang.
  2. Ketik langsung angka `9999` ke input jumlah barang di keranjang belanja.
  3. Keranjang menerima input tersebut dan Total harga melonjak tinggi melewati batas ketersediaan barang.
  4. Ketik `-5` pada input tersebut, maka item langsung hilang dari keranjang.

- **Kenapa ini bahaya / siapa yang rugi:**
  Jumlah pesanan menjadi tidak sinkron dengan stok fisik yang ada di gudang petani. Penjual/petani rugi karena menerima pesanan fiktif dalam jumlah raksasa yang tidak mungkin dipenuhi. User juga rugi dari segi pengalaman karena item hilang tiba-tiba tanpa konfirmasi saat memasukkan angka negatif.

- **Cara betulinnya:**
  Menerapkan batas atas berdasarkan sisa stok produk katalog yang tersedia, serta memastikan nilai integer positif sebelum memperbarui keranjang. Jika melebihi batas, lakukan penyesuaian (clamp) ke jumlah maksimal stok dan berikan notifikasi (toast).

---

## Temuan #3: [BUG] Total tidak diformat (`toFixed`) → muncul sampah floating-point

- **Masalahnya apa (bahasa sendiri):**
  Format mata uang di sidebar keranjang tidak menggunakan pembulatan desimal konsisten seperti di kartu produk. Nilai total yang dihitung merupakan floating-point mentah yang langsung disuntikkan ke DOM. Hal ini dapat menimbulkan artefak matematika biner berupa deretan angka desimal panjang (misalnya `$5.699999999999999` bukannya `$5.70`).

- **Lokasi kode:**
  - `main.js:123` (sebelum diperbaiki) → `totalPriceEl.textContent = total;`
  - `main.js:231` (sebelum diperbaiki) → baris grand total di modal review menggunakan string literal mentah `<span>$${total}</span>`.

- **Cara buktiinnya (langkah persis):**
  1. Tambahkan buah dengan kombinasi harga desimal tertentu dan tambahkan biaya penanganan.
  2. Lihat tampilan **Total** di sidebar kanan atau di modal konfirmasi checkout. Terkadang akan muncul deretan angka desimal yang tidak rapi akibat karakteristik operasi floating-point di JavaScript.

- **Kenapa ini bahaya / siapa yang rugi:**
  Tampilan harga tidak rapi, tidak konsisten, dan memicu ketidakpercayaan pembeli karena perhitungan uang terkesan tidak akurat.

- **Cara betulinnya:**
  Menggunakan fungsi format desimal `.toFixed(2)` di setiap tempat yang menampilkan nominal uang ke pengguna, atau memusatkan perhitungan melalui fungsi shared render.

---

## Temuan #4: [KEAMANAN] Harga diambil dari DOM (`data-price`) — bisa diedit user

- **Masalahnya apa (bahasa sendiri):**
  Aplikasi mengambil harga barang dari atribut HTML `data-price` pada tombol tambah (`+`) saat barang dimasukkan ke keranjang. Karena kode client-side (DOM) dapat dimanipulasi secara bebas oleh pembeli melalui browser DevTools, pembeli jahat dapat mengubah harga barang menjadi sangat murah atau bahkan bernilai negatif sebelum mengkliknya.

- **Lokasi kode:**
  - `main.js:62` (sebelum diperbaiki) → `data-price="${product.price}"` disematkan ke DOM.
  - `main.js:257` (sebelum diperbaiki) → `addToCart(target.dataset.id, Number(target.dataset.price));` membaca harga dari DOM.
  - `main.js:136` (sebelum diperbaiki) → `cart[id].price = price;` menyalin harga hasil manipulasi ke objek keranjang belanja.

- **Cara buktiinnya (langkah persis):**
  1. Buka halaman Pasar Pagi di browser, tekan F12 untuk masuk ke DevTools.
  2. Cari elemen tombol plus (`+`) milik Apel Fuji di tab **Elements**.
  3. Ubah nilai atribut `data-price="1.5"` menjadi `data-price="0.01"`.
  4. Klik tombol plus tersebut. Perhatikan keranjang belanja Anda merekam harga Apel Fuji sebesar **$0.01** per buah, bukan $1.50.

- **Kenapa ini bahaya / siapa yang rugi:**
  Sangat berbahaya karena membocorkan pendapatan toko. Pembeli nakal dapat membeli produk mahal dengan harga receh secara curang. Kerugian finansial sepenuhnya ditanggung oleh pemilik toko dan petani. Melanggar prinsip fundamental keamanan: **Client data is untrusted**.

- **Cara betulinnya:**
  Hapus parameter harga dari panggilan fungsi tambah keranjang. Ambil harga produk langsung dari array katalog resmi `products` di JavaScript yang bersih berdasarkan `id` produk yang divalidasi.
  ```js
  const product = products.find((item) => item.id == id);
  cart[id].price = product.price;
  ```

---

## Temuan #5: [KEAMANAN] XSS — catatan user dirender pakai `innerHTML`

- **Masalahnya apa (bahasa sendiri):**
  Input catatan belanja untuk petani dirender di sidebar menggunakan properti `innerHTML` tanpa proses filter/sanitasi karakter berbahaya. Akibatnya, jika pembeli memasukkan tag HTML script atau tag gambar dengan handler `onerror`, kode tersebut langsung dieksekusi secara otomatis oleh browser sebagai skrip aktif.

- **Lokasi kode:**
  - `main.js:115` (sebelum diperbaiki) → `preview.innerHTML = "Catatan: " + note;`

- **Cara buktiinnya (langkah persis):**
  1. Masukkan minimal 1 barang ke keranjang.
  2. Pada input textarea "Catatan buat petani", ketik:
     `<img src=x onerror=alert('XSS-Attack-251011450304')>`
  3. Begitu diketik, event listener `input` mendeteksi perubahan, memicu render ulang keranjang, dan **alert popup** bertuliskan "XSS-Attack-251011450304" akan muncul karena tag img gagal dimuat dan memicu javascript `onerror`.

- **Kenapa ini bahaya / siapa yang rugi:**
  Ini adalah celah Cross-Site Scripting (XSS). Jika catatan ini disimpan ke database dan dirender di halaman admin/petani (Stored XSS), penyerang dapat mengeksekusi script jahat di browser admin untuk mencuri cookie sesi (session hijacking), mengalihkan halaman, atau memanipulasi data transaksi.

- **Cara betulinnya:**
  Ganti penggunaan `innerHTML` menjadi `textContent` saat menampilkan input dinamis dari user.
  ```js
  preview.textContent = "Catatan: " + note;
  ```

---

## Temuan #6: [KEAMANAN] Kupon rahasia & logika diskon ada di sisi client

- **Masalahnya apa (bahasa sendiri):**
  Kode kupon rahasia khusus petani ditulis dalam bentuk teks biasa (plaintext) langsung di dalam file JavaScript client. Siapa saja yang membuka website dapat dengan mudah membaca kode kupon tersebut di browser dan memicu pemotongan harga diskon besar 90% secara curang tanpa izin.

- **Lokasi kode:**
  - `main.js:32` (sebelum diperbaiki) → `const KUPON_RAHASIA = "TEMANFARMER";`

- **Cara buktiinnya (langkah persis):**
  1. Klik kanan pada halaman website Pasar Pagi, pilih **View Page Source** (atau buka tab **Sources** di DevTools F12).
  2. Cari file `main.js` dan temukan variabel `KUPON_RAHASIA`.
  3. Terlihat string `"TEMANFARMER"` secara jelas. Masukkan kode tersebut ke box kupon dan klik "Pakai" untuk mendapatkan diskon 90% secara ilegal.

- **Kenapa ini bahaya / siapa yang rugi:**
  Kupon rahasia internal bocor ke publik sehingga margin keuntungan toko hancur akibat diskon massal 90%.

- **Cara betulinnya:**
  Dalam arsitektur client-side statis murni, ganti string plaintext kupon dengan representasi hash kriptografi SHA-256 (`a12497e637e42764b41e7c6de1b07a8906d8e8841c7522a471a48a1ee74d61cd`). Input user dikonversi ke hash SHA-256 terlebih dahulu sebelum dibandingkan. Catatan: cara terbaik dan aman sepenuhnya adalah melakukan pengecekan kode kupon dan perhitungan diskon di **server backend**.

---

## Temuan #7: [ETIKA] Stok palsu (fake scarcity) dari `Math.random()`

- **Masalahnya apa (bahasa sendiri):**
  Angka stok "tinggal X lagi hari ini!" yang ditampilkan pada setiap produk tidak berdasarkan data riil inventori, melainkan diacak secara dinamis menggunakan `Math.random()` setiap kali halaman dirender ulang. Hal ini sengaja dirancang untuk memberikan kepanikan palsu kepada pembeli agar cepat-cepat melakukan pembayaran.

- **Lokasi kode:**
  - `main.js:47` (sebelum diperbaiki) → `const sisa = Math.floor(Math.random() * 5) + 1;`

- **Cara buktiinnya (langkah persis):**
  1. Perhatikan angka stok Apel Fuji di layar (misalnya tertulis "tinggal 3 lagi hari ini!").
  2. Klik tombol `+` pada produk lain atau ketik catatan belanja.
  3. Angka stok Apel Fuji tiba-tiba berubah secara acak (bisa naik atau turun) tanpa alasan logis karena fungsi render dipicu kembali.

- **Kenapa ini tidak adil / siapa yang rugi:**
  Ini adalah pola gelap (**Dark Pattern - False Urgency**). Toko menipu pembeli dengan menciptakan urgensi palsu yang melanggar kode etik bisnis jujur. Pembeli tertekan secara psikologis untuk membeli buah yang sebenarnya persediaannya masih melimpah.

- **Cara betulinnya:**
  Tambahkan field `stock` yang sesungguhnya di katalog data produk dan tampilkan stok stabil hasil pengurangan antara stok awal dengan jumlah barang yang sudah masuk keranjang belanja (`product.stock - quantity`).

---

## Temuan #8: [ETIKA] Biaya penanganan tersembunyi (drip pricing)

- **Masalahnya apa (bahasa sendiri):**
  Aplikasi mengenakan biaya tambahan penanganan (`HANDLING_FEE`) sebesar `$0.30` secara diam-diam. Pembeli mendapati angka **Total** belanjaannya di sidebar lebih mahal daripada penjumlahan harga buah yang dibeli, tanpa diberikan keterangan rincian biaya penanganan tersebut. Penjelasan biaya penanganan baru dibongkar di halaman modal checkout paling akhir (detik-detik terakhir sebelum konfirmasi pembelian).

- **Lokasi kode:**
  - `main.js:120` (sebelum diperbaiki) → `let total = totalPrice + HANDLING_FEE;` langsung dimasukkan ke tampilan Total sidebar tanpa penjelasan baris breakdown fee.

- **Cara buktiinnya (langkah persis):**
  1. Masukkan satu buah Apel Fuji seharga `$1.50` ke keranjang belanja.
  2. Perhatikan nilai Total di sidebar kanan menunjukkan angka `$1.80`. Selisih `$0.30` tersebut disembunyikan dan tidak dijelaskan sama sekali di area sidebar.
  3. Klik "Lanjut ke Pembayaran", barulah rincian biaya penanganan sebesar `$0.30` muncul di modal review checkout.

- **Kenapa ini tidak adil / siapa yang rugi:**
  Ini adalah pola gelap (**Dark Pattern - Drip Pricing**). Toko menyembunyikan biaya tambahan di awal untuk membuat harga terkesan sangat murah, kemudian membebankan biaya tersebut di akhir transaksi saat pembeli sudah terlanjur menginvestasikan waktu untuk memilih produk. Pembeli merasa tertipu dan membayar lebih mahal tanpa transparansi sejak awal.

- **Cara betulinnya:**
  Tampilkan rincian biaya secara transparan sejak barang pertama kali masuk ke keranjang belanja di sidebar kanan (meliputi Subtotal, Biaya Penanganan, Diskon jika ada, dan Grand Total) menggunakan fungsi layout breakdown terpusat.

---

## Refleksi Penutup

**Bedanya "kode jalan" vs "kode benar & jujur":**
Semua temuan di atas ada di kode yang **"jalan"** dengan mulus (tampilan rapi, ada transisi modal, kupon berfungsi, order tersimpan). Namun, kode tersebut tidak **"benar & jujur"** karena tidak tahan terhadap input nakal, memiliki celah keamanan fatal yang mengandalkan data client, membocorkan rahasia, serta secara tidak etis menipu emosi dan dompet pengguna melalui manipulasi stok acak serta biaya siluman. 

Sebagai developer profesional dengan integritas (NIM: 251011450304), kita bertugas untuk memastikan kode tidak hanya berfungsi secara visual, melainkan juga aman dari celah eksploitasi dan menjunjung tinggi etika kejujuran produk terhadap pengguna akhir.
