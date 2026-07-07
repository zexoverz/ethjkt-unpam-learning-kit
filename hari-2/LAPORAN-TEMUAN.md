# REPORT — PASAR PAGI (HARI 2: BUG BOUNTY)

> Catatan: ini laporan hasil BEDAH kode `main.js` + validasi logika pakai Node.
> Setiap temuan ditulis dengan **alur kode** (kenapa bisa terjadi), **bukti test**,
> dan **cara betulin** — biar bisa dipelajari, bukan cuma dibaca kesimpulannya.
>
> Sebaran target README: 2 BUG, 3 KEAMANAN, 2 ETIKA. Di bawah ditandai per kategori.

---

## DAFTAR TEMUAN

| # | Kategori | Singkat | Lokasi |
|---|----------|---------|--------|
| 1 | BUG | Total tampil mentah → desimal kotor / `NaN` | `renderCart` & `openReview` |
| 2 | BUG | Input jumlah nakal → `NaN`/minus merambat ke total | `updateQuantity` + `input` handler |
| 3 | KEAMANAN | XSS lewat catatan petani (`innerHTML` mentah) | `renderCart` note preview |
| 4 | KEAMANAN | Harga diambil dari tombol HTML (bisa di-edit DevTools) | `addToCart` + `data-price` |
| 5 | KEAMANAN | Kupon rahasia & logika diskon diputus di client | `KUPON_RAHASIA` + `applyCoupon` |
| 6 | ETIKA | Stok "tinggal X lagi" di-karang `Math.random` tiap render | `renderProducts` |
| 7 | ETIKA | Biaya penanganan muncul diam-diam di detik terakhir | `HANDLING_FEE` di total |
| 8 | STRETCH | Tidak ada batas/cap → jumlah ekstrem & kupon tanpa proteksi | `applyCoupon` / `updateQuantity` |

---

## TEMUAN 1 — BUG: Total ditampilkan mentah (desimal kotor / NaN)

**Masalahnya apa:**
Angka Total ditulis ke layar **tanpa `.toFixed(2)`**, padahal baris-baris di atasnya (Subtotal, Biaya, Kupon) semuanya pakai `.toFixed(2)`. Akibatnya dua hal: (a) error floating-point kelihatan mentah, (b) kalau ada `NaN`, layar nulis huruf `NaN`.

**Alur kodenya (pelan-pelan):**

Sidebar keranjang — `renderCart`:
```js
let totalPrice = 0;
Object.values(cart).forEach((item) => {
  totalPrice += item.count * item.price;     // jumlah baris
});
let total = totalPrice + HANDLING_FEE;       // +0.30
total = total - total * diskon;              // potong diskon
totalPriceEl.textContent = total;            // ⚠️ MENTAH, tanpa toFixed
```
Bandingin dengan baris breakdown di modal `openReview`:
```js
Subtotal       $${subtotal.toFixed(2)}    // rapi
Biaya          $${HANDLING_FEE.toFixed(2)} // rapi
Kupon (-90%)   -$${potongan.toFixed(2)}    // rapi
Total          $${total}                   // ⚠️ MENTAH
```

Kenapa ini bisa "aneh"? Karena JavaScript itu **floating point**, bukan uang. Operasi `13.80 * 0.1` di JS nggak menghasilkan `1.38` bulat, tapi `1.379999999999999`. Kalau `total` ditulis mentah, angka itu langsung kelihatan di layar.

**Bukti test (Node):**
```
TEST 1: 3*1.5 + 2*4.5 + 0.30, tanpa diskon => 13.8        (tampil "13.8", bukan "13.80")
TEST 2: 13.80 dengan kupon 90% => 1.379999999999999       (seharusnya 1.38!)
TEST 3: 5.0+0.30=5.30, *0.1 => 0.5300000000000002         (seharusnya 0.53)
TEST 3: 3*1.5+0.30=4.80, *0.1 => 0.47999999999999954
TEST 4: count=NaN => total = NaN | String(total) => "NaN" (layar nulis "NaN")
```

**Kenapa bahaya:**
- Pembeli lihat harga `1.379999999999999` → toko kelihatan murahan/buggy, menurunin kepercayaan.
- Kalau `NaN` muncul, pembeli bingung (dan ini ngarah ke Temuan 2).
- Untuk pelaporan pajak/pembukuan, angka nggak konsisten antara baris breakdown (rapi) vs Total (kotor).

**Cara betulin:**
```js
totalPriceEl.textContent = total.toFixed(2);            // sidebar
// dan di modal:
<span>$${total.toFixed(2)}</span>                       // grand total
```
Prinsip umum: **uang selalu diformat ke presisi tetap (2 desimal) sebelum ditampilkan.** Lebih dalam lagi, untuk toko beneran sebaiknya hitung pakai **integer sen** (kalikan 100) atau library desimal (mis. `decimal.js`) supaya operasi aritmatika uang nggak kena error float sama sekali.

---

## TEMUAN 2 — BUG: Input jumlah nakal → NaN / minus merambat ke total

**Masalahnya apa:**
Kolom jumlah di keranjang adalah `<input type="number">`. Kode narik nilainya pakai `parseInt` lalu langsung jadiin `count`. Kalau user ngisi kosong/huruf, `parseInt` menghasilkan `NaN`, dan `NaN` itu merambat ke total. Kalau user ngisi minus, `count` bisa minus.

**Alur kodenya:**

Handler `input`:
```js
document.addEventListener("input", (event) => {
  if (target.classList.contains("edit-quantity-input")) {
    const quantity = parseInt(target.value, 10);   // bisa NaN
    updateQuantity(target.dataset.id, quantity);
  }
});
```
Fungsi `updateQuantity`:
```js
function updateQuantity(id, quantity) {
  if (!cart[id]) return;
  if (quantity <= 0) {        // ⚠️ NaN <= 0 itu FALSE
    delete cart[id];
  } else {
    cart[id].count = quantity; // count = NaN atau minus masuk di sini
  }
  renderCart();
}
```

