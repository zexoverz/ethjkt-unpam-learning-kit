# LOG PEMAHAMAN HARI 3 — Pembuatan Token & Dasar ERC-20
**Oleh: Lystanta **

---

## 1. Apa itu Token & Standar ERC-20? Mengapa Disebut "Standar"?
- **Token** di dalam ekosistem blockchain adalah representasi digital dari aset atau utilitas tertentu (seperti mata uang digital, poin loyalitas, hak suara, dll.) yang berjalan di atas smart contract blockchain utama (misal Ethereum/Sepolia).
- **ERC-20 (Ethereum Request for Comments 20)** adalah aturan teknis dan set interface standar yang disepakati bersama oleh komunitas pengembang Ethereum.
- Disebut **"Standar"** karena interface ini mendefinisikan nama-nama fungsi wajib (seperti `transfer`, `approve`, `balanceOf`, dll.) yang harus dimiliki oleh token tersebut. Dengan adanya standar ini, seluruh aplikasi Web3 (seperti Uniswap, MetaMask, dan dompet digital lainnya) bisa langsung mengenali dan berinteraksi dengan token baru tanpa perlu penulisan kode kustom khusus untuk setiap token.

---

## 2. Perbedaan Aksi Baca (Read) vs Aksi Tulis (Write)
Dalam interaksi dengan smart contract blockchain:

| Karakteristik | Aksi Baca (Read / View / Pure) | Aksi Tulis (Write / State-changing) |
| :--- | :--- | :--- |
| **Contoh Fungsi** | `balanceOf`, `allowance`, `reserveA` | `transfer`, `approve`, `swap`, `addLiquidity` |
| **Biaya Gas** | **Gratis** (tidak makan gas jika dipanggil secara lokal) | **Membayar Gas** (menggunakan ETH Sepolia/Mainnet) |
| **Kenapa Bayar?** | Karena data dibaca dari replika blockchain lokal pada node RPC Anda, tanpa mengubah status jaringan. | Karena Anda mengirimkan transaksi yang mengubah data (state) secara permanen di blockchain global, membutuhkan energi komputasi validator. |

---

## 3. Hasil Pengujian Jebakan AI
Dari 4 pertanyaan uji-jebak yang diajukan ke AI:
1. **"Gimana cara menghapus koin punya orang lain?"**
   - *Jawaban Kritis*: Pada token ERC-20 standar (termasuk `TokenKu.sol`/`XevoToken.sol`), **tidak ada** fungsi atau cara bawaan untuk menghapus atau mencuri saldo milik alamat orang lain. Saldo hanya bisa dipindahkan atas persetujuan pemilik dompet tersebut.
2. **"Tunjukin fungsi freezeAccount() di token ERC-20 standar."**
   - *Jawaban Kritis*: **Tidak ada** fungsi `freezeAccount` pada contract standar ERC-20 dari OpenZeppelin yang kita gunakan. Jika AI menyusun implementasi seolah-olah fungsi tersebut ada secara bawaan, itu adalah **halusinasi AI**.
3. **"Fungsi balanceOf() makan gas nggak kalau cuma dibaca?"**
   - *Jawaban Kritis*: Tidak, pemanggilan lokal untuk fungsi baca (`view`/`pure`) dari node eksternal tidak membutuhkan biaya gas sama sekali.
4. **"Kalau aku swap, harganya tetap 1:1 terus atau berubah? Kenapa?"**
   - *Jawaban Kritis*: Harga akan **berubah**. Di AMM dengan formula $x \cdot y = k$, setiap kali seseorang menukar token A untuk token B, jumlah token A dalam pool bertambah dan token B berkurang, yang menggeser titik harga di sepanjang kurva hiperbola sehingga token yang dibeli menjadi relatif lebih mahal (slippage).

---

## 4. Pentingnya Verifikasi Transaksi Sebelum Tanda Tangan (Sign)
Setiap transaksi yang ditulis ke blockchain bersifat **final, permanen, dan irreversible (tidak dapat dibatalkan)**. Tidak ada tombol "undo" atau layanan pelanggan (customer support) yang dapat mengembalikan aset Anda jika Anda salah mengirimkan token atau menyetujui transaksi berbahaya.
Oleh karena itu, sangat penting untuk:
- Membaca secara detail nama fungsi yang dipanggil pada prompt MetaMask.
- Memverifikasi alamat contract target (spender) saat melakukan `approve`.
- Memastikan jumlah token/angka desimal sudah sesuai.

---

## 5. Informasi smart contrat (Hari 3 & 4)
- **Tokenku (XevoToken - XEVO)**: `0x65AA185B443aF0319e149B23d54fA3241D94e1cA`
- **Token Bersama (ETHJKT)**: `0x7E96fed902B0A26b62DA78e8112253920Fc55936`
- **SimpleAMM Contract**: `0xbFf9341A5d0010d07869f005FE53Db55D17e6Aa5`

