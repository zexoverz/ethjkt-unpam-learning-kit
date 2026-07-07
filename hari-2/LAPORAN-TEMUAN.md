# LAPORAN TEMUAN — BUG BOUNTY: PASAR PAGI (HARI 2)

Laporan ini disusun oleh Tim Keamanan untuk mengidentifikasi masalah fungsional (BUG), celah keamanan (KEAMANAN), dan taktik manipulatif antarmuka (ETIKA/DARK PATTERN) pada website e-commerce Pasar Pagi.

---

## RINGKASAN TEMUAN

| ID | Kategori | Deskripsi Singkat | Dampak | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Temuan 1** | **BUG** | Presisi desimal floating-point pada total harga tidak diformat | Tampilan harga tidak rapi (`$4.1000000000000005`) | Teridentifikasi |
| **Temuan 2** | **BUG** | Ketiadaan validasi `NaN` saat input kuantitas dikosongkan | Menghancurkan perhitungan matematika keranjang (`NaN`) | Teridentifikasi |
| **Temuan 3** | **KEAMANAN** | DOM-Based XSS pada preview Catatan Petani (`innerHTML`) | Eksekusi script ilegal, pencurian sesi/cookies | Teridentifikasi |
| **Temuan 4** | **KEAMANAN** | Kode kupon rahasia (`TEMANFARMER`) ditulis hardcoded di sisi klien | Kebocoran kupon diskon 90% kepada publik | Teridentifikasi |
| **Temuan 5** | **KEAMANAN** | Manipulasi harga melalui atribut DOM `data-price` | Pembeli bisa mengubah harga sesuka hati via DevTools | Teridentifikasi |
| **Temuan 6** | **ETIKA** | Stok palsu yang diacak setiap render (Artificial Scarcity) | FOMO palsu untuk menekan pembeli secara psikologis | Teridentifikasi |
| **Temuan 7** | **ETIKA** | Biaya penanganan tersembunyi tanpa rincian di halaman keranjang | Pembeli merasa dijebak dengan total harga yang mendadak naik | Teridentifikasi |
| **Temuan 8** | **STRETCH** | Inkonsistensi stok & tidak adanya batasan pembelian nyata | Pembeli bisa membeli melampaui jumlah stok yang ditampilkan | Teridentifikasi |

---

## DETIL TEMUAN

### Temuan 1: [BUG] Floating-Point Display Precision (Total Harga Tidak Dibulatkan)
- **Masalahnya apa**: Ketika menghitung total harga di keranjang belanja (`renderCart`) dan di modal checkout (`openReview`), nilai `total` tidak diformat menggunakan `.toFixed(2)`. Hal ini menyebabkan angka desimal panjang khas floating-point JavaScript muncul di layar (contoh: `$1.8` atau `$4.1000000000000005` alih-alih `$1.80` atau `$4.10`).
- **Cara buktiinnya**:
  1. Tambahkan **Apel Fuji** (harga `$1.50`) sebanyak 1 buah ke keranjang.
  2. Total yang ditampilkan di sidebar langsung menjadi `$1.8` (karena ditambah biaya penanganan `$0.30`).
  3. Gunakan kupon diskon `TEMANFARMER` atau beli kombinasi buah lain, lalu periksa angka total akhir. Pada beberapa skenario, desimal berekor panjang akan muncul di layar.
- **Kenapa ini bahaya / nggak adil**: Tampilan harga pecahan acak merusak profesionalisme situs. Pembeli bisa bingung melihat angka desimal yang tidak lazim dan merasa ada kesalahan sistem perhitungan pembayaran.
- **Cara betulinnya**: Gunakan metode `.toFixed(2)` saat memasukkan nilai total ke dalam elemen UI di `main.js`:
  ```javascript
  totalPriceEl.textContent = total.toFixed(2);
  ```

---

