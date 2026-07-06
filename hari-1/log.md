## 2026-07-06 22:40:01 +07:00

- Mengubah `index.html` dari starter TODO menjadi website Pokemon gacha simulator penuh berbasis JavaScript.
- Menggunakan PokeAPI `https://pokeapi.co/api/v2/pokemon/{id}` untuk mengambil nama, tipe, base stats HP/ATK/DEF, sprite kecil, dan official artwork Pokemon.
- Menambahkan sistem rarity common/rare/epic/SSR dengan pity SSR 10 tarikan, counter total, counter SSR, dan riwayat 12 hasil terakhir.
- Menambahkan optimasi loading gambar: cache data Pokemon dengan `Map`, preload/decode gambar kartu utama sebelum reveal, dan sprite kecil lazy-load untuk riwayat.
- Mengubah tampilan menjadi tema gelap ala Pokedex dengan layar kartu, indikator lampu, tombol gacha 1x/10x, dan layout responsif.
- Menambahkan animasi kartu bergerak kiri ke kanan saat gacha berlangsung.
- Menambahkan efek SSR: siluet Pokemon memenuhi layar, kartu bergetar, glow emas, dan background halaman berubah emas sementara.

## 2026-07-06 22:47:58 +07:00

- Memperbaiki loading gambar Pokemon agar tidak berhenti di broken image/placeholder saat official artwork gagal dimuat.
- Menambahkan daftar fallback gambar dari PokeAPI: official artwork, home artwork, dream world, showdown, lalu sprite default.
- Menambahkan preload yang mengembalikan status sukses/gagal sehingga kartu memakai URL gambar pertama yang benar-benar bisa dimuat.
- Menambahkan handler `onerror` untuk kartu utama dan chip riwayat agar otomatis pindah ke fallback atau placeholder SVG lokal.
- Mengganti efek loading gacha menjadi layer `shuffle-lane` berisi beberapa kartu yang slide dari kiri ke kanan selama proses tarik 1x/10x.