Titik kritisnya: **`NaN <= 0` bernilai `false`** di JavaScript. Jadi cabang `delete` nggak kepanggil, dan `count = NaN` disimpan ke cart. Dari situ:
```
item.count * item.price  →  NaN * 1.5  →  NaN
totalPrice += NaN        →  NaN
total = NaN + 0.30       →  NaN
totalPriceEl.textContent = NaN  →  layar nulis "NaN"
```

Bukti `parseInt` untuk berbagai input nakal:
```
parseInt("")     => NaN     | (NaN<=0)? false   → count = NaN
parseInt("abc")  => NaN     | (NaN<=0)? false   → count = NaN
parseInt("   ")  => NaN     | (NaN<=0)? false   → count = NaN
parseInt("-3")   => -3      | (-3<=0)?  true    → hapus item (ok)
parseInt("0")    => 0       | (0<=0)?   true    → hapus item (ok)
parseInt("2.7")  => 2       → count=2 (potong desimal diam-diam)
parseInt("5abc") => 5       → count=5 (parse longgar)
```

Catatan: minus sebenarnya ke-handle karena `-3 <= 0` true → hapus. Tapi `NaN` lolos. Dan `parseInt("2.7")` jadi `2` — validasi longgar, user nggak tau desimalnya dipotong.

**Bukti test (Node):**
```
TEST 4: cart dengan count=NaN => total = NaN | String(total) => "NaN"
```
Artinya di layar bakal muncul angka aneh `NaN` di Total (gandengan Temuan 1).

**Kenapa bahaya:**
- Keranjang rusak → total `NaN` → checkout jadi nggak masuk akal.
- Pembeli frustasi / curiga toko error.
- Edge case: kalau kode dikembangin lebih lanjut (mis. kirim ke server), `NaN`/minus bisa bikin backend crash atau data rusak.

**Cara betulin:**
Validasi **sebelum** count dipakai, dan tangani `NaN` eksplisit:
```js
function updateQuantity(id, quantity) {
  if (!cart[id]) return;
  if (!Number.isFinite(quantity)) return;   // tolak NaN/Infinity
  if (quantity <= 0) { delete cart[id]; }
  else { cart[id].count = Math.floor(quantity); } // atau tolak desimal dgn validasi input
  renderCart();
}
```
Prinsip umum: **jangan pernah percaya input user** — validasi tipe & rentangnya sebelum dipakai untuk apa pun ("validate at the boundary"). Aturan ZAML (zero-trust input): kalau data bisa dari luar, anggap nakal sampai dibuktikan bersih.

---

## TEMUAN 3 — KEAMANAN: XSS lewat catatan petani (innerHTML mentah)

**Masalahnya apa:**
Catatan yang user ketik di kolom "Catatan buat petani" ditampilkan **mentah** pakai `innerHTML`. Kalau user ngetik tag HTML/script, itu dieksekusi browser → **XSS (Cross-Site Scripting)**.

**Alur kodenya:**
```js
const note = document.getElementById("note").value;
if (note) {
  const preview = document.createElement("div");
  preview.className = "note-preview";
  preview.innerHTML = "Catatan: " + note;   // ⚠️ MENTAH
  cartDetailsEl.appendChild(preview);
}
```
Karena pakai `innerHTML`, apa pun yang user ketik di-parse sebagai HTML. Contoh payload:
```
<img src=x onerror="alert(document.cookie)">
```
Browser bikin elemen `<img>`, gagal load `src=x`, lalu jalankan `onerror` → script jalan di halaman korban.

**Perbandingan menarik** — di modal review, kode pakai cara AMAN:
```js
const n = document.createElement("div");
n.textContent = "Catatan: " + note;   // ✅ textContent = aman dari XSS
noteWrap.appendChild(n);
```
`textContent` selalu nulis sebagai teks biasa, nggak pernah di-parse jadi HTML. Jadi kode yang sama punya **dua versi**: yang aman (modal) dan yang rawan (sidebar). Ini bukti kalau kerentanannya nyata — buktinya dev-nya sendiri udah tau cara amannya di tempat lain.

**Kenapa bahaya:**
- Script jalan di **browser korban** (session user lain kalau catatan ditampilkan ke mereka, atau user sendiri).
- Bisa curi cookie/localStorage, redirect ke phishing, atau lakuin aksi atas nama user.
- Di toko beneran, catatan sering dilihat petani/admin → XSS ke dashboard internal.

**Cara betulin:**
```js
preview.textContent = "Catatan: " + note;   // konsisten pakai textContent
```
Prinsip umum: **jangan pernah sisipkan data user ke HTML mentah.** Pakai `textContent` untuk teks, atau kalau terpaksa `innerHTML`, lakukan **escaping** (encode `<`, `>`, `&`, `"`, `'`). Atau pakai framework yang otomatis escape (React/Vue). Ini prinsip **output encoding** — data di-escape sesuai konteks (HTML, attribute, JS, URL) tepat sebelum dirender.

---

## TEMUAN 4 — KEAMANAN: Harga diambil dari tombol HTML (bisa di-edit DevTools)

**Masalahnya apa:**
Harga yang dipakai buat ngitung total **bukan dari data produk resmi** di memori, tapi dari atribut `data-price` di tombol `+` yang ada di HTML. Padahal elemen HTML bisa di-edit user lewat DevTools → user bisa **ngakalin harga**.

**Alur kodenya:**

