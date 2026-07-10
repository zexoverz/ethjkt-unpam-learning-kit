# Laporan Temuan Pasar Pagi (Bug Bounty)

## Temuan 1: KEAMANAN
- **Masalahnya apa:** Ada celah Cross-Site Scripting (XSS) di kolom catatan karena input user ditampilkan menggunakan `innerHTML`.
- **Cara buktiinnya:** Ketik `<img src="x" onerror="alert('XSS')">` di kolom input "Catatan buat petani" di keranjang. Sebuah popup alert "XSS" akan muncul, membuktikan script tereksekusi.
- **Kenapa ini bahaya:** Hacker bisa mencuri cookie atau token sesi pengguna yang login, atau mengarahkan pembeli ke situs jebakan. Pembeli dan toko yang rugi.
- **Cara betulinnya:** Mengubah `preview.innerHTML = "Catatan: " + note;` menjadi `preview.textContent = "Catatan: " + note;` sehingga input hanya akan dirender sebagai teks biasa yang aman.

## Temuan 2: KEAMANAN
- **Masalahnya apa:** Manipulasi Harga di Sisi Klien. Harga barang diambil langsung dari elemen HTML dan ditambahkan ke keranjang tanpa dicek lagi ke harga asli dari server/database.
- **Cara buktiinnya:** Buka DevTools (F12) > Elements. Pilih tombol `+` pada salah satu produk (misal Apel). Ubah nilai `data-price="1.5"` menjadi `data-price="0"`. Klik tombol `+` tersebut di halaman web, dan Apel akan masuk ke keranjang dengan harga $0.
- **Kenapa ini bahaya:** Pembeli nakal bisa membeli seluruh toko secara gratis. Toko akan mengalami kerugian finansial drastis.
- **Cara betulinnya:** Menghapus atribut `data-price` dari elemen tombol. Fungsi `addToCart(id)` diubah agar selalu mengambil `product.price` langsung dari data `products` yang terpercaya berdasarkan id barang, bukan dari input DOM.

## Temuan 3: KEAMANAN
- **Masalahnya apa:** Rahasia Terekspos di Sisi Klien (Hardcoded Secret). Kupon diskon ditaruh secara terang-terangan di kode frontend.
- **Cara buktiinnya:** Buka DevTools (F12) > tab Sources > buka file `main.js`. Pada baris 32 terdapat `const KUPON_RAHASIA = "TEMANFARMER"`. Masukkan kupon ini, dan diskon 90% langsung berlaku.
- **Kenapa ini bahaya:** Semua pembeli yang bisa membaca Inspect Element akan mendapat diskon 90% yang seharusnya untuk kalangan khusus. Toko akan bangkrut.
- **Cara betulinnya:** Logika kupon HANYA boleh berjalan di server (Backend). Diperbaiki dengan menghapus variabel rahasia tersebut dari frontend dan menyimulasikan validasi server (yang otomatis menolak/menggagalkan kupon di sisi frontend untuk mencegah eksploitasi statik).

## Temuan 4: ETIKA
- **Masalahnya apa:** Stok Kelangkaan Palsu (Fake Scarcity). Angka sisa stok barang hanyalah tipuan yang dihasilkan dari angka acak `Math.random()`.
- **Cara buktiinnya:** Tambahkan barang apa saja ke keranjang, ATAU ketik huruf di kolom "Catatan...". Perhatikan teks "tinggal X lagi hari ini!" pada produk. Angkanya akan meloncat-loncat berubah secara acak karena komponen keranjang me-render ulang seluruh daftar produk setiap ada perubahan kecil.
- **Kenapa ini nggak adil:** Ini adalah *dark pattern* yang memanipulasi psikologis pembeli agar merasa FOMO (Fear Of Missing Out) dan panik cepat-cepat *checkout*. Pembeli dirugikan karena dimanipulasi emosinya.
- **Cara betulinnya:** Membangkitkan angka stok awal HANYA SEKALI di saat awal halaman dimuat, lalu menyimpannya di variabel objek `products`. Saat *render*, sisa stok yang ditampilkan adalah murni pengurangan dari stok mula-mula tersebut terhadap kuantitas barang di keranjang.

