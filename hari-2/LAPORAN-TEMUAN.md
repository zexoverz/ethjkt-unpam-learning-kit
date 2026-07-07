# LAPORAN TEMUAN - BUG BOUNTY: PASAR PAGI (HARI 2)

Laporan ini disusun oleh Tim Keamanan untuk merinci hasil investigasi kode pada aplikasi web Toko Buah Online "Pasar Pagi". Berdasarkan pemeriksaan mendalam, ditemukan **7 temuan utama** (ditambah 1 temuan tambahan/stretch) yang mencakup kategori Bug, Keamanan, dan Etika (Dark Pattern). Semua temuan ini telah berhasil direproduksi, dibuktikan, dan diperbaiki.

---

## DAFTAR TEMUAN

### Temuan 1: [BUG] Presisi Matematika Uang (Floating Point Precision)
- **Masalahnya apa**:
  Total harga akhir di sidebar keranjang belanja (`totalPriceEl`) dan modal konfirmasi pembayaran (`review-breakdown`) tidak dibulatkan ke dua digit desimal (`.toFixed(2)`). Karena perilaku perhitungan bilangan pecahan (floating-point) di JavaScript, hasil penjumlahan harga sering kali menampilkan desimal yang sangat panjang dan tidak rapi (misal `$1.8000000000000003` alih-alih `$1.80`).
- **Cara buktiinnya**:
  1. Masukkan **Apel Fuji** ($1.50) ke keranjang.
  2. Total harga di keranjang akan menampilkan `$1.8` karena ditambahkan biaya penanganan `$0.30`.
  3. Masukkan kode kupon `TEMANFARMER` untuk mendapatkan diskon 90%.
  4. Total harga akan berubah menjadi `$0.18000000000000002` di sidebar dan modal pembayaran, bukan `$0.18`.
- **Kenapa ini bahaya / nggak adil**:
  Sangat membingungkan bagi pembeli dan terlihat tidak profesional. Selain itu, nilai pecahan yang tidak presisi ini jika dikirim ke payment gateway bisa menyebabkan kesalahan transaksi (gagal bayar) atau ketidaksesuaian pembukuan keuangan toko.
- **Cara betulinnya**:
  Membulatkan nilai akhir total belanjaan menggunakan `.toFixed(2)` sebelum ditampilkan ke antarmuka pengguna di fungsi `renderCart()` dan `openReview()`.
  ```js
  totalPriceEl.textContent = total.toFixed(2);
  ```

---

### Temuan 2: [BUG] Input Jumlah Kosong Mengakibatkan Nilai `NaN`
- **Masalahnya apa**:
  Ketika pengguna menghapus seluruh angka di kotak input kuantitas barang belanjaan (`.edit-quantity-input`) di sidebar, nilai input menjadi kosong (`""`). Fungsi `parseInt("", 10)` menghasilkan nilai `NaN`. Karena `NaN <= 0` bernilai `false`, logika kode masuk ke blok `else` dan menyimpan kuantitas barang tersebut sebagai `NaN` (`cart[id].count = NaN`), sehingga total harga berubah menjadi `NaN`.
- **Cara buktiinnya**:
  1. Masukkan **Apel Fuji** ke keranjang.
  2. Klik kotak input kuantitas di sidebar, lalu hapus angka `1` menggunakan tombol Backspace (sehingga input kosong).
  3. Total harga di sidebar akan langsung berubah menjadi `NaN` dan merusak seluruh perhitungan keranjang belanja.
- **Kenapa ini bahaya / nggak adil**:
  Merusak pengalaman pengguna secara total karena keranjang belanja menjadi error. Pengguna tidak bisa melakukan checkout dan harus me-refresh halaman untuk memulihkan fungsi keranjang.
