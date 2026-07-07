# LAPORAN TEMUAN - HARI 2

## Temuan 1: BUG - Total uang tidak diformat 2 desimal
- Masalahnya apa: Total harga ditampilkan langsung dari angka JavaScript tanpa format uang 2 desimal.
- Cara buktiinnya: Tambahkan kombinasi barang yang menghasilkan pecahan desimal, lalu lihat total di keranjang. Pada versi awal, total bisa muncul seperti `1.7999999999999998`, bukan `$1.80`.
- Kenapa ini bahaya / nggak adil: Angka uang yang tidak rapi bisa membingungkan pembeli dan membuat toko terlihat tidak terpercaya.
- Cara betulinnya: Semua nilai uang harus diformat dengan aturan uang yang konsisten.
- Status perbaikan: Sudah diperbaiki dengan fungsi `formatMoney(value)` yang memakai `Number(value).toFixed(2)`. Fungsi ini dipakai untuk harga item, subtotal, biaya penanganan, diskon, dan total.
- Cara cek setelah fix: Tambahkan beberapa buah ke keranjang. Total di sidebar dan modal checkout selalu tampil 2 desimal, misalnya `$1.80`, bukan angka floating point panjang.

## Temuan 2: BUG - Input jumlah bisa menjadi NaN
- Masalahnya apa: Input jumlah barang memakai `parseInt`, tetapi hasilnya tidak divalidasi. Jika input dikosongkan atau dibuat tidak valid, nilai `NaN` bisa masuk ke keranjang.
- Cara buktiinnya: Tambahkan barang ke keranjang, kosongkan field jumlah, lalu perhatikan total dan jumlah keranjang menjadi rusak.
- Kenapa ini bahaya / nggak adil: Data order bisa tidak valid, total bisa salah, dan alur checkout menjadi tidak bisa dipercaya.
- Cara betulinnya: Validasi quantity sebelum disimpan. Jika input tidak valid, kembalikan ke nilai aman dan batasi minimum serta maksimum.
- Status perbaikan: Sudah diperbaiki dengan `normalizeQuantity(value, max)`. Quantity tidak valid dikembalikan ke `1`, nilai minimum dipaksa `1`, dan nilai maksimum dibatasi sesuai stok produk.
- Cara cek setelah fix: Kosongkan input quantity atau isi angka besar. Nilai akan kembali ke angka valid dan total tidak berubah menjadi `NaN`.

## Temuan 3: KEAMANAN - XSS dari catatan user
- Masalahnya apa: Catatan user pada versi awal dimasukkan ke halaman memakai `innerHTML`, sehingga browser membaca input sebagai HTML.
- Cara buktiinnya: Isi catatan dengan payload `<img src=x onerror=alert('XSS')>`, lalu lihat alert muncul saat preview catatan dirender.
- Kenapa ini bahaya / nggak adil: Penyerang bisa menjalankan JavaScript di browser user, mencuri data, mengubah tampilan, atau melakukan aksi atas nama user.
- Cara betulinnya: Jangan masukkan input user ke `innerHTML`. Render sebagai teks, lalu sanitasi input agar hanya karakter aman yang tersimpan.
- Status perbaikan: Sudah diperbaiki dengan dua lapis perlindungan. Pertama, preview dan modal memakai `textContent` melalui `createTextElement()`. Kedua, catatan dibersihkan oleh `sanitizeNote()` yang membuang `<`, `>`, backtick, `{}`, karakter kontrol, menormalkan spasi, dan membatasi panjang 160 karakter.
- Cara cek setelah fix: Masukkan payload `<img src=x onerror=alert('XSS')>`. Payload tidak dieksekusi; karakter berbahaya dibuang dan sisanya tampil sebagai teks biasa.

## Temuan 4: KEAMANAN - Kupon rahasia bocor di client
- Masalahnya apa: Kode kupon rahasia `TEMANFARMER` disimpan langsung di JavaScript frontend.
- Cara buktiinnya: Buka DevTools atau View Source, cari `KUPON_RAHASIA`, lalu pakai kode tersebut di input kupon.
- Kenapa ini bahaya / nggak adil: Siapa pun bisa membaca kode kupon dan mendapat diskon 90%. Validasi promo penting tidak boleh bergantung pada browser user.
- Cara betulinnya: Jangan simpan rahasia di frontend. Validasi kupon dan aturan diskon seharusnya dilakukan di server.
- Status perbaikan: Untuk scope project statis ini, kupon rahasia sudah dihapus dan diganti menjadi kupon publik `PASARPAGI` dengan diskon 10%. Input kupon juga dinormalisasi dengan `trim()` dan `toUpperCase()`.
- Cara cek setelah fix: Cari `KUPON_RAHASIA` atau `TEMANFARMER` di `main.js`; tidak ada lagi. Kupon `PASARPAGI`, `pasarpagi`, atau ` PASARPAGI ` tetap bekerja konsisten.

