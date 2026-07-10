# MISI HARI 2 — BUG BOUNTY: PASAR PAGI

Hari ini kalian nggak bikin dari nol. Kalian jadi TIM KEAMANAN.

Ceritanya: seorang "AI junior dev" nyerahin sebuah TOKO BUAH ONLINE
("Pasar Pagi"). Kodenya JALAN, tampilannya rapi, ada modal checkout, ada
toast sukses. Keliatan profesional. Justru itu jebakannya makin rapi
tampilannya, makin gampang kamu percaya tanpa ngecek.

Bedanya sama sekadar coding biasa: di toko ini ada UANG dan KEPERCAYAAN
pembeli yang dipertaruhkan. Kalau kode kayak gini beneran naik ke publik,
yang rugi bukan cuma perasaan orang toko bisa bangkrut, pembeli bisa
dibohongin, data bisa bocor.

Tugas kamu: jalanin, belanja beneran, lalu BEDAH. Ada 7 masalah tertanam
(BUG, KEAMANAN, ETIKA) yang halus-halus. Ini skill inti Hari 2: MEMBACA
& MEMVERIFIKASI kode AI. Nemu semua sendiri?

---

## ATURAN EMAS (masih sama)

```
AI = tukang ketik, kamu = pilot.
Pilot yang baik BACA instrumen sebelum percaya.

Dinilai dari: seberapa tajam kamu NEMUIN, MEMBUKTIIN & NJELASIN
masalah, BUKAN dari kodenya jalan (kodenya emang udah jalan, tapi cacat).
```

Bedanya di level ini: sebagian masalah butuh kamu MEMBUKTIIN, bukan cuma
"kayaknya salah". Buka DevTools (F12). Detektif beneran ngumpulin bukti.

Catatan penting: petunjuk di bawah SENGAJA nggak nyebutin jawabannya.
Cuma nunjuk "area" tempat kamu harus curiga. Sisanya kamu yang gali.
Kalau langsung dikasih jawaban, itu bukan bug bounty namanya.

---

## TARGET: 7 TEMUAN, 3 KATEGORI

```
+-----------+---------------------------------------------------+
| Kategori  | Cari apa                                          |
+-----------+---------------------------------------------------+
| BUG       | Kelakuan salah / angka yang aneh                  |
| KEAMANAN  | Celah yang bisa dimanfaatin buat curang / nyerang |
| ETIKA     | Pola gelap (dark pattern): toko sengaja "nyetir"  |
|           | pembeli dengan cara nggak jujur                   |
+-----------+---------------------------------------------------+
```

Sebaran target: 2 BUG, 3 KEAMANAN, 2 ETIKA. (Jumlah tiap kategori
dikasih tau biar kamu tau kapan berhenti nyari, bukan biar kamu nyontek.)

Konsep baru di level ini: DARK PATTERN. Bukan bug teknis kodenya
"bener", tapi sengaja didesain buat NGAKALIN pengguna (bikin panik,
sembunyiin biaya, dll). Ini isu etika produk yang nyata.

---

## CHECKPOINT 0 — Jalanin & Belanja Dulu

```
[ ] Buka index.html di browser (tinggal double-click / Live Server).
[ ] Masukin beberapa buah ke basket pakai tombol +/-.
[ ] Isi "Note for the farmer", klik Continue to Checkout, Confirm.
[ ] Perhatiin angka Total. Bandingin sama jumlah harga barangnya.
[ ] Buka DevTools (F12) > tab Console & Elements. Ini senjatamu.
```

Detektif main dulu sama barangnya sebelum nuduh. Sambil belanja,
tanya terus: "angka ini dari mana?", "kenapa segini?", "ini jujur nggak?"

---

## CHECKPOINT 1 — Berburu BUG (target 2)

GOAL: temukan 2 kelakuan angka yang SALAH.

Area yang wajib kamu curigai:

```
- MATEMATIKA UANG. Belanja beberapa kombinasi barang, lalu tatap
  angka Total baik-baik. Selalu rapi & masuk akal, atau kadang
  bentuknya aneh?
- INPUT NAKAL. Di mana pun user bisa NGETIK ANGKA (mis. jumlah
  barang di basket), coba isi yang "nakal": kosongin, kasih huruf,
  kasih minus. Toko-nya tetap waras?
```

Jangan cuma nebak dari baca kode. BUKTIIN di layar: reproduksi angkanya,
screenshot / catat langkahnya.

Prompt bantu (boleh ke Codex/Claude, buat NGERTI, bukan nyari jawaban):
```
"Baca cara kode ini menghitung dan menampilkan Total. Menurut kamu,
kondisi input seperti apa yang bisa bikin hasilnya salah atau aneh?
Jelasin alurnya, jangan cuma kasih kesimpulan."
```

---

## CHECKPOINT 2 — Berburu CELAH KEAMANAN (target 3)

GOAL: temukan 3 celah. Ini bagian paling seru buktiin sendiri di DevTools.

Tiga pertanyaan pemandu (tiap pertanyaan nuntun ke satu celah):

