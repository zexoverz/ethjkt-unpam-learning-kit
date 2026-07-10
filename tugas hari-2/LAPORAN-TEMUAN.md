# LAPORAN TEMUAN — PASAR PAGI (Bug Bounty Hari 2)

Tim Keamanan. Setiap temuan dibuktiin sendiri di browser/DevTools, bukan
cuma nebak dari baca kode.

Status target: **2 BUG / 3 KEAMANAN / 2 ETIKA**.
Progress laporan ini: baru area **VALIDASI INPUT** (Checkpoint 1).

---

## Temuan #1: [BUG] Input jumlah non-angka bikin Total & keranjang jadi `NaN`

- **Masalahnya apa (bahasa sendiri):**
  Kolom jumlah di keranjang (`<input type="number" class="edit-quantity-input">`)
  nerima apa aja tanpa divalidasi. Kalau dikosongin atau diketik huruf,
  `parseInt` ngasih `NaN`. Karena `NaN <= 0` itu `false`, kode malah nyimpen
  `cart[id].count = NaN`. Akibatnya seluruh perhitungan ikut `NaN`.

- **Lokasi kode:**
  - `keranjang.js:283` → `const quantity = parseInt(target.value, 10);`
  - `keranjang.js:158-166` → fungsi `updateQuantity` (nggak ada guard `Number.isNaN`).

- **Cara buktiinnya (langkah persis):**
  1. Buka `index.html`, klik `+` di satu buah biar masuk keranjang.
  2. Di input jumlah pada keranjang, hapus angkanya sampai kosong (atau ketik `abc`).
  3. Lihat **Total** → berubah jadi `NaN`. Badge keranjang di header juga `NaN`.
  4. (Opsional) Buka DevTools > Console, ketik proof: `parseInt("", 10)` → `NaN`,
     dan `NaN <= 0` → `false`.

- **Kenapa ini bahaya / siapa yang rugi:**
  Toko keliatan rusak/nggak profesional; user bingung harus bayar berapa.
  Kalau angka `NaN` ini kebawa ke sistem pembayaran/pesanan, order bisa gagal
  atau tersimpan dengan nilai kotor. Kepercayaan pembeli langsung anjlok.

- **Cara betulinnya:**
  Validasi hasil parse sebelum dipakai. Contoh:
  ```js
  const quantity = parseInt(target.value, 10);
  if (Number.isNaN(quantity)) return; // atau set ke 1 / minta koreksi
  updateQuantity(target.dataset.id, quantity);
  ```
  Prinsip: **jangan pernah percaya input user** — validasi di batas sistem,
  fail fast dengan nilai yang aman.

---

## Temuan #2: [BUG] Tidak ada batas jumlah (min/max/integer) yang benar

- **Masalahnya apa (bahasa sendiri):**
  Selain `NaN`, jumlah barang nggak punya batas atas dan nggak diikat ke stok.
  User bisa ngetik `999999` dan diterima apa adanya. Angka negatif nggak
  divalidasi — cuma "kebetulan" ketangkep lewat cabang `quantity <= 0` yang
  malah **menghapus item diam-diam**, bukan nolak input. Nilai desimal (`2.9`)
  dipangkas `parseInt` jadi `2` tanpa kasih tau user.

- **Lokasi kode:**
  - `keranjang.js:158-166` → `updateQuantity` (tidak ada cek batas atas / stok).
  - `index.html:103` → atribut `min="1"` cuma ngatur tombol spinner, nggak
    mencegah user ngetik/hapus manual.

- **Cara buktiinnya (langkah persis):**
  1. Tambah satu buah ke keranjang.
  2. Ketik `999999` di input jumlah → Total ikut membengkak tanpa penolakan,
     padahal kartu produk teriak "tinggal sekian lagi".
  3. Ketik `-3` → item malah hilang dari keranjang (bukan pesan error).

- **Kenapa ini bahaya / siapa yang rugi:**
  Angka jumlah nggak nyambung ke stok yang diklaim toko → data pesanan nggak
  bisa dipercaya. Perilaku hapus-diam-diam pas negatif bikin user kaget
  kehilangan barang. Ini juga nunjukin klaim "stok" cuma pajangan (lihat
  catatan dark pattern di checkpoint etika nanti).

- **Cara betulinnya:**
  Paksa rentang & tipe yang valid di satu tempat, mis:
  ```js
  function updateQuantity(id, quantity) {
    if (!cart[id]) return;
    if (!Number.isInteger(quantity) || quantity <= 0) {
      deleteItem(id); // atau tolak & kembalikan nilai lama
      return;
    }
    const maks = cart[id].stok ?? 99; // idealnya batas dari stok resmi
    cart[id].count = Math.min(quantity, maks);
    renderCart();
  }
  ```

