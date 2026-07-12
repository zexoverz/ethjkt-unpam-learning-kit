# LOG HARI 3 — GhaniCoin (GC)

Nama: Ghani
Tanggal: 8 Juli 2026
Misi: Hari 3 - Bikin Koin Sendiri (ERC20)

---

## Ringkasan

GhaniCoin (GC) adalah token ERC20 yang dibuat menggunakan standar OpenZeppelin. Token ini di-deploy ke jaringan Sepolia (testnet Ethereum) menggunakan Remix IDE dan MetaMask.

---

## Token & ERC20

**Token & ERC20 itu apa? Kenapa disebut "standar"?**

Token adalah representasi digital dari aset atau utilitas di blockchain. ERC20 adalah standar teknis untuk token di Ethereum yang memastikan semua token ERC20 mengikuti aturan yang sama, sehingga kompatibel dengan wallet (MetaMask), exchange, dan dApps lainnya.

Standar ERC20 mendefinisikan fungsi-fungsi wajib seperti:
- `totalSupply()` - Total jumlah token yang ada
- `balanceOf(address)` - Saldo token milik alamat tertentu
- `transfer(address, amount)` - Kirim token ke alamat lain
- `approve(address, amount)` - Izinkan alamat lain mengambil token
- `transferFrom(address, address, amount)` - Transfer token atas nama pemilik

Karena semua token ERC20 mengikuti standar ini, wallet seperti MetaMask bisa menampilkan token ERC20 apa pun tanpa perlu modifikasi khusus.

---

## Bedanya "aksi baca" vs "aksi nulis"

**Bedanya "aksi baca" (mis. balanceOf) vs "aksi nulis" (mis. swap)? Yang mana yang bayar gas, kenapa?**

- **Aksi baca (read-only)**: Fungsi yang hanya membaca data dari blockchain tanpa mengubah state. Contoh: `balanceOf()`, `totalSupply()`, `getAmountOut()`. Tidak memerlukan gas karena tidak mengubah state blockchain.
- **Aksi nulis (state-changing)**: Fungsi yang mengubah data di blockchain. Contoh: `transfer()`, `approve()`, `swap()`, `mint()`. Memerlukan gas karena node harus memvalidasi dan menyimpan perubahan state secara permanen.

Gas dibayarkan untuk komputasi dan storage yang digunakan node untuk memproses dan menyimpan transaksi. Transaksi on-chain bersifat permanen, jadi setiap perubahan state harus diverifikasi dan disimpan oleh seluruh node di network.

---

## Uji Jebakan AI

**Dari 4 pertanyaan jebakan: mana yang AI-nya NGARANG? Gimana kamu tau?**

1. "Di contract TokenKu ini, gimana cara MENGHAPUS koin punya orang lain?"
   - **AI mungkin ngarang**: Contract ERC20 standar TIDAK memiliki fungsi untuk menghapus koin orang lain. Fungsi yang ada hanya `transfer()`, `approve()`, dll. Tidak ada `burnFrom()` atau fungsi admin untuk menghapus saldo orang lain tanpa izin.
   - **Cara tau**: Cek file `GhaniCoin.sol` - hanya ada fungsi `mint()` dan fungsi warisan dari ERC20. Tidak ada fungsi untuk menghapus saldo orang lain.

2. "Tunjukin fungsi freezeAccount() di token ERC20 standar ini."
   - **AI mungkin ngarang**: ERC20 standar TIDAK memiliki fungsi `freezeAccount()`. Fungsi freeze adalah fitur tambahan yang harus di-implementasi secara manual (misalnya dari OpenZeppelin Pausable).
   - **Cara tau**: Cek file `GhaniCoin.sol` dan warisan ERC20 - tidak ada fungsi `freezeAccount()`.

3. "Fungsi balanceOf() makan gas nggak kalau cuma dipanggil buat baca?"
   - **AI mungkin ngarang**: Fungsi `balanceOf()` TIDAK makan gas jika dipanggil secara lokal (off-chain) atau melalui `call()`. Hanya makan gas jika dipanggil dalam transaksi on-chain.
   - **Cara tau**: `balanceOf()` adalah fungsi `view` (read-only), tidak mengubah state, jadi tidak memerlukan gas untuk eksekusi.

4. "Kalau aku swap, harganya tetap 1:1 terus atau berubah? Kenapa?"
   - **AI mungkin ngarang**: Harga swap TIDAK tetap 1:1. Harga berubah sesuai rumus AMM: `x * y = k`. Setiap swap mengubah rasio reserve, sehingga harga berubah (slippage).
   - **Cara tau**: Cek rumus di `SimpleAMM.sol` - `getAmountOut()` menggunakan rumus `amountIn * reserveB / (reserveA + amountIn)`, yang berarti harga berubah berdasarkan rasio reserve saat ini.

---

## Kenapa Transaksi On-Chain Harus Dicek Dulu

**Kenapa transaksi on-chain harus dicek DULU sebelum tanda tangan?**

Transaksi on-chain bersifat:
1. **Permanen** - Tidak bisa di-undo atau dibatalkan setelah dikonfirmasi
2. **Irreversible** - Gas yang dibayarkan tidak bisa dikembalikan
3. **Public** - Semua transaksi terlihat di blockchain oleh siapa saja
4. **Final** - Setelah dikonfirmasi, perubahan state tersimpan selamanya

Karena itu, sebelum tanda tangan (menyetujui transaksi di MetaMask), harus dicek:
- Alamat contract yang benar (phishing risk)
- Jumlah token yang benar (bukan salah nol)
- Gas fee yang reasonable (bukan gas attack)
- Jaringan yang benar (bukan mainnet saat mau testnet)
- Fungsi yang dipanggil sesuai ekspektasi

Salah satu klik bisa mengakibatkan kehilangan token atau gas yang besar.

---

## Detail Contract GhaniCoin

**Contract Address**: [Isi setelah deploy]
**Network**: Sepolia Testnet
**Symbol**: GC
**Name**: GhaniCoin
**Decimals**: 18
**Total Supply**: 1,000,000 GC

**Fitur Khusus**:
- Fungsi `mint(uint256 jumlah)` - Faucet terbuka untuk siapa saja mint token (SECARA SENGAJA TIDAK AMAN, hanya untuk belajar)
- Menggunakan standar OpenZeppelin ERC20
- 1,000,000 token di-mint ke wallet deploy saat deployment

---

## Screenshot & Bukti

**Screenshot Token di MetaMask**: [GhaniCoin (GC).png]
**Link Transaksi Swap di Etherscan**: [Isi setelah deploy swap]
**Alamat 3 Contract**:
- GhaniCoin: [Isi setelah deploy]
- SimpleAMM: [Isi setelah deploy (jika stretch)]
- EthjktToken: [Dari pengajar]

---

## Refleksi

Hari ini saya belajar:
1. Cara membuat token ERC20 sendiri menggunakan Solidity dan OpenZeppelin
2. Cara deploy contract ke blockchain Sepolia menggunakan Remix IDE
3. Cara import token ke MetaMask dan melihat saldo
4. Perbedaan antara fungsi read-only dan state-changing
5. Pentingnya verifikasi AI dengan cek kode asli
6. Bahaya transaksi on-chain yang tidak bisa di-undo

Pelajaran terpenting: **Transaksi on-chain itu FINAL**. Cek dulu, baru klik.
