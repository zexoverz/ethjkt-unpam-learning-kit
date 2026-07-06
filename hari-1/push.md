# push.md — Cara push & buat Pull Request

> Panduan step-by-step buat npmhasil kerja Hari 1 (gacha + PokeAPI) ke GitHub.
> Ditulis 2026-07-06. Baca pelan-pelan, jangan skip.

---

## 0. Kondisi repo sekarang (penting!)

Repo asli (yang punya remote): **`ethjkt-unpam-learning-kit`**

```
Folder : .../Day1/ethjkt-unpam-learning-kit/
Branch : master
Remote : https://github.com/zexoverz/ethjkt-unpam-learning-kit
Login  : g4rrzx  (via gh CLI, sudah auth)
```

File yang berubah / baru:
- `hari-1/index.html`  → DIMODIFIKASI (logika gacha + integrasi PokeAPI)
- `hari-1/LOG.md`      → BARU (catatan belajar PokeAPI)

**Perhatian — 2 masalah yang harus kamu tahu:**

1. **Akun login ≠ pemilik repo.**
   Remote-nya milik `zexoverz`, tapi kamu login sebagai `g4rrzx`.
   Artinya kamu (kemungkinan) **gak bisa push langsung** ke `zexoverz/master`.
   Solusi: **fork** repo ke akun `g4rrzx`, lalu PR dari fork. → lihat **JALUR A**.
   (Kalau ternyata kamu punya akses push ke repo zexoverz, bisa langsung — **JALUR B**.)

2. **Ada `.git` nyangkut di folder home (`C:/Users/USER`).**
   Itu bukan repo project ini — jangan pernah `git add` atau `git commit` dari `C:/Users/USER`.
   SELALU jalankan git dari dalam folder `ethjkt-unpam-learning-kit/`.
   (Saran: nanti hapus `C:/Users/USER/.git` kalau memang gak disengaja. Tapi itu urusan lain — jangan sekarang.)

---

## 1. Pra-syarat (cek sekali)

```bash
git --version     # harus muncul versi
gh --version      # GitHub CLI
gh auth status    # harus "Logged in to github.com account g4rrzx"
```

Kalau `gh auth status` belum login:
```bash
gh auth login
# pilih: GitHub.com → HTTPS → Login with a web browser
```

Semua perintah git di bawah **dijalankan dari dalam folder**:
```
C:/Users/USER/Documents/Folder Kuliah/ShortCourse/Semester6/Day1/ethjkt-unpam-learning-kit
```

---

## 2. Lihat dulu apa yang akan di-push (verifikasi)

```bash
cd "ethjkt-unpam-learning-kit"
git status                 # lihat file berubah
git diff hari-1/index.html # lihat perubahan kode
```

Pastikan hanya `hari-1/index.html` dan `hari-1/LOG.md` yang muncul.
Kalau ada file lain (mis. `push.md` itu sendiri) — terserah mau dimasukin atau gak.

---

## JALUR A — Fork + Pull Request (REKOMENDASI)

Ini jalur yang dipakai kalau repo `zexoverz/ethjkt-unpam-learning-kit` BUKAN milikmu.

### A.1. Bikin branch baru (jangan commit ke master)
```bash
git checkout -b hari-1/gacha-pokeapi
```

### A.2. Stage & commit perubahan
```bash
git add hari-1/index.html hari-1/LOG.md
git commit -m "feat(hari-1): integrasi PokeAPI ke gacha simulator

- Ambil data Pokémon asli dari PokeAPI (sprite, tipe, stats, cry, flavor text)
- Rarity dipetakan dari sifat Pokémon (legendary/mythical=SSR, base_experience=epic/rare/common)
- localStorage cache biar gak request ulang
- Kartu auto-grow: tampil semua stats + flavor text
- TARIK 10x dengan grid 5x2 + cry SSR otomatis
- Tambah LOG.md (catatan belajar PokeAPI)"
```

### A.3. Fork repo ke akunmu (lewat gh CLI)
```bash
gh repo fork zexoverz/ethjkt-unpam-learning-kit --clone=false --remote=true
```
Ini bikin `g4rrzx/ethjkt-unpam-learning-kit` (fork) dan nambah remote `origin` = fork-mu,
remote lama pindah nama jadi `upstream` (= zexoverz).

Cek:
```bash
git remote -v
# origin   = g4rrzx/...      (fork-mu, tempat push)
# upstream = zexoverz/...    (repo asli)
```

### A.4. Push branch ke fork-mu
```bash
git push -u origin hari-1/gacha-pokeapi
```

