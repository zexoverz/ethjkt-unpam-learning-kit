# LOG PEMAHAMAN + REFLEKSI HARI 3
**Nama: Dinar Fadilah**

---

### 1. Token & ERC20 itu apa? Kenapa disebut "standar"?
* **Token** itu aslinya kayak koin digital atau kupon buatan saya sendiri di dunia blockchain (contohnya koin `KeyFrame` yang barusan saya bikin).
* Disebut **"standar"** karena para developer sepakat pakai aturan main yang sama (ERC20). Jadi, karena aturannya seragam, dompet kayak MetaMask atau aplikasi apa pun langsung paham cara bacanya tanpa perlu setting ulang dari nol.

### 2. Bedanya "aksi baca" vs "aksi nulis"? Yang mana yang bayar gas?
* **Aksi Baca** (misalnya `balanceOf` buat ngecek saldo): Ini cuma ngintip data yang udah ada di blockchain. Karena cuma baca dan gak ngubah apa-apa, aksi ini **GRATIS (gak bayar gas)**.
* **Aksi Nulis** (misalnya `swap` atau `mint` koin): Ini aksi yang ngubah status atau isi data di dalam blockchain. Karena saya menyuruh komputer/validator di jaringan bekerja untuk mencatat perubahan baru secara permanen, aksi ini **WAJIB bayar gas fee**.

### 3. Dari 4 pertanyaan jebakan, mana AI yang NGARANG?
* **AI ngarang di nomor 1 & 2**:
  1. AI ngarang kalau bilang saya bisa langsung hapus koin milik orang lain sesuka hati. Di standard ERC20, saya gak bisa asal comot atau hapus koin di dompet orang tanpa persetujuan mereka.
  2. AI juga ngarang kalau nunjukin fungsi `freezeAccount()` sebagai standar bawaan ERC20. Fungsi pembekuan akun itu gak ada di standar ERC20 biasa. Saya tahu AI ngarang karena saya bisa cek langsung di file kode `TokenKu.sol` dan dokumentasi resmi OpenZeppelin—fungsi-fungsi aneh itu emang gak terdaftar di sana!

### 4. Kenapa transaksi on-chain harus dicek DULU sebelum tanda tangan?
* Karena transaksi on-chain di blockchain itu sifatnya **FINAL dan tidak bisa di-cancel atau di-undo**. Begitu saya klik "Confirm" di MetaMask dan transaksinya masuk blok, koin yang kepotong gak bakal bisa balik lagi kalau saya salah kirim atau ketipu. Makanya saya wajib teliti sebelum tanda tangan!

---

### 📋 Detail Kontrak (Hari 3)
* **Wallet Address**: `0xCC54DCBecdCd1cDef915Fe95f1FE1ba715971Ab8`
* **TokenKu (KeyFrame Coin)**: `0x955ec89aEb0B8F5BBaBC6A22785e5f1a1171D440`
* **EthjktToken (Simulasi)**: *(Silakan isi alamat koin B jika nanti dideploy)*
* **SimpleAMM (Pasar)**: *(Silakan isi alamat AMM jika nanti dideploy)*
