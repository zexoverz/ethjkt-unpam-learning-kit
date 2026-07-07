# Dokumentasi Fitur Gacha

File utama: `index.html`

## Ringkasan

Halaman ini adalah simulator gacha waifu sederhana berbasis HTML, CSS, dan JavaScript. Pengguna bisa melakukan tarikan 1x atau 10x untuk mendapatkan kartu waifu dengan rarity berbeda.

Gambar waifu diambil dari API:

```text
https://api.waifu.im/images
```

## Fitur

- Tombol `TARIK 1x` untuk melakukan satu kali gacha.
- Tombol `TARIK 10x` untuk melakukan sepuluh kali gacha berurutan.
- Sistem rarity: `COMMON`, `RARE`, `EPIC`, dan `SSR`.
- Sistem pity: jika belum mendapat SSR sampai 10 tarikan, tarikan ke-10 dijamin SSR.
- Statistik total tarikan dan jumlah SSR yang sudah didapat.
- Progress bar pity menuju SSR gratis.
- Riwayat 12 hasil tarikan terakhir dalam bentuk thumbnail.
- Animasi reveal kartu dan efek khusus untuk SSR.
- Status pemuatan gambar dan URL gambar yang diterima dari API.

## Aturan Probabilitas

Urutan pengecekan hasil gacha:

1. Jika pity mencapai 10, hasil dijamin `SSR`.
2. Jika angka acak kurang dari `0.03`, hasil menjadi `SSR`.
3. Jika angka acak kurang dari `0.10`, hasil menjadi `EPIC`.
4. Jika angka acak kurang dari `0.30`, hasil menjadi `RARE`.
5. Selain itu, hasil menjadi `COMMON`.

Dengan aturan tersebut, peluang dasar sebelum pity adalah:

- SSR: 3%
- EPIC: 7%
- RARE: 20%
- COMMON: 70%

## Struktur Data

Nama kartu disimpan dalam object `namaWaifu`:

```js
const namaWaifu = {
  ssr: [],
  epic: [],
  rare: [],
  common: []
};
```

Gambar kartu tidak disimpan manual. Setiap tarikan wajib memanggil API `waifu.im`, lalu memakai URL gambar dari response JSON sebagai sumber gambar.

Contoh bentuk response:

```json
{
  "images": [
    {
      "url": "https://cdn.waifu.im/contoh-gambar.jpg"
    }
  ]
}
```

Kode juga mendukung format sederhana `{ "url": "..." }` kalau API mengembalikan bentuk response yang berbeda. Setelah pembaruan, aplikasi juga mampu menangani respons dari API yang mengembalikan data dalam bentuk `items[0].url` atau struktur lain yang masih memuat properti `url` di level yang sesuai.

### Perubahan terbaru

- Diperbaiki penanganan respons API `waifu.im` agar tidak gagal ketika respons tidak memiliki struktur `images[0].url` secara langsung.
- Logika pengambilan URL gambar sekarang mendukung beberapa bentuk respons yang umum digunakan.
- Pesan error lebih jelas saat API tidak mengandung URL gambar yang valid.

## Fungsi API

- Endpoint: `https://api.waifu.im/images`
- Method: `GET`
- Response utama yang dipakai: `images[0].url`

## Fungsi Utama

- `pilihAcak(arr)`: mengambil satu item secara acak dari array.
- `ambilGambarWaifu()`: mengambil gambar dari API `waifu.im`.
- `rollSatu()`: menjalankan satu tarikan gacha, menentukan rarity, mengatur pity, mengambil gambar waifu, dan mengembalikan hasil.
- `tampilkan(hasil)`: menampilkan hasil gacha ke kartu utama dan memperbarui statistik.
- `tambahRiwayat(hasil)`: menambahkan thumbnail hasil ke daftar riwayat terakhir.
- `tarikSekali()`: handler untuk tombol `TARIK 1x`.
- `tarikSepuluh()`: handler untuk tombol `TARIK 10x`.

## Cara Menjalankan

1. Buka terminal di folder `hari-1`.
2. Jalankan server lokal dengan npm:

```bash
npm install
npm start
```

3. Biarkan terminal tetap terbuka.
4. Buka `http://127.0.0.1:8000/index.html` di browser.
5. Klik `TARIK 1x` untuk satu tarikan.
6. Klik `TARIK 10x` untuk sepuluh tarikan otomatis.
7. Lihat hasil, statistik, pity bar, dan riwayat di halaman.

Alternatif Windows tanpa npm:

```text
Double click START_SERVER.bat
```

## Catatan Pengembangan

- Aplikasi ini berupa HTML statis, tetapi disarankan dibuka lewat server lokal agar request `fetch` ke API lebih stabil daripada membuka file langsung sebagai `file://`.
- Koneksi internet dibutuhkan untuk mengambil gambar dari API.
- Data tidak disimpan permanen. Jika browser di-refresh, statistik akan kembali ke awal.
- Jika API gagal diakses atau gambar dari API tidak bisa dimuat, tarikan tidak ditambahkan sebagai hasil sukses dan aplikasi menampilkan pesan error.
- Untuk mengubah nama kartu, edit array di object `namaWaifu`.
