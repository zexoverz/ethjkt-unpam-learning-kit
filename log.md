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

## 2026-07-07

- Merapikan desain agar terasa seperti dashboard koleksi kartu: warna lebih tenang, border lebih sederhana, panel jelas, dan efek visual dikurangi.
- Menambahkan koleksi kartu unik memakai `Set` berdasarkan ID kartu dari API.
- Menambahkan badge koleksi: First Pull, Binder Start, Deck Builder, Shiny Hunter, Monster Slot, Spell Slot, dan Trap Slot.
- Badge otomatis berubah dari locked ke unlocked setelah syarat koleksi terpenuhi.
- Statistik baru `Koleksi Unik` ikut diperbarui setiap roll.

## 2026-07-07

- Menambah badge koleksi lebih banyak untuk target 25, 50, 100, 250, dan 500 kartu unik.
- Menambah badge progres tarikan untuk 50, 100, dan 250 total pull.
- Menambah badge rarity untuk 3 SSR, 10 SSR, 5 Epic unik, dan 10 Rare unik.
- Menambah badge variasi koleksi untuk Monster/Spell/Trap lengkap, race Dragon/Spellcaster/Warrior/Machine, atribut LIGHT/DARK, dan 4 atribut berbeda.
- Menambahkan helper sederhana untuk menghitung rarity, race, attribute, dan jumlah attribute unik di koleksi.

## 2026-07-07

- Mengubah layout agar kartu hasil gacha menjadi fokus utama dengan ukuran kartu lebih besar dan panel samping lebih ringkas.
- Badge koleksi dipindahkan ke drawer tersembunyi yang dibuka lewat tombol `BADGES x / 27`.
- Tombol badge selalu menampilkan jumlah badge yang sudah terbuka dibanding total badge.
- Visual dibuat lebih sederhana dengan warna netral, border biasa, dan efek dekoratif yang lebih sedikit.

## 2026-07-07

- Mengubah desain gacha menjadi satu kolom dengan kartu gacha di tengah layar.
- Memindahkan tombol `TARIK 1x`, `TARIK 10x`, dan `BADGES` ke area dekat kartu utama.
- Memindahkan riwayat gacha ke bagian bawah layar dan membatasi preview utama menjadi 10 kartu terakhir.
- Menambahkan panel floating untuk melihat semua riwayat gacha dengan area scroll jika hasil sudah banyak.
- Mengubah badge menjadi panel floating scrollable yang dibuka lewat tombol `BADGES`.
- Menambahkan komentar sederhana pada fungsi riwayat dan panel floating agar alur kode lebih mudah dipahami.

## 2026-07-07

- Mengubah statistik `Total Tarik`, `SSR Didapat`, `Koleksi Unik`, dan `Kartu API` menjadi grid 2 baris agar area tengah lebih terisi.
- Membatasi lebar statistik agar sejajar dengan kartu gacha dan tombol utama.
- Mengubah preview riwayat menjadi 10 kartu dalam 2 baris, dengan 5 kartu per baris.
- Membatasi lebar preview riwayat agar tampil lebih rapi di bawah kartu gacha.

## 2026-07-07

- Mengecilkan lebar utama `.app` dari layout besar menjadi container compact agar area kosong kanan-kiri berkurang.
- Menyamakan lebar panel riwayat bawah dengan area kartu, statistik, dan tombol utama.
- Menambahkan penyesuaian mobile supaya container tetap penuh di layar kecil tanpa membuat desktop terlalu lebar.

## 2026-07-07

- Merapikan struktur `hari-1` dengan memisahkan CSS ke `hari-1/css/style.css`.
- Memisahkan JavaScript gacha ke `hari-1/js/app.js` agar `index.html` lebih pendek dan mudah dibaca.
- Mengubah markup utama menjadi lebih semantic memakai `main`, `header`, `section`, `article`, dan `aside`.
- Menambahkan label aksesibilitas sederhana pada area statistik, pity, gacha, riwayat, dan panel floating.
- Membersihkan indentasi file CSS dan JavaScript hasil pemisahan supaya kode lebih rapi.