### Temuan 2: [BUG] Validasi Input Kuantitas `NaN` (Input Kosong Merusak Keranjang)
- **Masalahnya apa**: Input manual kuantitas barang di keranjang belanja (`.edit-quantity-input`) tidak divalidasi dengan benar ketika dikosongkan. Menghapus seluruh teks di input akan menghasilkan nilai kuantitas `NaN` saat diparse dengan `parseInt()`. Karena `NaN <= 0` bernilai `false`, sistem melewati pengecekan penghapusan barang dan menetapkan kuantitas barang menjadi `NaN`, menyebabkan seluruh kalkulasi total harga di keranjang berubah menjadi `$NaN`.
- **Cara buktiinnya**:
  1. Tambahkan buah apa saja ke keranjang belanja.
  2. Pada input kuantitas di sidebar, hapus angka kuantitas hingga kotak input benar-benar kosong.
  3. Total harga di bagian bawah sidebar akan langsung berubah menjadi `$NaN` dan keranjang tidak dapat digunakan dengan normal.
- **Kenapa ini bahaya / nggak adil**: Pembeli dapat secara tidak sengaja mengosongkan input kuantitas saat ingin mengetik ulang, yang merusak seluruh tampilan halaman keranjang belanja dan memaksa mereka melakukan reload halaman.
- **Cara betulinnya**: Lakukan pengecekan `isNaN()` sebelum memperbarui kuantitas. Jika input bernilai `NaN` (atau kosong), set nilainya kembali ke `1` (atau hapus barang dari keranjang):
  ```javascript
  if (isNaN(quantity)) {
    // Kembalikan ke 1 atau biarkan kosong tanpa merusak state
    return; 
  }
  ```

---

### Temuan 3: [KEAMANAN] DOM-Based Cross-Site Scripting (XSS) di Catatan Petani
- **Masalahnya apa**: Pada fungsi `renderCart()`, catatan untuk petani diambil langsung dari input textarea `#note` dan dimasukkan ke dalam DOM menggunakan properti `innerHTML` tanpa sanitasi: `preview.innerHTML = "Catatan: " + note;`.
- **Cara buktiinnya**:
  1. Ketik script berikut pada kolom "Catatan buat petani":
     `<img src=x onerror="alert('XSS!')">`
  2. Ketik satu karakter lagi atau klik di luar textarea agar event input terpicu.
  3. Kotak dialog alert JavaScript akan langsung muncul di browser, membuktikan script berbahaya berhasil dijalankan.
- **Kenapa ini bahaya / nggak adil**: Penyerang dapat menyuntikkan script berbahaya untuk mencuri token sesi (session hijacking), membaca data sensitif dari local storage, atau melakukan tindakan tidak sah atas nama pembeli. Jika catatan ini disimpan di database dan ditampilkan di dashboard admin/petani, admin juga dapat terkena serangan XSS ini.
- **Cara betulinnya**: Ganti penggunaan `.innerHTML` dengan `.textContent` agar browser menerjemahkan input pengguna sebagai string teks murni, bukan elemen HTML aktif:
  ```javascript
  preview.textContent = "Catatan: " + note;
  ```

---

### Temuan 4: [KEAMANAN] Hardcoded Kode Kupon Rahasia di Sisi Klien
- **Masalahnya apa**: Kode kupon diskon rahasia 90% (`KUPON_RAHASIA = "TEMANFARMER"`) ditulis secara keras (hardcoded) di dalam file JavaScript sisi klien (`main.js`) yang dapat diakses oleh siapa saja.
- **Cara buktiinnya**:
  1. Klik kanan pada halaman website, pilih **View Page Source**, atau buka DevTools (F12) > tab **Sources**.
  2. Buka file `main.js` dan cari variabel `KUPON_RAHASIA`. Kode kupon `"TEMANFARMER"` dapat langsung dibaca dengan mudah.
