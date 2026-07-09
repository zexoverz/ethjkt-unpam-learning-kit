# ETHJKT x UNPAM — Learning Kit: AI & Blockchain

Short Course "AI & Blockchain" | Universitas Pamulang (UNPAM)
Pengajar: Faisal "Zexo" — Founder ETHJKT (Ethereum Jakarta)
Mulai 6 Juli 2026 | Hari 1-4 sesi live (2 jam) · demo + GitHub + karier = take-home

---

## BACA INI H-1 (Sehari Sebelum Kelas)

Halo. Ini panduan persiapan. Tujuannya satu: pas hari pertama,
laptop kalian udah SIAP, jadi kita nggak buang 2 jam cuma buat install-install.

Kerjain semua langkah di bawah SEBELUM hari-H. Nggak lama, kok
santai sekitar 30-45 menit. Kalau nyangkut, catat errornya, nanti
kita beresin bareng.

Prinsip course ini biar kalian tau dari awal:

    AI = tukang ketik. Kamu = pilot.
    Dinilai dari "bisa jelasin & verifikasi kode AI",
    BUKAN dari "kodenya jalan".

Jadi tenang, kalian nggak dituntut jago sintaks. Kalian dituntut PAHAM.

---

## CHECKLIST PERSIAPAN

Centang satu-satu. Kalau ketujuh ini beres, kalian aman.

```
[ ] 1. Punya akun GitHub (buat simpan & pamer karya)
[ ] 2. Git ke-install di laptop
[ ] 3. Node.js + npm ke-install (buat tools + jalanin interface DEX Hari 3)
[ ] 4. VSCode ke-install (editor kode + terminal built-in)
[ ] 5. Punya AI coding CLI gratis yang jalan di terminal (Codex CLI)
[ ] 6. Extension MetaMask ke-install (dompet; dipakai mulai Hari 3) -> Langkah 6
[ ] 7. Udah tes semua lewat "Verifikasi Akhir" di bawah
```

Spek laptop minimal: bisa buka browser + terminal. Windows, Mac,
atau Linux semua bisa. Koneksi internet wajib.

---

## LANGKAH 1 — Akun GitHub

GitHub itu tempat naruh kode online. Semua tugas & capstone kalian
bakal disimpan di sini. Ini sekalian jadi PORTFOLIO + amunisi CV.

1. Buka https://github.com/signup
2. Isi email, bikin password, pilih username (bebas, apa aja).
3. Verifikasi (klik teka-teki + cek email konfirmasi).
4. Selesai. Simpan username + password baik-baik.

Cek berhasil: kalian bisa login di https://github.com dan lihat halaman
profil kosong kalian.

---

## LANGKAH 2 — Install Git

Git itu alat buat "nyimpan versi" kode + upload ke GitHub.

### Windows

1. Buka https://git-scm.com/download/win
2. Download otomatis jalan. Buka file `.exe`-nya.
3. Klik Next terus sampai selesai (default-nya udah bener,
   nggak usah diutak-atik).
4. Selesai.

### macOS

Cara paling gampang lewat terminal (buka app "Terminal"):

```
git --version
```

