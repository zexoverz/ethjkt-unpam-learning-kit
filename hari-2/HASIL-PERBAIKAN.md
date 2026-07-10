# HASIL PERBAIKAN — PASAR PAGI

Dokumen ini menjelaskan **apa yang diperbaiki**, **solusi yang dipakai**, dan
yang paling penting: **kenapa solusi itu yang dipilih** (bukan tambal cepat).
Semua perbaikan sudah **diuji langsung di browser** (Playwright) — bukti ada di
bagian akhir.

File yang diubah: `main.js`, `index.html`, `style.css`.

---

## Ringkasan

| # | Kategori | Temuan | Status |
|---|----------|--------|--------|
| 1 | BUG | Input jumlah non-angka → `NaN` | ✅ Fixed |
| 2 | BUG (stretch) | Tidak ada batas jumlah / stok | ✅ Fixed |
| 3 | BUG | Total tidak `toFixed` (floating-point) | ✅ Fixed |
| 4 | KEAMANAN | Harga dari DOM `data-price` | ✅ Fixed |
| 5 | KEAMANAN | XSS via `innerHTML` di catatan | ✅ Fixed |
| 6 | KEAMANAN | Kupon rahasia + diskon di client | ⚠️ Fixed sebatas client (butuh server utk tuntas) |
| 7 | ETIKA | Stok palsu `Math.random()` | ✅ Fixed |
| 8 | ETIKA | Biaya penanganan tersembunyi | ✅ Fixed |

---

## #7 (ETIKA) Stok palsu → stok NYATA

**Masalah:** angka "sisa" dibuat `Math.floor(Math.random()*5)+1` tiap render →
false scarcity, bikin panik.

**Solusi:** tambah field `stock` di katalog produk (sumber kebenaran), tampilkan
`stock − jumlah di keranjang`, dan **tegakkan** batasnya: tombol `+` `disabled`
saat habis; `addToCart` dan input jumlah manual menolak melebihi stok.

**Kenapa solusi ini (bukan tambal):**
Tambal = "seed random sekali biar nggak berubah" — angkanya tetap karangan.
Akar masalahnya: **tidak ada data stok sama sekali**. Fix yang benar memberi
stok nilai nyata di satu sumber, lalu menegakkannya di **semua jalur** (+, input
manual). Kalau stok cuma dipajang tapi masih bisa dilewati, itu tetap bohong —
makanya penegakan wajib, bukan sekadar teks.

```js
const sisa = product.stock - quantity;   // nyata & stabil
// tombol + disabled saat habis; addToCart & updateQuantity clamp ke stok
```

---

## #8 (ETIKA) Biaya tersembunyi → transparan sejak awal

**Masalah:** `HANDLING_FEE` diam-diam ditambahkan ke Total di sidebar tanpa
rincian; baru muncul di modal checkout (drip pricing).

**Solusi:** satu fungsi `buildBreakdown()` jadi sumber tunggal angka, dirender
oleh `renderBreakdownRows()` di **sidebar dan modal**. Sidebar kini menampilkan
Subtotal + Biaya penanganan + (Diskon) + Total sejak barang pertama masuk.

**Kenapa solusi ini:**
Tambal = "tambah satu baris fee di sidebar". Tapi akar masalahnya: **sidebar dan
modal menghitung sendiri-sendiri**, jadi rawan beda & rawan ada angka yang baru
nongol di akhir. Dengan satu sumber angka, sidebar dan modal **dijamin identik**
secara struktural — mustahil ada "kejutan" di detik terakhir. Transparansi jadi
sifat kode, bukan sekadar tempelan.

---

## #4 (KEAMANAN) Harga dari DOM → harga dari katalog

**Masalah:** harga dibaca dari atribut `data-price` di tombol (bisa diedit user
via DevTools), lalu `cart[id].price` ditimpa nilai itu.

**Solusi:**
1. `addToCart(id)` — parameter harga dari DOM dihapus; harga diambil dari
   `product.price` (katalog).
2. Atribut `data-price` dihapus total dari tombol (hapus permukaan serangan).
3. **Defense-in-depth:** tiap render, harga & nama item di keranjang
   **diambil ulang** dari katalog — kalau object `cart` diutak-atik di console,
   langsung ketimpa.

**Kenapa solusi ini:**
Prinsip inti keamanan: **never trust the client**. DOM 100% dikuasai pembeli,
jadi tidak boleh jadi sumber angka uang. Katalog di kode adalah satu-satunya
sumber harga. Menghapus `data-price` bukan cuma "nggak dipakai" — menghilangkan
atribut berarti tidak ada lagi yang bisa dimanipulasi di situ. Resync tiap
render menutup jalur manipulasi via console.

```js
cart[id].price = product.price;            // resmi, bukan dari DOM
const official = products.find(p => p.id == item.id); // resync tiap render
if (official) { item.price = official.price; item.name = official.name; }
```

---

## #5 (KEAMANAN) XSS → render sebagai teks

**Masalah:** `preview.innerHTML = "Catatan: " + note` mengeksekusi HTML/JS dari
input user (stored XSS bila note tampil di dashboard admin).

**Solusi:** ganti ke `preview.textContent`. Sama persis dengan yang sudah benar
di modal review.

**Kenapa solusi ini:**
`innerHTML` mem-parse string jadi HTML; `textContent` memperlakukannya sebagai
**teks murni** — browser otomatis meng-escape `<`, `>`, dll. Karena kita cuma
mau menampilkan tulisan (bukan HTML kaya), `textContent` adalah alat yang tepat,
nol dependensi. Prinsip: **perlakukan semua input user sebagai teks**, kecuali
sengaja disanitasi (mis. DOMPurify) saat memang butuh HTML.

