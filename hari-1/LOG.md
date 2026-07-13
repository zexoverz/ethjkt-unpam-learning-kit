# Log Hari 1 — Poké Gacha (Simulator Gacha Pokémon)

Penjelasan santai soal isi `index.html`. Sekarang gacha-nya menarik
**Pokémon asli** langsung dari internet (PokeAPI), lengkap dengan gambar,
tipe, dan statistik betulan.

---

## 🚀 Pembaruan Hari 1: Premium Upgrade (Fitur & Estetika Premium)

Hari ini kita melakukan upgrade besar-besaran untuk mengubah Poké Gacha dari simulator sederhana menjadi sebuah aplikasi web statis satu halaman yang premium, interaktif, responsif, dan kaya fitur dengan tetap mempertahankan kompatibilitas penuh dengan sistem rarity, pity, dan PokeAPI bawaan.

### 🌟 Ringkasan Fitur Baru
1. **Sistem Koleksi Permanen (localStorage)**: Pokémon yang ditarik secara otomatis disimpan secara permanen di browser. Duplikat ditumpuk dengan penanda jumlah (`×Count`) dan status Shiny dipertahankan secara unik.
2. **Indikator Kemajuan Pokédex**: Progress bar kemajuan koleksi (out of 1025 Pokémon National Dex) dengan kalkulasi persentase real-time yang presisi.
3. **Penyaringan & Pencarian Koleksi**: Kotak pencarian dinamis (berdasarkan nama atau nomor ID dex) dan filter rarity dropdown (Semua Rarity, Common, Rare, Epic, SSR, dan Hanya Shiny).
4. **Dasbor Statistik Detak Gacha**:
   - Total Tarikan
   - Jumlah SSR (Legendary/Mythical)
   - Jumlah Shiny
   - Pity Saat Ini
   - Persentase Peluang Sukses SSR Rata-rata (SSR Rate)
5. **Panel Riwayat Detail dengan Stempel Waktu (Timestamp)**: Riwayat lengkap gulungan terperinci dalam daftar gulir vertikal yang dilengkapi dengan penunjuk waktu (HH:MM:SS), warna tier rarity, penanda shiny, serta tombol "Hapus" untuk mereset log.
6. **Sintesis Efek Suara Mandiri (Web Audio API)**: Sound engine internal retro yang bekerja 100% offline tanpa berkas eksternal (Suara tombol, getaran Pokeball, melodi reveal rarity, kelap-kelip shiny, dan lagu penobatan badge/recap). Dilengkapi dengan tombol mute/unmute.
7. **Mode Gelap/Terang (Dark/Light Mode)**: Mengadaptasi warna layar Pokédex, latar belakang, dan grid selaras dengan preferensi sistem yang disimpan di browser.
8. **Animasi Gulir Pokeball & Efek Partikel Kanvas**:
   - Tarikan 1x memicu animasi berguling Pokeball (3 kali kocokan) dengan suara ketukan rhythmic sebelum meledak memancarkan isi.
   - Efek partikel Canvas dinamis (percikan bintang emas untuk SSR/Shiny, gelembung ungu untuk Epic, kilauan biru untuk Rare).
   - Efek conic-gradient berputar di belakang kartu SSR, pulse cahaya, serta efek shimmer perak/emas untuk Pokémon Shiny.
9. **Modal Rekap 10x Tarikan**: Menampilkan rangkuman tarikan 10x sekaligus dalam grid 2x5 yang elegan dengan suara kemenangan retro.
10. **Modal Inspeksi Detil Pokémon**: Pengguna dapat mengklik kartu di riwayat maupun sel Pokédex untuk membuka modal info. Menampilkan artwork beresolusi tinggi, bar status lengkap, dan tombol toggle untuk melihat varian Shiny secara interaktif jika telah diperoleh.
11. **Penanganan API Failures Graceful**: Jika PokeAPI mengalami gangguan atau tanpa internet, sebuah kartu error overlay akan muncul dengan pesan bersahabat dan tombol "Coba Lagi" (Retry) yang menargetkan ulang ID roll terakhir.
12. **Aksesibilitas & WAI-ARIA**: Tab navigasi mendukung keyboard navigation (panah kiri/kanan), status `aria-selected` yang diperbarui secara dinamis, dan kerangka focus outline.

---

### 🛠️ Implementasi Teknis & Arsitektur

#### 1. Sintesis Suara Mandiri (Web Audio API)
Menghindari ketergantungan pada berkas `.mp3` atau `.wav` eksternal yang lambat dimuat dan rawan kegagalan unduhan. Audio disintesis secara real-time dengan memodulasi frekuensi dan gain menggunakan OscillatorNode dan GainNode:
- **SSR Reveal**: Akord fanfare megah (C4 -> E4 -> G4 -> C5) berurutan 100ms.
- **Shiny Sparkle**: Kluster frekuensi tinggi (1300Hz - 2200Hz) berjarak pendek menghasilkan suara gemerincing logam magis.

