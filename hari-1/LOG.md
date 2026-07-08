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

## Perubahan Kecil
Saya menambahkan fitur Reset Progress di praktik Hari 1, supaya
  user bisa mulai ulang gacha dari nol tanpa harus hapus data
  browser manual.

  Bagian yang diubah:

  1. hari-1/index.html:70

  Saya menambahkan tombol baru:

  <button class="btn reset" id="resetProgress">RESET</button>

  Kenapa:

  - Sebelumnya cuma ada PULL 1x dan PULL 10x.
  - Progress gacha disimpan di localStorage, tapi tidak ada
    tombol untuk menghapusnya.

  - Tombol ini jadi pintu masuk user untuk reset data.

  2. hari-1/app.js:195

  Saya tambahkan referensi DOM:

  resetProgress: document.getElementById("resetProgress"),

  Kenapa:

  - Supaya JavaScript bisa menangkap tombol RESET.
  - Polanya mengikuti tombol lain seperti tarik1 dan tarik10.

  3. hari-1/app.js:231

  Saya tambahkan fungsi resetCardView().

  Fungsinya:

  - Mengembalikan kartu Pokémon ke tampilan awal.
  - Menghapus gambar Pokémon terakhir.
  - Mengosongkan nama, nomor Pokédex, tipe, rarity, stat, dan
    history.

  Kenapa:

  - Kalau hanya hapus data, tampilan terakhir masih bisa
    kelihatan.

  - Jadi reset harus membersihkan state data dan state tampilan.

  4. hari-1/app.js:248

  Saya tambahkan fungsi resetProgress().

  Fungsinya:

  - Menampilkan konfirmasi dengan confirm(...).
  - Mengatur ulang:

  total = 0;
  pity = 0;
  ssrCount = 0;
  collection = {};
  shownBadges = new Set();

  - Menghapus data browser:

  localStorage.removeItem(STORAGE_KEY);

  - Merender ulang statistik, koleksi, badge, dan tampilan kartu.

  Kenapa:

  - Data utama aplikasi disimpan di variabel-variabel itu.
  - Data permanennya disimpan di localStorage.
  - Keduanya harus di-reset supaya setelah refresh browser,
    progress lama tidak balik lagi.

  5. hari-1/app.js:281

  Saya tambahkan:

  el.resetProgress.disabled = on;

  Kenapa:

  - Saat sedang loading pull, tombol reset ikut dikunci.
  - Ini mencegah user reset di tengah proses fetch Pokémon.

  6. hari-1/app.js:402

  Saya sambungkan tombol ke fungsi reset:

  el.resetProgress.addEventListener("click", resetProgress);

  Kenapa:

  - Tanpa event listener ini, tombol muncul tapi tidak melakukan
    apa-apa.

  7. hari-1/styles.css:245

  Saya tambahkan style:

  .btn.reset {
    color: var(--ink);
    background: linear-gradient(180deg,#f7f9fd,#dfe4ee);
    box-shadow: 0 4px 0 #aab4c5;
  }

  Kenapa:

  - Supaya tombol reset terlihat beda dari tombol pull.
  - Warna dibuat netral karena reset adalah aksi utilitas, bukan
    aksi utama seperti PULL.

  Intinya: perubahan ini menambahkan satu fitur kecil tapi
  lengkap: tombol reset yang menghapus progress dari memori
  aplikasi, localStorage, dan tampilan layar.
