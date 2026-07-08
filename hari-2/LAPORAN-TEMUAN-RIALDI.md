# LAPORAN TEMUAN RIALDI - PASAR PAGI

Audit dilakukan pada folder `hari-2` untuk mencari bug, celah keamanan, dan
pola gelap pada aplikasi toko buah Pasar Pagi.

Target temuan: 2 bug, 3 keamanan, 2 etika.

---

## Temuan #1: [BUG] Input jumlah kosong/huruf bisa membuat total rusak

- Masalahnya apa:
  Input jumlah di keranjang menerima nilai tidak valid. Pada versi rentan,
  nilai seperti kosong atau huruf diproses dengan `parseInt`, lalu hasil
  `NaN` masuk ke state keranjang.

- Cara buktiinnya:
  1. Tambahkan satu produk ke keranjang.
  2. Hapus isi input jumlah sampai kosong, atau isi dengan huruf lewat DevTools.
  3. Total dan jumlah keranjang berubah menjadi `NaN`.

- Kenapa bahaya:
  Angka order jadi tidak bisa dipercaya. Kalau nilai rusak ini ikut dikirim ke
  proses checkout, pesanan bisa gagal atau tersimpan dengan data salah.

- Cara betulinnya:
  Validasi jumlah sebelum masuk ke `cart`. Nilai harus integer, lebih dari nol,
  dan tidak boleh melebihi stok.

---

## Temuan #2: [BUG] Jumlah barang tidak dibatasi stok

- Masalahnya apa:
  User bisa mengetik jumlah sangat besar di input keranjang, walaupun stok yang
  ditampilkan lebih kecil. Ini membuat data pesanan tidak sesuai stok toko.

- Cara buktiinnya:
  1. Tambahkan Apel Fuji ke keranjang.
  2. Ubah jumlahnya menjadi `999`.
  3. Total naik mengikuti angka itu, padahal stok produk terbatas.

- Kenapa bahaya:
  Pembeli bisa membuat order fiktif yang stoknya tidak ada. Ini merugikan toko
  dan membuat pengalaman pembeli buruk saat pesanan tidak bisa dipenuhi.

- Cara betulinnya:
  Ambil batas maksimal dari data produk resmi, lalu clamp atau tolak input yang
  melebihi stok.

---

## Temuan #3: [KEAMANAN] Harga produk diambil dari DOM yang bisa diedit

- Masalahnya apa:
  Pada versi rentan, harga dibaca dari atribut seperti `data-price` di tombol.
  Atribut DOM bisa diedit user lewat DevTools, sehingga harga bisa dipalsukan.

- Cara buktiinnya:
  1. Buka DevTools > Elements.
  2. Ubah harga pada atribut tombol plus, misalnya `data-price="0.01"`.
  3. Klik tombol plus.
  4. Produk masuk keranjang dengan harga palsu.

- Kenapa bahaya:
  Browser sepenuhnya dikontrol user. Harga adalah data bisnis penting, jadi
  tidak boleh dipercaya dari DOM/client. Toko bisa rugi karena pembeli dapat
  membeli barang dengan harga manipulasi.

- Cara betulinnya:
  `addToCart` hanya menerima `id`, lalu harga selalu dicari dari katalog resmi
  `products`. Untuk produksi, total tetap wajib dihitung ulang di server.

---

## Temuan #4: [KEAMANAN] Catatan user rawan XSS

- Masalahnya apa:
  Pada versi rentan, catatan user dirender memakai `innerHTML`. Jika user
  memasukkan HTML berbahaya, browser akan memprosesnya sebagai markup/kode.

- Cara buktiinnya:
  1. Tambahkan produk ke keranjang.
  2. Isi catatan dengan:
     `<img src=x onerror=alert('xss')>`
  3. Jika dirender lewat `innerHTML`, alert akan muncul.

- Kenapa bahaya:
  XSS bisa mencuri sesi, mengubah halaman, atau menyerang admin/petani jika
  catatan pesanan ditampilkan di dashboard internal.

- Cara betulinnya:
  Tampilkan input user dengan `textContent`, bukan `innerHTML`. Jika suatu saat
  benar-benar perlu HTML, gunakan sanitizer yang jelas.

---

## Temuan #5: [KEAMANAN] Kupon rahasia dan diskon diputus di client

- Masalahnya apa:
  Kode kupon dan logika diskon berada di JavaScript browser. Rahasia di client
  bukan rahasia, karena bisa dibaca lewat View Source atau DevTools.

- Cara buktiinnya:
  1. Buka source `main.js`.
  2. Cari logika kupon/diskon.
  3. Masukkan kode yang ditemukan atau manipulasi state diskon dari console.

- Kenapa bahaya:
  Diskon adalah keputusan uang. Jika diputus di browser, user bisa mempelajari
  atau memanipulasinya. Toko bisa kehilangan margin.

- Cara betulinnya:
  Validasi kupon dan hitung total final di server. Pada aplikasi statis, hash
  kupon hanya hardening ringan, bukan keamanan penuh.

---

## Temuan #6: [ETIKA] Stok palsu menciptakan urgensi palsu

- Masalahnya apa:
  Pada versi rentan, angka stok/kelangkaan dibuat acak, bukan dari data stok
  nyata. Ini membuat pembeli merasa harus buru-buru membeli.

- Cara buktiinnya:
  1. Perhatikan teks stok pada kartu produk.
  2. Klik plus/minus atau refresh.
  3. Angka stok berubah tidak konsisten dan tidak mengikuti pembelian nyata.

- Kenapa tidak adil:
  Ini dark pattern false scarcity. Pembeli dibuat panik oleh informasi yang
  tidak jujur.

- Cara betulinnya:
  Simpan stok nyata di data produk dan tampilkan `stock - jumlah di keranjang`.
  Kalau stok belum tersedia, jangan tampilkan klaim kelangkaan.

---

## Temuan #7: [ETIKA] Biaya penanganan tidak transparan dari awal

- Masalahnya apa:
  Biaya penanganan ditambahkan ke total, tetapi pada versi rentan tidak
  dijelaskan sejak awal di sidebar. Pembeli baru melihat rincian saat checkout.

- Cara buktiinnya:
  1. Tambahkan 1 Apel Fuji seharga `$1.50`.
  2. Total menjadi `$1.80`.
  3. Selisih `$0.30` tidak dijelaskan jelas sejak awal.

- Kenapa tidak adil:
  Ini mirip drip pricing: biaya tambahan muncul setelah pembeli sudah masuk
  proses belanja. Pembeli rugi karena harga awal tidak transparan.

- Cara betulinnya:
  Tampilkan rincian subtotal, biaya penanganan, diskon, dan total sejak awal di
  sidebar dan gunakan rincian yang sama di modal checkout.

---

## Refleksi

Kode yang "jalan" belum tentu benar dan jujur. Kode benar harus tahan input
nakal, tidak mempercayai data dari client untuk urusan uang, aman saat
menampilkan input user, dan transparan terhadap pembeli.
