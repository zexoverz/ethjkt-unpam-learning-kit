# Gacha API Changelog

Dokumen ini menjelaskan perubahan utama pada sistem gacha di `hari-1`, yang awalnya hanya memakai logika lokal di `index.html`, lalu dipindahkan ke file JavaScript terpisah dan dihubungkan ke API Genshin yang sebenarnya.

## Perubahan Utama

Tampilan aplikasi sekarang memakai tema sederhana biru, hitam, dan putih dengan konteks `Genshin Wish`.

Data karakter diambil dari `https://genshin.jmp.blue/characters/all?lang=en`, lalu semua karakter dari API dimasukkan ke sistem gacha sebagai pool `ssr` dan `epic`.

Gambar karakter diambil dari endpoint gambar milik API, misalnya `icon-big`, sehingga kartu hasil wish bisa menampilkan visual karakter, bukan hanya teks.

Saat API gagal dimuat, aplikasi tetap berjalan memakai fallback lokal supaya tombol wish dan riwayat tidak rusak.

## Fungsi Yang Dipakai

`fetchCharacterDetails()` mengambil detail semua karakter dari endpoint `/characters/all?lang=en`.

`fetchCharacterIds()` mengambil daftar ID karakter resmi dari endpoint `/characters`.

`getApiArray()` dipakai sebagai parser aman karena response API bisa berupa array langsung atau wrapper yang berisi properti `value`.

`normalizeCharacters()` mengubah data API menjadi pool gacha yang bisa dipakai aplikasi.

`addCharacterToPool()` menaruh karakter ke pool `ssr` atau `epic` berdasarkan rarity, lalu menambahkan URL gambar karakter.

`getCharacterImageUrl()` dan `slugifyCharacterName()` dipakai untuk membentuk URL gambar yang valid dari nama karakter.

`pull(times)` menjalankan wish satu kali atau banyak kali, lalu memperbarui kartu hasil dan riwayat.

`runPullTest(10)` dipakai untuk tes cepat bahwa 10 wish berjalan benar.

`getPoolSummary()` dipakai untuk melihat jumlah karakter di tiap pool saat debugging.

`ready` dipakai untuk menunggu proses loading API selesai sebelum tombol wish aktif.

## Hasil Akhir

Sistem gacha sekarang sudah memakai semua karakter dari API, punya gambar karakter, tetap punya fallback kalau API gagal, dan sudah dites minimal 10 kali sebelum diserahkan.
