# Report Dragon Ball Gacha — Hari 1

## Perubahan utama

Poké Gacha telah diubah total menjadi **Dragon Ball Gacha**. Aplikasi kini mengambil karakter asli dari Dragon Ball API pada endpoint `GET /api/characters/{id}`.

## Fitur

- **Summon 1x dan 10x** dengan tier Common, Rare, Super, dan Ultra.
- **Dragon Radar pity**: summon ke-10 dijamin tier Ultra apabila belum mendapatkannya.
- **Featured Fighter**: Goku, Vegeta, atau Piccolo dapat dipilih; setiap hasil Ultra punya peluang 50% menjadi fighter pilihan.
- **Roster** yang tersimpan di `localStorage`, termasuk jumlah duplikat dan total transformasi.
- **Dragon Radar** untuk melacak fighter berdasarkan ras.
- Kartu fighter menampilkan gambar, ras, afiliasi, Ki, Max Ki, dan jumlah transformasi dari API.

## UI

Tampilan memakai bahasa visual Dragon Ball: gradasi oranye Dragon Ball, biru scouter/Capsule Corp., aksen merah, radar, serta bola naga CSS dengan empat bintang. UI juga responsif untuk layar kecil.

## Berkas yang diubah

- `index.html` — struktur aplikasi Dragon Ball Gacha.
- `app.js` — pengambilan data dan logika summon Dragon Ball API.
- `styles.css` — desain Scouter dan Dragon Ball.

## Verifikasi

- Respons endpoint karakter diverifikasi menggunakan `https://dragonball-api.com/api/characters/1`.
- Sintaks JavaScript diperiksa dengan `node --check`.