## Temuan 5: ETIKA
- **Masalahnya apa:** Biaya Siluman (Hidden Fees). Ada biaya penanganan ($0.30) yang diam-diam dimasukkan ke total akhir di *sidebar* tanpa adanya baris perincian biaya.
- **Cara buktiinnya:** Tambahkan 1 Pisang ($1.20) ke keranjang. Lihat angka "Total" di bawah keranjang, angkanya tertulis $1.50 padahal kita hanya beli barang $1.20. Tidak ada penjelasan biaya tambahan di *sidebar* tersebut sampai kita masuk ke modal *checkout*.
- **Kenapa ini nggak adil:** Pembeli bisa merasa dibohongi saat melihat total lebih besar dari jumlah barangnya. Toko tidak transparan di awal.
- **Cara betulinnya:** Menambahkan elemen div berisi baris rincian khusus untuk "Biaya Penanganan: $0.30" di fungsi `renderCart()` agar muncul secara transparan di sidebar keranjang sejak awal.

## Temuan 6: BUG
- **Masalahnya apa:** Perhitungan Rusak Menjadi `NaN` (*Not a Number*).
- **Cara buktiinnya:** Masukkan barang ke keranjang. Pada daftar keranjang di sidebar, klik angka input kuantitas, dan tekan tombol *backspace* untuk menghapusnya sampai kosong. Seketika itu juga Total harga menjadi `NaN` karena gagal melakukan kalkulasi matematika.
- **Kenapa ini bahaya:** Aplikasi menjadi rusak dan *error*, pembeli mungkin tidak bisa melanjutkan ke pembayaran.
- **Cara betulinnya:** Menambahkan validasi `isNaN(quantity)` pada event listener input kuantitas. Jika input kosong atau bukan angka, nilainya di-fallback menjadi `0` sebelum masuk ke fungsi `updateQuantity`.

## Temuan 7: BUG
- **Masalahnya apa:** Desimal / Floating Point yang Berantakan. Uang tidak diformat ke 2 angka di belakang koma.
- **Cara buktiinnya:** Coba tambahkan banyak barang dengan total pecahan ganjil, lalu masukkan kupon diskon rahasia (contoh: subtotal $3.5 + $0.30 biaya = $3.80, lalu didiskon). Angka total akan muncul panjang menjuntai seperti `$3.8000000000000003`.
- **Kenapa ini bahaya:** Terlihat tidak profesional dan membingungkan pembeli soal berapa persis nominal harga yang harus dibayar.
- **Cara betulinnya:** Menambahkan fungsi `.toFixed(2)` pada saat mencetak angka total (contoh: `total.toFixed(2)`) di dalam DOM fungsi `renderCart()` dan string HTML modal *checkout* agar selalu konsisten menampilkan 2 angka desimal.

---

## Refleksi Penutup
- **Bedanya "kode jalan" sama "kode benar & jujur" itu apa, menurutmu, setelah level ini?**
  *Kode jalan* hanyalah syarat minimum di mana aplikasi tidak error (meledak) dan tampilannya rapi/jalan secara visual. Namun *kode yang benar dan jujur* berarti kode tersebut dibangun dengan **integritas**. Secara teknis, ia dirancang kedap (melindungi data dan flow dari manipulasi celah seperti manipulasi sisi klien dan XSS). Secara etika/moral, ia dibangun dengan menghargai transparansi (tidak menyelipkan *hidden fee* dan tidak menipu pengguna dengan *fake scarcity*). Sebagai jembatan antara teknologi dan pengguna awam, sebuah kode "jalan" masih bisa mencuri dan merugikan banyak orang, tetapi kode yang "benar dan jujur" melindungi bisnis dari keruntuhan dan menjaga keselamatan mental maupun finansial pelanggan.