Saat render produk, harga ditempel di tombol:
```js
<button class="quantity-button plus-button" data-id="${product.id}" data-price="${product.price}">+</button>
```
Lalu saat klik `+`, harga diambil dari tombol itu:
```js
if (target.classList.contains("plus-button")) {
  addToCart(target.dataset.id, Number(target.dataset.price));   // ⚠️ harga dari tombol
}
```
Dan di `addToCart`:
```js
function addToCart(id, price) {
  const product = products.find((item) => item.id == id);
  if (!product) return;
  if (!cart[id]) { cart[id] = { ...product, count: 0 }; }
  cart[id].price = price;   // ⚠️ harga dari argumen (dari tombol) menimpa harga resmi!
  cart[id].count++;
  renderCart();
}
```
Perhatiin: `product` (dari katalog resmi) punya `price` yang benar. Tapi baris `cart[id].price = price` **menimpa** harga resmi pakai harga dari tombol HTML. Padahal `product` udah di-spread ke cart — harga resmi sebenernya udah ada di `cart[id].price`. Penimpaan ini justru **membuka celah**.

**Cara buktiin di DevTools:**
1. Tambah Apel ke cart → harga $1.50.
2. Klik kanan tombol `+` di Apel → Inspect → edit `data-price="0.01"`.
3. Klik `+` lagi → `cart[id].price` jadi `0.01`.
4. Total jadi murah banget. User ngakalin harga tinggal edit atribut.

**Kenapa bahaya:**
- **Client-side trust fallacy**: apa pun di browser bisa diubah user. Harga, diskon, total yang dihitung di client **nggak boleh dipercaya**.
- Kalau total ini langsung dipakai buat charge pembeli (tanpa verifikasi server), user bisa bayar serupiah.
- Bahkan kalau server hitung ulang, kalau server percaya `price`/`total` dari client → sama bahayanya.

**Cara betulin:**
Di client: ambil harga **hanya dari katalog resmi**, jangan dari DOM:
```js
function addToCart(id) {
  const product = products.find((item) => item.id == id);
  if (!product) return;
  if (!cart[id]) { cart[id] = { id: product.id, name: product.name, price: product.price, count: 0 }; }
  cart[id].count++;
  renderCart();
}
```
Tapi ini **belum cukup** untuk toko beneran. Prinsip sesungguhnya: **harga, diskon, dan total HARUS divalidasi & dihitung ulang di server**. Client cuma kirim `productId` + `quantity` + `couponCode`; server yang nyari harga resmi dari DB, ngecek kupon, dan itung total final. Apa pun di client itu cuma **preview**, bukan sumber kebenaran.

---

## TEMUAN 5 — KEAMANAN: Kupon rahasia & logika diskon diputus di client

**Masalahnya apa:**
Kode kupon rahasia (`TEMANFARMER`) ditulis terang-terangan di `main.js` yang bisa dilihat semua orang lewat View Source. Plus keputusan "boleh diskon 90% atau nggak" diputus di browser — user bisa langsung ngeset `diskon = 0.9` lewat console.

**Alur kodenya:**
```js
const KUPON_RAHASIA = "TEMANFARMER";   // ⚠️ rahasia keliatan di View Source
let diskon = 0;

function applyCoupon() {
  const code = document.getElementById("coupon").value;
  if (code === KUPON_RAHASIA) {
    diskon = 0.9;                       // ⚠️ keputusan diskon di client
    ...
  }
}
```
Celah ganda:
1. **Rahasia bocor**: buka DevTools → Sources / View Source → `KUPON_RAHASIA` keliatan. Siapa pun tau kuponnya.
2. **Logika client bisa di-bypass**: user buka Console, ketik `diskon = 0.9; renderCart();` → langsung diskon 90% tanpa kupon. Bahkan `diskon = 1` → gratis 100% (tidak ada batas `0 <= diskon <= 0.x`).

**Bukti (konsep):**
```
View Source main.js → ketemu "TEMANFARMER"
Console: diskon = 0.9; renderCart();   → total langsung dipotong 90%
Console: diskon = 1; renderCart();     → bayar $0 (gratis total, ga ada cap)
```
Ini nyambung sama Temuan 8 (tidak ada batas).

**Kenapa bahaya:**
- Kupon "internal petani" bocor → semua orang bisa pake diskon 90%.
- Bypass total → user bikin sendiri diskon 100%, toko rugi total.
- Diskon 90% buat kupon internal itu sendiri juga ekstrem (dark pattern kalau dipikir: "teman petani" dapot potongan brutal, pembeli biasa nggak).

**Cara betulin:**
- **Jangan simpan rahasia di client.** Kupon itu cukup diketik user, dikirim ke server, server cek di DB. Client nggak pernah tau daftar kupon valid.
- **Keputusan diskon di server.** Server hitung ulang total setelah verifikasi kupon; client cuma nampilin hasil.
- Tambah batas validasi meski di client (defense in depth): `diskon` cuma bisa nilai dari set terbatas, bukan variabel bebas.

Prinsip umum: **client nggak boleh jadi sumber kebenaran untuk hal yang ada uang/kepercayaan di dalamnya.** Setiap keputusan sensitif (harga, diskon, otorisasi) wajib ada di server.

---

## TEMUAN 6 — ETIKA: Stok "tinggal X lagi" di-karang Math.random (dark pattern)

**Masalahnya apa:**
Setiap kartu produk nunjukin "tinggal X lagi hari ini!" yang bikin user buru-buru (FOMO). Tapi angkanya **bukan stok beneran** — di-generate `Math.random()` **setiap kali kartu di-render**. Refresh / tambah barang → angka berubah. Ini dark pattern: **false scarcity** (stok palsu).

**Alur kodenya:**
```js
function renderProducts() {
  products.forEach((product) => {
    const quantity = cart[product.id] ? cart[product.id].count : 0;
    const sisa = Math.floor(Math.random() * 5) + 1;   // ⚠️ stok karangan, tiap render beda
    ...
    <p class="stock">tinggal ${sisa} lagi hari ini!</p>
  });
}
```

Worse: `renderProducts()` dipanggil dari dalam `renderCart()`, yang dipanggil **setiap kali** cart berubah (tambah/kurang/edit). Jadi:
1. Kamu tambah Apel → semua kartu re-render → angka "sisa" **semua produk berubah**.
2. Kamu refresh halaman → angka beda lagi.
3. Kamu nggak beli apa-apa, cuma klik-klik → angka fluktuatif kayak dadu.

