# LAPORAN TEMUAN — PASAR PAGI (Bug Bounty Hari 2)

Gua Dika, dan ini laporan hasil gua "bedah" toko online Pasar Pagi yang katanya
dibikin AI junior dev. Semua temuan di bawah ini gua buktiin sendiri langsung
di browser + DevTools, bukan cuma nebak-nebak baca kode doang.

Target: **2 BUG / 3 KEAMANAN / 2 ETIKA** = 7 temuan.

---

## Temuan #1: [BUG] Input jumlah asal-asalan bikin Total jadi `NaN`

**Ceritanya gini:** di kolom jumlah barang di keranjang, gua coba hapus
angkanya sampe kosong atau ketik huruf. Eh ternyata `parseInt` itu kalo dikasih
string kosong atau huruf, hasilnya `NaN`. Yang bikin parah, kode lama nggak
ngecek ini dulu — jadi langsung disimpen ke `cart[id].count`. Efeknya, seluruh
Total ikut kebawa `NaN`.

**Lokasinya:** di `main.js` bagian event input (`parseInt(target.value, 10)`)
dan fungsi `updateQuantity`.

**Cara gua buktiin:**
1. Masukin satu buah ke keranjang.
2. Di input jumlah, hapus semua angka / ganti jadi huruf.
3. Total di sidebar berubah jadi `NaN`, badge di header juga ikutan `NaN`.
4. Gua cek di console: `parseInt("", 10)` emang beneran ngasih `NaN`.

**Kenapa ini bahaya:** toko keliatan berantakan/nggak profesional, orang bisa
bingung mau bayar berapa. Kalo ini kebawa sampe ke sistem pembayaran beneran,
order bisa gagal atau kesimpen dengan data ngaco.

**Cara benerinnya:** sebelum angka dari input dipakai, cek dulu pake
`Number.isInteger()`. Kalo bukan angka valid, ya jangan diubah dulu state-nya,
biarin user lanjut ngetik sampe valid.

---

## Temuan #2 (stretch): [BUG] Nggak ada batas atas / stok buat jumlah barang

**Ceritanya gini:** selain masalah `NaN`, ternyata jumlah barang juga nggak
dibatesin sama sekali. Gua coba ketik `999999` di input jumlah, langsung
diterima gitu aja padahal stok kartunya cuma belasan. Terus pas gua ketik
angka minus, item-nya malah ilang diem-diem dari keranjang (bukan nolak
inputnya, tapi ngehapus).

**Lokasinya:** fungsi `updateQuantity`, sama atribut `min="1"` di HTML yang
ternyata cuma ngatur tombol spinner doang, nggak ngunci pas diketik manual.

**Cara gua buktiin:**
1. Tambah 1 barang ke keranjang.
2. Ketik `999999` → diterima mentah-mentah, Total ikut membengkak.
3. Ketik `-3` → barangnya malah ilang tanpa pesan apa-apa.

**Kenapa ini bahaya:** data pesanan jadi nggak bisa dipercaya karena nggak
nyambung sama stok asli. User juga bisa kaget kalo barangnya ilang
tiba-tiba pas ngetik minus.

**Cara benerinnya:** paksa jumlah harus integer positif, dan di-cap
maksimal sesuai stok resmi produk itu.

---

## Temuan #3: [BUG] Total nggak diformat, muncul angka desimal aneh

**Ceritanya gini:** hampir semua harga di halaman ini pake `.toFixed(2)`,
tapi si Total di sidebar sama modal checkout ternyata nggak. Jadi kadang
munculnya `4.8` doang (harusnya `4.80`), atau lebih parah lagi kayak
`5.699999999999999` — ini efek klasik floating-point di JavaScript.

**Lokasinya:** baris yang nge-render Total ke `textContent`, baik di sidebar
maupun di modal review — dua-duanya nggak dibungkus `.toFixed(2)`.

