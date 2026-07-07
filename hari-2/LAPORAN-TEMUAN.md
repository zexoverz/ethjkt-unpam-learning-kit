# LAPORAN TEMUAN — PASAR PAGI

Dokumen ini berisi 7 temuan hasil analisis terhadap aplikasi toko buah di folder hari-2, dengan fokus pada bug, celah keamanan, dan pola gelap yang dapat merugikan pembeli.

## Temuan 1 — BUG
- Masalahnya apa: Input jumlah barang yang tidak valid dapat membuat keranjang menjadi rusak.
- Cara buktiinnya:
  1. Tambahkan produk ke keranjang.
  2. Di panel keranjang, ubah nilai input jumlah menjadi kosong, huruf, atau angka negatif.
  3. Perhatikan bahwa kode memanggil `parseInt()` lalu langsung menugaskan hasil ke `count`.
- Kenapa ini bahaya: Nilai `NaN` atau angka tidak wajar dapat membuat total belanja jadi kacau dan tampilan keranjang tidak lagi konsisten.
- Cara betulinnya: Validasi input sebelum menyimpan, misalnya hanya menerima angka bulat positif dan mengembalikan nilai default jika input tidak valid.

## Temuan 2 — BUG
- Masalahnya apa: Total belanja dapat tampil dengan format angka yang tidak rapi karena perhitungan memakai bilangan floating point.
- Cara buktiinnya:
  1. Tambahkan beberapa barang dengan harga desimal.
  2. Perhatikan bahwa total dihitung dari angka desimal JavaScript, bukan dari nilai uang yang dijamin presisi.
  3. Hasil dapat muncul seperti `3.3000000000000003` atau angka serupa.
- Kenapa ini bahaya: Pembeli bisa melihat total yang terlihat aneh dan sistem dapat menghitung pembayaran dengan kesalahan kecil yang mengganggu kejujuran toko.
- Cara betulinnya: Hitung menggunakan sen atau integer, lalu tampilkan hasil dengan format dua desimal saat menampilkan ke layar.

## Temuan 3 — KEAMANAN
- Masalahnya apa: Catatan pembeli ditampilkan lewat `innerHTML`, sehingga input berisi tag HTML atau JavaScript dapat diproses sebagai markup.
- Cara buktiinnya:
  1. Buka keranjang.
  2. Isi kolom catatan dengan payload seperti `<img src=x onerror=alert('xss')>`.
  3. Lihat bahwa kode menampilkan input tersebut sebagai HTML, bukan teks biasa.
- Kenapa ini bahaya: Ini membuka celah XSS. Penyerang dapat menyisipkan skrip yang berjalan di browser pembeli dan mencuri data, mengganggu tampilan, atau melakukan tindakan yang tidak diinginkan.
- Cara betulinnya: Selalu gunakan `textContent` untuk menampilkan input pengguna yang berasal dari teks bebas.

## Temuan 4 — KEAMANAN
- Masalahnya apa: Logika kupon dan rahasia diskon berada di sisi klien dan terlihat jelas di kode.
- Cara buktiinnya:
  1. Buka file JavaScript dan cari konstanta `KUPON_RAHASIA`.
  2. Lihat bahwa kode memeriksa kupon di browser, bukan di server.
  3. Pengguna bisa mengubah nilai lewat DevTools atau melihat sumber kode untuk menebus diskon.
- Kenapa ini bahaya: Sistem diskon tidak aman karena aturan penting diputus di browser yang sepenuhnya bisa dimanipulasi oleh pengguna.
- Cara betulinnya: Validasi kupon dan penerapan diskon harus dilakukan di server, bukan di sisi klien.

## Temuan 5 — KEAMANAN
- Masalahnya apa: Harga yang dipakai untuk menghitung total berasal dari atribut DOM yang bisa diedit user lewat DevTools.
- Cara buktiinnya:
  1. Klik tombol tambah produk.
  2. Buka DevTools dan ubah nilai `data-price` pada tombol produk.
  3. Klik tombol tambah lagi dan lihat bahwa total belanja ikut berubah.
- Kenapa ini bahaya: Pembeli atau penyerang dapat memanipulasi harga yang dipakai sistem untuk menghitung total pembayaran.
- Cara betulinnya: Harga harus diambil dari sumber yang aman di server, bukan dari elemen HTML yang bisa dimodifikasi di browser.

## Temuan 6 — ETIKA
- Masalahnya apa: Informasi stok yang ditampilkan bersifat palsu dan dibuat secara acak.
- Cara buktiinnya:
  1. Lihat kartu produk.
  2. Perhatikan teks `tinggal X lagi hari ini!`.
  3. Klik tombol tambah/kurangi atau refresh halaman beberapa kali.
  4. Nilai stok berubah-ubah secara acak, padahal ini bukan data stok nyata.
- Kenapa ini bahaya: Ini adalah pola gelap yang memaksa pembeli merasa buru-buru dan tertekan, padahal toko tidak memiliki dasar nyata untuk klaim tersebut.
- Cara betulinnya: Tampilkan stok hanya jika data nyata tersedia dari sistem inventaris, dan jangan membuat angka yang terlihat seperti fakta.

## Temuan 7 — ETIKA
- Masalahnya apa: Biaya penanganan ditambahkan secara diam-diam ke total belanja tanpa penjelasan yang jelas di awal.
- Cara buktiinnya:
  1. Tambahkan barang ke keranjang.
  2. Perhatikan bahwa total akhir berubah karena ada biaya penanganan yang ditambahkan di kode.
  3. Informasi ini tidak terlihat jelas sejak awal di antarmuka utama.
- Kenapa ini bahaya: Ini bisa dianggap sebagai biaya tersembunyi yang membuat pembeli merasa dibohongi di saat terakhir, terutama jika mereka tidak sadar akan biaya tambahan.
- Cara betulinnya: Tampilkan biaya tambahan sejak awal, jelaskan tujuannya, dan pastikan pembeli melihatnya sebelum menekan checkout.

## Refleksi Penutup
- Bedanya kode yang “jalan” dan kode yang “benar serta jujur” adalah bahwa kode yang benar tidak hanya menghasilkan output yang terlihat rapi, tetapi juga aman, konsisten, transparan, dan tidak menipu pengguna.
