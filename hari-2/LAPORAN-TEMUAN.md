# LAPORAN TEMUAN - PASAR PAGI

## Temuan 1: [BUG] Input jumlah bisa menghasilkan total rusak

- Masalahnya apa:
  Input jumlah barang di keranjang hanya diproses dengan `parseInt()` lalu langsung dipakai untuk mengubah `cart`. Nilai kosong, huruf, `NaN`, desimal, atau angka sangat besar tidak divalidasi dengan benar.

- Cara buktiinnya:
  1. Tambahkan satu produk ke keranjang.
  2. Klik input jumlah di keranjang.
  3. Kosongkan input atau isi nilai tidak wajar.
  4. Total dapat berubah menjadi aneh, termasuk berpotensi menjadi `NaN`.

- Kenapa ini bahaya / tidak adil:
  Total belanja menjadi tidak bisa dipercaya. Di toko sungguhan, kesalahan angka bisa membuat pembeli bingung, transaksi gagal, atau nilai pembayaran salah.

- Cara betulinnya:
  Validasi jumlah dengan ketat sebelum mengubah keranjang. Pastikan nilai adalah integer, finite, dan berada dalam batas wajar, misalnya minimal `1` dan maksimal stok yang tersedia.

```js
const quantity = Number(target.value);
if (!Number.isInteger(quantity) || quantity < 1) {
  return;
}
updateQuantity(target.dataset.id, quantity);
```

## Temuan 2: [BUG] Format uang tidak konsisten

- Masalahnya apa:
  Total akhir ditulis langsung ke halaman dengan `totalPriceEl.textContent = total;`. Karena JavaScript memakai floating point, angka uang bisa tampil panjang atau tidak konsisten, misalnya tidak selalu dua angka desimal.

- Cara buktiinnya:
  1. Tambahkan beberapa produk dengan harga desimal.
  2. Perhatikan tampilan total di keranjang.
  3. Bandingkan dengan format harga produk yang memakai dua angka desimal.

- Kenapa ini bahaya / tidak adil:
  Harga terlihat tidak profesional dan bisa membingungkan pembeli. Untuk uang, tampilan harus konsisten dan mudah diaudit.

- Cara betulinnya:
  Selalu format nilai uang dengan dua angka desimal.

```js
totalPriceEl.textContent = total.toFixed(2);
```

## Temuan 3: [KEAMANAN] Catatan pembeli rawan XSS

- Masalahnya apa:
  Catatan dari user dimasukkan ke halaman memakai `innerHTML`.

```js
preview.innerHTML = "Catatan: " + note;
```

  Karena input user dianggap sebagai HTML, script berbahaya bisa disisipkan.

- Cara buktiinnya:
  1. Tambahkan produk ke keranjang.
  2. Isi catatan dengan:

```html
<img src=x onerror=alert(1)>
```

  3. Jika alert muncul, berarti input user dieksekusi sebagai HTML.

- Kenapa ini bahaya / tidak adil:
  XSS bisa dipakai untuk mencuri data, memanipulasi halaman, atau menjalankan aksi atas nama user. Walaupun contoh ini hanya alert, pola yang sama bisa dipakai untuk serangan yang lebih serius.

- Cara betulinnya:
  Gunakan `textContent`, bukan `innerHTML`, untuk menampilkan teks dari user.

```js
preview.textContent = "Catatan: " + note;
```

## Temuan 4: [KEAMANAN] Kode kupon rahasia terlihat di client

- Masalahnya apa:
  Kode kupon rahasia disimpan langsung di JavaScript browser.

```js
const KUPON_RAHASIA = "TEMANFARMER";
```

  Siapa pun bisa membuka source code atau DevTools dan melihat kode diskon.

- Cara buktiinnya:
  1. Buka file `main.js` atau DevTools.
  2. Cari `KUPON_RAHASIA`.
  3. Masukkan kode `TEMANFARMER` di form kupon.
  4. Diskon 90% aktif.

- Kenapa ini bahaya / tidak adil:
  Rahasia yang dikirim ke browser bukan rahasia lagi. Pengguna bisa mengambil diskon internal tanpa izin dan toko bisa rugi.

