# LOG PEMAHAMAN & REFLEKSI — HARI 3

Berikut adalah jurnal refleksi pemahaman untuk materi Hari 3 tentang pembuatan token ERC20 kustom (**Faiz Coin / FAIZ**) dan pool likuiditas (**SimpleAMM** / KampusSwap).

---

## 1. Token & ERC20 itu apa? Kenapa disebut "standar"?
* **Token** adalah representasi aset digital di atas blockchain yang diatur oleh smart contract.
* **ERC20** disebut **"standar"** karena ia menetapkan aturan baku (antarmuka/interface) yang wajib dipatuhi oleh pembuat token di Ethereum. Standar ini mencakup 6 fungsi utama (`totalSupply`, `balanceOf`, `transfer`, `transferFrom`, `approve`, `allowance`) dan 2 event (`Transfer`, `Approval`). 
* Karena adanya standar yang seragam ini, seluruh aplikasi dompet (seperti MetaMask), bursa (DEX seperti Uniswap), dan smart contract lainnya dapat langsung berinteraksi dengan token baru mana pun tanpa perlu menulis kode integrasi khusus untuk tiap token.

## 2. Bedanya "aksi baca" (mis. balanceOf) vs "aksi nulis" (mis. swap)? Yang mana yang bayar gas, kenapa?
* **Aksi Baca (View/Pure)**: Hanya membaca data dari blockchain tanpa mengubah keadaan/state (misalnya mengecek saldo dengan `balanceOf()` atau melihat cadangan pool dengan `reserveA`). Panggilan ini **gratis (tidak bayar gas)** selama dipanggil langsung secara off-chain (misal dari Remix/MetaMask RPC Node).
* **Aksi Nulis (State-changing)**: Mengubah status data di blockchain (misalnya mengirim token dengan `transfer()`, menyetujui kuota dengan `approve()`, atau melakukan penukaran dengan `swapAforB()`). Aksi ini **wajib membayar gas** karena memerlukan daya komputasi dari para validator/miners di jaringan blockchain untuk memproses, memvalidasi, dan mengamankan perubahan data tersebut secara permanen.

## 3. Dari 4 pertanyaan jebakan: mana yang AI-nya NGARANG? Gimana kamu tahu?
* **Jebakan 1: Cara menghapus koin milik orang lain**
  * *Status AI*: **NGARANG** jika AI memberikan kode/fungsi publik untuk menghapus saldo orang lain secara sepihak.
  * *Fakta*: Kontrak ERC20 standar tidak memiliki mekanisme bagi siapa pun (bahkan owner sekalipun) untuk langsung menghapus/mengambil paksa token dari alamat dompet orang lain tanpa persetujuan (`approve`) dari pemilik dompet tersebut.
* **Jebakan 2: Fungsi `freezeAccount()` di token ERC20 standar**
  * *Status AI*: **NGARANG** jika AI mengatakan fungsi ini ada bawaan dari standar ERC20.
  * *Fakta*: Standar ERC20 tidak mendefinisikan fungsi `freezeAccount()`. Fungsi pembekuan akun biasanya ditambahkan secara kustom di token tertentu (seperti USDT/USDC untuk kepatuhan hukum), tetapi tidak ada di kontrak `TokenKu.sol` maupun `EthjktToken.sol` milik kita.
* **Jebakan 3: `balanceOf()` makan gas atau tidak**
  * *Status AI*: **BENAR** jika AI menjelaskan bahwa ia gratis secara off-chain, tetapi memakan gas jika dipanggil secara on-chain oleh smart contract lain.
* **Jebakan 4: Harga swap tetap 1:1 atau berubah**
  * *Status AI*: **BENAR** jika AI menjelaskan bahwa harga akan berubah mengikuti kurva produk konstan ($x \times y = k$). Setiap kali terjadi swap, rasio cadangan token di pool berubah, sehingga harga token berikutnya juga berubah (efek slippage/price impact).

## 4. Kenapa transaksi on-chain harus dicek DULU sebelum tanda tangan?
* Karena transaksi on-chain bersifat **final dan tidak dapat dibatalkan (irreversible)**. Begitu transaksi dikonfirmasi oleh jaringan, token yang terkirim atau ditukarkan tidak dapat ditarik kembali secara otomatis. 
* Oleh karena itu, kita harus selalu memverifikasi alamat tujuan, jumlah token, slippage, serta estimasi gas fee di MetaMask sebelum menekan tombol "Confirm".

---

## 5. Alamat Kontrak Hasil Deploy (Sepolia Testnet)

* **Token A (Faiz Coin - FAIZ)**: `0xCe105996E1ef40ef1D6a52BF03E50fc0A9BC80BD`
* **Token B (Ethjkt Token - ETHJKT)**: `0xC87C03754DD6C2950D3564aCe9D2ff54e99Ae47A`
* **SimpleAMM (KampusSwap)**: `0x2c5b8363Ae7683f51dF6AC5158e59DC330d17D2b`

* **Link Transaksi Swap Pertama di Etherscan**: [0x73709c44f71f5fff3dea1e001fd8e8ee1335ae761f783d959f1ad9f5d407b054](https://sepolia.etherscan.io/tx/0x73709c44f71f5fff3dea1e001fd8e8ee1335ae761f783d959f1ad9f5d407b054)
