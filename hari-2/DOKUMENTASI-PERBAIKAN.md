# Dokumentasi Perbaikan Pasar Pagi

Dokumen ini mencatat perbaikan yang sudah dilakukan untuk setiap temuan bug, celah keamanan, dan dark pattern pada aplikasi `Pasar Pagi`.

## Ringkasan File yang Diubah

- `main.js`
  - Memperbaiki validasi quantity.
  - Memperbaiki format tampilan uang.
  - Mengambil harga dari katalog resmi, bukan dari DOM.
  - Mengamankan catatan user dari XSS.
  - Menghapus kupon rahasia dari sisi client.
  - Mengganti stok random dengan stok eksplisit.

- `index.html`
  - Menambahkan area breakdown biaya di sidebar keranjang.

- `style.css`
  - Menambahkan styling breakdown biaya.
  - Menambahkan styling tombol produk saat stok habis.

---

## Perbaikan 1: Input jumlah barang bisa menjadi NaN

- Masalah awal:
  Input quantity memakai `parseInt()` dan tidak mengecek apakah hasilnya angka valid. Jika input kosong atau tidak valid, nilai `NaN` bisa masuk ke `cart`.

- Perbaikan:
  Quantity sekarang diproses dengan `Number()` lalu divalidasi memakai `Number.isInteger()`.

  ```js
  if (!Number.isInteger(quantity) || quantity < 1) {
    showToast("Jumlah barang harus berupa angka minimal 1.");
    renderCart();
    return;
  }
  ```

- Dampak perbaikan:
  Quantity tidak bisa menjadi `NaN`, tidak bisa kurang dari `1`, dan keranjang tetap stabil.

- Cara retest:
  1. Tambahkan produk ke keranjang.
  2. Kosongkan input jumlah barang.
  3. Coba masukkan nilai tidak valid.
  4. Aplikasi harus menolak input tersebut dan menampilkan toast.
  5. Total tidak boleh berubah menjadi `NaN`.

---

## Perbaikan 2: Total uang tidak diformat konsisten

- Masalah awal:
  Total ditampilkan langsung dari angka JavaScript, sehingga bisa muncul angka panjang seperti `1.7999999999999998`.

- Perbaikan:
  Ditambahkan helper `formatMoney()` dan semua tampilan harga memakai format dua desimal.

  ```js
  function formatMoney(amount) {
    return amount.toFixed(2);
  }
  ```

- Dampak perbaikan:
  Semua harga dan total tampil konsisten, misalnya `$1.80`, bukan angka floating point panjang.

- Cara retest:
  1. Tambahkan beberapa produk dengan harga desimal.
  2. Lihat total di sidebar.
  3. Buka modal checkout.
  4. Semua nilai uang harus tampil dengan dua angka desimal.

---

## Perbaikan 3: Harga dipercaya dari DOM

- Masalah awal:
  Harga item dikirim dari atribut `data-price` pada tombol. Nilai ini bisa diubah lewat DevTools.

- Perbaikan:
  Fungsi `addToCart()` sekarang hanya menerima `id`, lalu mengambil harga dari katalog resmi `products`.

  ```js
  function addToCart(id) {
    const product = products.find((item) => item.id == id);
    if (!product) return;
    cart[id].price = product.price;
  }
  ```

- Dampak perbaikan:
  Mengubah atribut HTML di DevTools tidak lagi bisa mengubah harga transaksi.

- Cara retest:
  1. Buka DevTools.
  2. Edit tombol `+` produk.
  3. Tambahkan atribut palsu seperti `data-price="0.01"`.
  4. Klik tombol `+`.
  5. Harga di keranjang harus tetap mengikuti harga resmi dari katalog.

---

## Perbaikan 4: Catatan user rawan XSS

- Masalah awal:
  Catatan user ditampilkan memakai `innerHTML`, sehingga HTML dari user bisa diproses browser.

