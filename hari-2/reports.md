# Reports Hari 2 - Pasar Pagi

Target dari `README.md`: 7 temuan, terdiri dari 2 BUG, 3 KEAMANAN, dan 2 ETIKA/dark pattern.

Catatan: bagian temuan mendokumentasikan kondisi awal sebelum perbaikan. Setelah bagian "Fix yang Diterapkan", kode aplikasi sudah berubah sehingga beberapa baris bukti historis tidak lagi berisi pola bermasalah yang sama.

## Temuan 1: [BUG] Total uang ditampilkan dengan format tidak konsisten

- Masalahnya apa:
  Total kadang tampil sebagai angka mentah seperti `$1.8`, `$3.5999999999999996`, atau angka panjang lain, bukan format uang 2 desimal. Di kode, `renderCart()` dan modal review memasukkan `total` langsung ke UI tanpa `toFixed(2)`.

- Bukti kode:
  [main.js](./main.js:119) menghitung total, lalu [main.js](./main.js:123) menulis `totalPriceEl.textContent = total`. Modal review juga menulis `$${total}` di [main.js](./main.js:231).

- Cara buktiinnya:
  Tambahkan buah dengan kombinasi harga desimal, misalnya Pisang `$1.20` dan biaya penanganan `$0.30`. Total bisa tampil tanpa format standar 2 desimal. Beberapa kombinasi floating point juga berisiko menampilkan angka panjang.

- Kenapa ini bahaya / tidak adil:
  Uang harus presisi dan mudah diaudit. Tampilan angka yang aneh membuat pembeli bingung dan menurunkan kepercayaan.

- Cara betulinnya:
  Format semua nilai uang dengan `toFixed(2)` atau helper seperti `formatMoney(amount)`. Untuk aplikasi sungguhan, hitung uang dalam satuan sen/integer, bukan float.

## Temuan 2: [BUG] Input jumlah bisa membuat keranjang rusak

- Masalahnya apa:
  Kolom jumlah barang bertipe `number`, tetapi nilai input langsung diparse dengan `parseInt()` tanpa validasi `Number.isFinite()`. Jika user mengosongkan field atau memasukkan nilai aneh lewat DevTools, `quantity` bisa menjadi `NaN`. Karena `NaN <= 0` bernilai `false`, kode menyimpan `cart[id].count = NaN`.

- Bukti kode:
  Input quantity dibuat di [main.js](./main.js:103). Nilainya diparse di [main.js](./main.js:283), lalu dipakai di [main.js](./main.js:158). Cabang `else` pada [main.js](./main.js:162) menyimpan nilai tanpa validasi.

- Cara buktiinnya:
  Tambahkan 1 buah ke keranjang. Kosongkan kolom jumlah di sidebar, atau edit value lewat DevTools menjadi nilai non-angka. Cart count dan total bisa menjadi `NaN` atau perilaku keranjang menjadi tidak waras.

- Kenapa ini bahaya / tidak adil:
  Input user tidak boleh dipercaya. Keranjang yang menghasilkan `NaN` bisa merusak checkout, membuat harga salah, atau membuka celah manipulasi lanjutan.

- Cara betulinnya:
  Validasi quantity sebelum disimpan: harus integer, finite, dan berada dalam batas wajar, misalnya `1 <= quantity <= stokMaksimum`. Jika invalid, tolak input atau reset ke nilai terakhir yang valid.

## Temuan 3: [KEAMANAN] XSS dari catatan pembeli

- Masalahnya apa:
  Catatan dari textarea ditampilkan ulang menggunakan `innerHTML`. Artinya input user dianggap sebagai HTML, bukan teks biasa. Payload seperti `<img src=x onerror=alert(1)>` bisa dieksekusi saat preview catatan dirender.

- Bukti kode:
  Nilai note dibaca di [main.js](./main.js:111), lalu digabung ke HTML mentah di [main.js](./main.js:115): `preview.innerHTML = "Catatan: " + note`.

- Cara buktiinnya:
  Tambahkan barang ke keranjang. Isi catatan dengan `<img src=x onerror=alert(1)>`. Saat preview keranjang dirender, browser dapat menjalankan handler `onerror`.