---

## Temuan #3: [BUG] Total tidak diformat (`toFixed`) → muncul sampah floating-point

- **Masalahnya apa (bahasa sendiri):**
  Hampir semua tampilan uang pakai `.toFixed(2)`, tapi **Total akhir enggak**.
  Nilai `total` (angka mentah) langsung dimasukin ke DOM. Jadi harga bisa
  tampil `4.8` (bukan `4.80`) atau bahkan artefak seperti `5.699999999999999`.

- **Lokasi kode:**
  - `keranjang.js:123` → `totalPriceEl.textContent = total;` (tanpa `.toFixed(2)`).
  - `keranjang.js:231` → baris Total di modal review: `<span>$${total}</span>` (mentah).

- **Cara buktiinnya (langkah persis):**
  1. Belanja kombinasi yang bikin desimal "susah", mis. beberapa buah dengan
     harga `.1`/`.2` di belakang koma, plus biaya penanganan `0.30`.
  2. Perhatiin Total di sidebar dan di modal checkout → format beda dari harga
     per-item, kadang muncul deretan angka panjang.

- **Kenapa ini bahaya / siapa yang rugi:**
  Uang ditampilin nggak konsisten dan keliatan nggak profesional. Selisih
  pembulatan pada uang = sumber sengketa antara pembeli dan toko.

- **Cara betulinnya:**
  Samain dengan tampilan lain: `totalPriceEl.textContent = total.toFixed(2);`
  dan di modal `<span>$${total.toFixed(2)}</span>`. Idealnya hitung uang dalam
  satuan sen (integer) untuk hindari galat floating-point.

---

## Temuan #4: [KEAMANAN] Harga diambil dari DOM (`data-price`) — bisa diedit user

- **Masalahnya apa (bahasa sendiri):**
  Harga resmi produk ada di array `products` (sumber terpercaya). Tapi harga itu
  "dijemur" ke atribut `data-price` di tombol `+`, dan pas diklik, kode ngambil
  harga dari atribut DOM itu — bukan dari array resmi. Lebih parah, `addToCart`
  malah **menimpa** harga produk dengan nilai dari layar. Karena DOM 100%
  dikuasai pembeli, harga bisa dipalsuin jadi berapa pun.

- **Lokasi kode:**
  - `keranjang.js:62` → `data-price="${product.price}"` (harga dijemur ke DOM).
  - `keranjang.js:257` → `addToCart(target.dataset.id, Number(target.dataset.price));`
  - `keranjang.js:136` → `cart[id].price = price;` (harga resmi ditimpa nilai DOM).

- **Cara buktiinnya (langkah persis):**
  1. Buka `index.html`, F12 → tab **Elements**.
  2. Temukan tombol `+` Apel Fuji, ubah `data-price="1.5"` jadi `data-price="0.01"`.
  3. Klik `+` tombol itu → Apel masuk seharga **$0.01/buah**, Total ikut palsu.
  4. Alternatif via Console:
     `document.querySelector('.plus-button').dataset.price = "0.01";` lalu klik.
  5. Coba juga `data-price="-5"` → Total bisa mengecil / minus.

- **Kenapa ini bahaya / siapa yang rugi:**
  Keputusan harga — hal paling sensitif di toko — diputus di sisi client yang
  bisa diutak-atik siapa pun cukup pakai DevTools bawaan. Pembeli bisa beli
  semua buah seharga receh. Yang rugi: toko (pendapatan bocor) dan petani.
  Melanggar prinsip inti **never trust the client**.

- **Cara betulinnya:**
  Jangan pernah ambil harga dari DOM. Cari harga dari sumber resmi berdasarkan
  `id`, dan (idealnya) hitung ulang total di **server** saat checkout:
  ```js
  function addToCart(id) {
    const product = products.find((item) => item.id == id);
    if (!product) return;
    if (!cart[id]) cart[id] = { ...product, count: 0 };
    cart[id].price = product.price; // harga resmi, bukan dari layar
    cart[id].count++;
    renderCart();
  }
  ```
  Prinsip: harga & total wajib divalidasi/dihitung ulang di server; angka di
  browser cuma untuk tampilan, bukan sumber kebenaran.

---

## Temuan #5: [KEAMANAN] XSS — catatan user dirender pakai `innerHTML`

- **Masalahnya apa (bahasa sendiri):**
  Catatan buat petani diketik user, lalu di sidebar dirender pakai `innerHTML`
  tanpa di-escape. Artinya kalau user ngetik tag HTML/handler event, itu
  dieksekusi sebagai kode, bukan ditampilin sebagai teks. Ironisnya, modal
  review nampilin note yang sama pakai `textContent` (aman) — jadi ada
  inkonsistensi: satu tempat aman, satu tempat bolong.

