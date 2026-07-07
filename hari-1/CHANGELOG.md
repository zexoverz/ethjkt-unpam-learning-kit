# Hari 1 Change Log

## Gacha pull feature

- Menambahkan data hadiah untuk rarity SSR, Epic, Rare, dan Common.
- Menambahkan tombol `TARIK 1x` dan `TARIK 10x` agar benar-benar melakukan pull.
- Menambahkan sistem pity: kalau belum dapat SSR, pull ke-10 pasti SSR.
- Menampilkan hasil pull di kartu utama, termasuk animasi dan warna rarity.
- Menampilkan total pull, jumlah SSR, progress pity, dan riwayat 12 pull terakhir.

## Pokemon PokeAPI upgrade

- Mengubah simulator menjadi Pokemon gacha dengan data dari `https://pokeapi.co/`.
- Setiap pull mengambil data Pokemon dari endpoint `pokemon`, lalu mengambil detail tambahan dari `pokemon-species`.
- Data yang digabungkan: nama, nomor Pokedex, gambar official artwork, type, genus, flavor text, capture rate, dan status legendary/mythical.
- Rarity masih memakai peluang gacha, tapi data species bisa menaikkan rarity kalau Pokemon termasuk legendary, mythical, baby, atau capture rate rendah.
- Sistem pity tetap ada: jika belum mendapat SSR, pull ke-10 memilih Pokemon dari pool legendary/mythical.
- Riwayat pull sekarang menampilkan sprite Pokemon, bukan emoji manual.