- Kenapa ini bahaya / tidak adil:
  XSS bisa dipakai untuk mencuri data, mengubah tampilan checkout, memancing user klik tombol palsu, atau menjalankan aksi atas nama user.

- Cara betulinnya:
  Jangan gunakan `innerHTML` untuk input user. Gunakan `textContent`, misalnya buat elemen preview lalu set `preview.textContent = "Catatan: " + note`.

## Temuan 4: [KEAMANAN] Kupon rahasia disimpan di client

- Masalahnya apa:
  Kode kupon rahasia `TEMANFARMER` tersimpan jelas di JavaScript browser. Siapa pun bisa membuka DevTools atau View Source dan membaca kode tersebut.

- Bukti kode:
  Secret disimpan di [main.js](./main.js:32), lalu validasi kupon dilakukan langsung di browser pada [main.js](./main.js:172).

- Cara buktiinnya:
  Buka `main.js` di browser atau DevTools, cari `KUPON_RAHASIA`, lalu masukkan `TEMANFARMER` di field kupon. Diskon 90% langsung aktif.

- Kenapa ini bahaya / tidak adil:
  Rahasia yang dikirim ke browser bukan rahasia. Diskon internal bisa bocor dan disalahgunakan semua user, membuat toko rugi.

- Cara betulinnya:
  Validasi kupon di server. Client hanya mengirim kode kupon, server memutuskan valid/tidak dan mengembalikan total akhir yang sudah dihitung ulang.

## Temuan 5: [KEAMANAN] Harga checkout percaya pada `data-price` di DOM

- Masalahnya apa:
  Saat tombol plus diklik, harga yang dipakai bukan selalu harga resmi dari katalog internal, melainkan `data-price` dari tombol di halaman. Atribut DOM bisa diedit user lewat DevTools.

- Bukti kode:
  Tombol plus memuat `data-price="${product.price}"` di [main.js](./main.js:62). Saat klik, nilai itu dikirim ke `addToCart()` di [main.js](./main.js:257). Di [main.js](./main.js:136), `cart[id].price = price`.

- Cara buktiinnya:
  Buka DevTools Elements, pilih tombol `+` untuk buah mahal, ubah `data-price` menjadi `0.01`, lalu klik tombol itu. Keranjang memakai harga palsu tersebut.

- Kenapa ini bahaya / tidak adil:
  User bisa memanipulasi harga sebelum checkout. Di toko sungguhan, ini bisa menyebabkan transaksi dengan harga jauh di bawah harga resmi.

- Cara betulinnya:
  Jangan ambil harga dari DOM. Ambil harga dari katalog terpercaya berdasarkan `id`. Di sistem produksi, server harus menghitung ulang harga dan total dari database, bukan menerima harga dari client.

## Temuan 6: [ETIKA / Dark Pattern] Klaim stok palsu dibuat acak

- Masalahnya apa:
  Teks `tinggal X lagi hari ini!` terlihat seperti informasi stok sungguhan, tetapi angkanya dibuat acak setiap render. Saat user menambah/mengurangi barang, produk dirender ulang dan angka stok bisa berubah tanpa hubungan dengan stok nyata.

- Bukti kode:
  Angka stok dibuat dengan `Math.random()` di [main.js](./main.js:47), lalu ditampilkan sebagai klaim stok di [main.js](./main.js:58).

- Cara buktiinnya:
  Refresh halaman atau klik tambah/kurang barang beberapa kali. Angka `tinggal X lagi hari ini!` berubah-ubah walau tidak ada sistem stok nyata.

- Kenapa ini bahaya / tidak adil:
  Ini scarcity pressure palsu. User didorong membeli cepat karena merasa stok hampir habis, padahal toko mengarang urgensi.

- Cara betulinnya:
  Tampilkan stok hanya jika berasal dari data inventori yang benar. Jika tidak ada data stok, hilangkan klaim `tinggal X lagi`.

## Temuan 7: [ETIKA / Dark Pattern] Biaya penanganan ditambahkan diam-diam

- Masalahnya apa:
  Ada `HANDLING_FEE = 0.30` yang otomatis ditambahkan ke total. Di sidebar, label hanya menampilkan `Total`, bukan breakdown subtotal + biaya. Breakdown biaya baru terlihat di modal review setelah user klik checkout.

