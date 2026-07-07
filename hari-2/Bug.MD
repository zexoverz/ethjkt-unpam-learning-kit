# Temuan Anomali Pasar Pagi

## Temuan 1: [BUG] Input jumlah barang bisa menjadi NaN

- Masalahnya:
  Input jumlah barang di keranjang tidak divalidasi dengan benar. Jika nilai dikosongkan atau diisi input tidak valid, `parseInt()` bisa menghasilkan `NaN`, lalu nilai itu tetap disimpan sebagai jumlah barang.

- Bukti kode:
  ```js
  const quantity = parseInt(target.value, 10);
  updateQuantity(target.dataset.id, quantity);
  ```

  ```js
  if (quantity <= 0) {
    delete cart[id];
  } else {
    cart[id].count = quantity;
  }
  ```

- Cara membuktikan:
  Tambahkan barang ke keranjang, lalu edit input jumlah barang menjadi kosong atau nilai tidak normal. Total dan jumlah item bisa berubah menjadi aneh karena quantity tidak lagi berupa angka valid.

- Cara test:
  1. Buka `index.html` di browser.
  2. Klik tombol `+` pada salah satu produk.
  3. Di keranjang, klik input jumlah barang.
  4. Kosongkan input tersebut.
  5. Amati angka jumlah item dan total.
  6. Ulangi dengan memasukkan nilai tidak normal lewat DevTools, misalnya ubah atribut `value` menjadi teks atau nilai yang tidak bisa diparse sebagai angka.
  7. Jika total atau jumlah item menjadi `NaN` atau tampilan keranjang menjadi tidak masuk akal, berarti bug terbukti.

- Dampak:
  Keranjang bisa rusak secara perhitungan. Di toko sungguhan, ini bisa menyebabkan total salah, pesanan tidak valid, atau error saat checkout.

- Cara betulin:
  Validasi quantity dengan `Number.isInteger()`, pastikan nilainya minimal 1, dan tolak input yang bukan angka valid.

---

## Temuan 2: [BUG] Total uang tidak diformat konsisten

- Masalahnya:
  Total harga ditampilkan langsung dari nilai JavaScript tanpa pembulatan dua angka desimal.

- Bukti kode:
  ```js
  totalPriceEl.textContent = total;
  ```

  Di modal review juga ada pola serupa:

  ```js
  <div class="row grand"><span>Total</span><span>$${total}</span></div>
  ```

- Cara membuktikan:
  Masukkan kombinasi barang yang menghasilkan angka desimal. Total bisa tampil seperti `1.7999999999999998`, bukan `$1.80`.

- Cara test:
  1. Buka `index.html` di browser.
  2. Tambahkan barang yang punya harga desimal, misalnya `Pisang` dengan harga `$1.20` atau `Apel Fuji` dengan harga `$1.50`.
  3. Tambahkan beberapa kombinasi barang sampai total melibatkan angka desimal.
  4. Perhatikan bagian `Total` di sidebar.
  5. Klik `Lanjut ke Pembayaran`.
  6. Perhatikan total di modal review.
  7. Jika total tampil tanpa format dua desimal atau muncul angka panjang seperti `1.7999999999999998`, berarti bug format uang terbukti.

- Dampak:
  Tampilan harga terlihat tidak profesional dan bisa membingungkan pembeli. Untuk uang, angka harus konsisten dan eksplisit.

- Cara betulin:
  Gunakan format mata uang yang konsisten, misalnya `total.toFixed(2)` atau `Intl.NumberFormat`.

---

## Temuan 3: [KEAMANAN] Harga dipercaya dari DOM yang bisa diedit user

- Masalahnya:
  Harga yang dipakai saat menambah barang berasal dari `data-price` di tombol HTML, bukan dari data resmi produk di kode.

- Bukti kode:
  ```js
  addToCart(target.dataset.id, Number(target.dataset.price));
  ```

  ```js
  cart[id].price = price;
  ```

- Cara membuktikan:
  Buka DevTools, ubah nilai `data-price` pada tombol tambah produk menjadi angka lebih murah, lalu klik tombol tambah. Total akan mengikuti harga yang sudah dimanipulasi.

- Cara test:
  1. Buka `index.html` di browser.
  2. Buka DevTools dengan `F12`.
  3. Masuk ke tab `Elements`.
  4. Pilih tombol `+` pada salah satu produk.
  5. Cari atribut seperti `data-price="1.5"` pada tombol tersebut.
  6. Ubah nilainya menjadi `0.01`.
  7. Klik tombol `+` yang sudah diubah.
  8. Lihat harga item di keranjang dan total.
  9. Jika harga mengikuti `0.01`, berarti harga berhasil dimanipulasi dari browser dan celah terbukti.

- Dampak:
  Pembeli bisa mencurangi harga dari browser. Dalam aplikasi nyata, harga tidak boleh dipercaya dari client karena semua data di browser bisa dimodifikasi.

- Cara betulin:
  Saat menambah barang, ambil harga dari katalog resmi berdasarkan `id`, bukan dari `dataset.price`. Untuk toko sungguhan, validasi harga final tetap harus dilakukan di server.

---

## Temuan 4: [KEAMANAN] Catatan user rawan XSS di preview keranjang

- Masalahnya:
  Input catatan dari user dimasukkan ke halaman memakai `innerHTML`, sehingga HTML berbahaya bisa ikut diproses browser.

- Bukti kode:
  ```js
  preview.innerHTML = "Catatan: " + note;
  ```

- Cara membuktikan:
  Isi kolom catatan dengan payload HTML sederhana seperti:

  ```html
  <img src=x onerror=alert(1)>
  ```

  Jika alert muncul di preview keranjang, berarti input user dieksekusi sebagai HTML.

