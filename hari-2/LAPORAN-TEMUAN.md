# Laporan Temuan Bug - Pasar Pagi

Tinjauan dilakukan pada commit terbaru di folder `hari-2`:
- `7a45f55` - `docs: rewrite hari-2 README as no-spoiler brief`
- `c1f8698` - `feat: add hari-2 Pasar Pagi bug-bounty exercise`

## Temuan 1 - BUG
- Masalahnya apa: input jumlah barang sulit diedit manual. Saat user menghapus isi field jumlah lalu mengetik ulang, UI langsung me-render ulang dan membatalkan edit sementara.
- Lokasi: [`main.js`](./main.js) baris 158-166 dan 284-289.
- Cara buktiinnya:
  1. Tambahkan 1 barang ke keranjang.
  2. Di field jumlah, hapus angka sampai kosong.
  3. Coba ketik angka baru, misalnya `12`.
  4. Field sering balik lagi sebelum edit selesai.
- Kenapa bahaya / tidak benar: user tidak bisa melakukan edit angka dengan normal. Ini merusak alur belanja dan bisa bikin jumlah yang dimaksud tidak tersimpan.
- Cara betulinnya: pisahkan state input dari state cart, atau hanya validasi saat `blur` / `Enter` bukan saat setiap `input`.

## Temuan 2 - BUG
- Masalahnya apa: angka stok yang ditampilkan tidak stabil. Nilai stok dibuat acak setiap kali `renderProducts()` dipanggil, dan `renderCart()` memanggil `renderProducts()` lagi.
- Lokasi: [`main.js`](./main.js) baris 47-49 dan 76-85.
- Cara buktiinnya:
  1. Buka halaman.
  2. Catat angka `tinggal X lagi hari ini!` pada salah satu produk.
  3. Klik `+` atau `-` pada keranjang, atau ubah catatan.
  4. Angka stok bisa berubah walaupun tidak ada perubahan inventori.
- Kenapa bahaya / tidak benar: informasi stok jadi tidak konsisten dan menyesatkan. UI terlihat seperti data real, padahal nilainya hanya hasil random ulang.
- Cara betulinnya: stok harus berasal dari data tetap yang tidak diacak saat render, atau dihitung dari sumber data inventori yang konsisten.

## Temuan 3 - KEAMANAN
- Masalahnya apa: kode kupon rahasia disimpan langsung di browser dan dicek di sisi client.
- Lokasi: [`main.js`](./main.js) baris 32 dan 173-181.
- Cara buktiinnya:
  1. Buka `main.js` di browser atau DevTools.
  2. Cari `KUPON_RAHASIA`.
  3. Nilai kupon terlihat jelas: `TEMANFARMER`.
  4. Masukkan kode itu di form kupon dan diskon aktif.
- Kenapa bahaya / tidak aman: siapa pun bisa melihat dan memakai kode tersebut. Untuk sistem nyata, diskon seperti ini tidak boleh dipercaya sepenuhnya di client.
- Cara betulinnya: validasi kupon di server dan jangan simpan rahasia bisnis di bundle frontend.

## Ringkasan
- Bug utama yang paling terasa ke user: edit jumlah barang dan stok yang berubah sendiri.
- Risiko keamanan paling jelas: rahasia kupon ada di client.
- Kode ini memang jalan, tetapi belum layak dianggap benar dan jujur untuk dipakai sebagai aplikasi nyata.
