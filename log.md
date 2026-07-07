# Log

## 2026-07-07

- Mengaktifkan logika gacha di `hari-1/index.html`.
- Rarity memakai aturan: SSR jika pity sudah 10 atau peluang acak di bawah 3%, Epic di bawah 10%, Rare di bawah 30%, selain itu Common.
- Pity bertambah setiap tarikan dan reset ke 0 saat mendapat SSR.
- Tombol `TARIK 1x` menjalankan satu roll, tombol `TARIK 10x` menjalankan sepuluh roll.
- Tampilan kartu, total tarik, jumlah SSR, progress pity, dan 12 riwayat terakhir selalu diperbarui setelah roll.

## 2026-07-07

- Mengubah gacha menjadi Yu-Gi-Oh! Card Gacha memakai YGOPRODeck API v7: `https://db.ygoprodeck.com/api/v7/cardinfo.php?format=tcg&misc=yes`.
- API dipanggil satu kali saat halaman dibuka, lalu hasilnya disimpan di memori untuk menghindari request berulang.
- Rarity gacha diambil dari `card_sets.set_rarity`: collector/ghost/ultimate/prismatic/quarter century menjadi SSR, secret/ultra/platinum/gold menjadi Epic, super/rare menjadi Rare, sisanya Common.
- Logika pity tetap sama: SSR dipaksa pada pity ke-10 atau peluang acak SSR 3%, lalu pity reset ke 0.
- Tampilan kartu sekarang memakai gambar kartu, nama, rarity, tipe, race, attribute, deskripsi singkat, statistik, dan riwayat gambar kartu.
