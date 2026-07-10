## LOG PEMAHAMAN HARI 4

### 1. DeFi itu apa, bedanya sama bank? (bahasa sendiri)
DeFi (Decentralized Finance) adalah sistem keuangan yang berjalan otomatis di atas blockchain tanpa ada pihak ketiga atau perantara seperti bank. 
* **Bedanya sama bank:** Di bank konvensional, semua transaksi diatur, divalidasi, dan disimpan oleh pihak bank (sentralisasi). Kalau di DeFi, perantaranya digantikan oleh Smart Contract (kode pemrograman otomatis) yang berjalan 24/7, transparan, dan tidak bisa diintervensi oleh siapa pun.

### 2. ERC20 kasih kamu fungsi apa aja? Kenapa swap butuh approve dulu?
* **Fungsi ERC20:** Standar token ERC20 memberikan fungsi dasar pelacakan saldo (`balanceOf`), transfer koin (`transfer`), serta memberikan izin ke pihak lain untuk mengelola token kita (`approve` dan `allowance`).
* **Kenapa swap butuh approve dulu?** Karena contract AMM (KampusSwap) perlu hak akses untuk mengambil token NASH atau ETHJKT dari dompet MetaMask kita saat proses swap. Tanpa adanya fungsi `approve` terlebih dahulu, contract AMM secara keamanan jaringan blockchain tidak akan bisa memindahkan saldo koin kita untuk ditukarkan.

### 3. Tempel bukti x*y=k kamu (angka sebelum/sesudah + hasil kali).
Berdasarkan formula Constant Product Market Maker ($x \times y = k$):

* **Kondisi Awal (Sebelum Swap/Awal Pool):**
  * Saldo awal Pool NASH ($x$) = 1.000
  * Saldo awal Pool ETHJKT ($y$) = 1.000
  * Nilai Konstanta ($k$) = $1.000 \times 1.000 = 1.000.000$

* **Kondisi Sekarang (Setelah Berbagai Interaksi Swap & Liquidity di dApp):**
  * Berdasarkan data pool di screenshot aplikasi terbaru:
    * Pool NASH (x) = 1.011,89
    * Pool ETHJKT (y) = 990,12
  * Hasil Kali Terbaru ($k$) = $1.011,89 \times 990,12 = 1.001.892,52$
  *(Catatan: Nilai $k$ sedikit bertambah dari 1 juta murni karena adanya penambahan atau penyesuaian likuiditas baru di luar swap murni).*

### 4. Seberapa meleset AI Swap Advisor vs getAmountOut? Apa artinya buat kamu?
* **Analisis Meleset:** AI Swap Advisor memberikan estimasi harga berdasarkan analisis tren atau algoritma prediktif global, sedangkan fungsi `getAmountOut` pada Smart Contract menghitung secara real-time dan pasti berdasarkan sisa jumlah cadangan token ($x$ dan $y$) yang ada di dalam pool detik itu juga menggunakan rumus matematika AMM yang kaku.
* **Artinya buat saya:** Estimasi AI tidak bisa dijadikan patokan mutlak dalam eksekusi transaksi Web3. Keputusan final dan angka eksekusi yang valid di blockchain akan selalu mengikuti hasil perhitungan matematis objektif dari fungsi `getAmountOut` di smart contract.

### 5. Slippage itu apa, kapan bikin rugi?
* **Slippage adalah** perbedaan harga antara harga koin yang kita harapkan saat mengklik tombol "Swap" dengan harga eksekusi final yang sebenarnya tercatat di blockchain. 
* **Kapan bikin rugi?** Slippage bikin rugi ketika terjadi volatilitas tinggi atau ada transaksi besar lain yang masuk tepat sebelum transaksi kita diproses (frontrunning). Hal ini membuat harga koin yang kita beli menjadi jauh lebih mahal, atau jumlah koin yang kita terima menjadi jauh lebih sedikit dari perkiraan awal di UI.



## TUGAS AKHIR MANDIRI

* **Nama Koin:** NASH (nanashitoken)
* **Alamat Wallet Saya:** 0xe14A77344BB899fBd5bAE06CADb92465d9225DdC
* **Alamat Token NASH:** 0x4628107B95b82c021076a546F37B77A24302B307
* **Alamat Contract AMM:** 0x439E3D184fd45236658FF34Fa664b088D3C7c4D8

### Cara Menjalankan Aplikasi
1. npm install
2. npm run dev

### Langkah Lanjut Karier
Saya berencana menjadi seseorang yang bekerja di dunia cyber security, alasan saya mengambil program AI&BLOCKCHAIN ini karena saya tertarik dengan penggunaan AI dan juga saya memiliki minat untuk mempelajari apa itu BLOCKCHAIN.