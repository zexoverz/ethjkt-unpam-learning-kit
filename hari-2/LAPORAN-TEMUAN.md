# Laporan Temuan

Temuan 1: [BUG]
- Masalahnya apa: Input jumlah barang yang dikosongkan menghasilkan `NaN` karena `parseInt("")` menghasilkan `NaN`, lalu tetap disimpan ke `cart[id].count`.
- Cara buktiinnya: Tambahkan satu barang, kosongkan input jumlah di keranjang, lalu lihat total dan jumlah keranjang berubah menjadi `NaN`.
- Kenapa ini bahaya / nggak adil: Pembeli melihat total yang rusak dan aplikasi tidak bisa menghitung pesanan dengan benar.
- Cara betulinnya: Validasi input dengan `Number.isFinite`, tolak nilai kosong, dan hanya terima bilangan bulat positif.

Temuan 2: [BUG]
- Masalahnya apa: Input seperti `1e3` atau `2.9` diproses dengan `parseInt`, sehingga nilainya berubah menjadi `1` atau `2`.
- Cara buktiinnya: Tambahkan barang, isi jumlah dengan `1e3` atau `2.9`, lalu lihat jumlah yang dihitung tidak sesuai input.
- Kenapa ini bahaya / nggak adil: Pembeli bisa mengira memasukkan jumlah tertentu, tapi sistem menghitung jumlah lain.
- Cara betulinnya: Gunakan `Number()` dan validasi ketat bahwa input adalah integer positif, misalnya `Number.isInteger(quantity)`.

Temuan 3: [BUG]
- Masalahnya apa: Total uang tidak selalu diformat 2 angka desimal karena total ditampilkan langsung tanpa `.toFixed(2)`.
- Cara buktiinnya: Tambahkan Blueberry harga `$5.00`; total sidebar menjadi `$5.3`, bukan `$5.30`.
- Kenapa ini bahaya / nggak adil: Tampilan uang terlihat tidak profesional dan bisa membingungkan pembeli saat membandingkan harga.
- Cara betulinnya: Selalu format nilai uang dengan `.toFixed(2)` atau formatter mata uang seperti `Intl.NumberFormat`.

Temuan 4: [BUG]
- Masalahnya apa: Input negatif seperti `-5` tidak ditolak, tapi langsung menghapus barang dari keranjang.
- Cara buktiinnya: Tambahkan barang, isi jumlah dengan `-5`, lalu barang hilang dari keranjang.
- Kenapa ini bahaya / nggak adil: Angka negatif bukan perintah hapus. Aplikasi seharusnya memberi pesan validasi, bukan diam-diam menghapus item.
- Cara betulinnya: Tolak nilai kurang dari 1 dan tampilkan pesan error; gunakan tombol hapus sebagai satu-satunya aksi menghapus barang.

Temuan 5: [BUG]
- Masalahnya apa: Tidak ada batas maksimum jumlah barang, padahal UI menampilkan stok terbatas.
- Cara buktiinnya: Tambahkan barang, isi jumlah `999999999`, lalu total langsung melonjak tanpa peringatan.
- Kenapa ini bahaya / nggak adil: Pesanan jadi tidak realistis dan tidak konsisten dengan klaim stok.
- Cara betulinnya: Simpan stok asli di data produk dan batasi jumlah maksimal sesuai stok.

Temuan 6: [KEAMANAN]
- Masalahnya apa: Input catatan ditampilkan dengan `innerHTML`, sehingga HTML atau JavaScript dari user bisa dieksekusi.
- Cara buktiinnya: Tambahkan barang, isi catatan dengan `<img src=x onerror=alert("XSS")>`, lalu alert muncul.
- Kenapa ini bahaya / nggak adil: Ini celah XSS. Penyerang bisa menjalankan script di browser korban.
- Cara betulinnya: Gunakan `textContent` untuk menampilkan catatan, atau sanitasi HTML dengan library yang terpercaya jika HTML memang harus diizinkan.

