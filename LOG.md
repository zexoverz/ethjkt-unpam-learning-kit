# Log Perubahan - Misi Hari 1 PokeGacha Simulator

Log ini mencatat seluruh implementasi fitur Pokémon Gacha Simulator pada file [index.html](file:///Users/byasaa/Project/ai-blockchain/ethjkt-unpam-learning-kit/hari-1/index.html) menggunakan **PokeAPI** dan fitur **Randomized Pity Limit** (Batas Pity Acak).

---

## 🛠️ Ringkasan Fitur Baru & Perubahan

### 1. Integrasi PokeAPI & Klasifikasi Rarity (Checkpoint 1)
- Kami menghubungkan aplikasi ke **PokeAPI** (`https://pokeapi.co/api/v2/pokemon?limit=250`) untuk mengambil data dari 250 Pokémon pertama secara dinamis pada saat halaman dimuat.
- Tombol tarikan gacha di-disable secara default selama proses pengambilan data berlangsung untuk mencegah aksi pengguna sebelum data siap.
- Pokémon dikelompokkan ke dalam kategori kelangkaan (rarity) berdasarkan nomor Pokédex (ID) mereka:
  - **SSR (3% - Legendary/Mythical/Pseudo-Legendary)**: Mewtwo, Mew, Lugia, Ho-Oh, Dragonite, Tiga Burung Legendaris, dan Tiga Binatang Legendaris Johto.
  - **Epic (7% - Starter Tahap Akhir & Pokémon Kuat)**: Charizard, Blastoise, Venusaur, Gengar, Gyarados, Alakazam, Machamp, Snorlax, dll.
  - **Rare (20% - Starter Tahap Menengah & Pokémon Terkenal)**: Pikachu, Eevee, Togepi, Dratini, Dragonair, Vaporeon, Jolteon, Flareon, dll.
  - **Common (70% - Pokémon Liar Umum)**: Bulbasaur, Charmander, Squirtle, Caterpie, Weedle, Rattata, Zubat, Magikarp, dll.

### 2. Fitur Batas Pity Acak / Randomized Pity Limit (Checkpoint 2)
Sesuai aturan batas pity yang dirandomisasi:
- Pity limit pertama diinisialisasi secara acak antara **5 hingga 15 tarikan**.
- Setiap kali Anda mendapatkan Pokémon SSR (baik dari keberuntungan 3% atau menabrak batas pity), counter `pity` akan kembali ke `0` dan target pity limit baru akan diacak kembali antara 5 hingga 15.

### 3. Logika Tarikan Gacha (`rollSatu`) (Checkpoint 2)
- Mengembalikan detail Pokémon lengkap yang terdiri dari: `kelas` (rarity), `nama` (nama Pokémon), `id` (Pokédex ID), `image` (URL Artwork Resmi resolusi tinggi), dan `sprite` (URL Sprite Mini untuk riwayat).

### 4. Tampilan & Gambar Resmi (`tampilkan`) (Checkpoint 3)
- Kartu utama kini menampilkan **gambar artwork resmi (Official Artwork)** resolusi tinggi dari PokeAPI alih-alih teks emoji statis.
- Jika gambar belum termuat atau error, aplikasi akan menampilkan emoji Pokéball (`🔴`) sebagai fallback.
- Teknik force reflow (`offsetWidth`) tetap digunakan untuk mereset animasi memutar/bergoyang gacha pada kartu.

### 5. Riwayat Gacha dengan Sprite Mini (Checkpoint 4)
- Bagian riwayat gacha kini menampilkan **sprite gambar mini** dari Pokémon yang berhasil Anda tangkap, lengkap dengan atribut `title` yang memunculkan nama Pokémon beserta kelangkaannya saat kursor diarahkan ke atas chip.

---

## 🧪 Cara Menguji / Menjalankan Aplikasi
1. Buka file [hari-1/index.html](file:///Users/byasaa/Project/ai-blockchain/ethjkt-unpam-learning-kit/hari-1/index.html) menggunakan browser Anda.
2. Tunggu indikator status menampilkan `"Mengambil data Pokémon..."` sampai selesai (status akan hilang dan tombol akan aktif secara otomatis).
3. Jalankan **TARIK 1x** atau **TARIK 10x**.
4. Semua hasil tarikan akan muncul beserta gambar Pokémon resmi dari PokeAPI dan riwayat sprite mini di bawahnya.
