# HASIL PERBAIKAN — PASAR PAGI

**NIM Mahasiswa:** 251011450304  
**Nama Mahasiswa:** Muhammad Abiyasa  
**Email:** abi.vardhana@outlook.com  

Dokumen ini menjelaskan hasil audit perbaikan kode Pasar Pagi yang dilakukan untuk menuntaskan 8 temuan bug, kerentanan keamanan, serta pola etika tidak jujur (dark patterns).

---

## Ringkasan Perbaikan

| # | Kategori | Temuan Masalah | Status | Solusi Kode & Mitigasi |
|---|----------|----------------|--------|-------------------------|
| 1 | **BUG** | Input jumlah non-angka → `NaN` | ✅ Lolos Uji | Guard check `Number.isInteger(quantity)` menolak input non-angka dan mempertahankan nilai valid terakhir. |
| 2 | **BUG** | Tidak ada batas jumlah / stok | ✅ Lolos Uji | Membatasi input jumlah maksimal belanja disesuaikan dengan stok asli produk katalog. |
| 3 | **BUG** | Total tidak `toFixed` (floating-point) | ✅ Lolos Uji | Semua kalkulasi uang diformat menggunakan `.toFixed(2)` secara seragam. |
| 4 | **KEAMANAN** | Harga dibaca dari DOM `data-price` | ✅ Lolos Uji | Menghapus properti `data-price` dari DOM dan membaca harga langsung dari catalog tepercaya `products` JS berdasarkan `id`. |
| 5 | **KEAMANAN** | XSS via `innerHTML` di catatan user | ✅ Lolos Uji | Mengubah render preview catatan dari `innerHTML` menjadi `textContent` (melindungi parsing tag script/HTML). |
| 6 | **KEAMANAN** | Kupon rahasia client-side plaintext | ✅ Lolos Uji | Menghapus plaintext kupon dan menggunakan pencocokan hash SHA-256 (`hashSha256()`). |
| 7 | **ETIKA** | Stok palsu acak (`Math.random()`) | ✅ Lolos Uji | Menerapkan properti `stock` tetap dan mengurangi stok secara jujur (`product.stock - quantity`). |
| 8 | **ETIKA** | Biaya penanganan tersembunyi | ✅ Lolos Uji | Menampilkan baris rincian breakdown harga (Subtotal, Fee, Total) secara transparan di sidebar sejak awal. |

---

## Detil Solusi & Dasar Pemikiran Keamanan

### 1. Penanganan Input & Validasi Stok (Bug #1 & #2)
* **Solusi Kode:**
  Di dalam fungsi `updateQuantity(id, quantity)`, kami menyematkan filter tipe data integer menggunakan `Number.isInteger(quantity)`. Jika data bukan integer, fungsi akan langsung dihentikan (`return`) tanpa merusak objek state. Kami juga membatasi input kuantitas manual agar tidak melampaui batas persediaan barang (`product.stock`) dengan memotong nilai input ke jumlah stok maksimum dan memberikan feedback berupa pesan toast.
* **Prinsip Dasar:**
  * **Fail-Safe Defaults:** Jika user memasukkan input kotor/rusak, sistem tetap mempertahankan kondisi stabil terakhir yang aman.
  * **Input Validation:** Selalu validasi rentang nilai, batas atas, batas bawah, dan tipe data dari input pengguna di batas terluar sistem.

### 2. Format Desimal & Layout Breakdown Terpusat (Bug #3 & Etika #8)
* **Solusi Kode:**
  Kami membagi perhitungan biaya ke dalam helper function terpusat `buildBreakdown(subtotal)`. Rendering baris rincian biaya baik di area sidebar keranjang maupun modal checkout review menggunakan fungsi tunggal `renderBreakdownRows(target, sums)`. Semua output nominal uang diubah menjadi format dua desimal `.toFixed(2)`.
* **Prinsip Dasar:**
  * **Don't Repeat Yourself (DRY):** Menyatukan logika perhitungan uang mencegah inkonsistensi perhitungan antara apa yang dilihat user di keranjang dengan apa yang ditagihkan saat checkout.
  * **Transparansi Harga:** Menyajikan biaya operasional secara eksplisit sejak awal membangun kepercayaan pengguna terhadap etika bisnis platform.