#### 2. Canvas Particle Engine
Visual rendering dioptimalkan menggunakan elemen `<canvas>` 2D yang menimpa kartu. Partikel dimutakhirkan dalam loop `requestAnimationFrame` dengan vektor gerak, gravitasi mikro, peluruhan alfa, serta bentuk geometris bintang/lingkaran menyesuaikan rarity. Loop animasi dihentikan dengan `cancelAnimationFrame` secara disiplin saat efek selesai untuk menghemat penggunaan CPU/GPU.

#### 3. Caching & Optimasi DOM
- Pencarian dan filter koleksi diproses langsung di memori melalui `Object.values(collection)` dan di-render malas (`lazy loading` untuk gambar) untuk meminimalkan beban rendering browser.
- Data PokeAPI digabungkan menggunakan `Promise.all` dan disimpan di memori `cache` Map untuk mempercepat tarikan duplikat tanpa melakukan request HTTP tambahan.

#### 4. Penanganan Kegagalan Jaringan
Menyimpan state `lastFailedRoll` berisi `{ id, kelas }` ketika error terdeteksi. Tombol "Coba Lagi" secara langsung meneruskan state ini ke fungsi `pull()`, melompati generator rarity agar pengguna dijamin mendapatkan Pokémon yang gagal didapat sebelumnya tanpa kehilangan pity progress.

---

### 🎨 Peningkatan Pengalaman Pengguna (UX)
- **Visual WOW**: Transisi mulus, bayangan dalam (shadow-lg), gradasi warna modern ala kartu Pokémon premium, hover berskala mikro pada tombol, dan transisi transparan kaca (glassmorphism).
- **Inspeksi Koleksi**: Memberikan kedalaman permainan di mana pengguna tidak sekadar mengumpulkan angka, tetapi dapat memutar detail statistik dari koleksi mereka.
- **Dukungan Mobile**: Skala grid secara adaptif berubah menjadi 2 kolom di layar HP dengan margin yang disesuaikan agar pas di genggaman satu tangan.

---

### 🧪 Pengujian yang Dilakukan (Testing Performed)
- **Validasi Aliran Data & Cache**: Terbukti tarikan duplikat mengambil gambar instan dari cache memori local tanpa delay jaringan.
- **Skenario Offline**: Mensimulasikan pemutusan jaringan (DevTools Network Offline). Kartu error muncul seketika, dan setelah koneksi dipulihkan, tombol "Coba Lagi" berhasil me-retrieve Pokémon tersebut tanpa membuang tarikan pity baru.
- **Uji Kebocoran Memori Audio/Canvas**: Memastikan loop partikel berhenti sepenuhnya ketika modal ditutup dan AudioContext ditangguhkan dengan benar.
- **Uji Aksesibilitas**: Memverifikasi navigasi tab gacha, koleksi, dan badge sepenuhnya dapat dikontrol menggunakan tombol keyboard tab dan tanda panah.

---

