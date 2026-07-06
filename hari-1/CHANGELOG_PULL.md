# Pokemon Gacha Log

## Apa yang dibuat

- Simulator sekarang mengambil data asli dari PokeAPI.
- Tombol `TARIK 1x` mengambil satu Pokemon.
- Tombol `TARIK 10x` mengambil sepuluh Pokemon.
- Hasil pull muncul di kartu utama dengan gambar Pokemon.
- Riwayat pull terakhir muncul di bagian bawah sebagai thumbnail Pokemon.
- Total pull dan jumlah SSR ikut bertambah otomatis.

## Aturan rarity

- SSR bisa keluar kalau angka random kurang dari `0.03`, atau kalau pity sudah penuh.
- Epic bisa keluar kalau angka random kurang dari `0.10`.
- Rare bisa keluar kalau angka random kurang dari `0.30`.
- Selain itu hasilnya Common.
- Catalog Pokemon dari API dipakai untuk memilih nama dan ID saat pull.
- Detail Pokemon dari API dipakai untuk kartu hasil terakhir, seperti type, total stat, capture rate, dan status legendary/mythical.

## Random pity

Pity sekarang punya target random dari `7` sampai `12`.
Kalau pity sudah menyentuh target, pull berikutnya dijamin SSR.
Setelah SSR keluar, pity balik ke `0` dan target pity baru akan diacak lagi.

## Cara pakai PokeAPI

- `TARIK 10x` mengambil daftar Pokemon dari endpoint `/pokemon?limit=10&offset=...` dalam satu request REST.
- Riwayat memakai thumbnail sprite Pokemon dari package `pokeapi-sprites` di jsDelivr.
- `TARIK 10x` tidak request detail satu per satu.
- `TARIK 1x` mengambil detail Pokemon dari `/pokemon-species/{id}`.
- Dari species, app memilih default variety lalu mengambil detail Pokemon dari URL `/pokemon/{id atau name}` yang diberikan PokeAPI.
- Detail Pokemon juga disimpan di `localStorage`, jadi Pokemon yang sudah pernah diambil tidak selalu request ulang.