- Perbaikan:
  Preview catatan sekarang memakai `textContent`.

  ```js
  preview.textContent = "Catatan: " + note;
  ```

- Dampak perbaikan:
  Input user ditampilkan sebagai teks biasa, bukan HTML aktif.

- Cara retest:
  1. Tambahkan produk ke keranjang.
  2. Isi catatan dengan:

     ```html
     <img src=x onerror=alert(1)>
     ```

  3. Alert tidak boleh muncul.
  4. Payload harus tampil sebagai teks biasa.

---

## Perbaikan 5: Kupon rahasia disimpan di sisi client

- Masalah awal:
  Kode kupon `TEMANFARMER` disimpan langsung di `main.js`, sehingga bisa dilihat siapa saja.

- Perbaikan:
  Konstanta kupon rahasia dihapus dari client. Demo offline tidak lagi memproses diskon rahasia di browser.

  ```js
  msg.textContent = "Kupon diproses oleh server. Demo offline ini tidak menyimpan kode kupon rahasia di browser.";
  ```

- Dampak perbaikan:
  Tidak ada kode kupon rahasia yang bisa dicari di source client.

- Cara retest:
  1. Buka DevTools.
  2. Cari `KUPON_RAHASIA` atau `TEMANFARMER` di `main.js`.
  3. Nilai rahasia tersebut tidak boleh ditemukan sebagai logika kupon aktif.
  4. Memasukkan kode kupon tidak boleh memberi diskon client-side.

---

## Perbaikan 6: Stok produk dibuat random

- Masalah awal:
  Stok ditampilkan dari `Math.random()`, sehingga angka stok berubah-ubah dan menciptakan urgensi palsu.

- Perbaikan:
  Setiap produk sekarang punya properti `stock` eksplisit.

  ```js
  { id: 1, name: "Apel Fuji", price: 1.5, stock: 12, ... }
  ```

  Tampilan stok dihitung dari stok asli dikurangi jumlah di keranjang:

  ```js
  const remainingStock = Math.max(product.stock - quantity, 0);
  ```

- Dampak perbaikan:
  Stok tidak lagi random dan tidak berubah palsu saat halaman dirender ulang.

- Cara retest:
  1. Catat stok salah satu produk.
  2. Refresh halaman.
  3. Stok harus tetap sama.
  4. Tambahkan produk ke keranjang.
  5. Stok tersedia harus berkurang sesuai jumlah yang ditambahkan.

---

## Perbaikan 7: Biaya penanganan tersembunyi

- Masalah awal:
  Sidebar hanya menampilkan `Total`, padahal total sudah termasuk `HANDLING_FEE`.

- Perbaikan:
  Ditambahkan breakdown biaya di sidebar melalui elemen:

  ```html
  <div class="cart-breakdown" id="cart-breakdown"></div>
  ```

  Lalu `main.js` menampilkan subtotal dan biaya penanganan sebelum total.

  ```js
  <div class="row"><span>Subtotal</span><span>$${formatMoney(subtotal)}</span></div>
  <div class="row"><span>Biaya penanganan</span><span>$${formatMoney(HANDLING_FEE)}</span></div>
  ```

- Dampak perbaikan:
  Pembeli bisa melihat dari awal bahwa ada biaya penanganan. Total tidak lagi terasa naik diam-diam.

- Cara retest:
  1. Tambahkan satu produk ke keranjang.
  2. Lihat sidebar keranjang.
  3. Harus ada rincian `Subtotal`, `Biaya penanganan`, dan `Total`.
  4. Klik checkout.
  5. Breakdown di modal harus konsisten dengan sidebar.

---

## Catatan Penting

Untuk aplikasi toko sungguhan, validasi harga, kupon, stok, dan total akhir tetap harus dilakukan di server. Perbaikan di demo ini membuat sisi client lebih jujur dan lebih aman, tetapi browser tetap tidak boleh menjadi sumber kebenaran utama untuk transaksi uang.