- **Cara betulinnya**:
  1. Pada event `input`, abaikan proses jika nilai input kosong agar tidak langsung diset ke `NaN`.
  2. Tambahkan event listener `change` (saat input kehilangan fokus atau menekan Enter). Jika nilainya kosong, tidak valid (`isNaN`), atau kurang dari sama dengan `0`, hapus item dari keranjang secara aman (`deleteItem`), jika valid perbarui kuantitasnya.
  ```js
  document.addEventListener("change", (event) => {
    const target = event.target;
    if (target.classList.contains("edit-quantity-input")) {
      const quantity = parseInt(target.value, 10);
      if (isNaN(quantity) || quantity <= 0) {
        deleteItem(target.dataset.id);
      } else {
        updateQuantity(target.dataset.id, quantity);
      }
    }
  });
  ```

---

### Temuan 3: [KEAMANAN] Cross-Site Scripting (XSS) di Note Preview
- **Masalahnya apa**:
  Toko menampilkan pratinjau catatan belanja ("Catatan buat petani") di sidebar keranjang menggunakan `.innerHTML` secara langsung: `preview.innerHTML = "Catatan: " + note;`. Karena tidak ada proses sanitasi/escaping, penyerang dapat menyisipkan kode HTML/JavaScript berbahaya ke dalam catatan tersebut yang akan langsung dieksekusi di browser.
- **Cara buktiinnya**:
  1. Di kolom "Catatan buat petani", masukkan payload XSS berikut:
     `<img src=x onerror=alert('Terinfeksi_XSS')>`
  2. Klik tombol di luar kolom input atau ketik sesuatu untuk memicu `renderCart()`.
  3. Pop-up alert berisi tulisan `'Terinfeksi_XSS'` akan langsung muncul di browser, membuktikan celah XSS aktif.
- **Kenapa ini bahaya / nggak adil**:
  Penyerang dapat memanfaatkan ini untuk mencuri data sensitif (seperti session token atau cookie), melakukan pengalihan halaman secara paksa, atau merusak tampilan halaman (*defacement*) pada browser pelanggan maupun admin toko yang membuka pesanan tersebut.
- **Cara betulinnya**:
  Mengganti penggunaan `.innerHTML` dengan `.textContent` agar input dari pengguna dirender sebagai teks biasa dan bukan kode HTML/JS.
  ```js
  preview.textContent = "Catatan: " + note;
  ```

---

### Temuan 4: [KEAMANAN] Kebocoran Kode Kupon Rahasia di Sisi Klien (Hardcoded Coupon)
- **Masalahnya apa**:
  Kode kupon diskon internal `TEMANFARMER` disimpan secara terang-terangan sebagai teks biasa (*plaintext*) di dalam variabel `const KUPON_RAHASIA = "TEMANFARMER";` pada file JavaScript klien (`main.js`).
- **Cara buktiinnya**:
  1. Klik kanan di halaman web, pilih **Inspect** atau tekan **F12** untuk membuka DevTools.
  2. Buka tab **Sources** dan lihat isi file `main.js`.
  3. Cari teks `KUPON_RAHASIA` dan Anda akan langsung menemukan kode kupon diskon 90% tersebut di baris 32.
- **Kenapa ini bahaya / nggak adil**:
  Toko akan mengalami kerugian finansial yang besar karena kode kupon diskon 90% yang ditujukan khusus bagi kalangan internal petani dapat dengan mudah ditemukan dan disalahgunakan oleh pembeli umum untuk memotong harga belanja secara curang.
- **Cara betulinnya**:
  Dalam aplikasi nyata, kupon divalidasi di server. Namun, untuk aplikasi murni client-side seperti ini, keamanan dapat ditingkatkan dengan menyimpan representasi satu arah berupa hash (SHA-256) dari kupon rahasia tersebut, bukan teks mentahnya. Kupon asli dicocokkan dengan meng-hash masukan pengguna lalu membandingkannya dengan hash yang disimpan.
  ```js
  const KUPON_HASH = "a12497e637e42764b41e7c6de1b07a8906d8e8841c7522a471a48a1ee74d61cd"; // SHA-256 dari "TEMANFARMER"
  ```

