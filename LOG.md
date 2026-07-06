# Log Perubahan - Misi Hari 1 Gacha Simulator

Log ini mencatat seluruh implementasi fitur Gacha Simulator pada file [index.html](file:///Users/byasaa/Project/ai-blockchain/ethjkt-unpam-learning-kit/hari-1/index.html) dengan tambahan fitur **Randomized Pity Limit** (Batas Pity Acak).

---

## 🛠️ Ringkasan Fitur Baru & Perubahan

### 1. Inisialisasi Data & Variabel State (Checkpoint 1)
- Kami membuat objek `hadiah` yang mengelompokkan item berdasarkan tingkat kelangkaannya:
  - **SSR (Sangat Langka - 3%)**: `1 ETH` 🪙, `Laptop RTX` 💻, `Devcon Ticket` ✈️
  - **Epic (Langka - 7%)**: `Jaket Hoodie ETH` 🧥, `Hardware Wallet` 🔒, `Tiket VIP ETHJKT` 🎟️
  - **Rare (Uncommon - 20%)**: `Kaos ETHJKT` 👕, `Stiker Ethereum` 🏷️, `Buku Solidity` 📘
  - **Common (Biasa - 70%)**: `Garam` 🧂, `Teh Obeng` 🍹, `Indomie` 🍜, `Kopi Saset` ☕
- Kami menambahkan variabel state:
  - `total`: Menghitung total tarikan.
  - `ssrCount`: Menghitung jumlah item SSR yang berhasil didapat.
  - `pity`: Menghitung hitungan tarikan tanpa SSR saat ini.
  - `pityLimit`: Batas tarikan maksimal untuk jaminan (pity) mendapatkan SSR secara gratis.
- Kami menambahkan fungsi `pilihAcak(arr)` untuk mengambil item secara acak dari array kelangkaan.

### 2. Fitur Batas Pity Acak / Randomized Pity Limit (Checkpoint 2)
Sesuai permintaan Anda, batas pity untuk jaminan SSR tidak lagi bernilai tetap (10x), melainkan **diacak secara dinamis**:
- Saat halaman pertama kali dibuka, batas pity diacak antara **5 hingga 15 tarikan**.
- Setiap kali Anda mendapatkan item SSR (baik karena beruntung `acak < 0.03` maupun karena menabrak batas pity), hitungan `pity` akan direset ke `0`, dan **batas pity baru (`pityLimit`) akan diacak kembali antara 5 hingga 15**.
- Ini memberikan elemen kejutan tambahan karena Anda bisa saja dijamin dapat SSR hanya dalam 5 kali tarikan!

### 3. Logika Tarikan Gacha (`rollSatu`) (Checkpoint 2)
Fungsi `rollSatu()` diimplementasikan dengan aturan persentase peluang:
- Jika `pity >= pityLimit` ATAU nilai acak `Math.random() < 0.03` -> Dapat **SSR** (pity direset ke 0, dapat limit pity baru).
- Jika nilai acak di bawah 10% (`< 0.10`) -> Dapat **EPIC**.
- Jika nilai acak di bawah 30% (`< 0.30`) -> Dapat **RARE**.
- Selain itu -> Dapat **COMMON**.

### 4. Tampilan & Animasi Ulang (`tampilkan`) (Checkpoint 3)
- Menampilkan emoji, nama item, dan kelas rarity di elemen kartu utama.
- Menggunakan teknik **Force Reflow (`void card.offsetWidth`)** di JavaScript agar animasi kartu membesar/bergoyang (`reveal` & `glowpulse`) bisa dijalankan ulang setiap kali tombol diklik.
- Mengupdate statistik tarikan (`total`, `ssrCount`) secara dinamis.
- Mengupdate teks indikator pity (`pity / pityLimit`) dan menggerakkan lebar persentase progress bar (`pityFill`) secara presisi.

### 5. Riwayat Tarikan & Event Tombol (Checkpoint 4)
- Fungsi `tambahRiwayat(hasil)` akan membuat elemen bundar (.chip) kecil yang berisi emoji item hasil gacha dan dimasukkan ke bagian paling depan riwayat.
- Riwayat dibatasi maksimal hanya **12 tarikan terakhir** agar tidak merusak tampilan layout.
- Tombol **TARIK 1x**: Menarik satu kali gacha, mengupdate kartu utama, dan menambahkannya ke riwayat.
- Tombol **TARIK 10x**: Menjalankan perulangan gacha sebanyak 10 kali secara beruntun. Seluruh 10 hasil tarikan dimasukkan ke riwayat, dan item ke-10 (tarikan terakhir) akan ditampilkan di kartu utama lengkap dengan animasinya.

---

## 🧪 Cara Menguji / Menjalankan Aplikasi
1. Buka file [hari-1/index.html](file:///Users/byasaa/Project/ai-blockchain/ethjkt-unpam-learning-kit/hari-1/index.html) menggunakan browser Anda (bisa klik kanan -> Open with Chrome / browser pilihan Anda, atau double click filenya).
2. Perhatikan bagian pity bar. Batas pity di sebelah kanan akan menampilkan nilai acak antara 5 hingga 15 (contoh: `0 / 12` atau `0 / 7`).
3. Klik tombol **TARIK 1x** atau **TARIK 10x**.
4. Saat Anda mendapatkan SSR (kartu berwarna emas berkilau), perhatikan bahwa batas pity di sebelah kanan akan langsung berubah menjadi angka acak baru untuk siklus berikutnya!
