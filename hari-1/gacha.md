# Report Fitur Gacha — Hari 1

## Ringkasan

Halaman `hari-1/index.html` adalah Poké Gacha yang mengambil data Pokémon asli dari PokeAPI. Fitur yang tersedia mencakup pull 1x dan 10x, rarity Common/Rare/Epic/SSR, pity Legendary pada tarikan ke-10, peluang shiny, riwayat, koleksi, dan progress badge gym.

## Penambahan: Rate Up Legendary

Ditambahkan banner **Rate Up Legendary** pada tab Gacha dengan tiga pilihan target:

- Mewtwo
- Lugia
- Rayquaza

Saat target dipilih, setiap hasil **SSR** memiliki peluang **50%** untuk menjadi Pokémon tersebut. Rarity tetap ditentukan oleh sistem sebelumnya, sehingga rate up tidak meningkatkan peluang mendapatkan SSR atau mengubah mekanisme pity.

Pilihan target disimpan di `localStorage`, jadi tetap aktif setelah halaman dimuat ulang. Memilih **Tanpa rate up** mengembalikan pool SSR ke acak sepenuhnya.

## Berkas yang diubah

- `index.html` — kontrol pilihan Rate Up Legendary.
- `app.js` — logika target, peluang 50% pada SSR, dan penyimpanan pilihan.
- `styles.css` — tampilan banner rate up.

## Verifikasi

- Sintaks JavaScript diperiksa dengan `node --check`.
- Struktur HTML diperiksa untuk memastikan elemen kontrol dan ID yang dipakai skrip tersedia.
