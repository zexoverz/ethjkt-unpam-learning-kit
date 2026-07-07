# Pokemon Gacha Log

## Apa yang berubah

Simulator sekarang memakai data Pokemon asli dari PokeAPI di `hari-1/index.html`.

Saat user menekan `PULL 1x` atau `PULL 10x`, browser mengambil data dari:

- `/pokemon-species/{id}` untuk nama species, status legendary/mythical, capture rate, dan default variety.
- `/pokemon/{name-or-id}` dari default variety untuk sprite, tipe, base experience, dan stats.
- `/pokemon-species?limit=1` untuk membaca jumlah species terbaru.

## Aturan rarity

- `Legendary`: species punya `is_legendary` atau `is_mythical`.
- `Epic`: capture rate kecil atau total base stat tinggi.
- `Rare`: capture rate sedang atau base experience cukup tinggi.
- `Common`: sisanya.

## Aturan pity

- Setiap pull menaikkan pity.
- Kalau pull biasa dapat Legendary/Mythical, pity kembali ke 0.
- Kalau pity mencapai 10, pull berikutnya dipaksa mengambil species Legendary/Mythical dari daftar ID.

## Catatan teknis

- Response API disimpan di cache memory agar Pokemon yang sama tidak diminta berkali-kali.
- Tombol dinonaktifkan saat fetch berjalan supaya user tidak menumpuk request.
- Kalau PokeAPI gagal diakses, UI menampilkan pesan gagal dan user bisa mencoba lagi.
- Dokumentasi API: https://pokeapi.co/docs/v2
