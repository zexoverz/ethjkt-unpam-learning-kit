TokenKu itu kaya buku catetan yang nyatet uang kita. 
fungsi transfer sama aja kaya umumnya untuk memindahkan uang.
approve fungsinya kaya surat kuasa yang ngasih izin pihak lain buat megang/mengurus uang kita.

SimpleAMM itu kaya money changer tapi otomatis, berjalan full pake code tanpa perlu perantara di tengahnya.
addLiquidity itu proses seperti setor tunai ke mesin penukar uang agar mesinnya punya modal buat beroperasi.
swap merupakan proses penukaran uangnya.

Pembuktian Rumus x * y = k
1. Kondisi SEBELUM Swap (Kondisi Awal saat Tambah LP):

Reserve A (Pool FFT) = 1000

Reserve B (Pool ETHJKT) = 1000

k_sebelum = 1000 * 1000 = 1.000.000

2. Transaksi yang Terjadi:

Melakukan swap 90 FFT menjadi 82,3415 ETHJKT.

3. Kondisi SESUDAH Swap (Kondisi Pool Saat Ini):

Reserve A (Pool FFT) = 1090

Reserve B (Pool ETHJKT) = 917,66

k_sesudah = 1090 * 917,66 = 1.000.249,4

### Uji AI Swap Advisor vs Kenyataan (Checkpoint 8)

*   **Data Pool yang Digunakan:**
    *   Reserve In (FFT): 1090
    *   Reserve Out (ETHJKT): 917.66
    *   Amount In: 100 FFT
*   **Angka dari AI Swap Advisor:** 77.017 ETHJKT
*   **Angka dari Contract (`getAmountOut`):** 76.963 ETHJKT (Skala Wei: 76963495098906560965)
*   **Selisih/Meleset:** AI meleset sekitar 0.054 token karena kecenderungan melakukan pembulatan pecahan desimal biasa, sedangkan EVM pada smart contract memotong angka menggunakan pembagian integer (truncation) secara kaku.

**Refleksi:**
Hal ini membuktikan bahwa AI sering kali melakukan kalkulasi *floating point* standar yang tidak 100% akurat dengan logika eksekusi *on-chain*. Di dunia DeFi, meleset sedikit saja bisa berakibat pada kegagalan transaksi (*revert*) akibat proteksi *slippage*. Oleh karena itu, aturan utamanya adalah: **Selalu jadikan fungsi contract sebagai kebenaran absolut sebelum menandatangani transaksi.**

### AI Market Vibe (Checkpoint 9 - Bonus)

Pasar FFT hari ini baru saja melakukan pemanasan dengan adanya aksi *swap* perdana sebesar 90 FFT yang ditukar menjadi sekitar 82 ETHJKT. Kelihatannya para *holder* masih dalam fase *wait and see* sambil mengetes ombak dan memastikan mesin *smart contract* berjalan lancar. Kalau likuiditas terus ditambah, *slippage* pasti bakal makin mulus dan pasarnya siap *to the moon*! 

*(Disclaimer: Tulisan ini murni hiburan semata dan bukan saran finansial, do your own research!)*

# LOG PEMAHAMAN - HARI 4

### 1. DeFi itu apa, bedanya sama bank? 
DeFi (Decentralized Finance) adalah sistem keuangan yang berjalan secara mandiri di atas *blockchain* tanpa adanya otoritas pusat. Perbedaan utamanya dengan bank:
*   **Perantara:** Bank tradisional membutuhkan admin, *teller*, dan proses verifikasi manual, sedangkan DeFi sepenuhnya otomatis dijalankan oleh barisan kode (*smart contract*).
*   **Kendali Aset:** Di bank, uang kita dikelola oleh pihak bank. Di DeFi, kita memegang kendali penuh atas aset kita sendiri melalui dompet digital (*wallet*).
*   **Aksesibilitas:** DeFi bersifat transparan (*open source*) dan bisa diakses oleh siapa saja 24/7 tanpa perlu syarat buka rekening yang rumit.

### 2. ERC20 kasih fungsi apa aja? Kenapa swap butuh approve dulu?
Standar ERC20 memberikan fungsi-fungsi dasar untuk mengelola token, seperti mengecek saldo (`balanceOf`), mengirim token secara langsung antarpengguna (`transfer`), dan mengizinkan pihak ketiga memindahkan token kita (`approve` dan `transferFrom`). 
Saat ingin melakukan *swap* di mesin AMM, kita wajib memanggil fungsi `approve` terlebih dahulu untuk memberikan "surat kuasa". Tanpa proses *approve* ini, *smart contract* AMM tidak akan punya izin untuk menarik token dari dompet kita (menggunakan `transferFrom`) untuk dimasukkan ke dalam *pool*.

### 3. Bukti x * y = k (Kondisi Sebelum & Sesudah)
**1. Kondisi SEBELUM Swap (Kondisi Awal saat Tambah LP):**
* Reserve A (Pool FFT) = 1000
* Reserve B (Pool ETHJKT) = 1000
* **k_sebelum** = 1000 * 1000 = **1.000.000**

**2. Transaksi yang Terjadi:**
* Melakukan *swap* 90 FFT menjadi 82,3415 ETHJKT.

**3. Kondisi SESUDAH Swap (Kondisi Pool Saat Ini):**
* Reserve A (Pool FFT) = 1090
* Reserve B (Pool ETHJKT) = 917,66
* **k_sesudah** = 1090 * 917,66 = **1.000.249,4**

*(k_sesudah sedikit lebih besar karena adanya penambahan akumulasi fee)*

### 4. Seberapa meleset AI Swap Advisor vs getAmountOut? Apa artinya?
*   **Angka AI Swap Advisor:** 77.017 ETHJKT
*   **Angka Contract (`getAmountOut`):** 76.963 ETHJKT
*   **Meleset:** Sekitar 0.054 token.
*   **Artinya:** Kalkulasi AI menggunakan sistem *floating point* standar (desimal biasa), sementara mesin EVM pada *smart contract* mengeksekusi perhitungan secara rigid menggunakan pembagian integer (*truncation*). Hal ini membuktikan bahwa kita tidak bisa mengandalkan AI atau kalkulator biasa secara mentah-mentah untuk transaksi finansial *on-chain*. Fungsi yang ada di *contract* adalah satu-satunya sumber kebenaran absolut.

### 5. Slippage itu apa, kapan bikin rugi?
*Slippage* adalah selisih antara harga yang kita lihat dan harapkan saat memencet tombol *swap*, dengan harga aktual yang benar-benar kita dapatkan saat transaksi berhasil dieksekusi di *blockchain*. 
*Slippage* bisa membuat rugi dalam dua kondisi:
1.  **Likuiditas Rendah:** Kita menukar token dalam jumlah yang sangat besar di *pool* yang cadangannya kecil, sehingga harga langsung bergeser tajam (*price impact* tinggi).
2.  **Front-running:** Ada orang lain yang transaksinya diproses lebih cepat oleh jaringan dan mengubah rasio harga *pool* sebelum pesanan kita selesai, sehingga kita terpaksa membeli dengan harga yang lebih mahal atau menjual dengan harga lebih murah.


LINK VIDEO https://youtu.be/9Busb4BjOXs