**Bukti konsep:**
```
Buka toko → Apel "tinggal 3 lagi"
Klik + di Jeruk → Apel jadi "tinggal 1 lagi"  (padahal kamu nggak beli Apel!)
Refresh → Apel "tinggal 5 lagi"
```
Stok beneran nggak pernah berkurang saat beli. Angkanya murni teaterikal buat bikin panik.

**Kenapa ini isu ETIKA (bukan bug teknis):**
- Kode "bener" (jalan), tapi **tujuannya menipu**. Membuat urgensi palsu supaya user checkout cepat tanpa mikir.
- Pelanggaran kepercayaan: toko ngakalin psikologi pembeli.
- Di banyak yurisdiksi, klaim stok/scarcity palsu itu **ilegal** (periklanan menyesatkan).

**Cara betulin:**
- Kalau stok beneran ada, taruh di data resmi (`products[i].stock`), kurangi saat dibeli, dan **jangan re-generate acak**.
- Kalau nggak追踪 stok, **hapus** klaim scarcity sepenuhnya. Jangan karang angka.
Prinsip etika produk: **klaim yang bikin buru-buru harus mencerminkan kenyataan.** Urgensi yang dipalsukan = manipulasi.

---

## TEMUAN 7 — ETIKA: Biaya penanganan muncul diam-diam di detik terakhir (drip pricing)

**Masalahnya apa:**
`HANDLING_FEE = 0.30` ditambahkan ke total, tapi **nggak ditampilkan** di kartu produk atau sidebar keranjang sampai user sampai di modal checkout. Harga di kartu cuma `$1.50`, tapi total yang dibayar `$1.80`. Selisih $0.30 itu muncul **diam-diam di akhir**. Ini dark pattern: **drip pricing** (biaya menetes di detik-detik terakhir).

**Alur kodenya:**
- Kartu produk: `<p class="price">$${product.price.toFixed(2)}</p>` → cuma harga barang.
- Sidebar total: `totalPriceEl.textContent = total` (sudah termasuk fee) → tapi labelnya cuma "Total", nggak dijelaskan ada fee.
- Baru di modal review breakdown muncul baris "Biaya penanganan $0.30".

Jadi pembeli lihat harga murah di awal, baru sadar ada biaya extra pas mo bayar. Trik klasik: harga kelihatannya rendah, biaya extra ditambahkan belakangan biar susah mundur (sunk-cost / udah capek checkout).

**Bukti:**
```
Beli 1 Apel → kartu tulisannya $1.50
Lihat sidebar "Total" → $1.80   (selisih $0.30 nggak dijelasin di kartu)
Buka modal review → baru muncul baris "Biaya penanganan $0.30"
```

**Kenapa isu ETIKA:**
- Harga yang ditampilkan awal **bukan harga akhir**. Pembeli di-"hook" pakai harga rendah, lalu ditebius biaya extra di akhir.
- Fee-nya sah-sah aja, tapi **harus transparan dari awal**, bukan disembunyiin sampai checkout.
- Bandingin dengan stok palsu (Temuan 6): dua-duanya "kode jalan", tapi tujuannya sama — ngakalin pembeli.

**Cara betulin:**
- Tampilkan **total estimasi (barang + fee)** di sidebar sejak awal, dengan rincian fee kelihatan.
- Atau tampilkan fee di tiap kartu / di header biar user tau dari mulai.
- Prinsip: **harga yang ditampilkan = harga yang dibayar** (all-inclusive pricing). Biaya wajib nggak boleh "menetes" di akhir.

---

## TEMUAN 8 (STRETCH) — Tidak ada batas/cap (jumlah ekstrem & kupon tanpa proteksi)

**Masalahnya apa:**
README minta cari temuan ke-8: "batas yang lupa dipasang". Kode hampir nggak ada validasi batas di mana pun:

**A. Jumlah ekstrem.** `updateQuantity` nerima angka berapa pun (selama `> 0`):
```js
cart[id].count = quantity;   // bisa 999999999
```
User bisa input `999999999` → `total = 999999999 * 1.5 = 1499999998.5` → angka raksasa, atau bikin NaN/Infinity kalau digabung float. Tidak ada `max` di `<input type="number" min="1">` (cuma `min`, tanpa `max`).

**B. Diskon tanpa cap.** Seperti dibahas di Temuan 5: `diskon` variabel bebas, user bisa `diskon = 1` (gratis 100%) atau `diskon = -5` (total minus → toko "ngutang" pembeli). Tidak ada `0 <= diskon <= 0.9`.

**C. Angka ditampilin di dua tempat, nggak sinkron format.** Sidebar total: `textContent = total` (mentah). Modal total: `${total}` (mentah juga, tapi dalam template literal). Keduanya mentah, tapi **jalur hitungnya duplikat** (`renderCart` vs `openReview` masing-masing ngitung total sendiri). Kalau suatu hari satu diubah, yang satu lupa → dua total bisa beda. Ini "nggak sinkron" versi struktur: **logic duplication** tanpa single source of truth.

**Kenapa bahaya:**
- Jumlah ekstrem → overflow/angka kacau, atau kalau dikirim ke server bisa DoS/bikin error.
- Diskon tanpa cap → exploitasi harga.
- Duplikasi logika total → bug tersembunyi kalau kode berkembang.

**Cara betulin:**
- Tambah `max` di input + validasi rentang (`1 <= count <= 99` misalnya).
- Buat `diskon` konstanta/nilai ter-bounded; tolak nilai di luar `[0, 0.9]`.
- **Refaktor**: tarik perhitungan total jadi **satu fungsi** (`computeTotal(cart, diskon)`), dipanggil baik sidebar maupun modal. Single source of truth → nggak bisa nggak sinkron.

