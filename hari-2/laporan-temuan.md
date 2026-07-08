# LAPORAN TEMUAN ANOMALI — PASAR PAGI (HARI 2)

Berikut adalah daftar temuan anomali yang ditemukan pada kode aplikasi Pasar Pagi setelah dilakukan proses audit kode (code review) dan pembuktian melalui browser DevTools.

---

## Temuan 1: [KEAMANAN] - Cross-Site Scripting (XSS) pada Input Catatan Petani

- **Masalahnya apa (bahasa sendiri)**: 
  Input teks dari kolom "Catatan buat petani" langsung dimasukkan ke dalam preview keranjang dan modal checkout tanpa disaring (escaping) terlebih dahulu. Karena menggunakan `.innerHTML` (sebelum diperbaiki), browser akan memperlakukan teks tersebut sebagai kode HTML/JavaScript aktif jika pengguna mengetikkan tag tertentu.
  
- **Cara buktiinnya (langkah persis yang kamu lakuin)**:
  1. Jalankan aplikasi Pasar Pagi di browser.
  2. Tambahkan minimal satu produk (misalnya "Apel Fuji") ke keranjang belanja.
  3. Pada kolom **Catatan buat petani**, masukkan payload JavaScript berikut:
     ```html
     <img src=x onerror=alert('XSS')>
     ```
  4. Perhatikan bahwa browser langsung memunculkan kotak dialog popup alert bertuliskan `'XSS'`, baik di preview keranjang belanja maupun saat membuka modal checkout.
  
- **Kenapa ini bahaya / nggak adil (siapa yang rugi)**:
  Sangat berbahaya bagi **pembeli (pengguna)**. Celah XSS ini memungkinkan penyerang menyisipkan skrip jahat yang dapat berjalan di browser pengguna lain (atau admin toko saat melihat detail pesanan). Penyerang dapat mencuri cookie sesi, kredensial, token pembayaran, atau memanipulasi tampilan Checkout secara keseluruhan. Pihak yang dirugikan adalah pengguna (kehilangan keamanan data) dan pemilik toko (kehilangan reputasi bisnis).
  
- **Cara betulinnya**:
  Mengubah penggunaan `.innerHTML` menjadi `.textContent` saat memasukkan catatan user ke dalam DOM. Kode yang aman:
  ```js
  preview.textContent = "Catatan: " + note;
  ```

---

## Temuan 2: [BUG / KEAMANAN] - Kuantitas Input Tidak Valid (NaN/Negatif) & Kehilangan Fokus (Focus Loss) saat Mengetik

- **Masalahnya apa (bahasa sendiri)**:
  1. Input jumlah barang tidak divalidasi dengan kuat pada event input sehingga rentan menerima nilai non-integer, kosong, desimal, atau angka minus. Pengecekan kuantitas `<= 0` untuk menghapus item juga tidak pernah jalan (dead code) karena diblokir oleh kondisi `quantity < 1` sebelumnya.
  2. Event listener dipasang pada event `input` dan memanggil `renderCart()` yang menghapus seluruh elemen keranjang lalu membuatnya ulang setiap kali pengguna mengetik satu tombol di keyboard. Hal ini menghancurkan elemen input yang sedang aktif, menyebabkan input kehilangan fokus kursor (focus loss) secara terus-menerus sewaktu mengetik kuantitas multi-digit.
  
- **Cara buktiinnya (langkah persis yang kamu lakuin)**:
  1. Tambahkan buah ke keranjang.
  2. Coba klik kolom input kuantitas buah di keranjang, lalu tekan Backspace untuk menghapus angka. Kursor langsung hilang dan angka kembali ke nilai semula secara otomatis karena input menjadi string kosong (`NaN`) dan langsung di-reset oleh re-render instan.
  3. Coba ketik angka multi-digit seperti `15`. Setelah Anda menekan tombol `1`, input langsung kehilangan fokus (focus loss), memaksa Anda mengklik kembali kotak input tersebut untuk mengetik angka `5`.
  4. Coba ketik angka `0` atau minus (`-5`). Item di keranjang tidak akan terhapus, melainkan nilai kembali ter-reset ke nilai kuantitas sebelumnya karena pengecekan `<= 0` berada di bawah blok filter `< 1` yang melakukan `return` secara dini.
  
- **Kenapa ini bahaya / nggak adil (siapa yang rugi)**:
  Yang rugi adalah **pembeli (pengguna)** karena pengalaman pengguna (UX) menjadi rusak dan sangat mengesalkan saat ingin mengetik kuantitas secara manual. Dari sisi bisnis, kegagalan menghapus item lewat angka `0` membingungkan pengguna dan bisa menyebabkan kesalahan pemesanan kuantitas barang yang tidak diinginkan.
  