Temuan 7: [KEAMANAN]
- Masalahnya apa: Payload XSS dari catatan bisa aktif lagi setiap keranjang dirender ulang.
- Cara buktiinnya: Masukkan payload XSS di catatan, lalu klik `+` atau `-` barang. Keranjang dirender ulang dan payload bisa jalan lagi.
- Kenapa ini bahaya / nggak adil: Dampak XSS makin besar karena script bisa terpanggil berulang saat user berinteraksi.
- Cara betulinnya: Jangan render input user dengan `innerHTML`; render ulang catatan dengan node teks aman.

Temuan 8: [KEAMANAN]
- Masalahnya apa: Kode kupon rahasia disimpan di client sebagai `KUPON_RAHASIA = "TEMANFARMER"`.
- Cara buktiinnya: Buka DevTools, cari `KUPON_RAHASIA` atau `TEMANFARMER` di `main.js`, lalu pakai kupon itu.
- Kenapa ini bahaya / nggak adil: Rahasia yang dikirim ke browser bukan rahasia lagi. Semua pembeli bisa menemukan kupon internal.
- Cara betulinnya: Validasi kupon di server, jangan simpan kode rahasia atau aturan diskon penting di JavaScript client.

Temuan 9: [KEAMANAN]
- Masalahnya apa: Logika diskon 90% sepenuhnya ditentukan di browser melalui variabel `diskon`.
- Cara buktiinnya: Pakai DevTools Local Overrides, ubah `diskon = 0.9` menjadi `diskon = 1`, lalu reload dan pakai kupon.
- Kenapa ini bahaya / nggak adil: Pembeli bisa memanipulasi aturan diskon dan membuat total tidak sesuai aturan toko.
- Cara betulinnya: Hitung diskon final di server dan kirim hasil yang sudah tervalidasi ke client.

Temuan 10: [KEAMANAN]
- Masalahnya apa: Harga barang diambil dari atribut DOM `data-price`, bukan selalu dari katalog resmi.
- Cara buktiinnya: Di DevTools, ubah `data-price` tombol `+` Apel dari `1.5` menjadi `0.01`, lalu klik tombol itu.
- Kenapa ini bahaya / nggak adil: Pembeli bisa membeli barang dengan harga yang mereka ubah sendiri di browser.
- Cara betulinnya: Saat menambah barang, ambil harga dari data produk resmi atau validasi ulang harga di server.

Temuan 11: [KEAMANAN]
- Masalahnya apa: Harga negatif bisa dibuat lewat DevTools karena tidak ada validasi harga harus lebih dari 0.
- Cara buktiinnya: Ubah `data-price` tombol produk menjadi `-100`, lalu klik `+`; total ikut turun atau menjadi negatif.
- Kenapa ini bahaya / nggak adil: Penyerang bisa membuat total pesanan lebih murah secara tidak sah.
- Cara betulinnya: Tolak harga dari DOM, validasi harga di server, dan pastikan harga selalu angka positif dari sumber resmi.

Temuan 12: [KEAMANAN]
- Masalahnya apa: `data-id` dan `data-price` bisa dibuat tidak cocok, sehingga produk mahal bisa dimasukkan dengan harga murah.
- Cara buktiinnya: Ubah tombol Apel menjadi `data-id="6"` dan `data-price="0.01"`, lalu klik. Keranjang bisa menambahkan Blueberry dengan harga murah.
- Kenapa ini bahaya / nggak adil: Identitas produk dan harga tidak terikat kuat, sehingga total mudah dimanipulasi.
- Cara betulinnya: Kirim hanya product id dari client, lalu cari harga resmi berdasarkan id di server.

Temuan 13: [ETIKA]
- Masalahnya apa: Klaim stok dibuat random dengan `Math.floor(Math.random() * 5) + 1`, bukan dari data stok asli.
- Cara buktiinnya: Refresh atau klik barang beberapa kali, lalu lihat teks stok berubah-ubah.
- Kenapa ini bahaya / nggak adil: Pembeli diberi tekanan palsu seolah barang hampir habis.
- Cara betulinnya: Tampilkan stok hanya jika berasal dari data inventori yang benar.

