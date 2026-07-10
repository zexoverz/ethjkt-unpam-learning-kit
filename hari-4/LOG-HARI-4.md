# LOG PEMAHAMAN HARI 4 — XevoSwap & DeFi AMM
**Oleh: Lystanta **

---

## 1. Apa itu DeFi & Bedanya dengan Bank Tradisional?
**DeFi (Decentralized Finance)** adalah ekosistem keuangan yang berjalan di atas jaringan blockchain terdesentralisasi tanpa bergantung pada perantara terpusat seperti bank, broker, atau lembaga keuangan tradisional.

| Karakteristik | DeFi | Bank Tradisional |
| :--- | :--- | :--- |
| **Perantara** | Kode program komputer otomatis (**Smart Contract**) | Manusia, sistem internal bank, regulasi negara |
| **Aksesibilitas** | Terbuka untuk siapa saja di seluruh dunia (Tanpa KYC/Izin) | Harus datang ke cabang, verifikasi identitas, BI Checking, dll. |
| **Transparansi** | Semua transaksi dan logika kode dapat diaudit secara publik di Etherscan | Laporan internal tertutup dan proses verifikasi manual |
| **Waktu Operasional**| 24/7/365 tanpa henti | Jam kerja kantor, hari libur nasional |
| **Kontrol Aset** | Self-custodial (Pengguna memegang penuh private key dompet) | Custodial (Dana disimpan dan dikuasai oleh bank) |

---

## 2. Fungsi Utama ERC-20 & Mengapa Swap Butuh `approve`?
Standard token **ERC-20** menyediakan fungsi dasar seperti:
- `balanceOf`: Mengecek saldo token suatu alamat.
- `transfer`: Mengirim token langsung dari satu dompet ke dompet lain.
- `approve`: Memberikan hak/izin kepada alamat tertentu (seperti smart contract AMM) untuk menarik token dalam jumlah tertentu dari dompet kita.
- `allowance`: Mengecek jumlah token yang diizinkan untuk ditarik oleh spender.

### Kenapa Swap Butuh `approve` Terlebih Dahulu?
Secara default, smart contract tidak memiliki wewenang untuk mengambil atau memotong saldo token di dompet Anda. Jika smart contract AMM bisa langsung mengambil token Anda tanpa izin, ini akan menjadi celah keamanan yang sangat besar.
Oleh karena itu, alur transaksi swap/likuiditas selalu membutuhkan dua langkah:
1. **`approve(ammAddress, amount)`**: Pengguna memberi tahu contract token ERC-20 bahwa Smart Contract AMM diizinkan menarik token miliknya sebesar `amount`.
2. **`swap` atau `addLiquidity`**: Smart contract AMM memanggil fungsi `transferFrom` untuk memindahkan token dari dompet pengguna ke dalam pool secara aman.

---

## 3. Bukti Hukum Kekekalan Likuiditas $x \cdot y = k$
Model AMM yang kita gunakan menggunakan rumus Constant Product Market Maker $x \cdot y = k$.

### Data Reserve Live dari Sepolia Testnet (Pool XEVO/ETHJKT):
- **Reserve A (x) / XEVO**: `1028.3391` token (`1028339116273150297840` wei)
- **Reserve B (y) / ETHJKT**: `1232.9851` token (`1232985186070783395363` wei)
- **Nilai K ($x \cdot y$)**: `1,267,926,896.62` (`1267926896621915181022608222873529924915920` wei²)

### Simulasi Swap 100 XEVO:
Jika kita menambahkan $100$ XEVO sebagai `amountIn`:
$$x_{baru} = 1028.3391 + 100 = 1128.3391$$

Menggunakan rumus swap fee 0.3%:
$$\text{amountInWithFee} = 100 \times 997 = 99700$$
$$\text{amountOut} = \frac{99700 \times 1232.9851}{1028.3391 \times 1000 + 99700} \approx 109.2842 \text{ ETHJKT}$$

Maka reserve sesudah swap:
- **Reserve A ($x_{baru}$)**: `1128.3391` XEVO
- **Reserve B ($y_{baru}$)**: $1232.9851 - 109.2842 = 1123.7009$ ETHJKT
- **K Sesudah ($x_{baru} \cdot y_{baru}$)**: $1128.3391 \times 1123.7009 = 1,267,915,860.52$ (belum termasuk akumulasi fee). 
Di blockchain asli, nilai $k$ sesudah swap akan selalu **sedikit meningkat** dari nilai awal karena ada fee $0.3\%$ yang ditinggalkan di pool untuk pemberi likuiditas (LP).

---

## 4. Akurasi AI Swap Advisor vs `getAmountOut` Kontrak Pintar
Ketika menghitung output swap:
- **Smart Contract (`getAmountOut`)**: Menggunakan pembagian integer Solidity murni yang presisi tinggi (18 desimal) tanpa error pembulatan floating-point, dan memperhitungkan potongan fee $0.3\%$ secara akurat.
- **AI Swap Advisor (Math Mandiri)**: Seringkali meleset dari kenyataan on-chain karena:
  1. AI terkadang mengabaikan fee swap $0.3\%$.
  2. AI melakukan perhitungan menggunakan pembulatan floating point standar Javascript yang tidak sepresisi tipe data `uint256` Solidity.
  3. AI berasumsi rasio harga linier padahal kurvanya melengkung hiperbola.

### Hikmah Bagi Developer & User:
*Don't trust, verify.* Selalu gunakan data output dari fungsi read on-chain (`getAmountOut`) langsung dari smart contract sebagai kebenaran mutlak sebelum memicu transaksi.

---

## 5. Apa itu Slippage & Kapan Merugikan?
**Slippage** adalah perbedaan harga antara harga yang diharapkan saat transaksi dikirimkan dengan harga eksekusi aktual saat transaksi diproses di blok blockchain.

### Kapan Slippage Terjadi?
1. **Volatilitas Tinggi**: Harga berubah cepat sebelum transaksi Anda masuk ke dalam blok.
2. **Likuiditas Pool Rendah**: Pool terlalu kecil sehingga transaksi berukuran sedang pun mendorong titik harga terlalu jauh di sepanjang kurva $x \cdot y = k$.

### Kapan Slippage Merugikan?
Slippage merugikan saat Anda menerima token hasil swap jauh lebih sedikit daripada perkiraan awal. Di XevoSwap, kami mengimplementasikan **Slippage Warning UI** untuk memperingatkan pengguna jika ukuran swap mereka terlalu besar dibanding pool agar terhindar dari kerugian akibat perubahan harga yang drastis.

---

## 6. Langkah Lanjut di Dunia Blockchain (Karier)

Setelah membaca `KARIER.md`, langkah selanjutnya yang ingin saya lakukan adalah bergabung dengan komunitas ETHJKT dan mempelajari blockchain dari tingkat fundamental hingga menjadi seorang Web3 Developer. Saya ingin mengikuti roadmap pembelajaran yang disediakan, aktif mengikuti diskusi dan workshop, serta terus mengembangkan kemampuan melalui proyek-proyek nyata agar memiliki pemahaman yang kuat dan siap berkarier di bidang blockchain.

