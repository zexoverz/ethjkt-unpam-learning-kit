# Log Hari-1: Membuat Simulasi Gacha Arknights

## Latar Belakang

Pada tugas awal sebenarnya diminta membuat sistem gacha Pokemon. Namun, saya berinisiatif membuat variasi lain dengan tema Arknights karena sistem gacha di game tersebut memiliki mekanisme rarity dan pity yang menarik untuk disimulasikan.

Tujuan proyek Hari-1 adalah membuat simulasi gacha sederhana berbasis web yang dapat melakukan pull operator Arknights, menampilkan rarity, role, nama operator, dan gambar art operator.

## 1. Membuat Sistem Roll Rarity

Langkah pertama adalah membuat sistem dasar untuk menentukan rarity hasil gacha. File awal yang digunakan adalah `main.js`.

Rate rarity yang digunakan:

- Bintang 6: 2%
- Bintang 5: 8%
- Bintang 4: 50%
- Bintang 3: 40%

Operator bintang 1 dan bintang 2 tidak dimasukkan ke dalam sistem gacha, sesuai rancangan awal.

## 2. Membuat Sistem Pity

Setelah sistem rarity dibuat, ditambahkan mekanisme pity seperti Arknights.

Aturan pity:

- Chance awal bintang 6 adalah 2%.
- Jika belum mendapat bintang 6 sampai 50 pull, peluang bintang 6 mulai naik.
- Setelah pull ke-50 tanpa bintang 6, chance bintang 6 bertambah 2% setiap pull.
- Jika berhasil mendapat bintang 6, pity kembali ke 0.

Fungsi penting yang dibuat:

- `getSixStarRate()`
- `getCurrentRates()`
- `rollRarity()`
- `rollOperator()`
- `rollMany(amount)`
- `resetPity()`

## 3. Mengambil Data Operator Arknights

Agar sistem gacha tidak hanya menghasilkan rarity, dibutuhkan data operator asli dari game.

Sumber data yang digunakan:

- `Kengxxiao/ArknightsGameData`
- `Kengxxiao/ArknightsGameData_YoStar`

File data mentah yang digunakan:

- `character_table.json`
- `character_table_en.json`

Awalnya data operator berhasil diambil dari versi Mandarin, tetapi nama operator masih berbahasa Mandarin. Setelah itu digunakan data versi `en_US` dari repository YoStar agar nama operator menjadi nama resmi bahasa Inggris.

## 4. Membuat Generator Data Operator

Karena file `character_table.json` terlalu besar dan berisi banyak data mentah, dibuat script generator:

```txt
scripts/build-operators.js
```

Script ini mengekstrak data penting saja, yaitu:

- ID operator
- Nama operator
- Rarity
- Role
- Sub-role
- URL art operator
- URL avatar fallback

Filter yang digunakan:

- Hanya data dengan ID yang diawali `char_`
- Hanya rarity bintang 3 sampai bintang 6
- Operator dengan `isNotObtainable` tidak dimasukkan
- Operator bintang 1 dan 2 tidak dimasukkan

Output generator:

- `operators.json`
- `operators-data.js`

`operators.json` digunakan sebagai data utama, sedangkan `operators-data.js` dibuat agar aplikasi tetap bisa dibuka langsung dari file HTML tanpa harus menjalankan server lokal.

## 5. Menghubungkan Data Operator ke Sistem Gacha

Setelah data operator berhasil dibuat, sistem gacha dihubungkan dengan data tersebut.

Alurnya:

1. Sistem menentukan rarity hasil pull.
2. Program mengambil pool operator berdasarkan rarity tersebut.
3. Program memilih satu operator secara random dari pool rarity yang sesuai.
4. Hasil pull berisi nama operator, rarity, role, dan data gambar.

Contoh output terminal:

```txt
Exusiai | 6-star | Sniper
Fang | 3-star | Vanguard
Kroos | 3-star | Sniper
```

## 6. Membuat Tampilan Web

Setelah sistem gacha berjalan di JavaScript, dibuat tampilan web dengan file:

- `index.html`
- `styles.css`
- `app.js`

Fitur tampilan web:

