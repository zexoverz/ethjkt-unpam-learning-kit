# Catatan Perubahan Hari 1

## Perubahan

- Menambahkan logika prize gacha ke `index.html`.
- Menambahkan data hadiah untuk rarity `SSR`, `Epic`, `Rare`, dan `Common`.
- Menambahkan sistem peluang:
  - SSR: 3% atau pasti saat pity mencapai 10 tarikan.
  - Epic: sampai ambang 10%.
  - Rare: sampai ambang 30%.
  - Common: hasil default.
- Menambahkan penghitung total tarikan, jumlah SSR, progress pity, animasi kartu, dan riwayat 12 tarikan terakhir.
- Menambahkan daftar hadiah di bawah riwayat agar semua prize yang mungkin didapat terlihat.

## Catatan Testing

- Runtime smoke test lewat Node berhasil.
- Yang dicek:
  - Daftar hadiah berisi 12 item.
  - Tombol `TARIK 1x` menambah total menjadi 1.
  - Tombol `TARIK 10x` menambah total menjadi 11.
  - Riwayat tarikan terisi 11 chip.
  - Nilai pity tetap dalam rentang 0 sampai 9 setelah tarikan.