### A.5. Buat Pull Request
```bash
gh pr create \
  --repo zexoverz/ethjkt-unpam-learning-kit \
  --base master \
  --head g4rrzx:hari-1/gacha-pokeapi \
  --title "feat(hari-1): Gacha simulator + integrasi PokeAPI" \
  --body "## Ringkasan
Integrasi PokeAPI ke gacha simulator Hari 1.

## Perubahan
- \`hari-1/index.html\`: rewrite logika gacha → fetch Pokémon asli (sprite, tipe, stats, cry, flavor text). Rarity dari sifat Pokémon. localStorage cache. Kartu auto-grow.
- \`hari-1/LOG.md\`: dokumentasi belajar PokeAPI + rencana implementasi.

## Cara tes
1. Buka \`hari-1/index.html\` di browser.
2. Klik TARIK 1x → kartu muncul + stats bar.
3. Klik TARIK 10x → grid 10 mini + kartu besar.
4. Klik 🔊 untuk cry; SSR auto bunyi.

Closes # (kalau ada issue terkait)"
```

`gh pr create` akan ngasih link PR. Selesai!

---

## JALUR B — Push langsung (kalau kamu punya akses write ke zexoverz)

Hanya kalau `git push` ke `zexoverz/master` diizinkan (kamu collaborator).

### B.1. Bikin branch + commit (sama kayak A.1–A.2)
```bash
git checkout -b hari-1/gacha-pokeapi
git add hari-1/index.html hari-1/LOG.md
git commit -m "feat(hari-1): integrasi PokeAPI ke gacha simulator"
```

### B.2. Push branch ke repo asli
```bash
git push -u origin hari-1/gacha-pokeapi
```
Kalau muncul **"Permission denied"** → berarti kamu BUKAN collaborator.
Balik ke **JALUR A** (fork).

### B.3. Buat PR ke master
```bash
gh pr create \
  --base master \
  --head hari-1/gacha-pokeapi \
  --title "feat(hari-1): Gacha simulator + integrasi PokeAPI" \
  --body "Lihat detail di LOG.md"
```

---

## 3. Setelah PR dibuka

- Cek link PR yang dikasih `gh pr create`.
- Buka di browser → pastikan "Files changed" cuma `hari-1/index.html` & `hari-1/LOG.md`.
- Tunggu review / merge dari maintainer (zexoverz).

---

## 4. Kalau mau update PR (ada revisi)

```bash
# edit file... lalu:
git add hari-1/index.html
git commit -m "fix(hari-1): kartu auto-grow biar stats gak kepotong"
git push                      # otomatis ke branch yang sama, PR ke-update
```

---

## 5. Cheat sheet (copy-paste, JALUR A)

```bash
cd "ethjkt-unpam-learning-kit"
git checkout -b hari-1/gacha-pokeapi
git add hari-1/index.html hari-1/LOG.md
git commit -m "feat(hari-1): integrasi PokeAPI ke gacha simulator"
gh repo fork zexoverz/ethjkt-unpam-learning-kit --clone=false --remote=true
git push -u origin hari-1/gacha-pokeapi
gh pr create --repo zexoverz/ethjkt-unpam-learning-kit --base master \
  --head g4rrzx:hari-1/gacha-pokeapi \
  --title "feat(hari-1): Gacha simulator + integrasi PokeAPI" \
  --body "Integrasi PokeAPI: sprite, tipe, stats, cry, flavor text. Rarity dari sifat Pokémon. Lihat LOG.md."
```

---

## 6. Troubleshooting

| Masalah | Solusi |
|---|---|
| `gh auth status` belum login | `gh auth login` |
| `git push` → "Permission denied (zexoverz)" | Kamu bukan collaborator. Pakai **JALUR A** (fork). |
| `gh repo fork` error "already forked" | Sudah pernah fork. `git remote add origin https://github.com/g4rrzx/ethjkt-unpam-learning-kit.git` |
| `gh pr create` error "no head branch" | Pastikan `git push` (langkah A.4) sukses dulu. |
| Mau masukin `push.md` ini juga | `git add hari-1/push.md` sebelum commit. |
| Lupa jalanin git dari folder mana | SELALU dari `ethjkt-unpam-learning-kit/`, JANGAN dari `C:/Users/USER`. |

---

> **Intinya:** branch baru → commit → fork → push ke fork → `gh pr create` ke repo asli.
> Kalau bingung jalur mana: coba **JALUR B** dulu (lebih simpel). Kalau push ditolak, baru **JALUR A**.