Kalau Git belum ada, macOS otomatis nawarin install ("Command Line
Developer Tools"). Klik Install, tunggu selesai.

### Linux (Ubuntu/Debian)

```
sudo apt update
sudo apt install git -y
```

### Cek berhasil (semua OS)

Buka terminal, ketik:

```
git --version
```

Kalau muncul sesuatu kayak `git version 2.4x.x`, berarti SUKSES.

---

## LANGKAH 3 — Install Node.js

Node.js dipakai buat jalanin tools & (nanti) frontend. Ambil versi
LTS (Long Term Support) = versi paling stabil.

### Windows & macOS (cara termudah)

1. Buka https://nodejs.org
2. Klik tombol versi LTS (bertuliskan "LTS", biasanya angka genap).
3. Buka installer-nya, klik Next/Continue sampai selesai (default aman).

### Linux (Ubuntu/Debian)

```
sudo apt update
sudo apt install nodejs npm -y
```

### Cek berhasil (semua OS)

Buka terminal, ketik dua baris ini:

```
node -v
npm -v
```

Kalau dua-duanya keluar angka versi (contoh `v22.x.x` dan `10.x.x`),
berarti SUKSES. `npm` ikut ke-install bareng Node otomatis.

Nanti Hari 3, interface DEX kita dijalanin pakai npm (`npm install` lalu
`npm run dev`). Nggak usah install apa-apa lagi sekarang — cukup pastikan
`node -v` dan `npm -v` keluar angka.

---

## LANGKAH 4 — Install VSCode (Editor Kode)

VSCode = tempat kalian nulis & baca kode. Ada TERMINAL built-in-nya juga,
jadi ngoding + jalanin perintah bisa di satu jendela. Ini yang bakal
kita pakai sepanjang course.

### Semua OS

1. Buka https://code.visualstudio.com
2. Download sesuai OS (tombolnya ngedeteksi otomatis). Buka installer,
   klik Next/Continue sampai selesai.
3. (Windows) kalau ditawarin "Add to PATH", CENTANG.

### Kenalan terminal built-in

Buka VSCode. Di menu atas: Terminal > New Terminal (atau tekan Ctrl + `
tombol backtick, di pojok kiri atas keyboard). Muncul kotak hitam di
bawah itu terminalnya. Semua perintah CLI kita jalanin di situ.

Cek berhasil: VSCode kebuka DAN kalian bisa munculin terminal di dalamnya.

---

## LANGKAH 5 — AI Coding CLI (WAJIB, jalan di terminal)

Ini jantung course-nya. Gaya ngajar kita MEMBIASAKAN kalian kerja lewat
CLI (terminal), bukan cuma copy-paste dari web. Kenapa? Karena di
dunia kerja beneran, engineer ngobrol sama AI langsung dari terminal,
nempel di sebelah kodenya. Skill ini yang mau kita bangun.

Jadi wajib punya SATU AI coding CLI yang jalan. Semua di bawah GRATIS,
tanpa kartu kredit.

### Rekomendasi utama: Codex CLI (gratis via akun ChatGPT)

Codex CLI dari OpenAI GRATIS pakai akun ChatGPT biasa (plan Free, $0).
Node.js udah kalian install di Langkah 3, jadi tinggal:

1. Bikin akun ChatGPT gratis di https://chatgpt.com (skip kalau udah punya).
2. Install Codex CLI. Di terminal VSCode ketik:

```
npm install -g @openai/codex
```

3. Jalankan:

```
codex
```

4. Pilih "Sign in with ChatGPT", login pakai akun tadi.
5. Tes: ketik "jelasin apa itu smart contract dalam 2 kalimat".
   Kalau dibales, SUKSES.

### Pilihan lain (kalau Codex bermasalah)

```
+---+----------------------+--------+----------------------------+
| # | CLI                  | Kartu? | Catatan                    |
+---+----------------------+--------+----------------------------+
| A | Codex CLI (OpenAI)   | Tidak  | REKOMENDASI. Gratis via    |
|   |                      |        | akun ChatGPT Free.         |
+---+----------------------+--------+----------------------------+
| B | Antigravity CLI      | Tidak  | Gratis dari Google         |
|   | (Google)             |        | (pengganti Gemini CLI),    |
|   |                      |        | kuota harian besar.        |
+---+----------------------+--------+----------------------------+
| C | Claude Code (CLI)    | Ya /   | Yang dipakai PENGAJAR.     |
|   |                      | kredit | Butuh Pro (~$20/bln) atau  |
|   |                      |        | kredit API. TIDAK wajib.   |
+---+----------------------+--------+----------------------------+
```

Catatan: Gemini CLI udah dipensiun Google (Juni 2026), diganti
Antigravity CLI. Kalau nemu tutorial "Gemini CLI", itu udah usang.

PENTING SOAL KEAMANAN: hindari situs/proxy "AI gratis unlimited" yang
minta kalian tempel API key ke server mereka. Itu rawan dicuri. Cukup
jalur resmi di atas.

---

## LANGKAH 6 — MetaMask + Sepolia (Dompet Blockchain)

Mulai Hari 3, kita deploy ke blockchain ASLI (testnet Sepolia). Butuh
"dompet" namanya MetaMask. Gratis, nggak pakai uang beneran.

1. Buka https://metamask.io -> install extension buat browser kalian.
2. "Create a new wallet", bikin password.
3. Kalian dikasih SEED PHRASE (12 kata). CATAT di tempat aman.
   >> INI KUNCI DOMPET. RAHASIA MUTLAK. << Jangan screenshot ke cloud,
   jangan tempel ke chat, JANGAN kasih ke AI.
4. Aktifkan testnet: Settings -> Advanced -> "Show test networks" = ON,
   lalu pilih jaringan "Sepolia".

Cek berhasil: MetaMask kebuka, ada 1 akun (0x...), bisa pindah ke "Sepolia".
Belum ada saldo? Wajar — ETH gratis kita ambil di kelas (faucet).
CATATAN: kelas ini CUMA main di Sepolia. JANGAN pakai mainnet / uang asli.


<img width="762" height="1192" alt="image" src="https://github.com/user-attachments/assets/7eb5965e-8dc2-47bd-aaef-30e33f7b9d23" />


---

## VERIFIKASI AKHIR

Buka terminal (boleh terminal built-in VSCode), jalanin satu-satu:

```
git --version
node -v
npm -v
codex --version
```

Lalu:

```
Buka VSCode        -> kebuka + bisa munculin terminal built-in
Login github.com   -> harus bisa masuk
Jalankan: codex    -> udah login (Sign in with ChatGPT sukses)
```

Kalau empat perintah terminal keluar angka versi, VSCode jalan, DAN
Codex CLI udah login, artinya laptop kalian 100% SIAP. Mantap.

---

## KALAU MUNCUL ERROR

Jangan panik. Ini normal. Beberapa yang sering kejadian:

```
+-------------------------------+---------------------------------+
| Masalah                       | Coba ini dulu                   |
+-------------------------------+---------------------------------+
| "git bukan perintah dikenal"  | Tutup & buka LAGI terminalnya,  |
| / "'git' is not recognized"   | terus coba ulang. Kalau masih,  |
|                               | install ulang Git (Langkah 2).  |
+-------------------------------+---------------------------------+
| "node bukan perintah dikenal" | Sama: tutup-buka terminal, cek  |
|                               | ulang. Restart laptop kalau     |
|                               | perlu.                          |
+-------------------------------+---------------------------------+
| Download lama / gagal         | Cek koneksi internet, coba WiFi |
|                               | lain, ulangi.                   |
+-------------------------------+---------------------------------+
| Codex gagal install/login     | Cek `node -v` jalan dulu. Masih |
|                               | gagal? Pakai Pilihan B          |
|                               | (Antigravity CLI) sebagai ganti.|
+-------------------------------+---------------------------------+
```

Masih nyangkut? Screenshot error-nya, catat langkah ke berapa, bawa
pas hari-H. Kita beresin 5 menit di awal kelas.

---

## YANG DIBAWA PAS HARI-H

```
[ ] Laptop yang udah lolos "Verifikasi Akhir"
[ ] Charger laptop
[ ] Username & password GitHub (jangan lupa!)
[ ] Akun ChatGPT + Codex CLI yang udah bisa login di terminal
[ ] MetaMask ke-install + seed phrase disimpan aman (buat Hari 3)
[ ] Niat belajar + siap salah. Salah itu bagian dari proses.
```

---

## SEKILAS: 4 HARI KE DEPAN

```
+------+--------------------------------+---------------+
| Hari | Yang kita lakuin               | Format        |
+------+--------------------------------+---------------+
| 1    | Kenalan AI + ngoding pertama   | Live (2 jam)  |
|      | dibantu AI                     |               |
| 2    | Review & bongkar kode AI       | Live (2 jam)  |
|      | (nyari bug + celah keamanan)   |               |
| 3    | Dasar blockchain + BIKIN koin  | Live (2 jam)  |
|      | sendiri + pasar + swap (Sepolia)|              |
| 4    | Bedah DeFi (ERC20, likuiditas, | Live (2 jam)  |
|      | x*y=k) + demo/GitHub/karier    |               |
+------+--------------------------------+---------------+
```

Demo + push GitHub + baca karier = TAKE-HOME (bagian Hari 4, dikerjain
mandiri). Bacaan karier + cara lanjut belajar + komunitas ETHJKT ada di
file: KARIER.md (di repo ini).

Capstone kita: "KampusSwap" — tiap orang cetak KOIN sendiri di blockchain,
bikin pasar mini buat nuker-nya, dan ngerti sendiri gimana harga & DeFi
bekerja. Dibantu AI, diverifikasi otak sendiri. Sampai ketemu di hari-H.

---

## SUMBER INFO (biar transparan)

Info soal tool & harga di panduan ini diverifikasi dari sumber resmi
per Juli 2026. Kalau ada yang berubah, cek link di bawah:

```
- Codex CLI gratis via akun ChatGPT Free (OpenAI Help Center)
  https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan

- Cara install & sign-in Codex CLI (OpenAI Developers)
  https://developers.openai.com/codex/cli

- Perbandingan AI CLI gratis + info Gemini CLI dipensiun -> Antigravity
  https://www.termdock.com/en/blog/free-ai-cli-tools-ranked

- Download Node.js (versi LTS)
  https://nodejs.org

- Download Git
  https://git-scm.com

- Download VSCode
  https://code.visualstudio.com
```

---

-- Zexo, ETHJKT
