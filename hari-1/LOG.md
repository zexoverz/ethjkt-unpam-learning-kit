# Log Hari 1 — GT Gacha (Simulator Gacha Guardian Tales)

Penjelasan santai tentang implementasi gacha simulator **Guardian Tales** menggunakan data asli dari API public `gtales.top`. Semua aset dan logika terintegrasi dalam folder `hari-1` tanpa menambah file baru di luar berkas bawaan.

## Apa yang Baru & Berubah dari Poké Gacha?

1. **Migrasi Data ke Guardian Tales**:
   - Simulator beralih dari Pokémon ke Guardian Tales.
   - Mengambil data dari public API `gtales.top` (heroes list & hero details).
   - Seluruh data 168 hero lengkap dengan elemen, role, dan senjata tanda tangan (signature weapon) dikompilasi secara lokal ke dalam `HEROES_DB` di `app.js` agar web berjalan instan, responsif, dan bebas dari isu CORS serta batas rate-limiting (HTTP 429).

2. **Mekanisme Gacha Akurat**:
   - **Hero Summon**:
     - 3-Star (Unique Hero): **2.75%** (Rate-up hero utama: 1.375%).
     - 2-Star (Rare Hero): **19.00%**.
     - 1-Star (Normal Hero): **78.25%**.
   - **Weapon Summon**:
     - 5-Star Exclusive Weapon: **3.00%** (Rate-up weapon utama: 1.00%).
     - 4-Star Legend Weapon: **9.00%**.
     - Normal Equipment: **88.00%** (menggunakan nama-nama senjata generik seperti Bastard Sword, Magician Staff, dll).

3. **Sistem Garansi (Soft Pity)**:
   - Jika sampai tarikan ke-30 belum mendapatkan Bintang 3 (untuk banner hero) atau Bintang 5 Eksklusif (untuk banner senjata), tarikan ke-30 dijamin memberikan hadiah tier tertinggi tersebut.

4. **Akumulasi Duplikat (Hero Crystals)**:
   - Setiap kali mendapatkan hero duplikat, sistem akan mengonversinya menjadi **Hero Crystals (HC)** sesuai tier:
     - Duplikat Bintang 3 → **50 HC**
     - Duplikat Bintang 2 → **8 HC**
     - Duplikat Bintang 1 → **1 HC**

5. **Mileage Shop (Toko Penukaran)**:
   - Setiap tarikan gacha memberikan **1 Mileage Ticket**.
   - Setelah mengumpulkan **300 Mileage Tickets**, user dapat menukarkannya secara instan dengan Hero Bintang 3 atau Senjata Eksklusif Bintang 5 apa saja yang ada di daftar toko!

6. **Desain Estetika Premium & Animasi Box**:
   - Tampilan diubah ke mode gelap luar angkasa dengan sentuhan warna neon violet, ungu glowing, dan emas bintang.
   - Menggunakan Google Fonts *Titillium Web* agar memberi kesan antarmuka game modern.
   - **Animasi Reveal Box**: Saat melakukan summon, visual box akan muncul di layar.
     - **White Box** (glitch/glow pelangi) → Menandakan dapat Bintang 3/5 Eksklusif.
     - **Gold Box** (glowing kuning) → Menandakan dapat Bintang 2/4.
     - **Brown Box** (kotak kayu cokelat) → Hadiah bintang rendah.
     - User bisa membuka kotak satu per satu atau menekan tombol **SKIP ALL** untuk melihat ringkasan hasil secara instan.

7. **Fitur Tambahan**:
   - **+ Gems Gratis**: Tombol untuk menambah +10,000 Gems secara instan jika Gems habis.
   - **Reset Simulator**: Tombol untuk menghapus semua progres dan inventory untuk mulai dari awal.
   - **Local Storage**: Semua data Gems, Mileage, Crystals, Inventory, dan Banner saat ini disimpan otomatis di browser agar tidak hilang saat di-refresh.

---

## Riwayat Commit (Kecil & Rapi)

1. `feat: implement gacha engine and embed compiled heroes database`
   - Mengintegrasikan mesin gacha, parameter rate, soft pity, serta kompilasi data 168 hero.
2. `feat: implement HTML structure for Guardian Tales gacha simulator`
   - Membuat struktur layout semantik untuk tab summon, inventory, toko, dan modal detail hero.
3. `feat: implement premium cosmic dark theme styles for the simulator`
   - Menerapkan desain dark mode luar angkasa, styling box reveal gacha, dan efek glow.
4. `docs: update LOG.md for Guardian Tales simulator`
   - Memperbarui dokumentasi log dalam bahasa Indonesia.
