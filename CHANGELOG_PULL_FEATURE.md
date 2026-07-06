# Pull Feature Log

## 2026-07-06

Saya menambahkan fitur **pull / tarik gacha** di `hari-1/index.html`.

Yang sekarang bisa dilakukan:

- Tombol **TARIK 1x** melakukan satu kali random pull.
- Tombol **TARIK 10x** melakukan sepuluh kali random pull.
- Hasil terakhir muncul di kartu utama.
- Riwayat 12 hasil terakhir muncul di bawah tombol.
- Pity berjalan sampai 10 tarikan. Kalau belum dapat SSR, tarikan ke-10 pasti SSR.
- Counter total tarikan, jumlah SSR, dan progress pity ikut berubah otomatis.

Aturan rarity:

- SSR: 3% atau pasti saat pity mencapai 10.
- Epic: 7%.
- Rare: 20%.
- Common: sisanya.

Catatan kode:

- Data hadiah disimpan di object `hadiah` supaya mudah ditambah.
- Fungsi dibuat kecil-kecil supaya mudah dibaca: `rollSatu`, `tampilkan`, `tambahRiwayat`, dan `tarik`.
- Komentar hanya ditambahkan di bagian pity karena itu aturan penting di game.

## 2026-07-06 - Pokemon + PokeAPI

Saya mengubah simulator menjadi **Pokemon gacha simulator** yang mengambil data dari PokeAPI.

Endpoint yang dipakai:

- `GET /pokemon/{id}/` untuk mengambil nama dasar, sprite official artwork, types, stats, dan link species.
- `GET /pokemon-species/{id}/` untuk mengambil nama bahasa Inggris, capture rate, status legendary/mythical, dan flavor text.

Cara data digabung:

- Simulator memilih rarity dulu: SSR, Epic, Rare, atau Common.
- Setiap rarity punya pool ID Pokemon yang sesuai.
- Setelah ID dipilih, kode fetch detail Pokemon dan species dari PokeAPI.
- Hasil gabungan ditampilkan sebagai kartu: gambar, nama, rarity, nomor Pokedex, type, total stat, capture rate, status legendary/mythical, dan flavor text.

Catatan penting:

- Data PokeAPI disimpan di cache memory lewat `Map`, jadi request yang sama tidak dipanggil berulang-ulang selama halaman masih terbuka.
- Tombol dibuat loading saat fetch berjalan supaya user tidak spam klik saat data belum selesai.

## 2026-07-07 - Perbaikan Gambar Pokemon

Saya memperbaiki bug gambar Pokemon yang kadang tidak muncul atau menjadi broken image.

Penyebab:

- Kode sebelumnya mengambil gambar dari satu jalur utama: `official-artwork`.
- Tidak semua response atau kondisi jaringan selalu membuat URL itu siap dipakai.
- Kalau URL gambar gagal dimuat oleh browser, belum ada fallback otomatis.

Perbaikan:

- Gambar sekarang punya beberapa fallback URL.
- Kode memakai optional chaining (`?.`) saat membaca data sprite.
- Kalau satu gambar gagal dimuat, browser otomatis mencoba URL berikutnya.
- Riwayat juga memakai mekanisme fallback yang sama.
