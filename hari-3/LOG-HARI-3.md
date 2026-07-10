## LOG PEMAHAMAN + REFLEKSI HARI 3

1. **Token & ERC20 itu apa? Kenapa disebut "standar"?**
   - Token itu koin atau aset digital yang kita buat sendiri dan numpang berjalan di atas jaringan blockchain lain (seperti Ethereum/Sepolia).
   - ERC20 disebut standar karena ini adalah template aturan resmi yang disepakati developer global agar semua koin bisa langsung terdeteksi dan ditransaksikan di dompet digital (seperti MetaMask) tanpa ribet.

2. **Bedanya "aksi baca" (mis. balanceOf) vs "aksi nulis" (mis. swap)? Yang mana yang bayar gas, kenapa?**
   - **Aksi baca (`balanceOf`):** Cuma melihat data yang sudah ada di blockchain, tidak mengubah apa pun, jadi gratis alias tidak bayar gas.
   - **Aksi nulis (`swap`, `transfer`, `deploy`):** Aksi yang mengubah atau menambahkan data baru ke blockchain. Ini wajib bayar gas fee karena butuh validator untuk memproses dan mencatatnya secara permanen.

3. **Dari 4 pertanyaan jebakan: mana yang AI-nya NGARANG? Gimana kamu tau?**
   - AI ngarang di Pertanyaan 1 (katanya bisa menghapus koin orang lain) dan Pertanyaan 2 (nunjukin fungsi `freezeAccount()`).
   - Saya tahu karena di dalam file kode `nanashitoken.sol` standar OpenZeppelin yang kita pakai, murni hanya ada fungsi dasar ERC20 biasa (transfer, approve, mint). Tidak ada fungsi aneh-aneh buat membekukan atau menghapus saldo orang lain.

4. **Kenapa transaksi on-chain harus dicek DULU sebelum tanda tangan?**
   - Karena semua transaksi di blockchain sifatnya **FINAL**. Begitu kita klik *Confirm* di MetaMask, token langsung terkirim dan tidak ada tombol *undo* atau cara apa pun untuk membatalkannya.

---

## BUKTI PRAKTIK & ALAMAT CONTRACT

TxHash Deploy = https://sepolia.etherscan.io/tx/0x75855dd6d11246b94dd8fa659aae397d9bb2aca0b7bd3d6406b0059b5820e90f
nanashitoken Address (NASH) = 0x67B3395641d2f22D3f9149813f2698681A445882
` 

### Bukti Transfer Ke Zexo:
- **Jumlah:** 1,000 NASH
- **Ke Alamat:** 0x9ebdC8ACc879a8284Ae5B3CecfbD280ec307aFA3