- Tema gelap
- Tombol `Pull 1x`
- Tombol `Pull 10x`
- Panel pity bintang 6
- Kartu hasil pull
- Nama operator
- Role operator
- Rarity operator
- Splash art operator

Warna rarity:

- Bintang 6: merah
- Bintang 5: kuning
- Bintang 4: ungu
- Bintang 3: biru

Khusus bintang 6, kartu diberi efek shiny emas agar terlihat lebih spesial.

## 7. Menambahkan Splash Art Operator

Untuk menampilkan gambar operator, digunakan CDN jsDelivr agar tidak perlu mengunduh gambar satu per satu.

Awalnya digunakan format URL:

```txt
https://cdn.jsdelivr.net/gh/Aceship/Arknights-Bot-Resource@master/gamedata/layers/char_art/[ID_OPERATOR].png
```

Namun URL tersebut ternyata menghasilkan error `404`, sehingga gambar tidak muncul dan aplikasi hanya menampilkan nama operator.

Setelah dianalisis, path yang benar untuk splash art adalah:

```txt
https://cdn.jsdelivr.net/gh/Aceship/Arknight-Images@master/characters/[ID_OPERATOR]_1.png
```

Lalu ditambahkan juga fallback avatar:

```txt
https://cdn.jsdelivr.net/gh/Aceship/Arknight-Images@master/avatars/[ID_OPERATOR].png
```

Jika splash art gagal dimuat, aplikasi akan mencoba avatar. Jika avatar juga gagal, barulah aplikasi menampilkan nama operator sebagai fallback terakhir.

## 8. Memperbaiki Bug Gambar Tidak Muncul

Bug yang ditemukan:

- Gambar operator tidak muncul.
- Kartu hanya menampilkan nama operator.

Penyebab:

- URL gambar yang dibuat generator salah.
- CDN mengembalikan status `404`.
- Event `error` pada gambar aktif, sehingga fallback nama ditampilkan.

Perbaikan:

- Mengubah base URL art ke repository `Aceship/Arknight-Images`.
- Menggunakan format `[ID_OPERATOR]_1.png` untuk splash art.
- Menambahkan `avatarUrl` sebagai fallback.
- Memperbarui `operators.json` dan `operators-data.js`.

## 9. Membuat Script Uji URL Art

Untuk mencegah bug gambar terulang, dibuat script pengujian:

```txt
scripts/check-art-urls.js
```

Script ini mengecek beberapa sample operator dan memastikan URL gambar menghasilkan status `200`.

Sample operator yang diuji:

- Kal'tsit
- Exusiai
- Amiya
- Fang
- Ch'en the Holungday
- Nian
- Vigna
- Orchid

Hasil pengujian menunjukkan semua sample berhasil mendapatkan splash art dengan status `200`.

## 10. Pengujian yang Dilakukan

Pengujian syntax:

```txt
node --check app.js
node --check scripts/build-operators.js
node --check scripts/check-art-urls.js
```

Pengujian generator:

```txt
node scripts/build-operators.js
```

Pengujian sistem gacha:

```txt
node main.js
```

Pengujian URL gambar:

```txt
node scripts/check-art-urls.js
```

Hasilnya:

- Data operator berhasil dibuat.
- Sistem gacha berjalan.
- Pull 1x dan 10x tersedia di web.
- Pity berjalan.
- Warna rarity tampil berbeda.
- Efek shiny bintang 6 tersedia.
- Splash art operator berhasil dimuat dari CDN.

## Kesimpulan Hari-1

Pada Hari-1, simulasi gacha Arknights berhasil dibuat dari tahap dasar sampai menjadi aplikasi web sederhana.

Fitur utama yang sudah selesai:

- Sistem roll rarity
- Sistem pity bintang 6
- Data operator resmi dari game
- Nama operator bahasa Inggris
- Role operator
- Pull 1x dan 10x
- Tampilan web gelap
- Warna kartu berdasarkan rarity
- Efek shiny untuk bintang 6
- Splash art operator dari CDN
- Fallback gambar
- Script uji agar bug gambar tidak mudah terulang

Walaupun tugas awal bertema Pokemon, proyek ini tetap memenuhi konsep utama tugas, yaitu membuat sistem gacha, tetapi dengan tema Arknights sebagai bentuk inisiatif dan pengembangan tambahan.
