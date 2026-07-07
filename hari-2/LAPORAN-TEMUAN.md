# Laporan Temuan Bug - Hari 2

Website yang diuji: `hari-2` / Pasar Pagi

Target dari README: 7 temuan, terdiri dari 2 BUG, 3 KEAMANAN, dan 2 ETIKA.

## Temuan 1: [BUG]

- Masalahnya apa (bahasa sendiri):
  Total harga kadang tampil dengan angka desimal panjang, misalnya `3.0999999999999996`, bukan format uang yang rapi seperti `$3.10`.

- Cara buktiinnya (langkah persis yang kamu lakuin):
  1. Buka `hari-2/index.html`.
  2. Tambahkan 1 Mangga ke keranjang.
  3. Harga Mangga adalah `$2.80`, lalu kode menambahkan biaya penanganan `$0.30`.
  4. Total seharusnya `$3.10`, tetapi karena hasil hitung langsung ditaruh ke layar, total bisa tampil sebagai angka floating point panjang.
  5. Sumber kode: `main.js` baris 120-123 dan 223-231.

- Kenapa ini bahaya / nggak adil (siapa yang rugi):
  Pembeli jadi melihat angka uang yang tidak profesional dan bisa bingung apakah totalnya benar. Untuk toko online, angka uang harus konsisten karena menyangkut kepercayaan.

- Cara betulinnya:
  Semua nilai uang yang ditampilkan ke UI harus diformat dengan `toFixed(2)` atau formatter mata uang. Contoh: `totalPriceEl.textContent = total.toFixed(2);` dan total di modal juga harus pakai `total.toFixed(2)`.

## Temuan 2: [BUG]

- Masalahnya apa (bahasa sendiri):
  Input jumlah barang di keranjang bisa dibuat tidak waras. Kalau input dikosongkan atau diisi nilai yang tidak valid, nilai `NaN` bisa masuk ke `cart`, lalu total dan jumlah keranjang ikut rusak.

- Cara buktiinnya (langkah persis yang kamu lakuin):
  1. Tambahkan satu buah ke keranjang.
  2. Di input jumlah pada keranjang, hapus angkanya sampai kosong.
  3. Event `input` menjalankan `parseInt(target.value, 10)`.
  4. Saat kosong, hasilnya `NaN`.
  5. Di `updateQuantity`, kondisi `quantity <= 0` tidak menangkap `NaN`, jadi `cart[id].count = NaN`.
  6. Sumber kode: `main.js` baris 157-165 dan 279-285.

- Kenapa ini bahaya / nggak adil (siapa yang rugi):
  Toko bisa menampilkan total `NaN`, jumlah keranjang `NaN`, atau data pesanan yang tidak masuk akal. Pembeli dan penjual sama-sama rugi karena pesanan tidak valid.

- Cara betulinnya:
  Validasi angka sebelum menyimpan ke keranjang. Tolak `NaN`, pecahan, angka kosong, angka negatif, dan angka yang terlalu besar. Contoh aturan minimal: `Number.isInteger(quantity) && quantity >= 1 && quantity <= 99`.

## Temuan 3: [KEAMANAN]

- Masalahnya apa (bahasa sendiri):
  Kolom catatan rentan XSS karena input user dimasukkan ke halaman memakai `innerHTML`.

- Cara buktiinnya (langkah persis yang kamu lakuin):
  1. Tambahkan satu barang ke keranjang.
  2. Isi catatan dengan payload HTML/JavaScript, misalnya `<img src=x onerror=alert('XSS')>`.
  3. Saat catatan dirender di sidebar keranjang, kode menjalankan `preview.innerHTML = "Catatan: " + note`.
  4. Browser membaca input sebagai HTML, bukan teks biasa.
  5. Sumber kode: `main.js` baris 110-116.

- Kenapa ini bahaya / nggak adil (siapa yang rugi):
  Penyerang bisa menjalankan script di browser korban. Di aplikasi nyata, ini bisa dipakai untuk mencuri data sesi, mengubah tampilan checkout, atau menipu pengguna.

- Cara betulinnya:
  Jangan pakai `innerHTML` untuk input user. Gunakan `textContent`, misalnya `preview.textContent = "Catatan: " + note;`. Kalau HTML benar-benar dibutuhkan, input harus disanitasi dengan library yang tepat.

## Temuan 4: [KEAMANAN]

- Masalahnya apa (bahasa sendiri):
  Kode kupon rahasia disimpan langsung di JavaScript client, sehingga siapa pun bisa melihatnya dari DevTools atau file source.

