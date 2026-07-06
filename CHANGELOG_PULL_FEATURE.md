# Pull Feature Log

## Apa yang dibuat

Saya menambahkan fitur pull/tarik gacha di `hari-1/index.html`.

Sekarang tombol `TARIK 1x` dan `TARIK 10x` sudah berjalan. Setiap tarikan akan memilih hadiah secara acak dari rarity `COMMON`, `RARE`, `EPIC`, atau `SSR`.

## Aturan pity

- Setiap tarikan menambah angka pity.
- SSR punya peluang acak 3%.
- Kalau belum dapat SSR sampai pity ke-10, tarikan itu pasti menjadi SSR.
- Setelah dapat SSR, pity kembali ke 0.

## Tampilan hasil

- Kartu utama menampilkan emoji, nama hadiah, dan rarity.
- Total tarikan dan jumlah SSR ikut berubah.
- Bar pity ikut terisi sesuai jumlah pity sekarang.
- Riwayat 12 tarikan terakhir muncul di bawah tombol.

## Catatan kode

Kode dibuat dalam fungsi kecil agar mudah dibaca:

- `pilihAcak()` memilih item random dari daftar.
- `rollSatu()` menjalankan aturan gacha dan pity.
- `tampilkan()` memperbarui kartu, angka statistik, dan bar pity.
- `tambahRiwayat()` menambahkan hasil ke riwayat.
- `tarik()` menjalankan tarikan 1x atau 10x.