**Cara gua buktiin:** belanja kombinasi barang yang harganya desimal
"nyusahin" (kayak yang ada `.1`/`.2` di belakang koma) + biaya penanganan
`0.30`. Total-nya beneran keluar angka ganjil.

**Kenapa ini bahaya:** kesannya nggak profesional, dan selisih pembulatan
harga itu potensi sumber ribut antara toko sama pembeli.

**Cara benerinnya:** samain semua tampilan uang pake `.toFixed(2)` di satu
fungsi aja biar konsisten semua tempat.

---

## Temuan #4: [KEAMANAN] Harga diambil dari DOM, bisa diutak-atik lewat DevTools

**Ceritanya gini** — ini yang paling bikin gua kaget. Harga resmi barang
sebenernya udah ada di array `products`, tapi kode lama malah nyimpen
harga itu juga ke atribut `data-price` di tombol `+`. Terus pas diklik,
kode-nya ngambil harga dari atribut DOM itu, BUKAN dari array resminya.
Karena DOM itu 100% bisa diedit user pake DevTools, harga bisa dipalsuin
seenaknya.

**Cara gua buktiin:**
1. Buka DevTools (F12) → tab Elements.
2. Cari tombol `+` Apel Fuji, ganti `data-price="1.5"` jadi `data-price="0.01"`.
3. Klik `+` → Apel kebeli seharga $0.01 doang. Total ikut ke-manipulasi.

**Kenapa ini bahaya:** ini prinsip dasar keamanan yang dilanggar — jangan
pernah percaya sama data dari client. Kalo beneran dipake jualan, semua
orang bisa beli murah banget cukup modal DevTools bawaan browser, dan yang
rugi toko/petaninya.

**Cara benerinnya:** harga harus selalu diambil dari data resmi (`products`)
berdasarkan `id`, jangan pernah dari atribut HTML. Idealnya total juga
dihitung ulang di server pas checkout, bukan cuma dipercaya dari browser.

---

## Temuan #5: [KEAMANAN] Catatan user bisa dipake buat nyuntik script (XSS)

**Ceritanya gini:** catatan buat petani yang diketik user itu dirender pake
`innerHTML` di sidebar, tanpa di-escape dulu. Jadi kalo user ngetik tag HTML
atau script, itu bakal ke-eksekusi beneran, bukan cuma tampil sebagai teks.
Lucunya, di modal checkout catatan yang sama malah dirender pake
`textContent` yang aman — jadi ada dua tempat, satu bolong satu enggak.

**Cara gua buktiin:**
1. Masukin minimal 1 barang ke keranjang (biar preview note muncul).
2. Di kolom catatan, ketik: `<img src=x onerror=alert('XSS-Pasar-Pagi')>`
3. Begitu diketik, popup alert beneran muncul — artinya script user ke-run.

**Kenapa ini bahaya:** kalo catatan ini ditampilin di dashboard admin/petani
beneran, ini jadi celah **stored XSS**: siapa aja bisa nyuntik script yang
jalan di browser orang lain, bisa dipake nyolong cookie/sesi, ganti isi
halaman, atau redirect ke situs jahat.

**Cara benerinnya:** ganti `innerHTML` jadi `textContent`, sama kayak yang
udah bener di modal. Kalo emang butuh render HTML beneran, harus disanitasi
dulu pake library kayak DOMPurify.

---

## Temuan #6: [KEAMANAN] Kode kupon rahasia nongol polos di source, keputusan diskon di client

**Ceritanya gini:** kode kupon "internal petani" ditulis polos aja di
JavaScript, dan keputusan diskon 90% diputusin sepenuhnya di browser. Dua
masalah sekaligus: rahasia yang katanya rahasia malah kebaca semua orang
lewat View Source, dan keputusan uang segede itu ada di tempat yang 100%
dikuasai user.

**Cara gua buktiin:**
1. Klik kanan → View Source, atau buka file `main.js` langsung.
2. Cari variabel kupon, ketemu string kodenya polos aja di situ.
3. Coba masukin kode itu ke kolom kupon → diskon 90% langsung aktif.

