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

## Perubahan Lanjutan - One Piece Character Gacha

- Mengubah tema dari prize gacha ETHJKT menjadi One Piece character gacha.
- Mengambil character pool dari `https://www.onepieceapi.com/api/characters` setelah endpoint awal redirect dari `https://onepieceapi.com/api/characters`.
- Menambahkan fallback karakter lokal jika API gagal dimuat.
- Mengubah kartu hasil gacha agar menampilkan:
  - Nama karakter.
  - Rarity berdasarkan bounty.
  - Bounty, status, tinggi badan, dan blood type.
  - Initial avatar jika API tidak menyediakan gambar.
- Mengubah rarity menjadi:
  - `Legend` untuk bounty minimal 1.000.000.000.
  - `Yonko Tier` untuk bounty minimal 500.000.000.
  - `Supernova` untuk bounty minimal 100.000.000.
  - `Crewmate` untuk karakter tanpa bounty besar.
- Mempertahankan sistem pity 10 tarikan untuk hasil `Legend`.
- Memodernisasi UI menjadi layout dashboard dua kolom dengan glass panel, kartu karakter besar, stats, history, dan daftar character pool.

## Perubahan API — Beralih ke api.api-onepiece.com

- Mengganti API dari `https://www.onepieceapi.com/api/characters` (65 karakter, tanpa gambar) ke `https://api.api-onepiece.com/v2/characters/en` (786 karakter, lebih lengkap).
- Struktur data baru:
  - `name` langsung string (tidak perlu `name.en`).
  - `bounty` berupa string terformat seperti `"3.000.000.000"`, di-parse dengan `parseInt(replace(/\./g, ''))`.
  - `size` berupa string seperti `"174cm"`, di-parse untuk ambil angka.
  - Tidak ada `blood_type`, diganti dengan `job` dan `crew.name`.
  - `status` berupa string seperti `"vivant"` / `"living"`.
- Semua fungsi (`getName`, `getBounty`, `getSize`, `showResult`, dll) disesuaikan dengan format baru.
- Fallback karakter lokal juga diperbarui mengikuti struktur API baru.

## Perubahan Lanjutan - Modern UI + Character Images + Rare Effects

- **Character Images**: Karena API One Piece tidak menyediakan gambar (`image_url: null`), gambar karakter diambil dari One Piece Fandom Wiki via MediaWiki API JSONP (`onepiece.fandom.com/api.php`). Hasil dicache di memori agar tidak fetching ulang.
- **UI Modern**:
  - Animated gradient background dengan efek bintang.
  - Desain kartu bergaya bounty poster WANTED.
  - Glassmorphism panel dengan backdrop-filter.
  - Stats bar dengan accent gradient.
  - Gradient text untuk judul dan nama karakter Legend.
- **Special Effects berdasarkan Rarity**:
  - **Legend (SSR)**: Golden confetti rain + screen flash + card shake + golden glow pulse + gradien emas pada nama.
  - **Yonko Tier (Epic)**: Red confetti + screen flash + red pulse glow + card shake.
  - **Supernova (Rare)**: Blue confetti + shimmer glow.
  - **Crewmate (Common)**: Reveal animation standar.
- **Konfeti System**: Canvas-based particle system dengan bentuk rect dan circle, colors sesuai rarity.
- **Image Fallback**: Jika gambar gagal dimuat atau tidak ditemukan di Wiki, avatar menampilkan initials dengan background gelap.

## Catatan Testing Lanjutan

- API One Piece berhasil dicek lewat `curl.exe -L https://onepieceapi.com/api/characters`.
- Response API berupa array character dengan field seperti `name.en`, `status`, `height`, `blood_type`, `image_url`, dan `bounties`.
- Header API tidak menampilkan `Access-Control-Allow-Origin`, tapi fetch tetap berhasil karena tidak butuh CORS (GET biasa).
- Gambar karakter dari Fandom Wiki menggunakan JSONP (`callback=`) untuk bypass CORS — tested via curl dengan parameter `&callback=x` berhasil.
## Fix: Image loading untuk semua karakter

- **Bug fixed**: Regex `name.replace(/[^a-zA-Z0-9 ]/g, "")` sebelumnya menghapus titik pada nama seperti "Monkey D. Luffy" menjadi "Monkey D Luffy", menyebabkan Wiki API tidak menemukan halaman. Sekarang nama dikirim apa adanya tanpa sanitasi berlebihan.
- **Search fallback**: Jika pencarian judul eksak gagal (`pageid === -1`), sistem otomatis melakukan `generator=search` untuk mencari halaman Wiki yang cocok (contoh: "Saint Marcus Mars" → ditemukan sebagai "Marcus Mars").
- **Pre-fetch queue**: Semua gambar karakter di-pre-fetch di background setelah API dimuat (1 request per 400ms) agar saat ditarik gambarnya sudah siap.
- **Bug fixed**: Variabel `rarity` di `animateConfetti()` sebelumnya undefined (scope error), sekarang menggunakan `currentConfettiRarity` global.
- **Image cache**: Hasil lookup dicache di memori agar tidak memanggil API berulang untuk karakter yang sama.

## Catatan Testing Lanjutan

- Runtime smoke test lewat Node dengan mocked API berhasil.
- Yang dicek:
  - Character pool dari API berisi banyak item.
  - Tombol aktif setelah data selesai dimuat.
  - Tombol `Tarik 1x` menambah total menjadi 1.
  - Tombol `Tarik 10x` menambah total menjadi 11.
  - Riwayat dibatasi maksimal 8 item.
  - Nilai pity tetap dalam rentang 0 sampai 9.
  - Kartu hasil selalu menampilkan nama karakter.
  - Konfeti dan flash muncul sesuai rarity.
  - Gambar karakter muncul setelah fetch JSONP selesai.
  - Karakter tanpa halaman Wiki eksak tetap dapat gambar via search fallback.
  - Semua gambar di-pre-fetch di background setelah halaman dimuat.
