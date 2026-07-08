# Laporan Temuan Bug - Pasar Pagi

Tinjauan dilakukan pada commit terbaru di folder `hari-2`:
- `7a45f55` - `docs: rewrite hari-2 README as no-spoiler brief`
- `c1f8698` - `feat: add hari-2 Pasar Pagi bug-bounty exercise`

## Temuan 1 - BUG
- Masalahnya apa: input jumlah barang sulit diedit manual. Saat user menghapus isi field jumlah lalu mengetik ulang, UI langsung me-render ulang dan membatalkan edit sementara.
- Lokasi: [`main.js`](./main.js) baris 158-165 dan 280-287.
- Cara buktiinnya:
  1. Tambahkan 1 barang ke keranjang.
  2. Di field jumlah, hapus angka sampai kosong.
  3. Coba ketik angka baru, misalnya `12`.
  4. Field sering balik lagi sebelum edit selesai.
- Kenapa bahaya / tidak benar: user tidak bisa melakukan edit angka dengan normal. Ini merusak alur belanja dan bisa bikin jumlah yang dimaksud tidak tersimpan.
- Cara betulinnya: pisahkan state input dari state cart, atau hanya validasi saat `blur` / `Enter`, bukan saat setiap `input`.

## Temuan 2 - BUG
- Masalahnya apa: setiap kali user mengetik catatan atau mengubah keranjang, seluruh katalog produk ikut di-render ulang. Efeknya, UI terasa janky dan stok terlihat berubah terus.
- Lokasi: [`main.js`](./main.js) baris 76-84, 125, 138, 148, 154, 181, 248, 287, 292-293.
- Cara buktiinnya:
  1. Isi catatan di kolom note.
  2. Tambahkan atau kurangi barang beberapa kali.
  3. Perhatikan kartu produk di sebelah kiri terus dibangun ulang.
- Kenapa bahaya / tidak benar: perubahan kecil di keranjang memicu pembaruan seluruh katalog yang tidak perlu. Ini bikin UX berantakan dan memperbesar efek samping lain seperti stok acak.
- Cara betulinnya: pisahkan render katalog dari render keranjang, dan update hanya bagian yang berubah.

## Temuan 3 - KEAMANAN
- Masalahnya apa: kode kupon rahasia disimpan langsung di browser dan dicek di sisi client.
- Lokasi: [`main.js`](./main.js) baris 32 dan 169-181.
- Cara buktiinnya:
  1. Buka source atau DevTools.
  2. Cari `KUPON_RAHASIA`.
  3. Nilai kupon terlihat jelas: `TEMANFARMER`.
  4. Masukkan kode itu di form kupon dan diskon aktif.
- Kenapa bahaya / tidak aman: siapa pun bisa melihat dan memakai kode tersebut. Untuk sistem nyata, diskon seperti ini tidak boleh dipercaya sepenuhnya di client.
- Cara betulinnya: validasi kupon di server dan jangan simpan rahasia bisnis di bundle frontend.

## Temuan 4 - KEAMANAN
- Masalahnya apa: total pembayaran dan potongan dihitung penuh di browser, jadi angka final bergantung pada state client yang tidak bisa dipercaya.
- Lokasi: [`main.js`](./main.js) baris 29-30, 120, 223-230.
- Cara buktiinnya:
  1. Tambahkan barang ke keranjang.
  2. Buka DevTools.
  3. Ubah runtime atau source yang menghitung harga.
  4. Angka total yang tampil bisa dibuat berbeda dari harga resmi.
- Kenapa bahaya / tidak aman: semua keputusan finansial penting dibuat di sisi client. Dalam aplikasi nyata, pelanggan bisa memanipulasi total yang dibayar kalau tidak ada validasi server.
- Cara betulinnya: hitung total dan verifikasi harga di server, lalu jadikan frontend hanya sebagai tampilan.

## Temuan 5 - KEAMANAN
- Masalahnya apa: render review memakai `innerHTML` untuk membangun baris item. Saat data yang dirender bukan data statis tepercaya, ini jadi sink XSS.
- Lokasi: [`main.js`](./main.js) baris 213-230.
- Cara buktiinnya:
  1. Buka logika `review-line` di DevTools.
  2. Lihat bahwa nama item dan total disusun lewat `innerHTML`.
  3. Jika data produk pernah datang dari sumber tidak tepercaya, payload HTML bisa masuk ke DOM mentah.
- Kenapa bahaya / tidak aman: pola ini aman hanya karena data saat ini hardcoded. Begitu sumber data berubah, permukaan XSS muncul.
- Cara betulinnya: bangun node dengan `textContent` / `createElement`, bukan menyusun HTML mentah untuk data yang bisa berubah sumbernya.

## Temuan 6 - ETIKA
- Masalahnya apa: angka stok dibuat acak dan berubah saat halaman dirender ulang, sehingga terlihat seperti stok nyata padahal hanya dibuat-buat.
- Lokasi: [`main.js`](./main.js) baris 47-49 dan 76-84.
- Cara buktiinnya:
  1. Catat angka stok salah satu produk.
  2. Klik tombol pada keranjang atau ubah catatan.
  3. Angka stok berubah sendiri.
- Kenapa bahaya / tidak adil: ini menciptakan kesan kelangkaan palsu dan bisa mendorong user belanja cepat tanpa dasar yang jujur.
- Cara betulinnya: tampilkan stok hanya jika benar-benar berasal dari inventori yang stabil.

## Temuan 7 - ETIKA
- Masalahnya apa: biaya penanganan baru terlihat di ringkasan checkout, bukan sejak awal saat user melihat harga barang.
- Lokasi: [`index.html`](./index.html) baris 56-58 dan [`main.js`](./main.js) baris 120, 223-230.
- Cara buktiinnya:
  1. Tambahkan barang ke keranjang.
  2. Bandingkan subtotal barang dengan total akhir.
  3. Lihat bahwa ada biaya tambahan yang muncul belakangan.
- Kenapa bahaya / tidak adil: user bisa mengira harga akhir cuma penjumlahan produk, lalu baru melihat biaya ekstra di tahap akhir.
- Cara betulinnya: jelaskan biaya tambahan lebih awal dan konsisten di seluruh alur belanja.

## Ringkasan
- Bug utama yang paling terasa ke user: edit jumlah barang dan rerender penuh yang membuat UI tidak stabil.
- Risiko keamanan paling jelas: rahasia kupon dan logika harga ada di client.
- Isu etika paling jelas: stok palsu dan biaya tambahan yang tidak dijelaskan sejak awal.
- Kode ini memang jalan, tetapi belum layak dianggap benar dan jujur untuk dipakai sebagai aplikasi nyata.