**Kenapa ini bahaya:** siapapun yang buka source bisa nemu kode "rahasia"
ini dan pake diskon gede-gedean, margin toko bisa jebol.

**Cara benerinnya yang gua lakuin:** kode kupon nggak lagi disimpen plain-text,
tapi di-hash pake SHA-256, jadi nggak keliatan langsung di source. TAPI gua
juga jujur di laporan ini kalo ini cuma nutup kebocoran yang KETAUAN — bukan
solusi tuntas. Toko ini situs statis tanpa server, jadi validasi kupon dan
keputusan harga akhir **seharusnya** tetap diputus di server, bukan di
browser. Kalo mau bener-bener aman, validasi kupon wajib pindah ke server.

---

## Temuan #7: [ETIKA] Angka stok itu bohongan, diacak random

**Ceritanya gini:** angka "tinggal sekian lagi hari ini!" itu ternyata bukan
stok beneran, tapi diacak ulang tiap kali produk dirender pake
`Math.random()`. Karena render produk kepanggil ulang tiap kali gua
klik `+`/`-` di keranjang, angkanya loncat-loncat sendiri padahal nggak ada
yang beli barang beneran.

**Cara gua buktiin:** gua perhatiin angka stok satu produk, terus klik
`+`/`-` beberapa kali dan refresh halaman — angkanya berubah-ubah random,
kadang naik kadang turun, padahal logikanya stok asli nggak mungkin nambah
sendirian.

**Kenapa ini nggak adil:** ini namanya dark pattern "false scarcity" — dibikin
biar pembeli panik dan buru-buru checkout tanpa mikir. Yang rugi ya
pembelinya, dibohongin biar terburu-buru.

**Cara benerinnya:** stok sekarang gua ambil dari data asli di katalog
(`product.stock` dikurangi yang udah di keranjang), jadi angkanya stabil
dan jujur — bukan random lagi.

---

## Temuan #8: [ETIKA] Biaya penanganan disembunyiin, baru nongol pas checkout

**Ceritanya gini:** ada biaya penanganan `$0.30` yang otomatis ditambahin ke
Total di sidebar, tapi nggak dijelasin rinciannya sama sekali. Baru ketauan
pas buka modal checkout — itupun udah di detik-detik terakhir sebelum bayar.

**Cara gua buktiin:** masukin 1 Apel Fuji ($1.50) doang ke keranjang, terus
liat Total di sidebar — ternyata muncul $1.80, bukan $1.50. Selisihnya nggak
dijelasin di situ.

**Kenapa ini nggak adil:** ini dark pattern "hidden cost / drip pricing" —
harga sengaja diliatin murah di awal, biaya tambahan diselipin belakangan
pas orang udah niat mau bayar.

**Cara benerinnya:** rincian biaya (subtotal, biaya penanganan, diskon,
total) sekarang gua tampilin dari awal di sidebar, pake fungsi yang sama
kayak di modal, jadi nggak ada kejutan biaya di menit-menit terakhir.

---

## Refleksi Penutup

Yang gua pelajarin dari nemuin 8 masalah ini: kode yang "jalan" itu gampang
dibikin, tinggal nggak error pas kondisi normal doang. Tapi kode yang
"beneran benar & jujur" itu beda cerita — harus tahan input ngaco, nggak
bisa diakalin harga/diskonnya, nggak bocorin data lewat XSS, dan nggak
nipu pembeli pake stok/harga palsu. Yang paling gua inget: pas nemu soal
kupon (#6), gua sadar kalo kadang "fix yang bener" itu bukan berarti
langsung 100% aman, tapi ngaku jujur kalo arsitektur sekarang emang
terbatas, dan nulis apa solusi sebenernya yang dibutuhin bukan
nge-tutupin masalah pake tambalan yang keliatan meyakinkan doang.
