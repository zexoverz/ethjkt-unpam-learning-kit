# 📋 Progress Log — Gacha ETHJKT (Star Rail Edition)

Proyek: Wishing Simulator bertema Honkai Star Rail
Hari: 1 — Fondasi AI

## Ringkasan Checkpoint

| Checkpoint | Fitur | Status |
|---|---|---|
| 1 | Data hadiah + fungsi pilihAcak() | ✅ Selesai |
| 2 | Logika rollSatu() + sistem pity | ✅ Selesai |
| 3 | Tampilkan hasil + animasi | ✅ Selesai |
| 4 | Riwayat + tombol interaktif | ✅ Selesai |

---

## Detail per Checkpoint

### Checkpoint 1 — Data & Acak
**Apa yang dibikin:**
- Object `hadiah` berisi 4 array berdasarkan rarity: `ssr`, `epic`, `rare`, `common`
- Tiap item punya nama karakter Honkai Star Rail asli (`n`) dan emoji (`e`)
- Variabel counter: `pity`, `total`, `ssrCount` (semua mulai dari 0)
- Fungsi `pilihAcak(arr)` — ambil 1 item random dari sebuah array pakai `Math.random()`

**Kenapa penting:** ini fondasi data yang dipakai semua checkpoint berikutnya.

---

### Checkpoint 2 — Logika Tarikan
**Apa yang dibikin:**
- Fungsi `rollSatu()` yang jadi otak dari sistem gacha:
  - Nambah `total` dan `pity` tiap kali dipanggil
  - Sistem pity: kalau 10x tarikan belum dapet SSR, tarikan ke-10 **pasti** SSR
  - Kalau belum kena pity: 3% SSR, 10% Epic, 30% Rare, sisanya Common
  - Balikin hasil `{ kelas, nama, emoji }`

**Kenapa penting:** ini "aturan main" gacha-nya — nentuin adil/nggaknya sistem.

---

### Checkpoint 3 — Tampilkan + Animasi
**Apa yang dibikin:**
- Fungsi `tampilkan(hasil)` yang update tampilan kartu:
  - Isi emoji, nama, rarity ke elemen HTML
  - Trik reset animasi (`card.offsetWidth`) biar animasi replay tiap roll
  - Update angka total, SSR count, dan progress bar pity

**Kenapa penting:** ini yang bikin hasil roll kelihatan di layar, bukan cuma di data.

### Checkpoint 4 — Riwayat & Tombol
**Apa yang dibikin:**
- Fungsi `tambahRiwayat(hasil)` — bikin "chip" kecil berisi emoji hasil roll, 
  taruh di paling depan riwayat, hapus yang paling lama kalau udah lebih dari 12
- Tombol "TARIK 1x" → panggil `rollSatu()` sekali, tampilkan hasilnya
- Tombol "TARIK 10x" → ulang proses yang sama 10 kali berturut-turut

**Kenapa penting:** ini yang bikin simulator bisa benar-benar dipakai/diklik, 
bukan cuma logika di belakang layar.

---

## Status Akhir
🎉 Hari 1 selesai — semua 4 checkpoint kelar. Gacha simulator Honkai Star Rail 
udah bisa ditarik, ada sistem pity, animasi, dan riwayat. Siap di-push dan 
di-PR ke repo mentor.
---

## Belajar Hari Ini
- Paham cara kerja sistem "pity" di gacha game (guaranteed drop setelah X percobaan)
- Paham trik reset CSS animation pakai `offsetWidth`
- Sempet struggle banyak di setup tools (VS Code, Codex, Antigravity) karena laptop 
  lama — banyak belajar troubleshooting juga hari ini, bukan cuma coding.