---

### Temuan 5: [KEAMANAN] Manipulasi Harga Barang Melalui DOM (`data-price`)
- **Masalahnya apa**:
  Saat tombol tambah barang (`+`) diklik, harga barang dibaca langsung dari atribut HTML `data-price` pada tombol tersebut (`addToCart(..., Number(target.dataset.price))`). Karena DOM dapat dimodifikasi secara bebas oleh pengguna melalui DevTools, siapa saja bisa mengubah nilai atribut ini sebelum melakukan klik tombol `+`.
- **Cara buktiinnya**:
  1. Buka DevTools > tab **Elements**.
  2. Arahkan kursor (*Inspect Element*) ke tombol `+` pada produk **Blueberry** (harga asli $5.00).
  3. Ubah atribut `data-price="5.0"` menjadi `data-price="0.01"` di panel HTML DevTools.
  4. Klik tombol `+` tersebut. Blueberry akan masuk ke keranjang belanja dengan harga `$0.01`.
- **Kenapa ini bahaya / nggak adil**:
  Pembeli nakal dapat membeli buah mahal dengan harga super murah (bahkan $0.00 / gratis), yang merugikan pemilik toko secara finansial.
- **Cara betulinnya**:
  Ubah fungsi `addToCart(id)` agar hanya menerima parameter `id` barang, lalu cari harga barang yang valid dari array catalog `products` internal di dalam memori JavaScript, bukan dari atribut HTML DOM.
  ```js
  cart[id].price = product.price; // Selalu merujuk ke data asli di memori JS
  ```

---

### Temuan 6: [ETIKA] Stok Palsu / Angka Manipulatif (Fake Stock / FOMO Urgency)
- **Masalahnya apa**:
  Jumlah stok sisa buah yang ditampilkan kepada pembeli (misal "tinggal 3 lagi hari ini!") dihasilkan secara acak menggunakan fungsi `Math.random()` setiap kali komponen dirender ulang. Ini merupakan pola gelap produk (*dark pattern*) berupa urgensi palsu agar pembeli panik dan terburu-buru checkout.
- **Cara buktiinnya**:
  1. Perhatikan sisa stok pada buah Apel Fuji (misal tertulis: "tinggal 4 lagi hari ini!").
  2. Tambahkan Apel Fuji ke keranjang. Hal ini memicu fungsi render ulang.
  3. Sisa stok Apel Fuji tiba-tiba berubah secara acak (misal menjadi "tinggal 2 lagi hari ini!"). Jika dikurangi atau ditambah lagi, angkanya akan terus melompat secara acak.
- **Kenapa ini bahaya / nggak adil**:
  Tindakan manipulatif yang tidak jujur kepada pelanggan. Menggunakan kebohongan stok sisa untuk memaksa keputusan pembelian melanggar etika pengembangan produk yang transparan dan jujur.
- **Cara betulinnya**:
  Menyimpan properti `stock` yang sesungguhnya secara statis pada masing-masing barang di catalog `products`. Kurangi jumlah stok tersebut secara dinamis saat barang dimasukkan ke keranjang belanja agar angkanya akurat, jujur, dan konsisten.
  ```js
  const sisa = product.stock - quantity; // Jujur, konsisten, dinamis
  ```

---

### Temuan 7: [ETIKA] Biaya Tersembunyi (Hidden Handling Fee / Drip Pricing)
- **Masalahnya apa**:
  Toko menambahkan biaya penanganan (`HANDLING_FEE = 0.30`) ke total belanjaan secara diam-diam di sidebar keranjang tanpa menampilkan rincian biaya tersebut. Pembeli hanya melihat total harga akhir yang lebih mahal dibanding penjumlahan harga barang mereka tanpa tahu dari mana asalnya biaya ekstra tersebut. Rincian baru diperlihatkan saat membuka modal konfirmasi checkout.