- **Cara betulinnya**:
  1. Pindahkan penanganan event listener untuk `.edit-quantity-input` dari event `input` ke event `change` agar validasi dan re-render baru dijalankan setelah pengguna selesai mengetik dan memindahkan fokus (atau menekan Enter).
  2. Perbaiki urutan validasi pada fungsi `updateQuantity` agar memproses penghapusan item (`quantity <= 0`) terlebih dahulu sebelum memblokir input di bawah `1`:
     ```js
     if (Number.isInteger(quantity) && quantity <= 0) {
       delete cart[id];
       renderCart();
       return;
     }
     if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
       renderCart();
       return;
     }
     ```

---

## Temuan 3: [KEAMANAN] - Harga Produk Dipercaya Langsung dari Atribut HTML DOM

- **Masalahnya apa (bahasa sendiri)**:
  Harga buah yang dibeli tidak diambil dari data katalog internal JavaScript, melainkan dibaca dari atribut `data-price` pada tombol plus (`+`) di layar. Karena data HTML di sisi browser dapat diedit dengan mudah oleh pengguna lewat DevTools, siapa pun bisa mengubah harga barang sesuka mereka sebelum menambahkannya ke keranjang belanja.
  
- **Cara buktiinnya (langkah persis yang kamu lakuin)**:
  1. Klik kanan pada tombol plus (`+`) untuk produk "Pisang" (harga asli `$1.20`), pilih **Inspect** atau **Inspect Element** untuk membuka tab Elements DevTools.
  2. Cari atribut `data-price="1.2"` pada tag button tersebut, kemudian ubah nilainya menjadi `data-price="0.01"`.
  3. Klik tombol plus (`+`) tersebut di halaman web.
  4. Periksa keranjang belanja; Pisang ditambahkan dengan harga `$0.01` per buah, bukan `$1.20`.
  
- **Kenapa ini bahaya / nggak adil (siapa yang rugi)**:
  Sangat merugikan **pemilik toko (petani)**. Pembeli yang nakal bisa memanipulasi harga buah-buahan mahal (seperti Blueberry seharga $5.00) menjadi sangat murah atau bahkan mendekati gratis, sehingga pemilik toko akan mengalami kerugian finansial yang parah akibat selisih harga tersebut.
  
- **Cara betulinnya**:
  Jangan kirimkan atau baca harga dari DOM client. Hapus atribut `data-price` dari button di HTML. Cukup kirimkan `id` produk saat tombol plus diklik, lalu cari harga produk dari sumber katalog resmi internal (`products` array) menggunakan fungsi pencarian `findProductById(id)`.

---

## Temuan 4: [KEAMANAN] - Kebocoran Kode Kupon Promo di Sisi Client (Hardcoded)

- **Masalahnya apa (bahasa sendiri)**:
  Daftar kode kupon rahasia (seperti kupon diskon 90% `DEMO90`) disimpan secara mentah langsung di dalam file JavaScript client (`main.js`). Siapa pun yang mengakses situs web ini dapat dengan mudah membuka kode sumber aplikasi dan melihat kupon rahasia yang tersedia beserta besaran diskonnya.
  
- **Cara buktiinnya (langkah persis yang kamu lakuin)**:
  1. Di browser, klik kanan halaman lalu pilih **View Page Source** atau buka DevTools (F12) dan masuk ke tab **Sources**.
  2. Buka file `main.js`.
  3. Di bagian atas file, Anda akan melihat deklarasi objek kupon:
     ```js
     const COUPONS = {
       DEMO90: 0.9,
     };
     ```
  4. Pengguna tinggal menyalin teks `DEMO90` dan memasukkannya ke input kupon di halaman belanja untuk langsung memperoleh potongan harga 90%.
  
- **Kenapa ini bahaya / nggak adil (siapa yang rugi)**:
  Merugikan **pemilik toko**. Kupon promosi yang seharusnya bersifat rahasia (misal khusus untuk pelanggan tertentu atau event khusus) bocor ke publik dan bisa digunakan secara masif oleh siapa saja tanpa izin, yang dapat merusak strategi harga dan margin keuntungan toko buah.
  
- **Cara betulinnya**:
  Kode kupon tidak boleh disimpan atau divalidasi di browser client. Di dunia nyata, verifikasi kupon harus diproses melalui backend API server. Client mengirimkan kode yang diinput pengguna ke server, dan server yang menentukan apakah kupon itu valid, aktif, serta mengembalikan nominal diskon yang sah.

---

## Temuan 5: [KEAMANAN] - Validasi Diskon dan Total Belanja Dilakukan di Browser (Client-Side Trust)

