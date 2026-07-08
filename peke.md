# Catatan Bug Hari 2 - Pasar Pagi

File yang dicek: `hari-2/main.js`

## Yang Sudah Dibuat

Saya sudah membuat file catatan ini: `peke.md`.

Isi file ini adalah laporan inspeksi untuk website `hari-2` atau "Pasar Pagi". Catatan ini menjelaskan hal-hal yang mencurigakan di balik website yang kelihatannya berjalan normal, termasuk bug teknis, celah keamanan, dan pola gelap atau dark pattern.

Catatan ini belum memperbaiki kode aplikasinya. Fokusnya adalah dokumentasi temuan: masalahnya apa, bukti dari kode, dampaknya, dan saran cara memperbaiki.

## Bukti Awal Website Memang Sengaja Mencurigakan

Di awal file `hari-2/main.js`, komentar kodenya sendiri memberi tanda bahwa aplikasi ini memang mengandung masalah:

```js
// diselipin BUG, CELAH KEAMANAN, dan POLA GELAP (dark pattern).
```

Artinya, website ini dibuat supaya terlihat rapi dan berjalan, tetapi ada hal-hal gelap yang harus dibongkar lewat inspeksi kode dan pengujian.

## Ringkasan Temuan Utama

| No | Kategori | Temuan |
| --- | --- | --- |
| 1 | Bug | Total harga tidak diformat sebagai uang |
| 2 | Bug | Input jumlah barang bisa menerima nilai tidak valid |
| 3 | Keamanan | Catatan user rawan XSS |
| 4 | Keamanan | Harga bisa dimanipulasi lewat DevTools |
| 5 | Keamanan | Kupon rahasia terlihat di kode frontend |
| 6 | Etika / Dark Pattern | Stok palsu dibuat acak |
| 7 | Etika / Dark Pattern | Biaya penanganan kurang transparan |
| 8 | Bug / Keamanan | Tidak ada batas pembelian berdasarkan stok |

## 1. Total harga tidak diformat sebagai uang

Kategori: Bug

Masalah:
Total akhir ditulis langsung dari angka JavaScript:

```js
totalPriceEl.textContent = total;
```

Lokasi: `hari-2/main.js`, sekitar baris 123.

Dampak:
Angka total bisa tampil tidak rapi, misalnya terlalu banyak angka desimal. Untuk uang, tampilan harus konsisten dua angka di belakang koma.

Cara memperbaiki:
Gunakan format dua desimal:

```js
totalPriceEl.textContent = total.toFixed(2);
```

Hal yang sama juga perlu dilakukan di modal review checkout.

## 2. Input jumlah barang bisa menerima nilai tidak valid

Kategori: Bug

Masalah:
Jumlah barang dari input langsung diparse:

```js
const quantity = parseInt(target.value, 10);
updateQuantity(target.dataset.id, quantity);
```

Lokasi: `hari-2/main.js`, sekitar baris 282-284.

Kalau input dikosongkan, diisi huruf, atau nilai aneh, hasilnya bisa menjadi `NaN`.

Dampak:
Keranjang bisa menyimpan jumlah yang tidak valid, lalu total harga ikut rusak.

Cara memperbaiki:
Validasi dulu jumlahnya:

```js
if (!Number.isInteger(quantity) || quantity < 1) {
  return;
}
```

Lebih baik juga batasi jumlah maksimal sesuai stok.

## 3. Catatan user rawan XSS

Kategori: Keamanan

Masalah:
Catatan dari user ditampilkan dengan `innerHTML`:

```js
preview.innerHTML = "Catatan: " + note;
```

Lokasi: `hari-2/main.js`, sekitar baris 115.

Dampak:
User bisa memasukkan HTML atau JavaScript berbahaya, misalnya:

```html
<img src=x onerror=alert(1)>
```

Kalau browser menjalankannya, ini menjadi celah XSS.

Cara memperbaiki:
Gunakan `textContent`, bukan `innerHTML`:

```js
preview.textContent = "Catatan: " + note;
```

## 4. Harga bisa dimanipulasi dari DevTools

Kategori: Keamanan

Masalah:
Harga yang dipakai saat menambah barang diambil dari atribut tombol:

```js
addToCart(target.dataset.id, Number(target.dataset.price));
```

Lalu disimpan ke keranjang:

