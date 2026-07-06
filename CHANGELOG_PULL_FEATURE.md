# Pull Feature Log

Tanggal: 6 Juli 2026

## Yang Dibuat

- Tombol `TARIK 1x` sekarang mengambil 1 hadiah acak.
- Tombol `TARIK 10x` sekarang mengambil 10 hadiah sekaligus.
- Sistem rarity sudah aktif: `COMMON`, `RARE`, `EPIC`, dan `SSR`.
- Pity sudah aktif: kalau belum dapat SSR sampai 10 tarikan, tarikan berikutnya dijamin SSR.
- Total tarikan, jumlah SSR, bar pity, kartu hasil, dan riwayat terakhir otomatis berubah.

## Cara Kerjanya

Setiap klik tombol akan menjalankan fungsi gacha. Kode memilih angka acak dengan `Math.random()`, lalu menentukan rarity hadiah. Kalau SSR muncul, counter pity kembali ke 0.

## Catatan Test

Test dilakukan dengan simulasi DOM memakai Node.js dan `jsdom`. Hasilnya: tombol 1x dan 10x bisa diklik, total tarikan bertambah, riwayat muncul, dan batas riwayat tetap maksimal 12 item.

## Rencana Upgrade Pokemon

Sumber data akan pindah ke PokéAPI:

- `/pokemon/{id}` dipakai untuk sprite, tipe, ability, tinggi, berat, dan base stats.
- `/pokemon-species/{id}` dipakai untuk status legendary/mythical, capture rate, flavor text, genus, dan generasi.
- Data API akan disimpan di cache browser supaya klik berikutnya tidak selalu request ulang.
- Rarity gacha akan dihitung dari data species: mythical/legendary jadi paling langka, capture rate rendah jadi lebih spesial, sisanya mengikuti peluang gacha biasa.

## Hasil Upgrade Pokemon

- Simulator sekarang memakai data asli dari PokeAPI.
- Setiap pull mengambil data dari dua endpoint: detail Pokemon dan species Pokemon.
- Kartu hasil menampilkan sprite resmi, nomor dex, nama, rarity, tipe, flavor text, generasi, capture rate, ability, dan stat bar.
- Tombol `Pull 1x` dan `Pull 10x` tetap ada, tapi sekarang hasilnya Pokemon asli.
- Pity berubah menjadi `20` pull supaya SSR terasa lebih langka.
- Browser menyimpan data PokeAPI di `localStorage`, jadi Pokemon yang sama tidak perlu di-download berulang kali.
- Riwayat pull sekarang berisi sprite kecil dan nama Pokemon.

## Test Upgrade Pokemon

- Test mock API dengan Node.js: lulus.
- Test live API untuk `/pokemon/25` dan `/pokemon-species/25`: lulus.
