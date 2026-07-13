# LOG BELAJAR HARI 3: KampusSwap — Bikin Token & AMM Sendiri

## 1. Ringkasan Kegiatan
Hari ini seru banget dan berasa naik level! Gua belajar cara bikin token ERC-20 sendiri yang dikasih nama **Adel Token (ADT)**. Nggak cuma deploy token, gua juga mendeploy contract **SimpleAMM** (Automated Market Maker) yang berfungsi sebagai pasar/bursa mini untuk menukarkan token ADT dengan token bersama **ETHJKT**. 

Semua proses ini dideploy langsung ke jaringan **Sepolia Testnet** (blockchain Ethereum asli untuk uji coba, bukan sekadar simulasi lokal). Gua juga berhasil melakukan penyetoran likuiditas awal (add liquidity) dengan rasio 1:1, melakukan transaksi tukar koin (swap) pertama kali, dan memverifikasi seluruh transaksinya langsung di Etherscan.

---

## 2. Detail Teknis
Berikut adalah data teknis dari hasil deploy dan interaksi contract hari ini:

*   **Token A (Milik Pribadi)**
    *   **Nama Token:** Adel Token
    *   **Simbol:** ADT
    *   **Decimals:** 18
    *   **Alamat Contract AdelToken:** `0x6Cf3E11055f1158844F688f6CBD2e665A6ee0f70`
    *   **Link Etherscan:** [Lihat di Etherscan](https://sepolia.etherscan.io/address/0x6Cf3E11055f1158844F688f6CBD2e665A6ee0f70)
*   **Token B (Token Bersama/Pengajar)**
    *   **Alamat Contract ETHJKT:** `0x7E96fed902B0A26b62DA78e8112253920Fc55936`
*   **Contract Pasar (SimpleAMM)**
    *   **Alamat Contract SimpleAMM:** `0x69eE68Dfa2b81930951a8A1cf80518b3B9A47E8B`
*   **Penyetoran Likuiditas Awal:**
    *   **Rasio:** 1000 ADT : 1000 ETHJKT (Rasio awal 1:1)
*   **Transaksi Swap Pertama:**
    *   **Aksi:** Swap 100 ADT -> ETHJKT
    *   **Output yang Diterima:** ~90,66 ETHJKT (ada selisih dari 100 karena faktor slippage + fee 0,3% dari AMM)
*   **Kondisi Reserve Setelah Swap:**
    *   **Reserve A (ADT):** ~1100 ADT
    *   **Reserve B (ETHJKT):** ~909,34 ETHJKT

---

## 3. Pertanyaan Pemahaman

### a. Token & ERC20 itu apa? Kenapa disebut "standar"?
Token adalah representasi aset digital yang dicatat di dalam smart contract blockchain. Token bisa mewakili apa saja, mulai dari poin loyalitas, hak suara, hingga nilai mata uang buatan. 

ERC20 disebut "standar" karena ia menetapkan aturan main berupa fungsi-fungsi wajib (seperti `transfer`, `approve`, `balanceOf`) dan event yang harus diimplementasikan oleh smart contract token di jaringan Ethereum. Dengan adanya standar ini, dompet digital (seperti MetaMask), bursa terdesentralisasi (DEX), dan aplikasi lain bisa langsung mengenali dan berinteraksi dengan token baru mana pun secara otomatis tanpa perlu modifikasi kode kustom.

### b. Bedanya "aksi baca" (view function) vs "aksi nulis"? Kenapa nulis butuh gas sedangkan baca gratis?
*   **Aksi Baca (Read/View):** Adalah fungsi yang hanya mengambil atau membaca data yang sudah ada di blockchain (misal mengecek saldo lewat `balanceOf` atau melihat cadangan pool lewat `reserveA`). Ini bersifat gratis dan cepat karena kita hanya meminta informasi dari node lokal kita tanpa mengubah keadaan (state) data di blockchain.
*   **Aksi Nulis (Write):** Adalah fungsi yang mengubah atau memperbarui data di blockchain (misal melakukan `swap` or memberikan izin akses dengan `approve`). Karena aksi ini mengubah isi database global yang terdesentralisasi, ia membutuhkan proses konsensus oleh validator/miner untuk memvalidasi dan memasukkan transaksi ke blok baru. Gas fee dibayarkan sebagai imbal jasa bagi validator atas daya komputasi yang mereka gunakan.

### c. Kenapa fungsi approve() harus dipanggil DULU sebelum addLiquidity/swap? Jelasin dari sisi keamanan ERC20.
Dalam standar ERC20, smart contract pihak ketiga (seperti SimpleAMM) secara default **tidak diizinkan** mengambil token dari dompet kita tanpa izin eksplisit. Hal ini dibuat demi keamanan agar saldo kita tidak bisa dikuras habis oleh contract lain yang nakal. 

Dengan memanggil fungsi `approve()`, kita memberikan otoritas (allowance) kepada contract SimpleAMM untuk menarik token kita dalam jumlah tertentu. Setelah izin diberikan, barulah fungsi `addLiquidity()` atau `swap()` di dalam contract pasar bisa memanggil fungsi internal `transferFrom()` untuk menarik token dari dompet kita secara sah.

### d. Kenapa transaksi on-chain harus dicek dulu sebelum tanda tangan di MetaMask? Apa yang terjadi kalau salah klik?
Transaksi on-chain bersifat final dan *irreversible* (tidak bisa dibatalkan, ditarik kembali, atau di-undo). Sekali kita menyetujui transaksi dan menembus jaringan blockchain, data tersebut permanen. 

Jika kita salah klik atau buru-buru menyetujui transaksi tanpa memeriksa alamat tujuan, jumlah nominal (terutama jumlah nol desimal), atau jenis interaksinya, token kita bisa terkirim ke alamat mati, hilang selamanya, atau bahkan disedot habis oleh contract phising/penipuan.

---

## ## Hasil Uji-Jebak AI
*(Bagian ini dikosongkan untuk diisi secara manual setelah melakukan pengujian mandiri menggunakan 4 pertanyaan jebakan dari modul).*

1. **Uji-Jebak 1 (Menghapus koin orang lain di TokenKu):**
   *   
   *   

2. **Uji-Jebak 2 (Fungsi freezeAccount() di ERC20 standar):**
   *   
   *   

3. **Uji-Jebak 3 (Gas fee untuk fungsi balanceOf() saat hanya membaca):**
   *   
   *   

4. **Uji-Jebak 4 (Perubahan harga konstan 1:1 saat melakukan swap):**
   *   
   *   

---

## 5. Refleksi Pribadi
Hari ini menantang banget pas bagian ngitung angka dengan 18 desimal (harus nambahin 18 nol di belakang), sempat bikin pusing dan takut salah input jumlah nolnya. Tapi rasanya puas banget pas ngeliat transaksi swap pertama berhasil terkonfirmasi di MetaMask dan saldonya langsung berubah secara real-time di blockchain Sepolia!
