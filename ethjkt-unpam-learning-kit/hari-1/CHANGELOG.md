# Hari 1 Change Log

## Pull Feature

File yang diubah: `index.html`

Perubahan yang dibuat:

- Menambahkan data hadiah untuk rarity `SSR`, `Epic`, `Rare`, dan `Common`.
- Menambahkan tombol `TARIK 1x` supaya bisa melakukan satu pull.
- Menambahkan tombol `TARIK 10x` supaya bisa melakukan sepuluh pull sekaligus.
- Menambahkan sistem random rarity:
  - SSR: 3% atau pasti saat pity mencapai 10.
  - Epic: jika angka random di bawah 10%.
  - Rare: jika angka random di bawah 30%.
  - Common: hasil default.
- Menambahkan sistem pity:
  - Pity naik setiap pull.
  - Pity reset ke 0 saat mendapatkan SSR.
- Menampilkan hasil pull di kartu utama.
- Menampilkan total pull, jumlah SSR, dan progress pity.
- Menambahkan riwayat 12 pull terakhir.

Catatan kode:

- Kode dibuat langsung di dalam tag `<script>` supaya cocok dengan materi starter hari 1.
- Komentar hanya ditambahkan di bagian yang penting supaya kode tetap mudah dibaca.
- Emoji ditulis memakai Unicode escape agar file tetap aman dibaca di terminal Windows.

Tes yang dilakukan:

- Mengecek syntax JavaScript dari dalam `index.html` memakai Node.js.
- Hasil tes: `script syntax ok`.

## Pokemon API Gacha

File yang diubah: `index.html`

Perubahan yang dibuat:

- Mengubah simulator dari hadiah dummy menjadi Pokemon gacha.
- Mengambil data langsung dari PokeAPI:
  - `/pokemon/{id}` untuk sprite, type, base experience, dan stat.
  - `pokemon.species.url` untuk data species seperti legendary, mythical, capture rate, genus, generation, dan Pokedex text.
- Menambahkan tampilan kartu Pokemon dengan:
  - gambar official artwork,
  - nomor Pokedex,
  - nama Pokemon,
  - type,
  - rarity,
  - base EXP,
  - capture rate,
  - total stat,
  - flavor text.
- Menambahkan rarity berbasis data API:
  - `legendary` kalau species adalah legendary atau mythical.
  - `ultra` kalau base EXP/stat tinggi atau capture rate sangat rendah.
  - `rare` kalau base EXP/stat cukup tinggi atau capture rate rendah.
  - `common` untuk sisanya.
- Menambahkan pity untuk legendary/mythical:
  - Pity naik kalau pull bukan legendary.
  - Saat pity mencapai 10, pull berikutnya dipaksa mengambil Pokemon dari daftar legendary/mythical.
  - Pity reset saat mendapatkan legendary/mythical.
- Menambahkan counter total pull, legendary, dan unique Pokemon.
- Menambahkan cache sederhana supaya Pokemon yang pernah diambil tidak perlu fetch ulang.
- Menambahkan loading state dan pesan error kalau PokeAPI tidak bisa diakses.

Catatan API:

- PokeAPI memakai endpoint detail per resource. Jadi simulator mengambil data Pokemon dulu, lalu mengambil data species dari URL yang diberikan oleh response Pokemon.
- Data rarity tidak dibuat manual sepenuhnya. Rarity dihitung dari field asli API seperti `is_legendary`, `is_mythical`, `capture_rate`, `base_experience`, dan total stat.

Tes yang dilakukan:

- Mengecek syntax JavaScript dari dalam `index.html` memakai Node.js.
- Menguji fetch nyata ke PokeAPI memakai Pokemon `pikachu`.
- Hasil API test:

```json
{"name":"pikachu","types":["electric"],"baseExperience":112,"captureRate":190,"isLegendary":false,"isMythical":false}
```

## Sprite Fallback Fix

File yang diubah: `index.html`

Masalah:

- Beberapa Pokemon bisa tampil tanpa gambar kalau field sprite utama kosong atau gagal dimuat.

Perbaikan:

- Menambahkan daftar fallback sprite:
  - official artwork,
  - home sprite,
  - dream world sprite,
  - default front sprite,
  - shiny fallback kalau sprite biasa tidak tersedia.
- Menambahkan handler `onerror` supaya browser otomatis mencoba sprite berikutnya saat gambar gagal load.
- Menambahkan placeholder Pokeball kalau semua sprite gagal.
- Memakai fungsi yang sama untuk gambar utama dan riwayat pull.

Tes yang dilakukan:

- Mengecek syntax JavaScript dari dalam `index.html` memakai Node.js.
- Menguji beberapa Pokemon dari PokeAPI, termasuk Pokemon lama, legendary, dan Pokemon generasi terbaru.
- Hasil test menunjukkan semua sample punya minimal 6-7 fallback sprite.
