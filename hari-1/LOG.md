# Log Hari 1 — Pokémon Gacha Simulator (Versi Sendiri)

Nama: Ghani
Tanggal: 7 Juli 2026
Misi: Hari 1 - Pokémon Gacha Simulator

---

## Ringkasan

Single-file Pokémon Gacha Simulator dengan UI modern, sistem rarity, dan integrasi PokeAPI. Mengambil data Pokémon asli dari PokeAPI dengan sistem gacha lengkap (rarity, shiny, koleksi, persistence).

---

## Fitur Utama

### 1. Sistem Gacha dengan Rarity
- **Common (50%)** - Pokémon biasa
- **Uncommon (30%)** - Pokémon langka
- **Rare (15%)** - Pokémon jarang
- **Epic (4%)** - Pokémon epik
- **Legendary (0.9%)** - Pokémon legendaris
- **Mythic (0.1%)** - Pokémon mitik
- **Shiny (5%)** - Versi shiny dengan efek visual khusus

### 2. Integrasi PokeAPI
- Mengambil data Pokémon asli dari PokeAPI (https://pokeapi.co)
- Menampilkan sprite resmi Pokémon
- Fallback sprite jika gambar gagal dimuat
- Fetch paralel untuk pull multiple (Promise.all)

### 3. Sistem Koleksi
- Koleksi tersimpan di localStorage
- Tracking jumlah per Pokémon (normal & shiny)
- Grid display untuk koleksi
- Opsi hapus koleksi

### 4. Statistik Real-time
- Total Pull
- Pokémon Unik terkumpul
- Jumlah Shiny
- Jumlah Legendary/Mythic

### 5. UI Modern
- Gradient background (purple theme)
- Glassmorphism effect pada stat boxes
- Animasi kartu dengan fade-in
- Efek khusus untuk shiny (pulse animation)
- Warna kartu berbeda per rarity
- Responsive design

### 6. Tombol Pull
- **1 Pull** - Tarik 1 Pokémon
- **5 Pull** - Tarik 5 Pokémon beruntun
- **10 Pull** - Tarik 10 Pokémon beruntun
- Loading spinner saat fetch data

---

## Cara Kerja

1. **User klik tombol pull** → JavaScript meng-generate random Pokémon ID (1-898)
2. **Fetch data dari PokeAPI** → Menggunakan Promise.all untuk fetch paralel
3. **Roll rarity** → Menggunakan Math.random() dengan cumulative probability
4. **Roll shiny** → 5% chance untuk dapat versi shiny
5. **Tampilkan hasil** → Kartu dengan animasi fade-in, warna sesuai rarity
6. **Simpan ke koleksi** → localStorage untuk persistence
7. **Update statistik** → Real-time update di UI

---

## Teknologi

- **HTML5** - Struktur halaman
- **CSS3** - Styling dengan gradient, glassmorphism, animations
- **Vanilla JavaScript** - Logic gacha, fetch API, localStorage
- **PokeAPI** - Data Pokémon asli
- **localStorage** - Persistence koleksi dan statistik

---

## Struktur File

Single-file structure:
- HTML structure (lines 1-320)
- Inline CSS (lines 7-319)
- JavaScript logic (lines 395-555)

---

## Testing

- ✅ Pull 1x berhasil menampilkan Pokémon
- ✅ Pull 5x dan 10x berhasil menampilkan multiple Pokémon
- ✅ Rarity distribution berfungsi sesuai persentase
- ✅ Shiny chance berfungsi (5%)
- ✅ Koleksi tersimpan di localStorage
- ✅ Statistik update real-time
- ✅ Clear collection berfungsi
- ✅ Fallback sprite jika gambar gagal dimuat

---

## Perbedaan dengan Versi Faisal-Dev

Versi ini menggunakan single-file structure dengan inline CSS/JS, sedangkan versi faisal-dev menggunakan struktur terpisah (index.html, styles.css, app.js). Fitur core sama-sama menggunakan PokeAPI dan sistem gacha, tapi implementasi UI dan struktur kode berbeda.
