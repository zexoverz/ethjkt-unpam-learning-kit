# Pokemon Gacha Log

## Apa yang dibuat

- Simulator sekarang mengambil data asli dari PokeAPI.
- Tombol `TARIK 1x` mengambil satu Pokemon.
- Tombol `TARIK 10x` mengambil sepuluh Pokemon.
- Hasil pull muncul di kartu utama dengan gambar Pokemon.
- Riwayat pull terakhir muncul di bagian bawah dengan gambar kecil.
- Total pull dan jumlah SSR ikut bertambah otomatis.

## Aturan rarity

- SSR bisa keluar kalau angka random kurang dari `0.03`, atau kalau pity sudah penuh.
- Epic bisa keluar kalau angka random kurang dari `0.10`.
- Rare bisa keluar kalau angka random kurang dari `0.30`.
- Selain itu hasilnya Common.
- Data Pokemon dari API dipakai untuk menampilkan nama, gambar, type, total stat, capture rate, dan status legendary/mythical.

## Random pity

Pity sekarang punya target random dari `7` sampai `12`.
Kalau pity sudah menyentuh target, pull berikutnya dijamin SSR.
Setelah SSR keluar, pity balik ke `0` dan target pity baru akan diacak lagi.

## Cara pakai PokeAPI

- App mengambil jumlah Pokemon dari endpoint `/pokemon?limit=1`.
- Saat pull, app mengambil detail dari `/pokemon/{id}`.
- App juga mengambil species dari `/pokemon-species/{id}` lewat URL species yang diberikan PokeAPI.
- Data disimpan di `localStorage`, jadi Pokemon yang sudah pernah diambil tidak selalu request ulang.