---

## #1 & #2 (BUG) Input jumlah nakal → divalidasi

**Masalah:** `parseInt("")`/`parseInt("abc")` = `NaN`. Karena `NaN <= 0` itu
`false`, `cart[id].count` jadi `NaN` → seluruh Total `NaN`. Selain itu tidak ada
batas atas.

**Solusi:** di `updateQuantity`, tolak nilai non-integer lebih dulu
(`Number.isInteger`), lalu clamp ke stok. Nilai valid terakhir dipertahankan,
user tetap bisa lanjut mengetik.

**Kenapa solusi ini:**
Validasi harus **fail fast di batas sistem**: begitu input tidak valid, jangan
biarkan masuk ke state. Guard `Number.isInteger` menutup `NaN`, kosong, dan
desimal sekaligus. Memilih "return tanpa mengubah cart" (bukan memaksa reset)
menjaga UX: mengetik tidak dilawan, tapi state tidak pernah rusak.

```js
if (!Number.isInteger(quantity)) return;   // kosong/huruf/NaN ditolak
if (quantity > maks) { showToast(...); quantity = maks; } // clamp ke stok
```

---

## #3 (BUG) Total floating-point → diformat

**Masalah:** `totalPriceEl.textContent = total` (tanpa `.toFixed(2)`) → muncul
`4.8` atau `5.699999999999999`.

**Solusi:** semua angka uang dirender lewat `renderBreakdownRows()` yang selalu
pakai `.toFixed(2)`. Bug ini ikut tuntas begitu tampilan total disatukan.

**Kenapa solusi ini:** menyatukan format uang di satu tempat mencegah
inkonsistensi kambuh lagi (DRY). Idealnya, untuk toko produksi, uang dihitung
dalam satuan sen (integer) agar bebas galat floating-point.

---

## #6 (KEAMANAN) Kupon — diperbaiki sebatas yang mungkin di client

**Masalah:** kode kupon `"TEMANFARMER"` tertulis plain-text di source (bisa
dibaca & disebar via View Source), dan besar diskon diputus di browser.

**Solusi yang dipakai:**
1. String kupon **dihapus dari source**; yang disimpan hanya **hash SHA-256**.
   Validasi dilakukan dengan mem-hash input user dan membandingkan hash.
2. Logika kupon diisolasi ke `applyCoupon()` yang dikomentari sebagai **seam
   untuk panggilan server** — tinggal diganti `fetch` di produksi.
3. Karena harga sudah diambil dari katalog (#4), diskon kini diterapkan ke
   harga yang tidak bisa dimanipulasi.

**Kenapa solusi ini — dan batasnya (JUJUR):**
Toko ini **situs statis tanpa backend**. Di arsitektur seperti ini, rahasia
sejati dan keputusan harga **tidak mungkin** benar-benar diamankan — siapa pun
bisa membaca/menjalankan JS di browsernya. Jadi:
- Hash **menutup kebocoran konkret** dari temuan: kode kupon tidak lagi
  nongol plain-text sehingga tidak gampang disebar. (Terbukti: string
  `TEMANFARMER` sudah tidak ada di `main.js`.)
- Tapi ini **defense-in-depth, BUKAN batas keamanan**. Seseorang yang membaca
  alur kode tetap bisa memicu diskon.
- **Fix tuntasnya = validasi di server:** client mengirim kode kupon, server
  memutuskan sah/tidak dan menghitung total final. Daftar kupon tidak pernah
  ada di client. Aku sengaja **tidak berpura-pura** ini beres 100% di client —
  itu akan menyesatkan.

---

## BUKTI UJI (Playwright, browser sungguhan)

Dijalankan via server statis lokal, semua lolos:

```
STOK STABIL      : Pisang "Stok tersedia: 20" di dua render berbeda → identik
STOK BERKURANG   : Apel setelah +1 → "Stok tersedia: 11" (dari 12)
HARGA KATALOG    : Subtotal $1.50 / Biaya $0.30 / Total $1.80  (Apel = 1.50)
NaN (kosong)     : ada "NaN"? → false
NaN (huruf)      : ada "NaN"? → false
STOK CAP (input) : ketik "999" → dipotong jadi "12"
XSS              : preview = TEKS literal, <img> TIDAK terbuat, onerror TIDAK jalan
KUPON SALAH      : "Kode kupon salah." → Total tetap $18.30
KUPON BENAR      : "Kupon aktif!" → Subtotal 18.00 / Biaya 0.30 / Kupon -16.47 / Total 1.83
PLAINTEXT KUPON  : "TEMANFARMER" ada di source? → false
```

---

## Cara menjalankan & mengecek ulang

1. Buka `hari-2/index.html` (double-click / Live Server).
2. Ulangi langkah reproduksi di `LAPORAN-TEMUAN.md` untuk tiap temuan — sekarang
   toko harus berperilaku benar & jujur.

---

## Refleksi

"Kode jalan" hanya berarti tidak error saat kondisi normal. "Kode benar & jujur"
berarti tahan input nakal (validasi), tidak bisa diakali (harga & diskon dari
sumber terpercaya, idealnya server), tidak membocorkan data (escape input →
cegah XSS), dan tidak memanipulasi pengguna (stok & harga ditampilkan jujur).
Perhatikan #6: kadang "fix yang benar" berarti mengakui bahwa arsitektur saat
ini **tidak bisa** menyelesaikannya, lalu mendokumentasikan solusi sebenarnya —
bukan menutupinya dengan tambalan yang terlihat meyakinkan.
