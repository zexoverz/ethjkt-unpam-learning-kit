# Laporan Temuan Hari 2

## Temuan 1: BUG
- Masalahnya: input jumlah barang bisa kosong atau berisi nilai non-angka, lalu menghancurkan perhitungan keranjang.
- Cara buktiinnya: buka keranjang, edit jumlah barang, hapus isinya, atau masukkan teks lewat DevTools.
- Kenapa ini bahaya / nggak adil: total dan detail keranjang jadi salah, pengguna bisa melihat angka yang tidak masuk akal.
- Cara betulinya: validasi input sebagai bilangan bulat positif sebelum menyimpan ke state.
- Status saat ini: sudah diperbaiki.

## Temuan 2: BUG
- Masalahnya: total uang bisa tampil dengan format yang tidak konsisten karena angka mentah ditulis langsung ke UI.
- Cara buktiinnya: tambahkan beberapa item dengan kombinasi harga desimal lalu lihat ringkasan dan modal checkout.
- Kenapa ini bahaya / nggak adil: pengguna melihat nominal yang berpotensi membingungkan atau tampak tidak rapi.
- Cara betulinya: format semua nominal dengan dua desimal lewat satu helper.
- Status saat ini: sudah diperbaiki.

## Temuan 3: KEAMANAN
- Masalahnya: preview catatan memakai `innerHTML`, jadi input user bisa dieksekusi sebagai HTML.
- Cara buktiinnya: isi note dengan markup berbahaya lalu lihat preview sebelum checkout.
- Kenapa ini bahaya / nggak adil: membuka peluang XSS di halaman.
- Cara betulinya: render catatan sebagai text node, bukan HTML mentah.
- Status saat ini: sudah diperbaiki.

## Temuan 4: KEAMANAN
- Masalahnya: harga item diambil dari `data-price` pada tombol, bukan dari katalog sumber.
- Cara buktiinnya: ubah `data-price` lewat DevTools lalu klik tambah barang.
- Kenapa ini bahaya / nggak adil: pengguna bisa memalsukan harga keranjang.
- Cara betulinya: lookup harga dari data produk internal, bukan dari DOM.
- Status saat ini: sudah diperbaiki.

## Temuan 5: KEAMANAN
- Masalahnya: kupon dianggap rahasia padahal logika dan nilainya ada di client.
- Cara buktiinnya: buka source atau DevTools dan cari konstanta kupon.
- Kenapa ini bahaya / nggak adil: rahasia yang ditanam di frontend bukan rahasia.
- Cara betulinya: perlakukan kupon sebagai demo publik atau pindahkan validasi ke server.
- Status saat ini: sudah diperjelas sebagai kupon demo publik, bukan rahasia.

## Temuan 6: KEAMANAN
- Masalahnya: keputusan harga final dibuat sepenuhnya di browser.
- Cara buktiinnya: ubah state di DevTools lalu bandingkan total yang tampil.
- Kenapa ini bahaya / nggak adil: browser tidak boleh menjadi sumber kebenaran untuk harga yang sensitif.
- Cara betulinya: frontend hanya menampilkan estimasi, sementara otorisasi harga harus dari server.
- Status saat ini: masih frontend-only, jadi diperlakukan sebagai demo dan sudah dibuat lebih transparan.

## Temuan 7: ETIKA
- Masalahnya: stok ditampilkan dengan angka acak dan bahasa yang memicu panik.
- Cara buktiinnya: refresh halaman berkali-kali dan lihat angka stok berubah sendiri.
- Kenapa ini bahaya / nggak adil: pengguna didorong belanja karena takut kehabisan, bukan karena informasi nyata.
- Cara betulinya: gunakan stok yang konsisten dan jelaskan arti angka dengan jujur.
- Status saat ini: sudah diperbaiki dengan stok tetap dan batas stok per item.

## Temuan 8: ETIKA
- Masalahnya: biaya penanganan muncul sebagai angka tambahan tanpa penjelasan awal yang cukup jelas.
- Cara buktiinnya: bandingkan tampilan ringkasan sidebar dan checkout modal.
- Kenapa ini bahaya / nggak adil: selisih harga terasa disembunyikan sampai akhir proses.
- Cara betulinya: tampilkan breakdown biaya sejak awal di sidebar.
- Status saat ini: sudah diperjelas di sidebar sebelum checkout.

## Refleksi
- Kode yang jalan belum tentu kode yang benar dan jujur.
- Setelah verifikasi, saya melihat bahwa bug teknis, celah keamanan, dan pola gelap sama-sama bisa lolos jika hanya mengandalkan tampilan yang rapi.