- **Lokasi kode:**
  - `keranjang.js:115` → `preview.innerHTML = "Catatan: " + note;` (BAHAYA).
  - `keranjang.js:219` → `n.textContent = "Catatan: " + note;` (aman, pembanding).
  - Komentar `// innerHTML biar tulisannya rapi` = alasan menyesatkan.

- **Cara buktiinnya (langkah persis):**
  1. Buka `index.html`, masukin minimal 1 buah ke keranjang (note cuma kerender
     kalau keranjang nggak kosong).
  2. Di textarea "Catatan buat petani", ketik:
     `<img src=x onerror=alert('XSS-Pasar-Pagi')>`
  3. Begitu diketik, `renderCart` jalan → `innerHTML` masang `<img>` src rusak
     → `onerror` nembak → **alert muncul** (script user tereksekusi).
  4. Bukti tambahan: `<img src=x onerror="console.log(document.cookie)">`.

- **Kenapa ini bahaya / siapa yang rugi:**
  `innerHTML` nge-parse string jadi HTML, jadi handler event ikut hidup. Di
  skenario nyata note dikirim & ditampilin di dashboard petani/admin →
  jadi **stored XSS**: payload jalan di browser orang lain, bisa nyolong
  cookie/sesi, ubah halaman, atau redirect ke situs jahat. Rugi: petani/admin
  dan pembeli lain.

- **Cara betulinnya:**
  Jangan pakai `innerHTML` untuk data user. Pakai `textContent` (samain dengan
  modal yang udah bener):
  ```js
  preview.textContent = "Catatan: " + note;
  ```
  Kalau memang butuh HTML kaya, sanitasi dulu (mis. DOMPurify) atau escape
  entitas. Prinsip: **perlakukan semua input user sebagai teks**, kecuali
  sengaja disanitasi.

---

## Temuan #6: [KEAMANAN] Kupon rahasia & logika diskon ada di sisi client

- **Masalahnya apa (bahasa sendiri):**
  Kode kupon "internal petani" ditulis polos di JavaScript client, dan
  keputusan diskon 90% diputuskan sepenuhnya di browser. Dua masalah: (1)
  rahasia yang katanya "jangan disebar" justru kebaca siapa pun lewat View
  Source; (2) harga akhir diputus di sisi yang 100% dikuasai pembeli.

- **Lokasi kode:**
  - `keranjang.js:32` → `const KUPON_RAHASIA = "TEMANFARMER";` (rahasia di client).
  - `keranjang.js:33` → `let diskon = 0;` (state harga di browser).
  - `keranjang.js:169-182` → `applyCoupon` set `diskon = 0.9` di client.

- **Cara buktiinnya (langkah persis):**
  1. Buka `index.html`, klik kanan → **View Source** (atau F12 → Sources →
     `keranjang.js`).
  2. Cari `KUPON_RAHASIA` → ketemu string `"TEMANFARMER"` polos.
  3. Ketik `TEMANFARMER` di kolom kupon → klik "Pakai" → diskon 90% aktif.
     "Rahasia khusus petani" bisa dipakai siapa aja.
  4. Poin lanjutan: karena total & diskon dihitung ulang cuma di client
     (tanpa server), tidak ada yang mencegah manipulasi harga akhir.

- **Kenapa ini bahaya / siapa yang rugi:**
  Diskon 90% itu keputusan uang besar yang diputus di tempat yang dikuasai
  pembeli, plus rahasianya sebenarnya terbuka. Semua orang bisa klaim diskon
  khusus petani → margin toko hancur. Ini gabungan **secret in client-side
  code** + **trusting the client for pricing logic**.

- **Cara betulinnya:**
  Validasi kupon di **server**: client cuma kirim kode kupon, server yang cek
  keabsahan, hitung diskon, dan kembalikan total final. Jangan pernah simpan
  daftar kupon/rahasia di kode client. Total yang ditampilkan client hanya
  perkiraan; angka yang mengikat adalah hasil hitung server saat checkout.

---

## Temuan #7: [ETIKA] Stok palsu (fake scarcity) dari `Math.random()`

- **Masalahnya apa (bahasa sendiri):**
  Angka "tinggal sekian lagi hari ini!" bukan stok beneran — diacak ulang tiap
  kali produk dirender. Karena `renderProducts` dipanggil di dalam
  `renderCart`, angkanya berubah tiap klik `+`/`-` atau tiap refresh. Tujuannya
  bikin pembeli panik & buru-buru beli.