- **Cara buktiinnya**:
  1. Masukkan **Apel Fuji** ($1.50) sebanyak 1 buah ke keranjang.
  2. Total harga di sidebar akan tertulis `$1.80`.
  3. Tidak ada informasi sama sekali di sidebar yang menjelaskan dari mana selisih biaya `$0.30` itu berasal.
- **Kenapa ini bahaya / nggak adil**:
  Merupakan teknik penipuan halus (*Drip Pricing*) yang menyembunyikan biaya tambahan di awal dan baru mengungkapkannya secara transparan di akhir agar pembeli yang tidak teliti terpaksa membayar lebih.
- **Cara betulinnya**:
  Tampilkan rincian "Subtotal" (harga total semua barang belanjaan) dan "Biaya penanganan: $0.30" secara transparan di sidebar keranjang belanja tepat di atas baris total harga, sehingga pembeli memahami asal-usul angka total sejak awal.
  ```js
  // Render baris Subtotal secara transparan di sidebar
  subtotalEl.innerHTML = `<span>Subtotal</span><strong>$${totalPrice.toFixed(2)}</strong>`;

  // Render baris penanganan secara transparan di sidebar
  handlingEl.innerHTML = `<span>Biaya penanganan</span><strong>$${HANDLING_FEE.toFixed(2)}</strong>`;
  ```

---

### Temuan Tambahan (Stretch Goal): Ketiadaan Batas Stok Belanja
- **Masalahnya apa**:
  Toko sebelumnya tidak memiliki batas kuantitas belanjaan. Pembeli dapat memasukkan jumlah buah sebanyak apa pun ke keranjang belanja (bahkan melebihi stok fisik buah yang tersedia), dan sistem akan tetap menerimanya. Stok sisa di kartu produk juga tidak pernah berkurang secara logis atau sinkron dengan jumlah barang di keranjang.
- **Cara buktiinnya**:
  1. Sebelum perbaikan, ketik kuantitas `999` buah Blueberry di input kuantitas keranjang belanja.
  2. Sistem akan memproses total harga secara membabi buta tanpa ada penolakan batas stok fisik.
- **Kenapa ini bahaya / nggak adil**:
  Menyebabkan masalah operasional di mana pembeli memesan barang melebihi stok nyata petani, berujung pada pembatalan pesanan sepihak dan kekecewaan pelanggan.
- **Cara betulinnya**:
  Tambahkan pengecekan batas maksimum stok (`product.stock`) di fungsi `addToCart` and `updateQuantity`. Jika kuantitas melebihi stok yang tersedia, tampilkan pesan peringatan dan set jumlahnya ke kuantitas maksimum stok yang tersedia.

---

## REFLEKSI PENUTUP

### Apa bedanya "kode jalan" sama "kode benar & jujur" menurutmu setelah level ini?

"**Kode jalan**" hanyalah kode yang secara fungsionalitas teknis tidak menghasilkan error dan mampu menyelesaikan skenario utama (happy path) — misalnya, tombol bisa diklik, keranjang bisa bertambah, dan modal checkout bisa muncul. Namun, kode seperti ini sering kali mengabaikan validasi input, memaparkan celah keamanan kritis (seperti kebocoran rahasia atau kerentanan XSS), serta menggunakan teknik manipulatif (*dark patterns*) untuk menipu pembeli demi keuntungan sepihak.

Di sisi lain, "**kode benar & jujur**" adalah kode yang ditulis dengan tanggung jawab penuh, mengedepankan keamanan data pengguna (*secure by design*), menangani input-input ekstrem/nakal agar aplikasi tidak rusak, serta memperlakukan pembeli secara adil melalui transparansi harga dan stok yang riil. Kode yang benar dan jujur menempatkan KEPERCAYAAN pelanggan di atas trik psikologis penjualan cepat. Sebagai engineer, kita adalah benteng pertahanan terakhir yang menjamin keadilan sistem sebelum diaplikasikan ke dunia nyata.