```
1. INPUT USER. Di setiap tempat user bisa NGETIK (catatan, kupon),
   apa yang terjadi kalau yang diketik BUKAN teks biasa? Kode-nya
   nampilin input user dengan aman, atau mentah? (kata kunci: XSS)
2. RAHASIA & LOGIKA DI CLIENT. Buka file kode / View Source. Ada
   "rahasia" yang keliatan terang-terangan? Ada keputusan penting
   yang diputus di BROWSER, yang harusnya nggak boleh dipercaya?
3. ANGKA PENTING DARI MANA. Harga yang dipakai buat ngitung Total
   itu diambil dari data resmi produk, atau dari sesuatu di halaman
   yang bisa diedit user lewat DevTools?
```

Buktiin tiap celah beneran. "Kayaknya rawan" belum keitung kamu harus
bisa nunjukin celahnya kepake.

Prompt bantu:
```
"Di file ini: (1) gimana cara kode nampilin catatan dari user, aman
dari XSS nggak? (2) apakah ada rahasia atau logika penting yang ada di
sisi browser? (3) harga buat ngitung total diambil dari mana? Jelasin
BAHAYANYA, jangan langsung kasih patch."
```

---

## CHECKPOINT 3 — Berburu POLA GELAP / ETIKA (target 2)

GOAL: buktiin toko ini sengaja "nyetir" pembeli dengan nggak jujur.

Dua hal yang perlu kamu tanyain ke toko ini:

```
- TOKO INI JUJUR SOAL "STOK"? Perhatiin klaim yang bikin buru-buru
  (mis. angka "sisa sekian"). Klik-klik & refresh halaman. Angkanya
  kelakuan kayak stok beneran, atau kayak dikarang biar kamu panik?
- TOKO INI JUJUR SOAL "HARGA"? Jumlahin harga barang di basket pakai
  kalkulator, bandingin sama Total yang kamu bayar. Pas? Kalau ada
  selisih, selisih itu dijelasin JELAS dari awal, atau muncul diam-diam
  di detik terakhir?
```

Renungan (buat laporan): dua-duanya "kode-nya jalan sempurna". Tapi
tujuannya bikin orang panik & bayar lebih tanpa sadar. Ini bukan bug
teknis ini pilihan ETIKA. Kalau kamu yang disuruh AI bikin fitur kayak
gini buat startup-mu, kamu bakal bilang apa?

---

## CHECKPOINT 4 — Betulin (FINISH)

GOAL: perbaiki temuanmu, dibantu AI, TAPI kamu yang paham.

Buat tiap temuan yang udah kamu buktiin: minta AI bantu betulin, lalu
kamu WAJIB bisa jelasin kenapa fix-nya bener. Contoh prompt:
```
"Aku nemu masalah ini: <jelasin temuanmu>. Betulin di kode ini, dan
jelasin kenapa cara itu yang bener + prinsip umum di baliknya."
```

Cara ngecek fix-mu beneran jalan: ULANGI langkah waktu kamu nemuin
masalahnya tadi. Kalau sekarang toko-nya udah kelakuan bener & jujur,
berarti fix-mu lolos. Kamu yang nyusun checklist-nya sendiri dari
temuanmu itu bagian dari nilainya.

Kalau mentok, tanya AI (Codex/Claude) pakai prompt-prompt di atas, atau
minta bocoran ke pengajar. Tapi tetap wajib bisa JELASIN sendiri kunci
lengkapnya sengaja nggak ditaruh di sini biar kamu nyari dulu.

---

## LAPORAN TEMUAN (WAJIB — ini yang dinilai)

Bikin file `LAPORAN-TEMUAN.md`. Buat tiap temuan, tulis:

```
Temuan #: [BUG / KEAMANAN / ETIKA]
- Masalahnya apa (bahasa sendiri):
- Cara buktiinnya (langkah persis yang kamu lakuin):
- Kenapa ini bahaya / nggak adil (siapa yang rugi):
- Cara betulinnya:
```

Plus 1 refleksi penutup:
```
- Bedanya "kode jalan" sama "kode benar & jujur" itu apa, menurutmu,
  setelah level ini?
```

Yang paling dihargain: temuan yang kamu BUKTIIN sendiri di DevTools +
ngerti kenapa bahaya. Nemu 4 tapi paham & terbukti > nemu 7 tapi nyontek.

---

## STRETCH (buat yang haus)

```
- Cari temuan ke-8: masih ada celah lain yang belum masuk target 7?
  (petunjuk: pikirin batas-batas yang "lupa" dipasang, atau angka yang
  ditampilin di dua tempat tapi nggak sinkron).
- Harga versi aman: gimana caranya toko beneran mastiin pembeli nggak
  ngakalin harga? (kata kunci: validasi di server).
- Tulis "5 aturan review" versimu buat tiap kali AI ngasih kode toko.
```

---

Inget: kode AI itu DRAFT, bukan FINAL. Di toko beneran, kamu gerbang
terakhir sebelum duit & kepercayaan orang dipertaruhkan.

-- Zexo, ETHJKT