- **Masalahnya apa (bahasa sendiri)**:
  Seluruh kalkulasi finansial, seperti penentuan nominal diskon, penambahan biaya penanganan, dan penjumlahan total pembayaran akhir dilakukan sepenuhnya di browser client. Karena tidak ada validasi di server, nilai total belanjaan dapat dimanipulasi secara bebas oleh pengguna sebelum pesanan dikirim.
  
- **Cara buktiinnya (langkah persis yang kamu lakuin)**:
  1. Tambahkan buah ke keranjang belanja.
  2. Buka DevTools (F12) dan masuk ke tab **Console**.
  3. Ketik perintah untuk mengubah variabel diskon di runtime (misalnya `diskon = 1.0` untuk diskon 100% atau langsung ubah nilai `total` pembayaran).
  4. Klik tombol checkout dan konfirmasi pesanan; total pembayaran yang telah dimanipulasi akan langsung diterima oleh aplikasi.
  
- **Kenapa ini bahaya / nggak adil (siapa yang rugi)**:
  Sangat merugikan **pemilik toko**. Dalam aplikasi nyata, total belanjaan ini adalah nominal yang akan dikirimkan ke payment gateway. Jika perhitungan diserahkan sepenuhnya ke browser, pembeli nakal dapat membayar belanjaan seharga ratusan dolar hanya dengan harga beberapa sen saja dengan memodifikasi variabel di konsol JavaScript.
  
- **Cara betulinnya**:
  Kalkulasi total harga dan validasi diskon wajib dihitung di server (backend). Browser client hanya bertugas mengirimkan array berisi `id` produk dan kuantitasnya saja. Server yang menghitung subtotal, diskon kupon yang valid, biaya penanganan, dan menghasilkan nilai total akhir yang sah untuk ditagihkan ke payment gateway.

---

## Temuan 6: [ETIKA / DARK PATTERN] - Scarcity Palsu (Stok Buatan Menggunakan Math.random)

- **Masalahnya apa (bahasa sendiri)**:
  Aplikasi memunculkan pesan keterbatasan stok seperti "tinggal X lagi hari ini!" di bawah nama buah untuk memicu kepanikan pembeli. Namun, angka stok X tersebut hanyalah angka buatan yang diacak dengan fungsi `Math.random()` pada setiap kali halaman web melakukan render.
  
- **Cara buktiinnya (langkah persis yang kamu lakuin)**:
  1. Buka halaman Pasar Pagi dan catat angka stok yang tertera di bawah produk "Apel Fuji" (misalnya tertera "tinggal 3 lagi hari ini!").
  2. Klik tombol plus (`+`) untuk memasukkan Apel Fuji ke keranjang.
  3. Perhatikan bahwa teks stok di bawah Apel Fuji tiba-tiba berubah secara acak (misalnya menjadi "tinggal 5 lagi hari ini!" atau "tinggal 1 lagi hari ini!") karena penambahan barang memicu render ulang yang mengacak ulang nilai stok.
  
- **Kenapa ini bahaya / nggak adil (siapa yang rugi)**:
  Tidak adil bagi **pembeli (konsumen)**. Ini adalah taktik manipulatif psikologis yang tidak etis (disebut *Dark Pattern - Fake Scarcity*). Pembeli ditekan agar buru-buru melakukan transaksi karena merasa barang akan habis, padahal persediaan buah sebenarnya melimpah atau bahkan tidak dilacak sama sekali oleh sistem.
  
- **Cara betulinnya**:
  Tampilkan status stok yang jujur berdasarkan inventaris riil dari database. Jika data inventaris tidak tersedia, gunakan status statis yang jujur seperti `"stok tersedia"` tanpa menampilkan angka rekayasa acak.

---

## Temuan 7: [ETIKA / DARK PATTERN] - Biaya Penanganan Tersembunyi (Hidden Handling Fee) di Sidebar

- **Masalahnya apa (bahasa sendiri)**:
  Toko menambahkan biaya tambahan bernama "biaya penanganan" (`HANDLING_FEE` sebesar `$0.30`) langsung ke dalam nilai total harga yang tertera di sidebar belanjaan. Namun, rincian biaya penanganan ini tidak dicantumkan sama sekali di sidebar, sehingga pembeli melihat total harga membengkak secara misterius tanpa tahu dari mana asalnya. Penjelasan biaya penanganan ini baru sengaja ditampilkan saat pembeli membuka modal konfirmasi checkout.
  
- **Cara buktiinnya (langkah persis yang kamu lakuin)**:
  1. Kosongkan keranjang belanja Anda.
  2. Tambahkan satu buah "Apel Fuji" yang berharga resmi `$1.50` ke dalam keranjang.
  3. Lihat angka "Total" di bagian bawah sidebar kanan. Totalnya tertulis `$1.80`.
  4. Cari keterangan penambahan biaya `$0.30` di sidebar; Anda tidak akan menemukannya. Keterangan "Biaya penanganan: $0.30" baru muncul setelah Anda mengklik tombol "Lanjut ke Pembayaran" pada modal checkout.
  
