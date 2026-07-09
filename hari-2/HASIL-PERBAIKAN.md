# HASIL PERBAIKAN — PASAR PAGI

Ini penjelasan gua soal apa yang udah gua benerin, gimana caranya, dan yang
paling penting kenapa gua milih cara itu (bukan asal tambal biar keliatan
beres). Semua udah gua tes langsung di browser, buktinya ada di bagian
bawah.

File yang gua ubah: `main.js`, `index.html`, `style.css`.

---

## Ringkasan

| # | Kategori | Temuan | Status |
|---|----------|--------|--------|
| 1 | BUG | Input jumlah bukan angka → `NaN` | Beres |
| 2 | BUG (stretch) | Nggak ada batas jumlah/stok | Beres |
| 3 | BUG | Total nggak `.toFixed`, muncul desimal aneh | Beres |
| 4 | KEAMANAN | Harga diambil dari DOM `data-price` | Beres |
| 5 | KEAMANAN | XSS lewat `innerHTML` di catatan | Beres |
| 6 | KEAMANAN | Kupon rahasia + diskon diputus di client | Beres sebatas client (butuh server buat tuntas) |
| 7 | ETIKA | Stok bohongan pake `Math.random()` | Beres |
| 8 | ETIKA | Biaya penanganan disembunyiin | Beres |

---

## #7 (ETIKA) Stok bohongan → jadi stok beneran

**Masalahnya:** angka "sisa stok" itu dikarang tiap render pake
`Math.random()`, jadi bikin panik palsu.

**Yang gua lakuin:** gua nambahin field `stock` di data produk sebagai
sumber kebenaran, terus stok yang ditampilin = `stock` dikurangi jumlah
yang udah masuk keranjang. Terus gua kunci beneran: tombol `+` bakal
`disabled` kalo udah habis, dan input jumlah manual juga nolak kalo
ngelebihin stok.

**Kenapa gua milih ini (bukan cuma tambal):** kalo cuma di-"seed" random-nya
biar nggak berubah-ubah, angkanya tetep aja karangan. Akar masalahnya
emang dari awal nggak ada data stok beneran. Jadi gua kasih stok nilai
yang beneran nyata, dan gua tegakin di SEMUA jalur — tombol plus maupun
input manual. Kalo cuma dipajang doang tapi masih bisa dilewatin, ya sama
aja bohong.

```js
const sisa = product.stock - quantity;   // beneran & stabil
// tombol + disabled kalo abis; addToCart & updateQuantity nge-clamp ke stok
```

---

## #8 (ETIKA) Biaya tersembunyi → transparan dari awal

**Masalahnya:** `HANDLING_FEE` diem-diem ditambahin ke Total di sidebar
tanpa rincian, baru ketauan pas modal checkout.

**Yang gua lakuin:** gua bikin satu fungsi `buildBreakdown()` yang jadi
satu-satunya sumber angka, dipake bareng di sidebar dan modal lewat
`renderBreakdownRows()`. Jadi sidebar sekarang nunjukin Subtotal + Biaya
penanganan + (Diskon kalo ada) + Total, dari barang pertama masuk.

**Kenapa gua milih ini:** kalo cuma nambah satu baris fee doang di sidebar,
itu tambal doang. Akar masalahnya: sidebar sama modal itu ngitung sendiri-
sendiri, jadi rawan beda angka atau rawan ada yang muncul mendadak di akhir.
Dengan satu fungsi sumber angka, sidebar dan modal dijamin sama persis —
nggak mungkin ada kejutan biaya di detik terakhir lagi.

---

## #4 (KEAMANAN) Harga dari DOM → harga dari katalog resmi

**Masalahnya:** harga diambil dari atribut `data-price` di tombol (bisa
diedit lewat DevTools), terus `cart[id].price` malah ditimpa sama nilai itu.

**Yang gua lakuin:**
1. `addToCart(id)` sekarang cuma butuh `id`, harga diambil dari
   `product.price` (data resmi), bukan dari DOM.
2. Atribut `data-price` gua hapus total dari tombol biar nggak ada yang
   bisa diutak-atik di situ.
3. Sebagai jaga-jaga tambahan, tiap kali render, harga & nama item di
   keranjang diambil ULANG dari katalog resmi — jadi kalo ada yang iseng
   ngutak-atik object `cart` lewat console, langsung ketimpa balik.

**Kenapa gua milih ini:** prinsip dasarnya "jangan pernah percaya client".
DOM itu sepenuhnya dikuasai pembeli, jadi nggak boleh jadi sumber angka
duit. Katalog di kode jadi satu-satunya sumber harga yang bener.

```js
cart[id].price = product.price;            // resmi, bukan dari DOM
const official = products.find(p => p.id == item.id); // di-sync ulang tiap render
if (official) { item.price = official.price; item.name = official.name; }
```

---

## #5 (KEAMANAN) XSS → dirender sebagai teks biasa

**Masalahnya:** `preview.innerHTML = "Catatan: " + note` bisa nge-run
HTML/script dari input user.

**Yang gua lakuin:** ganti jadi `preview.textContent`, disamain kayak yang
udah bener di modal review.

**Kenapa gua milih ini:** `innerHTML` itu ngeparse string jadi HTML beneran,
sedangkan `textContent` cuma nampilin sebagai teks polos — browser otomatis
nge-escape karakter kayak `<` `>`. Karena kita emang cuma mau nampilin
tulisan (bukan HTML rumit), `textContent` itu udah pas banget, nggak perlu
library tambahan.

---

## #1 & #2 (BUG) Input jumlah nakal → divalidasi

