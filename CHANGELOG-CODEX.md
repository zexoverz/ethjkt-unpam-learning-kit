# Codex Change Log

## 2026-07-06

- Memperbaiki render kartu agar tidak berhenti di simbol `?` saat gambar pertama gagal dimuat.
- Gambar sekarang dicoba satu per satu: front sprite, official artwork, home, showdown, dream world, lalu shiny.
- Data `pokemon-species` sekarang optional. Jika gagal, kartu tetap tampil memakai data utama dari `pokemon/{id}`.

## 2026-07-06 - Sprite Fix

- Memperbaiki bug gambar Pokemon yang bisa gagal tampil jika `official-artwork` kosong atau struktur sprite tidak lengkap.
- Sekarang gambar punya beberapa fallback: official artwork, home artwork, dream world, front default, lalu front shiny.
- Jika semua gambar gagal, kartu menampilkan placeholder `?` agar tampilan tidak terlihat rusak.

## 2026-07-06 - Pokemon API

- Mengubah simulator menjadi Pokemon gacha yang mengambil data dari PokeAPI.
- Tiap tarikan mengambil data `pokemon/{id}` untuk sprite, type, dan stat, lalu `pokemon-species/{id}` untuk nama Inggris, genus, flavor text, dan info species.
- Sistem pity tetap dipakai: peluang SSR kecil, tapi tarikan ke-10 tanpa SSR dijamin menjadi SSR.
- Tombol dibuat loading saat data sedang diambil agar user tidak menekan berkali-kali dan membuat hasil berantakan.

## 2026-07-06 - Sebelumnya

- Menambahkan fitur tarik gacha 1x dan 10x di `hari-1/index.html`.
- Menambahkan aturan rarity: SSR 3%, Epic 7%, Rare 20%, dan sisanya Common.
- Menambahkan pity: jika belum dapat SSR, tarikan ke-10 dijamin SSR.
- Menampilkan hasil terakhir, total tarikan, jumlah SSR, progress pity, dan riwayat 12 hasil terakhir.