- **Kenapa ini bahaya / nggak adil (siapa yang rugi)**:
  Tidak adil bagi **pembeli (konsumen)** karena kurangnya transparansi harga (*Dark Pattern - Hidden Costs*). Konsumen dipaksa membayar biaya tambahan tanpa persetujuan atau penjelasan eksplisit di awal proses pemilihan barang. Pembeli yang terburu-buru berisiko membayar biaya lebih tinggi tanpa menyadarinya.
  
- **Cara betulinnya**:
  Tampilkan rincian breakdown harga (Subtotal, Biaya Penanganan, Diskon) secara transparan langsung di sidebar keranjang belanja sebelum total akhir ditampilkan, bukan menyembunyikannya hingga detik-detik terakhir checkout.

---

## Temuan 8: [BUG] - Batas Kuantitas Maksimal Pembelian Dapat Dilewati (Max Quantity Bypass)

- **Masalahnya apa (bahasa sendiri)**:
  Aplikasi memiliki batas kuantitas maksimal pembelian per produk sebesar `MAX_QUANTITY = 99`. Namun, pengecekan batas maksimal ini lupa dipasang pada fungsi `addToCart(id)` (tombol plus `+` di layar) dan hanya dipasang pada fungsi `updateQuantity` (ketika mengetik angka langsung). Akibatnya, pembeli dapat melewati batas 99 barang hanya dengan mengklik tombol plus berkali-kali.
  
- **Cara buktiinnya (langkah persis yang kamu lakuin)**:
  1. Tambahkan sebuah produk ke dalam keranjang belanja.
  2. Ubah kuantitas produk tersebut di kolom input kuantitas keranjang menjadi `99` (angka batas maksimal).
  3. Klik tombol plus (`+`) pada produk tersebut di katalog buah di sebelah kiri.
  4. Kuantitas barang di keranjang belanja akan berhasil naik menjadi `100`, membuktikan batas maksimal `99` telah dilewati.
  
- **Kenapa ini bahaya / nggak adil (siapa yang rugi)**:
  Merugikan **pemilik toko / petani** dan **pembeli lain**. Pembatasan kuantitas biasanya dibuat untuk mencegah monopoli barang oleh spekulan/tengkulak, keterbatasan kapasitas pengiriman logistik, atau batas stok gudang. Dengan adanya bypass ini, kontrol inventaris toko menjadi rusak dan tidak akurat.
  
- **Cara betulinnya**:
  Tambahkan pengecekan batas maksimum kuantitas pada fungsi `addToCart(id)` sebelum melakukan increment nilai kuantitas:
  ```js
  if (cart[id].count >= MAX_QUANTITY) {
    showToast(`Maksimal pembelian ${product.name} adalah ${MAX_QUANTITY} buah.`);
    return;
  }
  ```

---

## Refleksi Penutup

### Bedanya "kode jalan" dengan "kode benar & jujur" setelah level ini:
- **Kode Jalan (Working Code)**: Hanya berfokus pada fungsionalitas di permukaan. Selama aplikasi tidak crash, UI/UX terlihat cantik, tombol bisa diklik, dan alur pembayaran selesai hingga muncul pesan sukses, kode dianggap "selesai". Kelemahannya adalah kode jalan seringkali mengabaikan aspek keamanan (seperti mempercayai input user mentah-mentah), celah manipulasi data, dan menggunakan trik psikologis tidak jujur untuk memanipulasi keputusan pengguna.
- **Kode Benar & Jujur (Secure & Ethical Code)**:
  1. **Benar (Secure/Robust)**: Memperhitungkan batas-batas sistem (edge cases), melakukan validasi input yang ketat, dan tidak pernah mempercayai data dari sisi client (DOM/browser) untuk transaksi finansial atau data sensitif. "Benar" berarti kode tersebut aman dari eksploitasi dan berfungsi secara konsisten baik secara fungsional maupun keamanan.
  2. **Jujur (Ethical)**: Menghargai hak pengguna dengan menyajikan data yang akurat (seperti stok barang riil) dan transparan dalam penentuan harga (menampilkan seluruh rincian biaya dari awal). Kode jujur tidak menggunakan Dark Patterns (scarcity palsu, biaya tersembunyi) demi menaikkan penjualan dengan cara menipu konsumen.

Sebagai pengembang, kita adalah benteng pertahanan terakhir. Kode yang kita tulis bukan sekadar logika pemrograman, melainkan sebuah tanggung jawab sosial dan profesional terhadap keamanan data dan keadilan finansial bagi para pengguna aplikasi kita.