- Cara buktiinnya (langkah persis yang kamu lakuin):
  1. Buka DevTools atau file `hari-2/main.js`.
  2. Cari `KUPON_RAHASIA`.
  3. Terlihat jelas nilainya: `TEMANFARMER`.
  4. Masukkan kode itu di kolom kupon.
  5. Diskon 90% langsung aktif.
  6. Sumber kode: `main.js` baris 31-33 dan 168-181.

- Kenapa ini bahaya / nggak adil (siapa yang rugi):
  Kupon internal bisa dipakai semua orang. Toko kehilangan pendapatan karena aturan bisnis penting disimpan di browser yang sepenuhnya bisa dibaca pengguna.

- Cara betulinnya:
  Validasi kupon harus dilakukan di server. Browser boleh mengirim kode kupon, tetapi server yang menentukan apakah kode valid, siapa yang boleh memakai, berapa diskonnya, dan apakah kupon sudah pernah dipakai.

## Temuan 5: [KEAMANAN]

- Masalahnya apa (bahasa sendiri):
  Harga barang yang dipakai saat menambah ke keranjang diambil dari atribut HTML `data-price`, bukan dari katalog resmi di kode.

- Cara buktiinnya (langkah persis yang kamu lakuin):
  1. Buka DevTools tab Elements.
  2. Pilih tombol `+` salah satu produk.
  3. Ubah atribut `data-price` menjadi `0.01`.
  4. Klik tombol `+`.
  5. Barang masuk keranjang dengan harga yang sudah dimanipulasi.
  6. Sumber kode: `main.js` baris 60-62, 128-138, dan 252-258.

- Kenapa ini bahaya / nggak adil (siapa yang rugi):
  Pembeli nakal bisa mengubah harga sendiri sebelum checkout. Di toko nyata, ini bisa membuat transaksi rugi besar.

- Cara betulinnya:
  Jangan percaya harga dari DOM. Fungsi `addToCart` cukup menerima `id`, lalu ambil harga dari `products` atau, lebih aman lagi, dari server saat checkout. Atribut `data-price` sebaiknya dihapus dari tombol.

## Temuan 6: [ETIKA]

- Masalahnya apa (bahasa sendiri):
  Klaim stok "tinggal X lagi hari ini" palsu karena angkanya dibuat acak setiap render, bukan dari data stok nyata.

- Cara buktiinnya (langkah persis yang kamu lakuin):
  1. Buka halaman dan lihat tulisan stok pada beberapa produk.
  2. Klik tombol `+` atau `-`, atau refresh halaman.
  3. Angka stok berubah-ubah tanpa hubungan jelas dengan jumlah barang di keranjang.
  4. Sumber kode: `main.js` baris 45-58.

- Kenapa ini bahaya / nggak adil (siapa yang rugi):
  Ini dark pattern scarcity. Pembeli didorong merasa buru-buru karena stok seolah hampir habis, padahal angka itu tidak jujur.

- Cara betulinnya:
  Tampilkan stok hanya jika benar-benar berasal dari data inventori. Kalau belum ada data stok, hapus klaim "tinggal X lagi" atau ganti dengan informasi netral yang tidak menekan pembeli.

## Temuan 7: [ETIKA]

- Masalahnya apa (bahasa sendiri):
  Biaya penanganan `$0.30` ditambahkan ke total tanpa dijelaskan sejak awal di area keranjang. Di sidebar, pengguna hanya melihat "Total", bukan rincian subtotal + biaya.

- Cara buktiinnya (langkah persis yang kamu lakuin):
  1. Tambahkan 1 Apel Fuji seharga `$1.50`.
  2. Total sidebar menjadi sekitar `$1.80`, padahal harga barang cuma `$1.50`.
  3. Rincian "Biaya penanganan" baru terlihat di modal review checkout.
  4. Sumber kode: `main.js` baris 28-29, 119-123, dan 223-231.

- Kenapa ini bahaya / nggak adil (siapa yang rugi):
  Pembeli membayar biaya tambahan yang tidak dijelaskan jelas di awal. Walaupun biayanya kecil, pola ini mengurangi transparansi harga.

- Cara betulinnya:
  Tampilkan rincian biaya di sidebar sejak barang masuk keranjang: subtotal, biaya penanganan, diskon jika ada, lalu total akhir. Label tombol checkout juga sebaiknya membawa pengguna ke review yang benar-benar transparan.

## Refleksi Penutup

Kode yang "jalan" hanya berarti browser tidak langsung error dan fitur terlihat bisa dipakai. Kode yang benar dan jujur harus lebih dari itu: angka uangnya akurat, input divalidasi, data user aman, aturan bisnis tidak ditaruh sembarangan di client, dan desainnya tidak memanipulasi pembeli.
