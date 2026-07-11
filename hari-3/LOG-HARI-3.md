# LOG HARI 3 — Token dan KampusSwap

## 1. Token & ERC-20

Token adalah aset digital yang dibuat dan dicatat oleh smart contract di blockchain. Saldo dan aturan perpindahannya tersimpan di contract, sedangkan MetaMask hanya menampilkan saldo dan meminta izin untuk berinteraksi dengannya.

ERC-20 adalah standar/interface token di Ethereum. Disebut standar karena contract yang mengikutinya memakai fungsi dan event dengan bentuk yang sama, misalnya `balanceOf`, `transfer`, `approve`, `allowance`, dan `transferFrom`. Dengan aturan bersama ini, wallet, exchange, dan AMM dapat mengenali banyak token tanpa integrasi khusus untuk setiap token.

## 2. Aksi baca dan aksi tulis

`balanceOf()` adalah aksi baca: fungsi ini hanya mengambil saldo dari blockchain dan tidak mengubah state contract. Jika dipanggil sebagai query dari Remix, aplikasi web, atau RPC, aksi ini tidak membutuhkan transaksi dan tidak membayar gas.

`swap()` adalah aksi tulis karena mengubah state: saldo token pengguna dan reserve token pada AMM berubah. Aksi ini harus dikirim sebagai transaksi, ditandatangani oleh wallet, lalu dieksekusi dan disimpan oleh validator di blockchain. Karena memakai kerja komputasi dan ruang penyimpanan jaringan, aksi tulis membayar gas (di latihan ini memakai ETH Sepolia).

## 3. Hasil uji-jebak AI

1. Permintaan untuk menghapus koin milik orang lain adalah **ngarang** jika AI menyatakan ada fungsi yang bisa melakukannya. ERC-20 standar tidak memiliki fungsi untuk menghapus saldo pemilik lain. Hal itu hanya mungkin bila pembuat token sengaja menambahkan fungsi khusus, misalnya `burnFrom` dengan mekanisme izin, atau fungsi admin. Saya perlu memeriksa source contract, bukan percaya jawaban AI.
2. `freezeAccount()` pada ERC-20 standar adalah **ngarang**. Fungsi itu tidak termasuk interface ERC-20. Fitur pembekuan hanya ada bila contract token menambahkannya sendiri.
3. Pernyataan bahwa `balanceOf()` tidak makan gas untuk panggilan baca adalah **benar**. Fungsi ini bersifat `view` dan dapat dipanggil tanpa transaksi. Jika suatu saat dipanggil dari dalam transaksi, biaya gas transaksi tetap ada, tetapi bukan karena query terpisah di Remix/web.
4. Pernyataan bahwa harga swap berubah adalah **benar**. SimpleAMM memakai reserve pool dan rumus *constant product* (`x × y = k`). Setelah token A masuk ke pool, reserve A bertambah dan reserve B berkurang; akibatnya harga token A terhadap token B berubah. Selain itu terdapat fee dan slippage, sehingga swap 100 token tidak menghasilkan tepat 100 token lawan.

Saya mengetahui jawaban ngarang dengan mencocokkan nama fungsi dengan source `SindiToken.sol`/kontrak yang dideploy serta fungsi yang diwarisi dari OpenZeppelin ERC-20. Jika fungsi tidak ada pada source atau ABI Remix, fungsi itu tidak bisa dipanggil pada contract tersebut.

## 4. Alasan cek sebelum tanda tangan

Transaksi on-chain yang sudah dikonfirmasi umumnya tidak dapat dibatalkan atau di-*undo*. Tanda tangan dapat mengirim token, memberi `approve` kepada contract, atau menjalankan swap dengan jumlah/harga yang salah. Karena itu saya harus memeriksa jaringan (Sepolia), alamat contract/penerima, fungsi, jumlah token beserta 18 desimalnya, allowance, serta estimasi hasil swap sebelum menekan **Confirm** di MetaMask.

## Data contract latihan

| Contract | Alamat |
| --- | --- |
| TokenKu / Token A | `0x54081934A1CF2643a272118502fd333a5DC2019B` |
| ETHJKT / Token B | `0x7E96fed902B0A26b62DA78e8112253920Fc55936` |
| SimpleAMM | `0x5307925df061398795c75850d74F5a9E1D31E015` |

# Bukti Praktik & Alamat Contract

TxHash Deploy = https://sepolia.etherscan.io/tx/0x540d2caa5c5d512803881d8854b966596784319144bd4f48178bb87522313dde

SindiToken Address (SINDI) = 0x54081934A1CF2643a272118502fd333a5DC2019B

## Bukti Transfer Ke Zexo:
Link transaksi swap ke Zexo 
 https://sepolia.etherscan.io/tx/0x88f7b726aa47c5a25a8a39353f83fbedd03cff258b713c663bb631e3564e6322 di bagian ini.

Jumlah: 1,000
Ke Alamat: 0x9ebdC8ACc879a8284Ae5B3CecfbD280ec307aFA3