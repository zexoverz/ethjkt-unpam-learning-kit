# Bug Board - Hari 2: Pasar Pagi

Target audit: `hari-2/index.html` yang menjalankan logika dari `hari-2/main.js`.

Ringkasan hasil: ditemukan 7 masalah utama: 2 bug, 3 keamanan, dan 2 etika/dark pattern. Scan kedua menambahkan 3 temuan tersembunyi/stretch.

---

## Temuan 1 - BUG - Total uang ditampilkan tidak konsisten

- Lokasi: `main.js` baris 119-123 dan 223-231.
- Masalah: total akhir langsung ditulis ke layar tanpa format uang, misalnya `totalPriceEl.textContent = total`. Beberapa kombinasi harga akan muncul sebagai angka panjang seperti `3.0999999999999996`, bukan `$3.10`.
- Cara bukti:
  1. Buka `hari-2/index.html`.
  2. Tambahkan 1 Mangga seharga `$2.80`.
  3. Total menjadi `3.0999999999999996` karena `2.8 + 0.30` dihitung sebagai floating point JavaScript.
- Dampak: pengguna melihat harga yang tidak profesional dan bisa bingung soal nominal pembayaran. Dalam toko sungguhan, angka uang wajib stabil dan dibulatkan.
- Cara betulin: simpan uang sebagai integer sen/cents atau minimal tampilkan dengan `toFixed(2)`/formatter mata uang di semua tempat total ditampilkan.

---

## Temuan 2 - BUG - Input jumlah bisa membuat keranjang menjadi `NaN`

- Lokasi: `main.js` baris 103, 158-165, dan 282-284.
- Masalah: input jumlah memakai `parseInt(target.value, 10)`, tetapi tidak memvalidasi hasilnya. Kalau field jumlah dikosongkan, `parseInt("")` menghasilkan `NaN`. Karena `NaN <= 0` bernilai `false`, kode menyimpan `cart[id].count = NaN`.
- Cara bukti:
  1. Tambahkan 1 barang ke keranjang.
  2. Klik input angka jumlah di sidebar.
  3. Kosongkan nilainya.
  4. Jumlah item dan total berubah menjadi `NaN`.
- Dampak: perhitungan total rusak, cart count rusak, dan checkout bisa menampilkan data pesanan yang tidak valid.
- Cara betulin: validasi dengan `Number.isInteger(quantity)` dan batas minimal/maksimal. Jika tidak valid, tolak perubahan atau kembalikan ke nilai terakhir yang valid.

---

## Temuan 3 - KEAMANAN - XSS dari catatan pembeli

- Lokasi: `index.html` baris 47-48 menyediakan textarea catatan; `main.js` baris 111-116 merender catatan dengan `innerHTML`.
- Masalah: isi catatan user dimasukkan mentah ke DOM lewat `preview.innerHTML = "Catatan: " + note`. Ini membuka celah Cross-Site Scripting.
- Cara bukti:
  1. Tambahkan barang ke keranjang.
  2. Isi catatan dengan payload uji: `<img src=x onerror=alert('xss')>`.
  3. Saat preview catatan muncul di sidebar, script event handler berjalan.
- Dampak: penyerang bisa menyisipkan JavaScript, mencuri data halaman, memalsukan tampilan, atau menjalankan aksi atas nama user.
- Cara betulin: jangan pakai `innerHTML` untuk input user. Gunakan `textContent`, atau buat node teks seperti yang sudah dilakukan di modal review pada baris 219.

---

## Temuan 4 - KEAMANAN - Kupon rahasia bocor di kode client

- Lokasi: `main.js` baris 31-33 dan 169-181.
- Masalah: kode kupon internal `TEMANFARMER` disimpan langsung di JavaScript browser. Siapa pun bisa membuka DevTools/View Source dan membacanya.
- Cara bukti:
  1. Buka DevTools atau file `main.js`.
  2. Cari `KUPON_RAHASIA`.
  3. Masukkan `TEMANFARMER` ke input kupon.
  4. Diskon 90% aktif.
- Dampak: kupon internal tidak rahasia. Orang luar bisa mendapatkan diskon besar tanpa otorisasi.
- Cara betulin: validasi kupon di server. Browser hanya mengirim kode yang diketik user; server yang memutuskan apakah valid dan berapa diskonnya.

---

## Temuan 5 - KEAMANAN - Harga produk bisa dimanipulasi dari DOM

- Lokasi: `main.js` baris 62, 129-137, dan 256-258.
- Masalah: harga yang dipakai untuk keranjang diambil dari `data-price` tombol plus, bukan dari data resmi produk yang dipercaya. Atribut DOM ini bisa diubah user lewat DevTools.
- Cara bukti:
  1. Buka DevTools Console.
  2. Jalankan contoh: `document.querySelector('.plus-button[data-id="5"]').dataset.price = '0.01'`.
  3. Klik tombol `+` pada Stroberi.
  4. Keranjang menghitung Stroberi dengan harga `$0.01`, bukan `$4.50`.
- Dampak: pembeli jahat bisa menurunkan harga barang sebelum checkout.
- Cara betulin: jangan percaya harga dari DOM. `addToCart` cukup menerima `id`, lalu ambil harga dari katalog resmi. Pada sistem nyata, validasi akhir tetap harus dilakukan di server.

---

## Temuan 6 - ETIKA - Klaim stok dibuat acak untuk memancing rasa buru-buru