- Cara test:
  1. Buka `index.html` di browser.
  2. Tambahkan satu barang ke keranjang agar area preview keranjang aktif.
  3. Isi kolom `Catatan buat petani` dengan:

     ```html
     <img src=x onerror=alert(1)>
     ```

  4. Perhatikan apakah muncul alert di browser.
  5. Jika alert muncul, berarti input catatan diproses sebagai HTML/JavaScript, bukan teks biasa.
  6. Sebagai pembanding, klik `Lanjut ke Pembayaran`; di modal review catatan memakai `textContent`, sehingga payload seharusnya tampil sebagai teks biasa di sana.

- Dampak:
  Penyerang bisa menjalankan JavaScript di halaman pengguna. Ini bisa mencuri data, mengubah tampilan, atau melakukan aksi atas nama user.

- Cara betulin:
  Gunakan `textContent` untuk menampilkan input user sebagai teks biasa, bukan HTML.

---

## Temuan 5: [KEAMANAN] Kupon rahasia disimpan di sisi client

- Masalahnya:
  Kode kupon internal terlihat langsung di file JavaScript.

- Bukti kode:
  ```js
  const KUPON_RAHASIA = "TEMANFARMER";
  ```

- Cara membuktikan:
  Buka file `main.js` atau DevTools Sources, cari `KUPON_RAHASIA`, lalu masukkan kode `TEMANFARMER` di kolom kupon.

- Cara test:
  1. Buka `index.html` di browser.
  2. Buka DevTools dengan `F12`.
  3. Masuk ke tab `Sources`.
  4. Buka file `main.js`.
  5. Tekan `Ctrl+F`, lalu cari `KUPON_RAHASIA`.
  6. Catat nilai kupon yang terlihat, yaitu `TEMANFARMER`.
  7. Tambahkan barang ke keranjang.
  8. Masukkan `TEMANFARMER` di input kupon, lalu klik `Pakai`.
  9. Jika muncul pesan potongan 90% dan total berubah, berarti rahasia di client bisa dipakai langsung.

- Dampak:
  Kupon internal mudah dibocorkan dan dipakai siapa saja. Logika diskon penting tidak boleh hanya berada di browser.

- Cara betulin:
  Validasi kupon di server. Client hanya mengirim kode, server yang menentukan apakah kupon valid dan berapa diskonnya.

---

## Temuan 6: [ETIKA] Stok produk dibuat random untuk menciptakan urgensi palsu

- Masalahnya:
  Klaim stok "tinggal sekian lagi hari ini" bukan berasal dari data stok asli, melainkan angka random setiap render.

- Bukti kode:
  ```js
  const sisa = Math.floor(Math.random() * 5) + 1;
  ```

  ```html
  tinggal ${sisa} lagi hari ini!
  ```

- Cara membuktikan:
  Refresh halaman atau ubah keranjang beberapa kali. Angka stok bisa berubah-ubah tanpa hubungan dengan jumlah barang yang benar-benar tersedia.

- Cara test:
  1. Buka `index.html` di browser.
  2. Catat angka stok pada beberapa produk, misalnya `tinggal 3 lagi hari ini`.
  3. Refresh halaman.
  4. Bandingkan angka stok setelah refresh dengan catatan sebelumnya.
  5. Tambahkan atau kurangi barang dari keranjang beberapa kali.
  6. Perhatikan angka stok bisa berubah karena produk dirender ulang.
  7. Jika angka stok berubah acak tanpa hubungan dengan stok nyata atau jumlah yang dibeli, berarti fake scarcity terbukti.

- Dampak:
  Pengguna dibuat merasa takut kehabisan barang dengan informasi yang tidak jujur. Ini termasuk dark pattern berbasis fake scarcity.

- Cara betulin:
  Tampilkan stok nyata dari data produk atau hilangkan klaim stok jika toko tidak punya data stok yang benar.

---

## Temuan 7: [ETIKA] Biaya penanganan tersembunyi di total awal

- Masalahnya:
  Total di sidebar sudah menambahkan biaya penanganan, tetapi pengguna tidak langsung diberi breakdown biaya tersebut.

- Bukti kode:
  ```js
  const HANDLING_FEE = 0.30;
  ```

  ```js
  let total = totalPrice + HANDLING_FEE;
  ```

- Cara membuktikan:
  Tambahkan satu barang ke keranjang, lalu bandingkan harga barang dengan total sidebar. Total lebih tinggi karena ada biaya tambahan, tetapi rincian biaya baru terlihat jelas di modal review.

- Cara test:
  1. Buka `index.html` di browser.
  2. Tambahkan satu barang, misalnya `Apel Fuji` seharga `$1.50`.
  3. Lihat total di sidebar.
  4. Total akan menjadi `$1.80` atau nilai sekitar itu karena ada tambahan `HANDLING_FEE` sebesar `$0.30`.
  5. Perhatikan bahwa sidebar hanya menampilkan label `Total`, bukan rincian `Subtotal` dan `Biaya penanganan`.
  6. Klik `Lanjut ke Pembayaran`.
  7. Baru di modal review terlihat breakdown `Biaya penanganan`.
  8. Jika biaya tambahan baru dijelaskan jelas di tahap review, berarti dark pattern biaya tersembunyi terbukti.

- Dampak:
  Pembeli bisa merasa harga naik diam-diam. Biaya tambahan seharusnya dijelaskan sejak awal, bukan baru terlihat di tahap akhir checkout.

- Cara betulin:
  Tampilkan subtotal, biaya penanganan, diskon, dan total akhir langsung di sidebar sebelum user masuk checkout.