Temuan 14: [ETIKA]
- Masalahnya apa: Semua produk selalu terlihat langka karena stok selalu 1 sampai 5.
- Cara buktiinnya: Perhatikan semua kartu produk; semuanya menampilkan teks `tinggal X lagi hari ini!`.
- Kenapa ini bahaya / nggak adil: Ini membuat kelangkaan palsu untuk mendorong pembeli cepat membeli.
- Cara betulinnya: Jangan tampilkan klaim kelangkaan kecuali memang sesuai kondisi stok asli.

Temuan 15: [ETIKA]
- Masalahnya apa: Angka stok berubah sendiri saat user berinteraksi karena `renderCart()` memanggil `renderProducts()` dan stok dihitung ulang.
- Cara buktiinnya: Catat stok salah satu barang, klik `+`, lalu lihat stok bisa berubah tanpa alasan.
- Kenapa ini bahaya / nggak adil: Pembeli bisa merasa stok makin habis, padahal angka hanya berubah karena render ulang.
- Cara betulinnya: Simpan stok sebagai data tetap dari sumber inventori, bukan dihitung random setiap render.

Temuan 16: [ETIKA]
- Masalahnya apa: Klaim stok tidak membatasi pembelian. UI bisa bilang tinggal 1, tapi user tetap bisa beli lebih dari itu.
- Cara buktiinnya: Cari produk yang tertulis `tinggal 1 lagi`, lalu klik `+` berkali-kali sampai jumlah melebihi 1.
- Kenapa ini bahaya / nggak adil: Ini membuktikan klaim stok hanya tekanan visual, bukan informasi inventori yang jujur.
- Cara betulinnya: Batasi jumlah pembelian sesuai stok yang benar, atau hapus klaim stok dari UI.

Temuan 17: [ETIKA]
- Masalahnya apa: Biaya penanganan `$0.30` ditambahkan ke total sidebar tanpa breakdown yang jelas.
- Cara buktiinnya: Tambahkan Apel `$1.50`; total sidebar menjadi `$1.80`, tapi sidebar tidak menjelaskan biaya tambahan.
- Kenapa ini bahaya / nggak adil: Pembeli melihat total lebih tinggi tanpa tahu komponen biayanya.
- Cara betulinnya: Tampilkan subtotal, biaya penanganan, diskon, dan total akhir sejak di sidebar.

Temuan 18: [ETIKA]
- Masalahnya apa: Breakdown biaya penanganan baru muncul di modal checkout.
- Cara buktiinnya: Tambahkan barang, klik `Lanjut ke Pembayaran`, lalu baru terlihat baris `Biaya penanganan`.
- Kenapa ini bahaya / nggak adil: Biaya penting muncul terlambat setelah pembeli sudah masuk proses pembayaran.
- Cara betulinnya: Jelaskan biaya tambahan sebelum checkout, bukan hanya di tahap review akhir.

Temuan 19: [ETIKA]
- Masalahnya apa: Tombol checkout tidak memberi sinyal bahwa ada biaya tambahan.
- Cara buktiinnya: Lihat tombol `Lanjut ke Pembayaran`; tidak ada teks seperti `lihat rincian biaya` atau `termasuk biaya penanganan`.
- Kenapa ini bahaya / nggak adil: Pembeli diarahkan lanjut dulu sebelum memahami biaya tambahan.
- Cara betulinnya: Ubah UI agar rincian biaya terlihat sebelum tombol checkout, atau beri label yang transparan.

Temuan 20: [ETIKA]
- Masalahnya apa: Bahasa stok memakai frasa mendesak seperti `tinggal ... lagi hari ini!`.
- Cara buktiinnya: Lihat teks stok pada kartu produk.
- Kenapa ini bahaya / nggak adil: Bahasa tersebut menciptakan urgensi waktu, padahal stoknya tidak terbukti benar.
- Cara betulinnya: Gunakan copy yang netral dan faktual, misalnya `Stok tersedia: X`, hanya jika datanya benar.