## Temuan 5: KEAMANAN - Harga bisa dimanipulasi dari DOM
- Masalahnya apa: Harga yang masuk ke keranjang diambil dari atribut `data-price` pada tombol, bukan dari data produk yang terpercaya.
- Cara buktiinnya: Buka DevTools, ubah `data-price` tombol plus menjadi `0.01`, lalu klik tombol tersebut. Pada versi awal, total memakai harga palsu.
- Kenapa ini bahaya / nggak adil: Pembeli bisa memalsukan harga dan checkout dengan total yang jauh lebih murah.
- Cara betulinnya: Harga harus diambil dari katalog resmi aplikasi atau, untuk toko nyata, dihitung ulang oleh server saat checkout.
- Status perbaikan: Sudah diperbaiki. Tombol plus tidak lagi membawa `data-price`, `addToCart()` hanya menerima `id`, dan semua perhitungan harga mengambil nilai dari katalog `products` melalui `getProductById()`.
- Cara cek setelah fix: Edit DOM tombol plus lewat DevTools dan tambahkan atribut harga palsu. Total tetap memakai harga resmi dari katalog, bukan harga dari DOM.

## Temuan 6: ETIKA - Stok palsu / random membuat urgency palsu
- Masalahnya apa: Angka stok dibuat dengan `Math.random`, bukan dari stok nyata.
- Cara buktiinnya: Refresh halaman atau tambah/kurangi barang. Pada versi awal, angka `tinggal X lagi hari ini!` bisa berubah tanpa alasan stok yang benar.
- Kenapa ini bahaya / nggak adil: Ini dark pattern karena membuat pembeli merasa buru-buru membeli berdasarkan informasi palsu.
- Cara betulinnya: Tampilkan stok nyata, atau jangan tampilkan klaim stok terbatas jika datanya tidak benar.
- Status perbaikan: Sudah diperbaiki. Setiap produk punya nilai `stock` tetap di katalog, stok yang ditampilkan dihitung dari `stock - quantity`, dan tombol plus dinonaktifkan saat stok habis.
- Cara cek setelah fix: Refresh halaman dan tambah/kurangi barang. Stok tidak berubah acak; stok turun saat barang masuk keranjang dan naik lagi saat barang dikurangi.

## Temuan 7: ETIKA - Biaya penanganan disisipkan diam-diam
- Masalahnya apa: Total sudah ditambah biaya penanganan, tetapi user tidak diberi penjelasan jelas sejak awal di area keranjang.
- Cara buktiinnya: Tambahkan barang, hitung subtotal manual dari harga barang, lalu bandingkan dengan total. Pada versi awal, ada selisih $0.30 yang baru dijelaskan di modal review.
- Kenapa ini bahaya / nggak adil: Pembeli bisa membayar lebih dari perkiraan tanpa transparansi sejak awal.
- Cara betulinnya: Tampilkan breakdown biaya dengan jelas sebelum user menekan checkout.
- Status perbaikan: Sudah diperbaiki. Sidebar keranjang sekarang menampilkan `Subtotal`, `Biaya penanganan`, diskon kupon jika ada, dan `Total` sebelum tombol checkout. Biaya penanganan bernilai `$0.00` saat keranjang kosong dan `$0.30` setelah ada barang.
- Cara cek setelah fix: Tambahkan satu barang ke keranjang. Sebelum klik checkout, sidebar sudah menampilkan biaya penanganan `$0.30` dan total yang sama dengan modal review.

## Refleksi
Kode yang jalan belum tentu kode yang benar dan jujur. Kode benar harus menghitung dengan akurat, memvalidasi input, tidak mempercayai data dari browser, aman dari input berbahaya, dan transparan terhadap user terutama saat menyangkut uang. Setelah diperbaiki, aplikasi tidak hanya terlihat berjalan, tetapi juga lebih bisa dipertanggungjawabkan dari sisi keamanan, akurasi, dan etika produk.