- Bukti kode:
  Fee didefinisikan di [main.js](./main.js:29), ditambahkan ke total sidebar di [main.js](./main.js:120), dan baru dijelaskan sebagai `Biaya penanganan` di modal pada [main.js](./main.js:229).

- Cara buktiinnya:
  Tambahkan Apel Fuji `$1.50`. Sidebar menampilkan total `$1.8` atau sekitar `$1.80`, bukan `$1.50`, tanpa penjelasan langsung bahwa ada fee `$0.30`.

- Kenapa ini bahaya / tidak adil:
  Pembeli melihat harga produk, tetapi dikenai biaya tambahan yang tidak dijelaskan sejak awal. Ini membuat harga terasa lebih murah sampai tahap akhir.

- Cara betulinnya:
  Tampilkan breakdown sejak awal di sidebar: subtotal, biaya penanganan, diskon, total akhir. Jika fee wajib, jelaskan sebelum checkout.

## Temuan 8: [BUG / ANOMALI] Jumlah barang tidak punya batas atas dan tidak mengikuti stok

- Masalahnya apa:
  UI menampilkan klaim stok `tinggal X lagi hari ini!`, tetapi jumlah pembelian tidak pernah dibatasi oleh angka stok tersebut. User bisa klik tombol `+` berkali-kali atau mengubah input quantity menjadi angka sangat besar seperti `999999`, walaupun kartu produk mengklaim stok tinggal 1-5.

- Bukti kode:
  Stok hanya dibuat untuk teks tampilan dengan `Math.random()` di [main.js](./main.js:47) dan ditampilkan di [main.js](./main.js:58). Input jumlah hanya punya `min="1"` tanpa `max` di [main.js](./main.js:103). Fungsi `addToCart()` langsung menaikkan `cart[id].count++` di [main.js](./main.js:137), dan `updateQuantity()` menyimpan quantity tanpa batas atas di [main.js](./main.js:163).

- Cara buktiinnya:
  Cari produk yang menampilkan `tinggal 1 lagi hari ini!`, lalu klik tombol `+` beberapa kali sampai quantity lebih dari 1. Atau tambahkan satu barang, lalu ubah input quantity di sidebar menjadi `999999`. Keranjang tetap menerima jumlah tersebut.

- Kenapa ini bahaya / tidak adil:
  Ini membuat informasi stok tidak konsisten dengan perilaku checkout. Pembeli bisa memesan lebih banyak dari stok yang diklaim tersedia, dan toko terlihat tidak punya kontrol inventori. Jika ini toko sungguhan, pesanan bisa gagal dipenuhi atau total transaksi menjadi tidak realistis.

- Cara betulinnya:
  Simpan stok sebagai data produk yang stabil, bukan angka random untuk tampilan. Saat tambah barang atau update quantity, validasi `quantity <= product.stock`. Tambahkan `max` pada input quantity, disable tombol `+` saat batas stok tercapai, dan tetap validasi ulang di server.

## Temuan 9: [KEAMANAN / PRIVASI] Font dan ikon pihak ketiga dimuat tanpa kontrol integritas

- Masalahnya apa:
  Halaman checkout memuat CSS Font Awesome dari CDN dan font dari Google Fonts. Untuk halaman yang memproses alur belanja, font/ikon pihak ketiga bisa menjadi risiko supply chain dan privasi. File Font Awesome juga tidak memakai Subresource Integrity (`integrity`) sehingga browser tidak memverifikasi apakah file CDN yang dimuat benar-benar file yang diharapkan.

- Bukti kode:
  Font Awesome dimuat dari CDN di [index.html](./index.html:8). Google Fonts dimuat lewat `@import` di [style.css](./style.css:1).

- Cara buktiinnya:
  Buka DevTools tab Network lalu reload halaman. Pada versi awal, browser melakukan request ke `cdnjs.cloudflare.com` dan `fonts.googleapis.com` / domain font Google. Tidak ada atribut `integrity` pada stylesheet CDN di HTML.