### 3. Keamanan Sumber Harga & Sinkronisasi Keranjang (Keamanan #4)
* **Solusi Kode:**
  Atribut `data-price` dihapus sepenuhnya dari tag tombol plus (`+`) di HTML. Logika `addToCart` hanya menerima parameter `id` produk dan mencocokkannya ke catalog JS internal `products.find()`. Selain itu, kami menyematkan sistem sinkronisasi ulang data nama dan harga produk katalog resmi pada setiap kali fungsi `renderCart` dipanggil untuk menggagalkan upaya manipulasi properti objek keranjang via browser Developer Console.
* **Prinsip Dasar:**
  * **Never Trust the Client:** Seluruh keputusan data finansial wajib merujuk pada data backend/katalog tepercaya yang tidak dapat diedit secara sepihak oleh pengguna di DOM.

### 4. Pencegahan Cross-Site Scripting (Keamanan #5)
* **Solusi Kode:**
  Properti rendering preview catatan petani diganti dari `.innerHTML` menjadi `.textContent`.
* **Prinsip Dasar:**
  * **Context-Aware Encoding:** Menginstruksikan browser untuk memperlakukan input pengguna strictly sebagai data string biasa (plain-text), bukan sebagai baris tag HTML yang bisa dieksekusi.

### 5. Kriptografi Hash Kupon Rahasia (Keamanan #6)
* **Solusi Kode:**
  Kupon rahasia tidak lagi disimpan dalam string plaintext `"TEMANFARMER"`. Sebagai gantinya, kode client-side hanya menyimpan nilai hash SHA-256: `a12497e637e42764b41e7c6de1b07a8906d8e8841c7522a471a48a1ee74d61cd`. Saat kupon dimasukkan, aplikasi mem-hash input user secara asinkron menggunakan web API `crypto.subtle.digest("SHA-256", data)` dan mencocokkannya dengan hash tersebut.
* **Prinsip Dasar:**
  * **Security in Depth:** Tidak menyimpan data sensitif/rahasia secara polos di sisi client. Namun, laporan ini juga menekankan bahwa penegakan logika kupon sejati wajib divalidasi penuh di sisi **server backend** untuk keamanan absolut.

---

## Bukti Hasil Pengujian Interaktif

1. **Uji Validasi Input (NaN & Negatif):**
   * Memasukkan buah Apel Fuji ke keranjang, mengosongkan input kuantitas di keranjang belanja, serta mengetik huruf `"abc"` → keranjang belanja menolak input kotor tersebut dan Total tetap bersih tanpa ada nilai `NaN`.
   * Mengetik angka `-5` → item terhapus dengan aman dari keranjang belanja.
2. **Uji Batas Stok Riil:**
   * Apel Fuji diset memiliki stok maksimal 12. Mengetik angka `999` pada kuantitas keranjang → sistem memotong nilai input kembali menjadi `12` disertai pemunculan pesan Toast `"Stok Apel Fuji tinggal 12."`. Tombol plus (`+`) otomatis diset `disabled` setelah kuantitas mencapai 12.
3. **Uji Manipulasi Harga DOM:**
   * Di DevTools tab Elements, tidak ada lagi atribut `data-price` pada tombol plus. Mencoba mengutak-atik harga produk via script console → saat fungsi render terpanggil, harga langsung disinkronkan kembali ke harga katalog resmi ($1.50).
4. **Uji Serangan XSS:**
   * Menuliskan `<img src=x onerror=alert('XSS')>` pada catatan petani → preview catatan menampilkan string teks mentah tersebut secara utuh tanpa mengeksekusi script popup alert.
5. **Uji Transparansi Biaya Penanganan:**
   * Sidebar keranjang sejak buah pertama dimasukkan langsung merinci: Subtotal, Biaya Penanganan ($0.30), dan Grand Total secara transparan sehingga tidak ada lonjakan harga misterius di modal checkout.
6. **Uji Kupon Rahasia:**
   * Kode kupon tidak terlihat polos di file JavaScript. Mengisi kupon dengan kata `"TEMANFARMER"` menghasilkan hash pencocokan yang valid dan mengaktifkan diskon 90%.
