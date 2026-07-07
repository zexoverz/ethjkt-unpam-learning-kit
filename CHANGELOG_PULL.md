# Pull Feature Log

Tanggal: 7 Juli 2026

## Yang ditambahkan

- Sistem gacha sekarang memakai Pokemon dari PokeAPI.
- Tombol `TARIK 1x` mengambil satu Pokemon acak.
- Tombol `TARIK 10x` mengambil sepuluh Pokemon acak.
- Hasil pull muncul di kartu utama, lengkap dengan gambar, nama Pokemon, nomor Pokedex, tipe, dan rarity.
- Riwayat pull terakhir muncul sebagai chip kecil dengan gambar Pokemon.
- Sistem pity dibuat: kalau sudah 10 pull tanpa SSR, pull berikutnya dijamin SSR.
- Kalau gambar Pokemon dari satu sumber gagal, kode mencoba sumber gambar lain.
- Kalau semua gambar gagal atau kosong, kartu menampilkan inisial Pokemon supaya tidak terlihat rusak.

## Aturan peluang

- SSR: 3% atau pasti saat pity mencapai 10.
- Epic: 7%.
- Rare: 20%.
- Common: sisanya.

## Cara cek

Buka `hari-1/index.html` di browser, lalu klik `TARIK 1x` atau `TARIK 10x`.