- Kenapa ini bahaya / tidak adil:
  Jika resource pihak ketiga berubah, terganggu, atau disusupi, halaman checkout bisa ikut terdampak. Request ke pihak ketiga juga membocorkan metadata kunjungan seperti IP, user-agent, dan halaman yang membuka resource tersebut.

- Cara betulinnya:
  Untuk app checkout, self-host asset penting atau gunakan dependency lokal. Jika tetap memakai CDN, tambahkan `integrity` dan `crossorigin` untuk resource yang mendukung SRI. Jelaskan pemakaian pihak ketiga di kebijakan privasi. Gambar produk yang tetap eksternal juga sebaiknya diself-host pada versi produksi jika ingin mengurangi metadata request pihak ketiga sepenuhnya.

## Fix yang Diterapkan dan Alasan

### Fix 1: Format dan hitung uang dengan satuan sen

- Perubahan:
  Harga produk diubah dari float `price` menjadi integer `priceCents`. Semua tampilan uang melewati helper `formatMoney(cents)`.

- Kenapa pakai ini:
  Uang lebih aman dihitung sebagai integer karena menghindari masalah floating point seperti `3.5999999999999996`. `toFixed(2)` saja hanya memperbaiki tampilan, tetapi hitungan internal masih bisa membawa error desimal.

- Alternatif:
  Bisa tetap memakai float lalu selalu `toFixed(2)` saat render. Itu lebih cepat ditulis, tetapi kurang kuat untuk kalkulasi uang. Bisa juga memakai library money/decimal, tetapi terlalu berat untuk app latihan statis sekecil ini.

### Fix 2: Validasi quantity dengan integer dan batas stok

- Perubahan:
  `updateQuantity()` sekarang menolak nilai non-integer, menghapus item jika `<= 0`, dan membatasi jumlah ke `item.stock` jika user memasukkan angka terlalu besar. Input quantity juga diberi `max`.

- Kenapa pakai ini:
  Validasi dilakukan di logika JavaScript, bukan hanya atribut HTML, karena atribut `min`/`max` bisa dilewati lewat DevTools. Atribut HTML tetap dipakai sebagai bantuan UX.

- Alternatif:
  Bisa hanya mengandalkan `<input min max>`, tetapi itu bukan kontrol keamanan. Bisa juga menolak total jika invalid saat checkout saja, tetapi feedback ke user akan terlambat.

### Fix 3: Catatan user dirender dengan `textContent`

- Perubahan:
  Preview catatan di keranjang memakai `textContent`, bukan `innerHTML`.

- Kenapa pakai ini:
  `textContent` membuat input user diperlakukan sebagai teks biasa, sehingga payload HTML/JS tidak dieksekusi. Ini fix paling sederhana dan tepat untuk data yang memang bukan HTML.

- Alternatif:
  Bisa memakai sanitizer HTML seperti DOMPurify jika aplikasi memang perlu menerima HTML terbatas. Di sini catatan petani hanya perlu teks, jadi sanitizer akan menambah kompleksitas tanpa manfaat.

### Fix 4: Kupon rahasia diganti menjadi promo publik demo

- Perubahan:
  `TEMANFARMER` dihapus. App sekarang memakai kode promo publik `PASARPAGI10` dengan diskon 10% untuk demo.

- Kenapa pakai ini:
  Karena proyek ini statis tanpa server, tidak ada cara benar-benar aman untuk menyimpan kupon rahasia. Mengubahnya menjadi promo publik membuat tidak ada rahasia sensitif yang dikirim ke browser.

- Alternatif:
  Alternatif terbaik untuk toko sungguhan adalah validasi kupon di server dan hitung ulang total dari database. Itu tidak diterapkan di sini karena repo ini hanya HTML/CSS/JS statis.

### Fix 5: Harga tidak lagi diambil dari DOM

- Perubahan:
  Tombol `+` tidak lagi membawa `data-price`. `addToCart(id)` selalu mencari produk resmi dari array `products` dan memakai `priceCents` dari data tersebut.

- Kenapa pakai ini:
  DOM adalah permukaan yang mudah diedit user. Mengambil harga berdasarkan `id` dari data aplikasi menghilangkan manipulasi langsung lewat atribut tombol.