- **Lokasi kode:**
  - `keranjang.js:47` → `const sisa = Math.floor(Math.random() * 5) + 1;`
  - `keranjang.js:58` → `<p class="stock">tinggal ${sisa} lagi hari ini!</p>`
  - `keranjang.js:125` → `renderProducts()` dipanggil dari `renderCart` (re-acak).

- **Cara buktiinnya (langkah persis):**
  1. Buka `index.html`, perhatiin angka "tinggal X lagi" pada satu produk.
  2. Klik `+`/`-` beberapa kali, atau refresh halaman.
  3. Angkanya loncat acak (kadang naik, kadang turun) tanpa hubungan dengan
     pembelian. Stok asli nggak mungkin nambah sendiri.

- **Kenapa ini nggak adil / siapa yang rugi:**
  Ini dark pattern "false urgency": kode-nya jalan sempurna, tapi sengaja
  didesain memanipulasi emosi pembeli supaya panik dan beli tanpa pikir
  panjang. Yang rugi: pembeli (dibohongin), dan reputasi toko kalau ketahuan.

- **Cara betulinnya:**
  Tampilkan stok dari data nyata (persediaan sebenarnya), bukan angka acak.
  Kalau memang stok belum dilacak, jangan tampilkan klaim kelangkaan sama
  sekali. Jujur > menakut-nakuti.

---

## Temuan #8: [ETIKA] Biaya penanganan tersembunyi (drip pricing)

- **Masalahnya apa (bahasa sendiri):**
  `HANDLING_FEE` diam-diam ditambahkan ke Total di sidebar tanpa baris rincian.
  Pembeli lihat Total lebih besar dari jumlah harga barang, tapi nggak dikasih
  tau kenapa. Rinciannya baru muncul di modal review (detik terakhir sebelum
  konfirmasi). Biaya disembunyikan di awal, diungkap belakangan.

- **Lokasi kode:**
  - `keranjang.js:29` → `const HANDLING_FEE = 0.30;`
  - `keranjang.js:120` → `let total = totalPrice + HANDLING_FEE;` (sidebar, tanpa rincian)
  - `keranjang.js:229` → baru dirinci di modal review.

- **Cara buktiinnya (langkah persis):**
  1. Masukin 1 Apel Fuji ($1.50) ke keranjang.
  2. Lihat Total di sidebar → `1.8`, bukan `1.50`.
  3. Selisih $0.30 nggak dijelasin di sidebar; baru nongol pas buka checkout.

- **Kenapa ini nggak adil / siapa yang rugi:**
  Dark pattern "hidden costs / drip pricing": biaya nyata disembunyikan di awal
  supaya harga keliatan lebih murah, lalu diselipin di akhir saat pembeli udah
  terlanjur mau bayar. Yang rugi: pembeli (bayar lebih dari yang dikira).

- **Cara betulinnya:**
  Tampilkan rincian biaya sejak awal, di tempat yang sama dengan Total (subtotal
  + biaya penanganan + total), jelas dan konsisten di sidebar maupun modal.
  Transparansi harga dari langkah pertama.

---

## Rekap & catatan penomoran

Target README: **2 BUG / 3 KEAMANAN / 2 ETIKA = 7 temuan**. Pemetaan:

```
BUG      (2) → #1 Input nakal (NaN)  · #3 Total tanpa toFixed (floating-point)
KEAMANAN (3) → #4 Harga dari DOM     · #5 XSS note · #6 Kupon rahasia client
ETIKA    (2) → #7 Stok palsu random  · #8 Biaya tersembunyi
```

**Temuan #2 (tidak ada batas jumlah min/max/stok) = kandidat TEMUAN KE-8 / STRETCH**
("batas-batas yang lupa dipasang"), bukan bagian dari 7 inti. Tetap dicatat
karena tetap cacat nyata yang layak diperbaiki.

---

## Refleksi penutup

**Bedanya "kode jalan" vs "kode benar & jujur":**
Semua temuan di atas ada di kode yang JALAN mulus — tampilan rapi, ada modal,
ada toast sukses. "Kode jalan" cuma berarti nggak error saat kondisi normal.
"Kode benar & jujur" berarti: tahan input nakal (validasi), nggak bisa
diakalin (harga/diskon divalidasi server, bukan client), nggak bocorin data
(escape input → cegah XSS), dan nggak memanipulasi pengguna (stok & harga
ditampilkan jujur). Gerbang terakhir sebelum uang & kepercayaan orang
dipertaruhkan adalah manusia yang MEMBACA & MEMBUKTIKAN, bukan AI yang
sekadar bikin kodenya "jalan".