**Masalahnya:** `parseInt("")` atau `parseInt("abc")` hasilnya `NaN`, dan
karena `NaN <= 0` itu `false`, kode lama malah nyimpen `NaN` ke jumlah
barang. Selain itu juga nggak ada batas atasnya.

**Yang gua lakuin:** di `updateQuantity`, gua cek dulu `Number.isInteger()`
sebelum dipake — kalo bukan angka valid, langsung `return` (nggak ngerusak
state). Terus gua tambahin batas atas: nggak boleh ngelebihin stok resmi
produk itu.

**Kenapa gua milih ini:** validasi mesti gagal secepat mungkin pas ketemu
input yang aneh, jangan dibiarin masuk ke state. Gua milih "return tanpa
ngerusak keranjang" (bukan maksa reset ke 0) biar user tetep nyaman ngetik,
tapi data-nya tetep aman.

```js
if (!Number.isInteger(quantity)) return;   // kosong/huruf/NaN ditolak
if (quantity > maks) { showToast(...); quantity = maks; } // di-cap ke stok
```

---

## #3 (BUG) Total nggak diformat → sekarang konsisten

**Masalahnya:** `totalPriceEl.textContent = total` tanpa `.toFixed(2)`,
jadi kadang muncul `4.8` atau angka desimal panjang aneh.

**Yang gua lakuin:** semua angka duit sekarang dirender lewat satu fungsi
`renderBreakdownRows()` yang selalu pake `.toFixed(2)`.

**Kenapa gua milih ini:** dengan nyatuin format duit di satu tempat aja,
nggak bakal ada lagi ketidaksesuaian format di kemudian hari. Idealnya sih
buat toko produksi beneran, itungan duit lebih aman kalo pake satuan sen
(integer) biar bebas dari galat floating-point, tapi buat scope tugas ini
`.toFixed(2)` udah cukup.

---

## #6 (KEAMANAN) Kupon — gua benerin sebatas yang emang bisa di client

**Masalahnya:** kode kupon `"TEMANFARMER"` ketulis polos di source (bisa
dibaca siapa aja via View Source), dan besar diskonnya diputusin di
browser.

**Yang gua lakuin:**
1. String kupon gua hapus dari source, yang disimpen cuma hash SHA-256-nya.
   Validasi dilakuin dengan nge-hash input user terus dibandingin sama
   hash yang tersimpan.
2. Logika kupon gua pisahin ke fungsi `applyCoupon()` yang gua kasih
   komentar sebagai tempat yang nantinya harusnya diganti pemanggilan
   server.
3. Karena harga udah diambil dari katalog (poin #4), diskon sekarang
   diterapin ke harga yang emang nggak bisa dimanipulasi lagi.

**Kenapa gua milih ini — dan gua jujur soal batasannya:** toko ini situs
statis, nggak ada backend. Di arsitektur kayak gini, rahasia beneran dan
keputusan harga itu nggak mungkin diamanin 100% — siapa aja tetep bisa
baca/jalanin JS di browser mereka sendiri. Jadi:
- Hash nutup kebocoran yang KETAUAN dari temuan gua: kode kupon udah
  nggak nongol plain-text lagi, jadi nggak segampang itu disebar.
- TAPI ini cuma hardening tambahan, BUKAN solusi keamanan tuntas. Orang
  yang niat baca alur kodenya tetep bisa mancing diskon itu keluar.
- Solusi tuntasnya emang harus validasi kupon di server: client cuma
  kirim kode, server yang mutusin sah/nggak dan ngitung total final,
  daftar kupon nggak pernah ada di sisi client. Gua sengaja nggak
  pura-pura ini udah 100% aman di client, karena itu bakal nyesatin.

---

## BUKTI TES (langsung di browser, bukan cuma baca kode)

```
STOK STABIL      : angka stok Pisang sama di render berbeda-beda → identik
STOK BERKURANG   : Apel abis +1 → stok berkurang sesuai (dari 12 jadi 11)
HARGA KATALOG    : Subtotal, Biaya, Total keluar sesuai harga resmi produk
NaN (kosong)     : dicoba kosongin input → nggak keluar NaN lagi
NaN (huruf)      : dicoba ketik huruf → nggak keluar NaN lagi
STOK DI-CAP      : ketik angka gede banget → otomatis di-cap ke stok asli
XSS              : coba masukin `<img onerror=...>` → tampil sebagai teks doang, script nggak jalan
KUPON SALAH      : kode salah → pesan "Kode kupon salah", Total nggak berubah
KUPON BENAR      : kode bener → diskon 90% aktif, rincian muncul di sidebar & modal
KODE KUPON       : string "TEMANFARMER" udah nggak ada lagi di source `main.js`
```

---

## Cara ngecek ulang

1. Buka `hari-2/index.html` (double-click atau pake Live Server).
2. Ulangin langkah-langkah reproduksi yang ada di `LAPORAN-TEMUAN.md` buat
   tiap temuan — sekarang harusnya toko udah kelakuan bener & jujur.

---

## Refleksi

Yang gua pelajarin: "kode jalan" itu artinya cuma nggak error pas kondisi
normal. "Kode yang bener & jujur" itu beda level — dia tahan input ngaco
(validasi), nggak bisa diakalin (harga & diskon dari sumber yang bisa
dipercaya, idealnya server), nggak bocorin data (escape input, cegah XSS),
dan nggak nipu pengguna (stok & harga ditampilin apa adanya). Poin #6 tuh
yang paling nempel di kepala gua — kadang "fix yang bener" itu bukan
berarti nutup semua celah 100%, tapi ngaku jujur kalo arsitektur sekarang
emang punya batesan, terus nulis solusi sebenernya butuh apa, bukan
nutupin pake tambalan yang keliatannya doang meyakinkan.
