# Change Log

## 2026-07-06 - Pull gacha feature

- Menambahkan data hadiah untuk rarity SSR, Epic, Rare, dan Common.
- Menambahkan tombol pull 1x dan pull 10x agar hasil gacha muncul di kartu.
- Menambahkan sistem pity: setiap 10 pull tanpa SSR akan dijamin mendapat SSR.
- Menambahkan riwayat 12 pull terakhir supaya hasil sebelumnya mudah dilihat.

Bahasa mudahnya: sekarang tombol TARIK sudah benar-benar mengacak hadiah. Kalau belum dapat SSR, angka pity naik. Saat pity sampai 10, pull berikutnya otomatis menjadi SSR dan pity kembali ke 0.

## 2026-07-06 - Pokemon gacha dari PokeAPI

- Mengganti desain gacha menjadi tema Pokemon card.
- Mengambil Pokemon random langsung dari PokeAPI saat tombol Pull ditekan.
- Menampilkan gambar official artwork, nama, ID, tipe, HP, Attack, dan Base EXP.
- Mengubah SSR menjadi Shiny SSR dengan pity 10 pull.

Bahasa mudahnya: sekarang aplikasi tidak pakai daftar hadiah manual lagi. Setiap pull akan minta data Pokemon ke PokeAPI, lalu menampilkan Pokemon yang didapat sebagai kartu gacha.