### 📂 Berkas yang Dimodifikasi
- [index.html](file:///C:/Users/Dika%20Rahmat%20Fadillah/OneDrive/Kuliah/Adelya%20Revalina/ethjkt-unpam-learning-kit/hari-1/index.html): Menambahkan modal recap, modal inspeksi detail, bar penyaringan koleksi, canvas efek, bar kontrol suara/tema, dan atribut ARIA.
- [styles.css](file:///C:/Users/Dika%20Rahmat%20Fadillah/OneDrive/Kuliah/Adelya%20Revalina/ethjkt-unpam-learning-kit/hari-1/styles.css): Desain ulang total dengan CSS variables, dark/light theme tokens, Google Font Outfit, animasi conic-gradient, star shimmer, dan media query seluler. Memperbaiki selector `.recap-modal[hidden]` untuk mengatasi regresi modal 10x.
- [app.js](file:///C:/Users/Dika%20Rahmat%20Fadillah/OneDrive/Kuliah/Adelya%20Revalina/ethjkt-unpam-learning-kit/hari-1/app.js): Menulis ulang logika pengontrol gacha dengan sound synthesizer, canvas particles, penanganan status retry kegagalan API, serta sinkronisasi penelusuran koleksi. Menambahkan focus reset ke tombol PULL 10x saat modal rekap ditutup.
- [LOG.md](file:///C:/Users/Dika%20Rahmat%20Fadillah/OneDrive/Kuliah/Adelya%20Revalina/ethjkt-unpam-learning-kit/hari-1/LOG.md): Memperbarui dokumentasi kemajuan proyek hari ini.

---

## 🐛 Perbaikan Bug (Bug Fixes)

### 1. Regresi Tombol "Lanjut" (Continue) Pada Modal Rekap 10x Tarikan
* **Masalah**: Tombol "Lanjut" di dalam modal rekap 10x tarikan (`#recapModal`) tampak seolah tidak berfungsi saat diklik, sehingga modal terus menutupi antarmuka aplikasi.
* **Penyebab Utama (Root Cause)**: Di dalam [styles.css](file:///C:/Users/Dika%20Rahmat%20Fadillah/OneDrive/Kuliah/Adelya%20Revalina/ethjkt-unpam-learning-kit/hari-1/styles.css), selector `.recap-modal` mendefinisikan properti `display: flex;`. Properti ini memiliki spesifisitas CSS (class selector, bobot 10) yang mengabaikan aturan bawaan browser `[hidden] { display: none; }` (attribute selector bawaan, bobot 1). Karena tidak ada selector penimpa seperti `.recap-modal[hidden] { display: none !important; }` di stylesheet, browser tetap merender modal sebagai `display: flex` meskipun properti DOM `.hidden` telah diubah menjadi `true` di JavaScript.
* **Solusi**:
  - Menambahkan selector `.recap-modal[hidden]` ke dalam blok CSS `display: none !important;` di [styles.css](file:///C:/Users/Dika%20Rahmat%20Fadillah/OneDrive/Kuliah/Adelya%20Revalina/ethjkt-unpam-learning-kit/hari-1/styles.css) (sebaris dengan `.modal[hidden]`). Hal ini memaksa modal untuk menghilang ketika atribut `hidden` dipasang.
  - Memodifikasi fungsi `closeRecapModal()` di [app.js](file:///C:/Users/Dika%20Rahmat%20Fadillah/OneDrive/Kuliah/Adelya%20Revalina/ethjkt-unpam-learning-kit/hari-1/app.js) untuk mengembalikan fokus keyboard (`focus()`) secara eksplisit ke tombol "PULL 10x" (`el.tarik10`) setelah modal ditutup demi kelancaran aksesibilitas pengguna.

### 2. Tumpang Tindih State Sukses/Gagal & Kondisi Balap (Race Conditions)
* **Masalah**: Kartu error "Gagal memuat Pokémon" kadang muncul berbarengan dengan Pokémon sukses, atau data lama tetap menggantung di belakang penampang error.
* **Penyebab Utama (Root Cause)**:
  - State UI (Loading, Sukses, Error) dikontrol secara ad-hoc menggunakan fungsi penolong terpisah (`setLoading` dan `showErrorCard`). Hal ini menyebabkan elemen-elemen DOM lama tidak dibersihkan secara mutlak ketika terjadi transisi (misalnya kegagalan tidak menyembunyikan sprite lama, dan kesuksesan tidak menyembunyikan panel error).
  - Terdapat celah kondisi balap (race conditions) di mana tombol PULL diaktifkan kembali selama jeda 150ms di dalam perulangan 10x Pull. Hal ini memungkinkan pengguna mengklik tombol secara beruntun, memulai beberapa permintaan gacha paralel secara asinkron yang saling menimpa satu sama lain.
* **Solusi**:
  - **State Machine Terpusat**: Mengimplementasikan fungsi `transitionTo(state, data)` yang mengontrol 4 status eksklusif secara mutlak: `idle`, `loading`, `success`, dan `error`. Transisi ke status baru menjamin pembersihan bersih (reset sprite, stat, label tipe, dan panel error) dari status sebelumnya.
  - **Pencegahan Race Condition**: Menambahkan penghitung permintaan monoton `activeRequestId`. Setiap kali tarikan dipanggil, id ini dinaikkan. Resolusi janji asinkron (fetch) akan membandingkan `reqId` lokal dengan `activeRequestId` global; jika tidak cocok (karena ada tarikan baru), respon lama langsung dibuang.
  - **Penguncian Tombol yang Ketat**: Memastikan tombol PULL tetap terkunci (`disabled = true`) di sepanjang perulangan 10x Pull termasuk selama masa jeda `sleep(150)`, mencegah klik ganda secara mutlak.

---

### 📈 Riwayat Commit (Terbaru)
1. `feat: redesign gacha UI shell + local rarity/pity engine`
2. `feat: fetch real Pokémon from PokeAPI with caching + async pulls`
3. `feat: add type badges, base-stat bars, and shiny variants`
4. `docs: update LOG.md for Pokémon gacha`
5. `feat: implement dark mode, sound engine, and persistent storage`
6. `feat: add canvas particle effects, 10x recap, and inspect modal`
7. `feat: add collection filters, dex progress tracker, and keyboard accessibility`
8. `fix: implement api failure grace cards and retry button`
9. `docs: update LOG.md to document premium upgrades`
10. `fix: resolve 10x pull recap modal visibility regression and add accessibility focus reset`
11. `fix: refactor UI state management into a strict state machine and resolve race conditions`