- **Kenapa ini bahaya / nggak adil**: Semua pengguna dapat dengan mudah menemukan kupon diskon internal ini dan memanfaatkannya untuk mendapatkan potongan harga 90% secara tidak sah. Toko akan menderita kerugian finansial yang signifikan.
- **Cara betulinnya**: Logika validasi kupon dan potongan harga harus diproses di sisi server (backend) yang aman. Jika aplikasi ini harus berjalan murni di front-end, simpan representasi kupon dalam bentuk hash (misalnya SHA-256) dan verifikasi kecocokan hash input dengan hash rahasia tersebut agar kode aslinya tidak dapat dibaca langsung.

---

### Temuan 5: [KEAMANAN] Manipulasi Harga melalui Atribut DOM (`data-price`)
- **Masalahnya apa**: Ketika pengguna menekan tombol tambah (`+`), fungsi `addToCart` mengambil harga barang dari atribut HTML `data-price` pada elemen tombol tersebut (`target.dataset.price`), bukan dari daftar produk aman internal (`products` array).
- **Cara buktiinnya**:
  1. Buka DevTools (F12) > tab **Elements**.
  2. Cari elemen tombol tambah `+` untuk **Blueberry** (harga asli `$5.00`).
  3. Ubah atribut `data-price="5"` menjadi `data-price="0.01"`.
  4. Klik tombol `+` tersebut pada halaman.
  5. Blueberry akan masuk ke dalam keranjang belanja dengan harga `$0.01` per buah.
- **Kenapa ini bahaya / nggak adil**: Pembeli nakal dapat memanipulasi harga barang sesuka hati sebelum memasukkannya ke keranjang belanja, memungkinkan mereka melakukan checkout barang mahal dengan harga yang sangat murah atau bahkan negatif (gratis).
- **Cara betulinnya**: Di dalam fungsi `addToCart(id)`, jangan gunakan parameter `price` dari DOM. Cari data produk yang valid langsung dari array produk internal (`products`) berdasarkan `id` produk:
  ```javascript
  function addToCart(id) {
    const product = products.find((item) => item.id == id);
    if (!product) return;

    if (!cart[id]) {
      cart[id] = { ...product, count: 0 };
    }
    // Menggunakan harga asli dari array internal yang aman
    cart[id].price = product.price; 
    cart[id].count++;
    renderCart();
  }
  ```

---

### Temuan 6: [ETIKA] Stok Palsu / Urgensi Buatan (False Scarcity)
- **Masalahnya apa**: Angka sisa stok yang ditampilkan kepada pembeli (misal: *"tinggal 3 lagi hari ini!"*) adalah angka palsu hasil acak (`Math.random()`) yang dihitung setiap kali halaman dirender ulang.
- **Cara buktiinnya**:
  1. Perhatikan angka stok untuk Apel Fuji (misal: *"tinggal 2 lagi hari ini!"*).
  2. Tambahkan buah lain ke keranjang belanja (tindakan ini memicu render ulang produk).
  3. Lihat kembali stok Apel Fuji, angka tersebut sekarang berubah secara acak menjadi *"tinggal 5 lagi hari ini!"* tanpa ada pasokan baru.
- **Kenapa ini bahaya / nggak adil**: Ini adalah Dark Pattern jenis *Artificial Scarcity* (Kelangkaan Buatan) yang menipu pembeli secara psikologis untuk menciptakan rasa urgensi (FOMO) agar segera membeli barang tersebut, padahal stok riil tidak terbatas atau berbeda dari klaim.
- **Cara betulinnya**: Integrasikan jumlah stok asli ke dalam array data produk (`products`). Ketika barang dibeli atau ditambahkan ke keranjang, kurangi nilai stok tersebut secara konsisten dan simpan state-nya agar tidak berubah secara acak saat dirender ulang.

---