- Alternatif:
  Bisa menyembunyikan harga di atribut lain atau memakai `readonly`, tetapi itu tetap bisa diedit lewat DevTools. Untuk produksi, server tetap harus menjadi sumber kebenaran akhir.

### Fix 6: Stok dibuat stabil dan tidak memakai scarcity palsu

- Perubahan:
  `Math.random()` untuk stok dihapus. Setiap produk sekarang punya `stock` stabil di katalog, dan teks diubah menjadi `Stok tersedia: X`.

- Kenapa pakai ini:
  Informasi stok harus berasal dari data, bukan angka acak yang menciptakan urgensi palsu. Kata-kata juga dibuat netral agar tidak menekan user untuk buru-buru membeli.

- Alternatif:
  Bisa menghapus teks stok seluruhnya. Saya memilih stok stabil karena masih berguna untuk pembeli dan sekaligus mendukung batas quantity.

### Fix 7: Biaya penanganan ditampilkan sejak sidebar

- Perubahan:
  Sidebar sekarang menampilkan subtotal, biaya penanganan, diskon, dan total akhir sebelum user masuk modal review.

- Kenapa pakai ini:
  Masalahnya bukan fee-nya, tetapi fee yang tidak transparan. Breakdown sejak awal membuat pembeli tahu dari mana total berasal.

- Alternatif:
  Bisa menghapus fee total. Itu valid jika toko tidak butuh fee. Karena kode awal tampaknya memang ingin biaya operasional, solusi yang lebih proporsional adalah membuatnya transparan.

### Fix 8: Quantity dibatasi mengikuti stok

- Perubahan:
  Tombol `+` otomatis disabled saat quantity mencapai `stock`. Jika user mengetik angka di atas stok, jumlah dikembalikan ke batas stok dan toast menjelaskan alasannya.

- Kenapa pakai ini:
  Fix ini menyatukan klaim stok dan perilaku checkout. User tidak bisa membeli lebih banyak dari stok yang ditampilkan.

- Alternatif:
  Bisa hanya menampilkan warning tanpa membatasi. Itu masih memungkinkan checkout tidak realistis. Bisa juga memvalidasi hanya saat checkout, tetapi lebih baik mencegah error sejak input.

### Fix 9: Font dan ikon pihak ketiga dihapus

- Perubahan:
  Link Font Awesome CDN dihapus dari `index.html`, import Google Fonts dihapus dari `style.css`, ikon keranjang dihapus, dan ikon trash diganti tombol teks `Hapus`.

- Kenapa pakai ini:
  Untuk app statis kecil, font system dan tombol teks lebih sederhana dan mengurangi risiko supply chain/privasi untuk UI dasar. Tidak perlu jaringan eksternal hanya untuk font dan ikon.

- Alternatif:
  Bisa tetap memakai CDN dengan SRI (`integrity`) dan `crossorigin`. Itu mengurangi risiko integritas, tetapi request ke pihak ketiga tetap terjadi. Bisa juga self-host font/icon, tetapi untuk kebutuhan UI ini system font dan tombol teks sudah cukup. Gambar produk masih memakai Cloudinary karena aplikasi membutuhkan visual produk; untuk produksi, gambar juga sebaiknya dipindahkan ke asset yang dikontrol sendiri.

## Validasi Setelah Fix

- `node --check main.js` lolos tanpa syntax error.
- Simulasi hitung uang berbasis sen lolos: subtotal `150` sen + fee `30` sen + diskon `10%` menghasilkan total `1.62`.
- Pencarian pola lama tidak menemukan `TEMANFARMER`, `KUPON_RAHASIA`, `data-price`, `Math.random`, `preview.innerHTML`, `cdnjs`, `fonts.googleapis`, `font-awesome`, atau `delete-icon`.
- Quantity sekarang punya `max`, tombol tambah bisa disabled saat stok tercapai, dan `updateQuantity()` tetap memvalidasi nilai yang diketik manual.

## Refleksi

Kode yang "jalan" hanya berarti browser bisa menjalankannya tanpa langsung rusak. Kode yang benar dan jujur harus menghitung uang secara konsisten, memvalidasi input, tidak mempercayai client untuk keputusan penting, aman dari injeksi, dan tidak memakai desain yang memanipulasi pembeli.