- Cara betulinnya:
  Validasi kupon di server. Browser hanya mengirim kode kupon, lalu server menentukan apakah kode valid dan berapa diskonnya.

## Temuan 5: [KEAMANAN] Harga dipercaya dari elemen halaman yang bisa diedit

- Masalahnya apa:
  Saat tombol tambah diklik, harga diambil dari `data-price` pada tombol.

```js
addToCart(target.dataset.id, Number(target.dataset.price));
```

  Nilai `data-price` bisa diedit lewat DevTools.

- Cara buktiinnya:
  1. Buka DevTools tab Elements.
  2. Pilih tombol `+` pada salah satu produk.
  3. Ubah atribut `data-price` menjadi `0`, `0.01`, atau angka negatif.
  4. Klik tombol `+`.
  5. Total memakai harga palsu dari atribut yang sudah diedit.

- Kenapa ini bahaya / tidak adil:
  User bisa memanipulasi harga barang sendiri. Di toko sungguhan, ini bisa membuat pembeli membayar jauh lebih murah atau membuat total transaksi tidak valid.

- Cara betulinnya:
  Jangan percaya harga dari DOM. Ambil harga berdasarkan `id` dari data produk tepercaya. Untuk toko nyata, validasi ulang seluruh harga di server saat checkout.

```js
function addToCart(id) {
  const product = products.find((item) => item.id == id);
  if (!product) return;

  if (!cart[id]) {
    cart[id] = { ...product, count: 0 };
  }

  cart[id].price = product.price;
  cart[id].count++;
  renderCart();
}
```

## Temuan 6: [ETIKA] Stok dibuat acak untuk menciptakan urgensi palsu

- Masalahnya apa:
  Jumlah stok yang ditampilkan dibuat dengan `Math.random()`.

```js
const sisa = Math.floor(Math.random() * 5) + 1;
```

  Angka "tinggal X lagi hari ini" bukan stok nyata.

- Cara buktiinnya:
  1. Buka halaman.
  2. Tambah atau kurangi produk sehingga daftar produk render ulang.
  3. Perhatikan angka stok berubah-ubah tanpa alasan nyata.
  4. Refresh halaman dan lihat angka bisa berubah lagi.

- Kenapa ini bahaya / tidak adil:
  Ini fake scarcity. Pengguna didorong membeli cepat karena merasa stok hampir habis, padahal angka tersebut dikarang oleh kode.

- Cara betulinnya:
  Tampilkan stok asli dari sistem inventori. Jika stok tidak tersedia, jangan tampilkan klaim kelangkaan.

## Temuan 7: [ETIKA] Biaya penanganan ditambahkan tanpa transparansi awal

- Masalahnya apa:
  Ada biaya penanganan tetap:

```js
const HANDLING_FEE = 0.30;
```

  Biaya ini langsung masuk ke total keranjang, tetapi tidak dijelaskan secara jelas sejak awal di area keranjang utama.

- Cara buktiinnya:
  1. Tambahkan satu produk, misalnya Apel Fuji seharga `$1.50`.
  2. Lihat total keranjang menjadi `$1.80` atau setara harga produk + biaya.
  3. Pengguna baru melihat breakdown biaya penanganan dengan jelas saat modal review checkout.

- Kenapa ini bahaya / tidak adil:
  Ini mirip drip pricing. Pembeli melihat harga barang, tetapi total naik karena biaya tambahan yang tidak ditonjolkan dari awal.

- Cara betulinnya:
  Tampilkan breakdown sejak di keranjang utama: subtotal, biaya penanganan, diskon, dan total akhir. Biaya tambahan harus terlihat sebelum user lanjut checkout.

## Refleksi Penutup

Kode yang jalan belum tentu kode yang benar dan jujur. Website ini terlihat rapi dan fungsional, tetapi masih mempercayai input user, menyimpan rahasia di browser, membuka celah XSS, dan memakai pola desain yang mendorong pembeli dengan informasi tidak transparan. Kode yang benar harus aman, bisa diverifikasi, dan tidak menipu pengguna.