### Temuan 7: [ETIKA] Biaya Tersembunyi di Akhir Transaksi (Hidden Fees / Sneaking)
- **Masalahnya apa**: Biaya penanganan sebesar `$0.30` (`HANDLING_FEE`) secara otomatis ditambahkan ke total harga pada sidebar keranjang belanja, namun tidak ada label, rincian, atau pemberitahuan tertulis mengenai biaya tersebut di halaman utama keranjang. Pembeli baru mengetahui adanya biaya penanganan ini pada rincian modal saat menekan tombol "Lanjut ke Pembayaran".
- **Cara buktiinnya**:
  1. Masukkan **Apel Fuji** (harga `$1.50`) sebanyak 1 buah ke keranjang belanja.
  2. Total harga di sidebar akan tertulis `$1.80`. Pembeli tidak diberikan penjelasan di mana selisih `$0.30` tersebut berasal.
  3. Klik tombol "Lanjut ke Pembayaran", di sana baru terungkap bahwa ada tambahan biaya penanganan sebesar `$0.30`.
- **Kenapa ini bahaya / nggak adil**: Ini adalah Dark Pattern jenis *Hidden Fees* (Biaya Tersembunyi). Menyamarkan biaya tambahan ke dalam total harga tanpa transparansi sejak awal merusak kepercayaan pelanggan dan memaksa mereka menyetujui biaya yang tidak mereka ketahui sebelumnya saat mengumpulkan barang di keranjang.
- **Cara betulinnya**: Tampilkan rincian biaya penanganan secara jelas pada sidebar keranjang belanja sebelum tombol checkout, misalnya dengan menambahkan baris rincian "Biaya Penanganan: $0.30" di atas baris Total.

---

### Temuan 8: [STRETCH] Inkonsistensi Batasan Stok Nyata di Keranjang Belanja
- **Masalahnya apa**: Meskipun halaman menampilkan label sisa stok, sistem tidak membatasi kuantitas pembelian. Pengguna bisa mengklik tombol tambah (`+`) terus-menerus melampaui angka "stok sisa" yang tertera di layar.
- **Cara buktiinnya**:
  1. Cari produk yang bertuliskan *"tinggal 1 lagi hari ini!"*.
  2. Klik tombol tambah (`+`) sebanyak 5 kali.
  3. Keranjang belanja dengan senang hati menampung 5 buah produk tersebut tanpa ada error atau batasan.
- **Kenapa ini bahaya / nggak adil**: Ini membuktikan bahwa klaim stok di website sepenuhnya palsu dan tidak sinkron dengan logika bisnis keranjang.
- **Cara betulinnya**: Sebelum menambahkan item ke keranjang atau memperbarui kuantitasnya, lakukan pengecekan apakah kuantitas di keranjang melebihi stok yang tersedia di array produk, lalu batasi penambahannya.

---

## REFLEKSI PENUTUP

**Apa perbedaan antara "kode jalan" dengan "kode benar & jujur"?**

- **Kode Jalan (Functional Code)** hanya peduli pada aspek teknis: apakah fitur berjalan tanpa error, tombol bisa diklik, halaman bisa memproses data, dan kalkulasi menghasilkan angka. Selama fungsionalitas utama tercapai, kode dianggap "selesai". Kode Pasar Pagi sebelum diperbaiki adalah contoh "kode jalan" yang tampak sempurna di luar namun rusak dan manipulatif di dalam.
- **Kode Benar & Jujur (Secure & Ethical Code)** tidak hanya memastikan kode tersebut berjalan, tetapi juga menjamin bahwa:
  1. **Aman (Secure)**: Kode tidak mempercayai input dari klien, memvalidasi semua parameter di sisi server/internal yang aman, dan terlindung dari eksploitasi seperti XSS dan manipulasi harga.
  2. **Etis & Transparan (Ethical & Transparent)**: Kode tidak menggunakan trik psikologis palsu (stok acak/palsu) untuk mendesak pembeli, serta bersikap transparan mengenai semua biaya yang dikenakan tanpa ada yang disembunyikan.
  
Sebagai profesional IT/Keamanan, integritas sebuah sistem dinilai dari bagaimana sistem tersebut memperlakukan data pengguna dan uang mereka dengan jujur serta aman.
