# Log Hari 1 - Anime Archive Gacha

Simulator ini sekarang memakai data anime publik dari Jikan REST API v4:
`https://api.jikan.moe/v4/`.

## Cara kerja data

1. Rarity di-roll dulu secara lokal:
   - SSR 3%
   - EPIC 10%
   - RARE 30%
   - COMMON sisanya
   - Pity ke-10 menjamin SSR kalau belum dapat SSR.

2. Setelah rarity ditentukan, app mengambil pool anime dari endpoint `/anime`.
   Pool dibedakan dengan query Jikan:
   - SSR: skor tertinggi, `min_score=8.6`
   - EPIC: favorit tinggi, `min_score=8`
   - RARE: member tinggi, `min_score=7.2`
   - COMMON: katalog umum dengan `min_score=6`

3. Semua request memakai `sfw=true`, `limit=25`, pagination acak, dan cache
   per halaman supaya pull berikutnya tidak selalu minta data baru.

4. Pull 10x berjalan berurutan dengan jeda request kecil. Ini mengikuti limit
   publik Jikan: 3 request/detik dan 60 request/menit.

## Fitur

- Poster anime asli dari data MyAnimeList via Jikan.
- Rarity, pity, dan limited-cover roll.
- Metadata skor, ranking, member, episode, genre, tahun, dan format.
- Archive koleksi dengan dupe counter.
- Badge berdasarkan genre, skor tinggi, dan anime klasik.

## Commit terbaru

1. `feat: restyle gacha as anime archive`
2. `feat: use jikan anime pools`
