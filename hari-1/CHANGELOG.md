# Catatan Perubahan Hari 1

## Pull gacha + pity

- Tombol `TARIK 1x` sekarang melakukan satu pull.
- Tombol `TARIK 10x` sekarang melakukan sepuluh pull sekaligus.
- Setiap pull memilih hadiah secara acak dari rarity `COMMON`, `RARE`, `EPIC`, atau `SSR`.
- Peluang SSR normal adalah 3%.
- Kalau sudah 10 pull belum dapat SSR, sistem pity otomatis memberi SSR dan menghitung pity dari 0 lagi.
- Hasil terakhir muncul di kartu utama.
- Riwayat 12 pull terakhir muncul di bawah tombol.
- Total pull, jumlah SSR, dan progress pity ikut diperbarui setiap kali pull.

## Pokemon gacha pakai PokeAPI

- Simulator sekarang mengambil data Pokemon asli dari `https://pokeapi.co/api/v2/pokemon/{id}`.
- Setiap rarity punya kumpulan ID Pokemon sendiri: `COMMON`, `RARE`, `EPIC`, dan `SSR`.
- Hasil pull menampilkan nama Pokemon, gambar resmi, tipe, tinggi, dan berat.
- Data Pokemon disimpan di `localStorage` setelah pertama kali dimuat supaya tidak sering request ke PokeAPI.
- Tombol pull masuk mode `LOADING` saat sedang mengambil data dari API.
- Kalau request API gagal, kartu utama menampilkan pesan error sederhana supaya mudah dipahami.
