# Hari 1 Change Log

## Gacha pull feature

- Menambahkan tombol `TARIK 1x` dan `TARIK 10x` agar benar-benar menjalankan gacha.
- Menambahkan rarity `SSR`, `EPIC`, `RARE`, dan `COMMON` dengan peluang acak.
- Menambahkan sistem pity random: target SSR dijamin diacak dari 8 sampai 12 pull setiap kali SSR keluar.
- Menampilkan hasil terakhir, total tarikan, jumlah SSR, progress pity, dan riwayat 12 hasil terakhir.

## Pokemon gacha redesign

- Mengubah simulator menjadi Pokemon gacha yang mengambil data dari `https://pokeapi.co`.
- Menggabungkan data dari endpoint `pokemon` dan `pokemon-species` supaya kartu punya artwork, type, ability, total stat, genus, dan teks Pokedex.
- Menambahkan cache di browser memakai `localStorage`, mengikuti saran PokeAPI supaya aplikasi tidak terlalu sering request data yang sama.
- Merapikan tampilan agar terasa seperti kartu Pokemon, bukan daftar hadiah placeholder.
- Commit berikutnya memakai format Conventional Commits, contoh: `feat(hari-1): add pokemon gacha simulator`.

## 429 rate-limit fix

- `PULL 10x` sekarang hanya mengambil detail lengkap untuk kartu terakhir, bukan 10 Pokemon sekaligus.
- Riwayat tetap mencatat 10 hasil, tapi memakai nomor Pokedex dan rarity agar tidak membebani API/CDN.
- Kartu utama punya fallback ke sprite kecil. Jika gambar tetap ditolak CDN, aplikasi menampilkan placeholder `?`.
- Jika API mengembalikan `429`, aplikasi menampilkan pesan yang lebih jelas: tunggu sebentar lalu coba `PULL 1x`.

## Image fallback improvement

- Jika artwork dan sprite dari CDN tidak bisa dimuat, kartu sekarang menampilkan badge lokal berbasis nama dan type Pokemon.
- Ini membuat area gambar tetap terlihat rapi walaupun CDN sedang rate limit.

## Image always visible

- Kartu sekarang mulai dari gambar SVG lokal, jadi area art selalu punya image yang tampil.
- Kalau remote artwork berhasil dimuat, browser bisa menukarnya ke gambar asli.

## Real image source

- Gambar utama sekarang mengambil artwork resmi dari host Pokemon, bukan dari sprite CDN GitHub.
- Kalau host itu gagal, kartu tetap menampilkan fallback lokal supaya layout tidak kosong.
