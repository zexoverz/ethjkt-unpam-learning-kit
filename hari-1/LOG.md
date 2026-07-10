<<<<<<< HEAD
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
=======
# Log Hari 1 — Poké Gacha (Simulator Gacha Pokémon)

Penjelasan santai soal isi `index.html`. Sekarang gacha-nya menarik
**Pokémon asli** langsung dari internet (PokeAPI), lengkap dengan gambar,
tipe, dan statistik betulan.

## Apa yang berubah dari versi sebelumnya?

Versi lama cuma emoji buatan sendiri (kelihatan "AI banget").
Versi baru mengambil data nyata dari **PokeAPI** (https://pokeapi.co) —
database Pokémon gratis untuk umum. Jadi tiap tarikan memunculkan Pokémon
sungguhan dengan artwork resminya.

## Cara kerjanya (bahasa gampang)

1. **Roll rarity dulu (pakai pity)** — sama seperti gacha beneran:
   - **SSR 3%**, **EPIC 10%**, **RARE 30%**, sisanya **COMMON**.
   - **Pity:** kalau sampai tarikan ke-10 belum dapat SSR, tarikan ke-10
     itu **dijamin SSR**. Bar kuning menunjukkan progresnya.

2. **Baru ambil Pokémon yang cocok** dengan tier hasil roll:
   - **SSR** → Pokémon **Legendary / Mythical** asli (Mewtwo, Mew, Rayquaza, dll).
     Daftar ID-nya sudah diverifikasi lewat data `is_legendary` / `is_mythical`.
   - **EPIC** → Pokémon "pseudo-legendary" super kuat (Dragonite, Garchomp, dll).
   - **RARE & COMMON** → Pokémon acak dari National Dex (nomor 1–1025).

3. **Ambil + gabung data** dari dua alamat API:
   - `/pokemon/{id}` → gambar artwork, tipe, base stat.
   - `/pokemon-species/{id}` → status legendary/mythical.
   Keduanya diambil **barengan** (Promise.all) biar cepat.

4. **Shiny!** — tiap Pokémon punya peluang **1/40** keluar versi *shiny*
   (warna langka & mengkilap). Kalau hoki, muncul badge "✨ SHINY" dan
   gambar shiny-nya yang dipakai.

5. **Tampilan kartu** menunjukkan:
   - Artwork resmi + nomor Pokédex + nama.
   - Badge **tipe** dengan warna resminya (contoh: grass hijau, fire oranye).
   - **6 bar base stat** (HP, ATK, DEF, SpA, SpD, SPD).
   - Border kartu berubah warna sesuai rarity, SSR ada efek getar + kilau emas.

6. **Hemat internet (cache)** — Pokémon yang sudah pernah ditarik disimpan
   di memori, jadi tidak minta ke server berulang-ulang. Ini juga mematuhi
   aturan *fair use* PokeAPI.

7. **Tombol** — **PULL 1x** menarik sekali, **PULL 10x** menarik 10 kali
   beruntun. Selama mengambil data, tombol dikunci + muncul spinner loading.

## Sudah dites? Ya, beneran. ✅

Selain cek logika, saya jalankan tes **end-to-end pakai browser sungguhan
(Chrome headless)**:
- Klik PULL 1x → muncul Pokémon asli (gambar tampil, 2 tipe, 6 bar stat). ✔
- Klik PULL 10x → total jadi 11, pity ter-update, riwayat terisi. ✔
- **0 error JavaScript** di console. ✔
- Data fetch + cache + pity + anti-tabrakan pool sudah diuji terpisah juga. ✔

## Cara lihat hasilnya

Dobel-klik `hari-1/index.html` di browser (butuh koneksi internet karena
gambar & data diambil online), lalu pencet **PULL**. Tarik terus sampai bar
pity penuh untuk dapat Legendary gratis, dan semoga hoki dapat **shiny**! ✨

## Riwayat commit (kecil-kecil, sesuai aturan)

1. `feat: redesign gacha UI shell + local rarity/pity engine`
2. `feat: fetch real Pokémon from PokeAPI with caching + async pulls`
3. `feat: add type badges, base-stat bars, and shiny variants`
4. `docs: update LOG.md for Pokémon gacha`
>>>>>>> upstream/master