```js
cart[id].price = price;
```

Lokasi: `hari-2/main.js`, sekitar baris 136 dan 257.

Dampak:
User bisa membuka DevTools, mengubah `data-price`, lalu membeli barang dengan harga palsu.

Cara memperbaiki:
Harga harus selalu diambil dari data produk resmi berdasarkan `id`, bukan dari HTML:

```js
const product = products.find((item) => item.id == id);
cart[id] = { ...product, count: 0 };
```

Untuk aplikasi nyata, validasi harga tetap harus dilakukan di server.

## 5. Kupon rahasia terlihat di kode client

Kategori: Keamanan

Masalah:
Kode kupon rahasia disimpan langsung di JavaScript:

```js
const KUPON_RAHASIA = "TEMANFARMER";
```

Lokasi: `hari-2/main.js`, sekitar baris 32.

Dampak:
Siapa pun bisa membuka source code dan menemukan kupon tersebut. Karena diskonnya 90%, ini bisa merugikan toko.

Cara memperbaiki:
Jangan simpan rahasia di frontend. Validasi kupon harus dilakukan di server. Kalau hanya demo frontend, gunakan kupon publik dengan diskon wajar.

## 6. Stok palsu berubah-ubah setiap render

Kategori: Etika / Dark Pattern

Masalah:
Stok dibuat acak setiap kali produk dirender:

```js
const sisa = Math.floor(Math.random() * 5) + 1;
```

Lokasi: `hari-2/main.js`, sekitar baris 47-58.

Dampak:
Teks "tinggal X lagi hari ini" memberi tekanan palsu ke user agar cepat membeli. Ini bukan stok sungguhan.

Cara memperbaiki:
Gunakan data stok yang nyata dan konsisten. Kalau stok belum tersedia, jangan tampilkan klaim kelangkaan.

## 7. Biaya penanganan tidak jelas sejak awal

Kategori: Etika / Dark Pattern

Masalah:
Kode menambahkan biaya penanganan:

```js
const HANDLING_FEE = 0.30;
let total = totalPrice + HANDLING_FEE;
```

Lokasi: `hari-2/main.js`, sekitar baris 29 dan 120.

Namun biaya ini tidak dijelaskan dengan jelas di area keranjang utama. User baru melihat total yang sudah bertambah.

Dampak:
Pembeli bisa merasa tertipu karena harga akhir lebih tinggi dari jumlah harga barang.

Cara memperbaiki:
Tampilkan rincian biaya di keranjang sebelum checkout:

```text
Subtotal
Biaya penanganan
Diskon
Total
```

## 8. Tidak ada batas pembelian berdasarkan stok

Kategori: Bug / Keamanan

Masalah:
User bisa menambah barang terus menerus tanpa dicek terhadap stok.

Dampak:
Jumlah barang di keranjang bisa melebihi stok yang ditampilkan.

Cara memperbaiki:
Tambahkan properti stok pada data produk, lalu tolak penambahan jika jumlah sudah mencapai stok.

## Cara Membuktikan di Browser

Beberapa cara untuk membuktikan temuan:

1. Buka `hari-2/index.html`.
2. Tambahkan buah ke keranjang.
3. Perhatikan teks stok. Klik tambah/kurang atau render ulang halaman, angka stok bisa berubah karena dibuat acak.
4. Isi catatan dengan:

```html
<img src=x onerror=alert(1)>
```

Jika alert muncul, berarti catatan rentan XSS.

5. Buka DevTools, ubah atribut `data-price` di tombol `+`, lalu klik tombol tersebut. Jika total mengikuti harga palsu, berarti harga bisa dimanipulasi.
6. Buka file `main.js`, cari `TEMANFARMER`, lalu masukkan sebagai kupon. Diskon 90% aktif karena rahasia disimpan di frontend.
7. Ubah input jumlah barang menjadi kosong, huruf, atau angka tidak wajar. Ini menguji validasi kuantitas.

## Kesimpulan

Bug utama di Hari 2 bukan cuma soal kode error, tapi juga soal kepercayaan. Ada masalah teknis seperti angka tidak valid dan XSS, ada celah manipulasi harga, dan ada pola gelap seperti stok palsu serta biaya tambahan yang kurang transparan.

Kode yang "jalan" belum tentu benar, aman, atau jujur.
