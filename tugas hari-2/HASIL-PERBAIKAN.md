# Hasil Perbaikan - Pasar Pagi

Dokumen ini merangkum perbaikan akhir untuk aplikasi Pasar Pagi di `tugas hari-2`.

File yang diperbaiki:

- `keranjang.js`
- `index.html`
- `style.css`

## Ringkasan

| # | Kategori | Masalah | Status |
|---|----------|---------|--------|
| 1 | Bug | Input quantity bisa menjadi `NaN` | Fixed |
| 2 | Bug | Pembelian bisa melebihi stok | Fixed |
| 3 | Bug | Format total harga tidak rapi | Fixed |
| 4 | Keamanan | Harga diambil dari DOM | Fixed |
| 5 | Keamanan | XSS lewat catatan user | Fixed |
| 6 | Keamanan | Kupon internal terlalu berisiko di frontend | Fixed untuk demo |
| 7 | Etika | Stok acak memakai `Math.random()` | Fixed |
| 8 | Etika | Biaya penanganan kurang transparan | Fixed |

## Perbaikan Utama

### Stok Stabil

Stok sekarang berasal dari field `stock` di katalog produk. Jumlah sisa dihitung dari stok resmi dikurangi jumlah yang ada di keranjang.

```js
const remainingStock = product.stock - quantity;
```

Tombol `+` otomatis `disabled` saat stok habis. Fungsi tambah barang dan input quantity manual juga membatasi pembelian agar tidak melewati stok.

### Harga Dari Katalog

Harga tidak lagi dibaca dari atribut DOM seperti `data-price`. Saat barang ditambahkan atau dirender ulang, harga selalu diambil dari katalog `products`.

```js
cart[product.id].price = product.price;
```

Ini mencegah manipulasi harga lewat DevTools.

### Catatan Aman Dari XSS

Catatan user ditampilkan dengan `textContent`, bukan `innerHTML`.

```js
preview.textContent = "Catatan: " + note;
```

Payload seperti `<img src=x onerror=alert(1)>` akan tampil sebagai teks, bukan dijalankan sebagai HTML/JavaScript.

### Quantity Valid

Input quantity sekarang divalidasi:

- harus integer;
- nilai kosong/huruf tidak masuk ke state keranjang;
- nilai lebih besar dari stok dipotong ke stok maksimum;
- nilai `0` atau negatif menghapus item dari keranjang.

### Format Harga

Semua tampilan uang memakai helper:

```js
const formatMoney = (value) => value.toFixed(2);
```

Subtotal, biaya penanganan, diskon, dan total tampil konsisten dengan dua angka desimal.

### Kupon Demo

Kupon internal lama diganti menjadi kupon promosi publik:

```text
PASARPAGI10
```

Diskon demo sekarang 10%. Untuk aplikasi produksi, validasi kupon dan total final tetap harus dilakukan di backend.

### Rincian Biaya Transparan

Sidebar dan modal checkout memakai fungsi breakdown yang sama, jadi subtotal, biaya penanganan, diskon, dan total tampil konsisten.

## Pengujian

Pengujian yang dilakukan ulang:

- `node --check keranjang.js`
- cek tidak ada conflict marker Git;
- cek `index.html` memuat `keranjang.js`;
- cek pola lama seperti `Math.random`, `data-price`, dan `innerHTML` untuk catatan;
- smoke test DOM untuk render produk, tambah barang, batas stok, kupon, catatan XSS, dan modal checkout;
- HTTP smoke test lewat server lokal.

Hasil akhir: aplikasi dapat berjalan kembali dan file `tugas hari-2` sudah konsisten memakai `keranjang.js`.