- Lokasi: `main.js` baris 45-58.
- Masalah: teks "tinggal X lagi hari ini!" dibuat dari `Math.random()` setiap render, bukan dari stok sungguhan.
- Cara bukti:
  1. Perhatikan angka stok pada kartu produk.
  2. Tambah/kurangi barang, atau refresh halaman.
  3. Angka stok berubah-ubah tanpa hubungan dengan stok nyata.
- Dampak: ini dark pattern scarcity. User dibuat panik supaya cepat membeli berdasarkan informasi palsu.
- Cara betulin: tampilkan stok hanya jika berasal dari data inventori nyata. Jika tidak ada data stok, hilangkan klaim scarcity.

---

## Temuan 7 - ETIKA - Biaya penanganan tersembunyi sampai total

- Lokasi: `main.js` baris 28-29, 119-123, dan `index.html` baris 56-59.
- Masalah: ada `HANDLING_FEE = 0.30`, tetapi UI utama hanya menampilkan "Total". Biaya tambahan tidak dijelaskan di area keranjang sebelum user membandingkan sendiri dengan harga barang. Rinciannya baru jelas di modal review.
- Cara bukti:
  1. Tambahkan 1 Apel Fuji seharga `$1.50`.
  2. Total langsung menjadi sekitar `$1.80`.
  3. Di sidebar awal tidak ada baris yang jelas menyebut biaya penanganan `$0.30`.
- Dampak: user membayar lebih dari subtotal produk tanpa penjelasan yang cukup sejak awal. Ini bukan bug teknis, tetapi desain yang tidak transparan.
- Cara betulin: tampilkan breakdown sejak sidebar: subtotal, biaya penanganan, diskon, dan total akhir. Jangan sembunyikan biaya sampai langkah akhir.

---

## Catatan Tambahan

- Semua keputusan penting saat ini terjadi di browser. Untuk toko sungguhan, client hanya boleh menjadi tampilan. Harga, stok, kupon, diskon, dan pembuatan order harus divalidasi ulang di server.
- File `index.html` terlihat sederhana, tetapi input dan output yang didefinisikan di sana menjadi titik masuk masalah ketika diproses oleh `main.js`.

---

## Temuan 8 - BUG / ETIKA - Klaim stok tidak ditegakkan

- Lokasi: `main.js` baris 45-58 dan 129-137.
- Masalah: halaman menampilkan klaim stok seperti "tinggal 1 lagi hari ini!", tetapi tombol `+` tetap bisa menambah barang tanpa batas. Nilai `sisa` hanya variabel tampilan dan tidak pernah dipakai untuk membatasi `cart[id].count`.
- Cara bukti:
  1. Cari produk yang sedang menampilkan "tinggal 1 lagi hari ini!".
  2. Klik tombol `+` berkali-kali pada produk itu.
  3. Keranjang tetap bisa berisi jumlah lebih dari stok yang diklaim.
- Dampak: dari sisi bug, stok dan keranjang tidak sinkron. Dari sisi etika, klaim stok makin terlihat seperti alat tekanan palsu, bukan informasi inventori.
- Cara betulin: jika stok benar-benar ada, simpan sebagai data resmi dan blok penambahan saat jumlah keranjang mencapai stok. Jika stok tidak ada, hapus teks scarcity.

---

## Temuan 9 - BUG - Tidak ada batas maksimum jumlah barang

- Lokasi: `main.js` baris 103 dan 158-165.
- Masalah: input jumlah hanya punya `min="1"`, tidak punya `max`, dan fungsi `updateQuantity` tidak membatasi angka besar. User bisa memasukkan angka sangat besar dan aplikasi akan tetap menghitungnya.
- Cara bukti:
  1. Tambahkan 1 barang ke keranjang.
  2. Isi jumlah dengan angka besar, misalnya `999999999999`.
  3. Total dan cart count ikut membesar tanpa validasi stok, limit order, atau kewajaran transaksi.
- Dampak: order menjadi tidak realistis, angka UI bisa rusak, dan pada aplikasi sungguhan ini bisa membebani sistem atau membuat transaksi tidak valid.
- Cara betulin: tetapkan batas maksimum per item dan total item per order. Validasi di UI dan ulangi validasi di server.

---

## Temuan 10 - KEAMANAN - Dependensi eksternal dimuat tanpa proteksi integritas

- Lokasi: `index.html` baris 8 dan `style.css` baris 1.
- Masalah: halaman memuat Font Awesome dari CDN dan Google Fonts dari URL eksternal. Link CDN di `index.html` tidak memakai Subresource Integrity (`integrity`) dan tidak ada Content Security Policy yang membatasi sumber aset.
- Cara bukti:
  1. Buka `index.html`.
  2. Lihat tag `<link>` Font Awesome pada baris 8.
  3. Tidak ada atribut `integrity`/`crossorigin`, dan tidak ada CSP di dokumen.
- Dampak: jika CDN, jaringan, atau konfigurasi supply chain bermasalah, halaman bisa memuat stylesheet yang berubah tanpa terdeteksi. Ini bukan eksploit paling mudah di demo lokal, tetapi penting untuk aplikasi publik.
- Cara betulin: self-host asset penting atau tambahkan SRI untuk CDN yang mendukungnya. Tambahkan CSP yang ketat untuk membatasi sumber script, style, font, dan image.