Prinsip: **defensive bounds** (selalu batasi input ke rentang masuk akal) + **DRY** (don't repeat yourself) untuk logika kritis.

---

## REFLEKSI PENUTUP — "Kode jalan" vs "Kode benar & jujur"

Setelah ngebedah Pasar Pagi, bedanya keliatan jelas:

**"Kode jalan"** = kalau di-run, nggak crash di happy path. Tombol bisa diklik, modal kebuka, toast muncul, angka keluar. Pasar Pagi lulus tes ini — kelihatan profesional, rapi, meyakinkan. Tapi itu standar yang **sangat rendah**: kode bisa jalan sempurna dan **tetap cacat**.

**"Kode benar"** = logikanya akurat di **semua kondisi**, bukan cuma yang diharapkan. Total harus rapi walau ada diskon (`toFixed`, bukan float mentah). Input nakal (`""`, `abc`, minus) harus ditolak, bukan jadi `NaN` yang merambat. Harga harus dari sumber resmi, bukan dari DOM yang bisa di-edit. Itu soal **robustness** & **correctness** di boundary.

**"Kode jujur"** = kode nggak menipu penggunanya. Stok palsu (`Math.random`) itu **berbohong** soal kelangkaan. Biaya yang muncul diam-diam itu **menyembunyikan** harga asli. Dua-duanya "jalan sempurna" secara teknis — tapi tujuannya memanipulasi. Ini pilihan etika, bukan bug sintaks.

Pelajaran terbesar dari Hari 2: **AI ngasilin kode yang "jalan" dengan sangat meyakinkan.** Tampilan rapi, alur keliatan profesional, ada modal & toast. Justru itu jebakannya — makin rapi, makin gampang percaya tanpa ngecek. Tugas kita sebagai "pilot"/gerbang terakhir bukan nyetujui kode yang jalan, tapi **membuktikan** kode itu benar (di edge case) dan jujur (nggak ngakalin user).

Konkret: setiap kali AI ngasih kode yang ada uang/kepercayaan di dalamnya, aku harus nanya tiga hal:
1. **Benar?** — Apa yang terjadi di input/condisi nakal? (BUG)
2. **Aman?** — Apa yang diputus di client? Apa rahasia yang bocor? Apa yang bisa di-edit user buat curang? (KEAMANAN)
3. **Jujur?** — Apa klaim yang bikin buru-buru/sembunyi biaya? Buat siapa untungnya? (ETIKA)

"Kode jalan" itu baru permulaan. "Benar & jujur" itu standar yang harus kita pegang sebelum duit & kepercayaan orang dipertaruhkan.

---

## APPENDIX — Cara Reproduksi (Checklist)

Buka `index.html` di browser + DevTools (F12).

- [ ] **T1 float mentah**: beli 3 Apel + 2 Stroberi, pakai kupon `TEMANFARMER` → lihat Total sidebar (muncul `1.3799...` bukan `1.38`).
- [ ] **T2 NaN**: isi kolom jumlah di keranjang dengan huruf/kosong → Total jadi `NaN`.
- [ ] **T3 XSS**: ketik `<img src=x onerror="alert(1)">` di catatan → alert muncul di sidebar (bukan di modal — modal pakai `textContent`).
- [ ] **T4 harga DOM**: inspect tombol `+` Apel, ubah `data-price="0.01"`, klik `+` → total turun drastis.
- [ ] **T5 kupon bocor**: View Source `main.js` → ketemu `TEMANFARMER`. Console: `diskon = 1; renderCart();` → bayar $0.
- [ ] **T6 stok palsu**: catat "sisa" Apel → klik `+` di Jeruk → angka sisa Apel berubah.
- [ ] **T7 biaya diam-diam**: bandingkan harga di kartu ($1.50) vs Total sidebar ($1.80) — selisih $0.30 muncul tanpa penjelasan di kartu.
- [ ] **T8 ekstrem**: isi jumlah `999999999` → total jadi raksasa. Console: `diskon = -1` → total minus.


---

# BAGIAN 2 â€” FIXES (CHECKPOINT 4): BENERIN + KENAPA PILIH SOLUSI INI

> Setiap fix di bawah dijelaskan: **kode sebelum â†’ kode sesudah â†’ kenapa solusi ini
> yang dipilih (bukan alternatif lain)**, plus hasil validasi pakai Node.
> File yang diubah: `main.js`, `index.html`, `style.css`. Tiap blok ditandai `[FIX #n]`.

Ringkasan validasi Node (semua fix lolos):
```
FIX #1  diskon 0.9 -> mentah 1.379999999999999 | formatUang: 1.38 âœ…
FIX #2  input "" / "abc" -> TOLAK NaN | "-3"/"0" -> HAPUS | "2.7" -> 2 âœ…
FIX #5  diskonAktif=1 -> clamp 0.9 | diskonAktif=-5 -> clamp 0 âœ…
FIX #6  Apel stock=12, cart=3 -> sisa 9 (konsisten, bukan random) âœ…
FIX #7  subtotal 13.50 + fee 0.30 tampil terpisah âœ…
FIX #8  input 999999 -> cap 99 âœ…
NaN     count=NaN -> total NaN -> formatUang: "0.00" (bukan "NaN") âœ…
```

---

## FIX #1 â€” Total diformat 2 desimal (`formatUang` + `toFixed`)

**Sebelum:**
```js
totalPriceEl.textContent = total;                              // mentah
// di modal: <span>$${total}</span>                            // mentah
```
**Sesudah:**
```js
function formatUang(angka) {
  if (!Number.isFinite(angka)) return "0.00";   // pengaman vs NaN/Infinity
  return angka.toFixed(2);
}
totalPriceEl.textContent = formatUang(ringkas.total);
// di modal: <span>$${formatUang(ringkas.total)}</span>
```

**Kenapa pilih `toFixed(2)` + helper `formatUang`?**
- `toFixed(2)` menyelesaikan akar masalahnya langsung: floating-point JS bikin `1.38` jadi `1.3799...`; format ke 2 desimal potong itu. Validasi Node membuktikan: `1.3799... â†’ "1.38"`.
- **Kenapa bukan `Math.round(total*100)/100`?** Itu cuma bulatin angka tapi tetap disimpan sebagai float â†’ pas ditampilkan mentah (`textContent = total`) angka kotor bisa muncul lagi. Kita perlu **format saat tampil**, bukan sekadar bulatkan saat hitung.
- **Kenapa bikin helper, bukan `.toFixed(2)` langsung di tiap tempat?** Dua alasan: (1) DRY â€” satu tempat ubah, semua ikut; (2) helper ini juga jadi **pertahanan terakhir** lewat `Number.isFinite` â€” kalau `NaN`/`Infinity` lolos entah dari mana, layar tetap nampil `0.00` bukan huruf `NaN`. Itu defense in depth.
- **Kenapa nggak pustaka desimal (decimal.js) atau integer sen?** Itu justru solusi *yang lebih benar* untuk toko beneran, karena `toFixed` cuma memperbaiki **tampilan**, bukan akurasi internal â€” kalau nilai float kotor dipakai untuk perhitungan lanjutan (pajak, kembalian), error tetap merembet. Tapi untuk latihan ini (toko statis tanpa backend), `toFixed` + helper sudah memenuhi standar "tampil benar". Di bagian prinsip aku tetap catat: produksi = integer sen / decimal lib.

---

## FIX #2 â€” Validasi input jumlah (tolak NaN, paksa integer, batasi rentang)

**Sebelum:**
```js
function updateQuantity(id, quantity) {
  if (!cart[id]) return;
  if (quantity <= 0) { delete cart[id]; }     // NaN<=0 = false â†’ lolos!
  else { cart[id].count = quantity; }          // count = NaN
  renderCart();
}
```
**Sesudah:**
```js
function updateQuantity(id, quantity) {
  if (!cart[id]) return;
  if (!Number.isFinite(quantity)) return;      // tolak NaN/Infinity di batas
  let q = Math.floor(quantity);                // paksa integer
  if (q < MIN_QTY) { delete cart[id]; }        // 0/minus â†’ hapus
  else { cart[id].count = Math.min(q, MAX_QTY); } // cap atas
  renderCart();
}
```

**Kenapa pilih cek `Number.isFinite` di awal fungsi?**
- Akar masalahnya: `parseInt("")` = `NaN`, dan `NaN <= 0` = `false` di JS â†’ cabang hapus nggak kepanggil â†’ `count = NaN` merambat ke total. Validasi Node membuktikan: sekarang `""`/`"abc"` â†’ **TOLAK NaN** (fungsi `return` awal, cart nggak berubah).
- **Kenapa `Number.isFinite` bukan `!isNaN(quantity)`?** `isFinite` sekalian nolak `Infinity` (yang bisa muncul kalau user iseng input angka raksasa via console). Lebih ketat. Selain itu `isNaN` punya jebakan: `isNaN(null)` = `false` padahal `null` bukan angka valid.
- **Kenapa `Math.floor`?** `parseInt("2.7")` = `2` (potong desimal di-mulut). Tapi kalau ada jalur lain yang lewat angka desimal (mis. refactor pakai `Number()`), `Math.floor` memastikan `count` selalu integer â€” nggak mungkin beli 2.7 apel.
- **Kenapa `return` (diam) ketika NaN, bukan `alert`/reset ke 1?** UX: kalau user lagi ngetik (mis. baru hapus angka, input kosong sebentar), `return` biarkan input sementara kosong tanpa mengacaukan cart. Force-reset ke 1 justru bikin input melompat-lompat saat diketik. Ini pilihan UX + safety.
- **Kenapa nilai minus masuk cabang hapus?** Karena `MIN_QTY=1` â†’ `q < 1` termasuk 0 dan minus. Lebih bersih daripada pisah `=== 0` dan `< 0`.

---

## FIX #3 â€” XSS catatan: `innerHTML` â†’ `textContent`

**Sebelum:**
```js
preview.innerHTML = "Catatan: " + note;   // âš ï¸ note = input user mentah
```
**Sesudah:**
```js
preview.textContent = "Catatan: " + note; // aman dari XSS
```

**Kenapa pilih `textContent`, bukan escaping manual / DOMPurify?**
- `textContent` **secara desain** tidak pernah mem-parse string sebagai HTML â€” apa pun yang user ketik (`<script>`, `<img onerror>`) tampil sebagai teks biasa. Ini menghilangkan kelas bug XSS sepenuhnya, tanpa kode tambahan.
- **Kenapa bukan escape manual** (`note.replace(/</g,"&lt;")...`)?** Itu rawan: gampang lupa satu karakter, urutan escape salah, atau salah konteks (escape HTML vs attribute vs URL beda). `textContent` menyerahkan tanggung jawab ke browser â€” pihak yang paling tahu cara aman memasukkan teks.
- **Kenapa bukan DOMPurify?** DOMPurify dipakai kalau kita **sengaja** mau izinkan sebagian HTML dari user (mis. komentar rich-text). Di sini catatan petani cuma teks biasa â†’ nggak butuh HTML sama sekali â†’ `textContent` adalah alat yang paling pas. Overkill pustaka.
- **Bonus konsistensi:** modal review dari awal sudah pakai `textContent` (benar). Sekarang sidebar ikut benar. Kode konsisten = gampang diaudit.
- **Catatan:** `item.name` & `item.price` di `listItem.innerHTML` tetap aman karena berasal dari **katalog internal** (bukan input user). Hanya input user yang harus `textContent`.

---

## FIX #4 â€” Harga diambil dari katalog resmi, bukan `data-price` tombol

**Sebelum:**
```js
// render: data-price="${product.price}" di tombol +
// klik:   addToCart(target.dataset.id, Number(target.dataset.price))
// fungsi: cart[id].price = price;   // harga dari argumen (dari DOM) menimpa harga resmi
```
**Sesudah:**
```js
// render: data-price DIHAPUS dari tombol
// klik:   addToCart(target.dataset.id)           // id saja
// fungsi: function addToCart(id) {
//   const product = products.find(p => p.id == id);
//   cart[id] = { id, name: product.name, price: product.price, count: 0 }; // harga dari katalog
//   cart[id].count++;
// }
```

**Kenapa pilih "cari harga di katalog", bukan "validasi harga dari tombol"?**
- Ini beda filosofi. "Validasi harga dari DOM" = terima input harga dari client, cek apakah cocok katalog. Itu **salah secara arsitektur** karena tetap mengakui client sebagai sumber harga. Celah aslinya bukan "harga bisa di-edit" â€” celahnya adalah **"client dipercaya sebagai sumber harga"**. Solusinya: potong sumbernya. Harga cuma boleh keluar dari katalog.
- **Kenapa hapus `data-price` di HTML, bukan cuma abaikan?** Defense in depth + clarity. Kalau `data-price` masih ada, orang yang baca kode bakal mikir "oh harga dari tombol" dan mungkin kelak ada jalur lain yang sempat baca. Dihapus â†’ tidak ada jebakan sama sekali.
- **Penting dipahami:** ini fix **client-side**, yang nggak cukup untuk toko beneran. Prinsip sebenarnya: **server wajib hitung ulang** harga, diskon, dan total dari `productId` + `quantity` di DB-nya sendiri. Apa pun di client itu cuma preview. Fix ini menutup celah di *lapisan client*, tapi lapisan server tetap wajib (lihat FIX #5).

---

## FIX #5 â€” Kupon & diskon di-bounded + rahasia dihapus dari client

**Sebelum:**
```js
const KUPON_RAHASIA = "TEMANFARMER";   // bocor di View Source
let diskon = 0;                         // variabel bebas, bisa di-set 1 / minus via console
if (code === KUPON_RAHASIA) { diskon = 0.9; }   // keputusan di client
```
**Sesudah:**
```js
const KUPON_VALID = { "TEMANFARMER": { diskon: 0.10, label: "..." } }; // simulasi
let diskonAktif = 0;
const kupon = KUPON_VALID[code];
diskonAktif = Math.max(0, Math.min(kupon.diskon, 0.9)); // clamp [0, 0.9]
// di computeTotal: const d = Math.min(0.9, Math.max(0, diskonAktif)); // clamp lagi
```

**Kenapa pilih clamp + tabel kupon, bukan sekadar `const`?**
- **Clamp `[0, 0.9]`** ngejawab exploit "console: `diskon = 1` â†’ gratis 100%". Validasi Node: `diskonAktif=1` â†’ `d=0.9`; `diskonAktif=-5` â†’ `d=0`. Sekalipun variabel di-hack, nilai yang dipakai dihitung dibatasi.
- **Kenapa clamp di DUA tempat** (applyCoupon + computeTotal)? Defense in depth. `applyCoupon` clamp saat input; `computeTotal` clamp saat pakai. Kalau ada jalur lain yang set `diskonAktif` tanpa lewat applyCoupon, computeTotal tetap aman.
- **Kenapa ganti `let diskon = 0` jadi `let diskonAktif`?** Bukan cuma rename. `diskon` lama **bisa ditimpa bebas** dari console. `diskonAktif` juga bisa ditimpa (semua `let` bisa), tapi sekarang **nilai timpaan itu diabaikan** karena computeTotal re-clamp. Beda konsep: dari "percaya variabel" ke "validasi nilai sebelum dipakai".
- **Kenapa diskon kupon diubah dari 90% ke 10%?** 90% buat "kupon petani internal" itu sendiri ekstrem/suspicious (dark pattern adjacent). 10% lebih masuk akal sebagai diskon loyalitas. Plus nilai diskon di-tabel â†’ gampang diubah tanpa sentuh logika.
- **Kenapa `KUPON_VALID` masih ada di client â€” bukannya rahasia harus di server?** Benar â€” di **produksi** daftar kupon + validasi **HARUS di server**; ini aku tegaskan di komentar kode. Di latihan ini (static, no backend), aku simulasikan dengan tabel lokal supaya konsepnya bisa dipraktikkan. Yang aku hilangkan: label "RAHASIA" yang menyesatkan + kebebasan variabel. Yang aku pertahankan secara prinsip di komentar: **rahasia & otorisasi = server, bukan client.**

---

## FIX #6 â€” Stok dari data resmi (hapus `Math.random`)

**Sebelum:**
```js
const sisa = Math.floor(Math.random() * 5) + 1;  // karangan, tiap render beda
<p class="stock">tinggal ${sisa} lagi hari ini!</p>
```
**Sesudah:**
```js
// produk punya field stock tetap (mis. Apel stock:12)
const sisa = Math.max(0, product.stock - quantity);  // stok nyata dikurangi isi cart
<p class="stock">sisa ${sisa} hari ini</p>
```

**Kenapa pilih "stok sebagai properti produk", bukan "stok di-cache sekali per sesi"?**
- Akar masalah etikanya: angka **dipalsukan** (random tiap render). Pilihan "cache random sekali" cuma bikin angka stabil tapi **tetap palsu** â€” itu malah lebih licik karena kelihatan kayak stok beneran padahal karangan. Fix yang jujur: angka harus **mencerminkan kenyataan**.
- `product.stock - quantity` itu **akurat secara semantik**: kalau stok 12 dan kamu masukin 3 ke cart, sisa 9. Refresh halaman â†’ tetap 12 (stok awal), cart 0 â†’ sisa 12. Konsisten, bisa diverifikasi. Validasi Node: `12 - 3 = 9`, tidak berubah.
- **Kenapa `Math.max(0, ...)`?** Kalau user masukin lebih banyak dari stok (di fix ini di-cap `MAX_QTY=99`, tapi stok bisa < 99), `sisa` jangan minus. `Math.max(0, ...)` jaga angka tetap â‰¥ 0 (meski di toko beneran, beli melebihi stok harusnya **ditolak**, bukan cuma ditampilin 0 â€” itu improvement berikutnya).
- **Kenapa teks diubah dari "tinggal X lagi hari ini!" jadi "sisa X hari ini"?** Kata "tinggal ... lagi!" sengaja bikin panik (urgency). "sisa X hari ini" bersifat informatif tanpa tekanan. Ini bagian dari hapus dark pattern: **bukan cuma angkanya yang jujur, narasinya juga netral.**

---

## FIX #7 â€” Transparansi `HANDLING_FEE` (rincian di sidebar sejak awal)

**Sebelum:** Fee $0.30 cuma muncul di breakdown modal checkout (detik terakhir). Sidebar cuma nunjukin "Total" tanpa penjelasan â†’ drip pricing.
**Sesudah:** Sidebar sekarang nunjukin **Subtotal** + **Biaya penanganan** + **Total**, terlihat sejak barang pertama masuk cart.

**Kenapa pilih "tampilkan rincian sejak awal", bukan "sematkan fee di harga kartu"?**
- Drip pricing berbahaya karena **biaya muncul di akhir**. Solusinya bisa dua: (A) gabung fee ke harga tampilan, atau (B) tampilkan rincian sejak awal.
- **Kenapa B, bukan A?** Opsi A (sundulan harga + fee di kartu) menyesatkan ke arah lain: harga barang jadi kelihatan lebih mahal dari harga "resmi" produk, dan kalau ada banyak barang fee-nya ambigu (apakah per-item?). Opsi B lebih jujur: harga barang = harga barang, fee = fee, keduanya kelihatan, total = penjumlahannya. Pembeli bisa verifikasi sendiri.
- **Kenapa rincian muncul saat ada barang, hilang saat kosong?** Kalau fee tampil `$0.00` di keranjang kosong, user bingung ("kenapa ada biaya padahal belum beli?"). Sembunyi saat kosong (`display:none`), muncul saat ada item â†’ kontekstual.
- **Kenapa di `index.html` + `style.css`, bukan di-generate JS aja?** Sebagian struktur (baris statis) di HTML lebih jelas untuk dibaca sebagai markup semantik; JS cuma ngisi angkanya. Plus lebih gampang di-style (font kecil/redup untuk baris rincian vs baris Total) â†’ visual hierarchy mendukung transparansi.

---

## FIX #8 â€” Bounds defensif + refaktor `computeTotal` (single source of truth)

**Sebelum:** Dua fungsi (`renderCart`, `openReview`) **masing-masing menghitung total sendiri** dengan kode yang mirip tapi terpisah. Plus tidak ada cap jumlah (`MAX_QTY`).
**Sesudah:**
```js
const MIN_QTY = 1, MAX_QTY = 99;
function computeTotal() {                  // SATU fungsi, dipanggil dua tempat
  // ... return { subtotal, fee, potongan, total, diskon }
}
```

**Kenapa pilih refaktor ke satu fungsi, bukan biarkan dua lalu perbaiki masing-masing?**
- **DRY (Don't Repeat Yourself).** Logika total adalah logika **kritis** (menentukan uang). Duplikasi logika kritis = bom waktu: suatu hari seseorang ubah cara hitung di `renderCart` tapi lupa `openReview` â†’ dua total bisa **beda**. Itu bug tersembunyi yang persis tipe yang gampang lolos review.
- Dengan `computeTotal`, sidebar dan modal **dijamin** ngitung cara yang sama karena panggil fungsi yang sama. Tidak mungkin tidak sinkron. Ini "single source of truth".
- **Kenapa `computeTotal` return objek `{subtotal, fee, potongan, total, diskon}`?** Agar sekali panggil, semua komponen rincian tersedia â†’ sidebar & modal bisa tampilkan rincian konsisten tanpa hitung ulang.
- **Kenapa `MAX_QTY=99`?** Untuk toko buah e-commerce, beli 99 buah satu jenis sudah sangat ekstrem. Cap ini cegah angka raksasa (`999999999`) yang bisa bikin total overflow/aneh atau (di backend) DoS. Nilai spesifik bisa debatable, tapi **pentingnya adalah adanya batas**, bukan angkanya. Validasi Node: `999999 â†’ 99`.
- **Kenapa `MIN_QTY=1` juga?** Eksplisit. Sebelumnya "0 = hapus" implisit. Konstanta bikin aturan bisnis terbaca jelas di satu tempat.

---

## RINGKASAN PRINSIP YANG DIPAKAI (buat dipelajari)

| Prinsip | Dipakai di fix |
|---------|----------------|
| **Output encoding** (jangan percaya input saat render) | #3 (textContent) |
| **Validate at the boundary** (cek input sebelum dipakai) | #2 (Number.isFinite + floor + bounds) |
| **Server is source of truth** (client cuma preview) | #4, #5 |
| **Defense in depth** (lapisan pertahanan ganda) | #1 (isFinite), #5 (clamp 2x), #8 (cap + clamp) |
| **DRY / single source of truth** (logika kritis tak boleh duplikat) | #8 (computeTotal) |
| **Don't trust the client** (apa pun di browser bisa diubah) | #4, #5 |
| **Honesty in product** (klaim harus nyata, narasi netral) | #6 (stok nyata), #7 (fee transparan) |

Setiap fix bukan ditambah asal â€” ada prinsip di baliknya. Kalau kamu bisa jelasin **kenapa solusi ini, bukan alternatif lain**, itulah yang dimaksud README dengan "kamu WAJIB bisa jelasin kenapa fix-nya bener."

