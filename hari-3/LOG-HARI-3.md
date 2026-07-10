# LOG HARI 3 — Token & Pasar Pertamaku

## 1. Token & ERC20 itu apa? Kenapa disebut "standar"?

Token ERC20 itu kayak "mata uang digital" yang hidup di atas blockchain Ethereum. ERC20 itu standar — artinya semua token yang ikut aturan ini punya fungsi yang SAMA persis. Jadi wallet kayak MetaMask otomatis bisa baca saldo, kirim, dan terima token APAPUN selama dia ERC20. Bayangin kayak colokan USB — bentuknya standar, jadi charge手机 apa pun bisa dipake. Begitu juga token: `transfer()`, `balanceOf()`, `approve()` — semua token ERC20 punya itu.

## 2. Bedanya "aksi baca" vs "aksi nulis"? Yang mana bayar gas?

- **Aksi baca** (e.g. `balanceOf`, `reserveA`, `getAmountOut`) = cuma lihat data yang udah ada di blockchain. **Gratis**, nggak bayar gas. Karena nggak ngubah apa-apa.
- **Aksi nulis** (e.g. `swap`, `addLiquidity`, `approve`, `transfer`) = NGUBAH data di blockchain. **Bayar gas**. Karena butuh komputer (validator) di seluruh dunia buat nyetujuin dan nyatet perubahan itu.

Ini konsep penting: baca itu gratis, nulis itu berbayar. Kayak baca buku di perpustakaan (gratis) vs nulis di buku orang (minta izin + bayar).

## 3. Jebakan AI: mana yang NGARANG?

Dari 4 pertanyaan:

1. **"Gimana cara MENGHAPUS koin punya orang lain?"** — AI bilang panggil `burn()` atau `destroy()`. Padahal di ERC20 standar dan contract TokenKu, fungsi `burn()` nggak ADA. Transfer ke `address(0)` emang efeknya "bakar", tapi itu transfer, bukan fungsi khusus. AI ngasih fungsi yang nggak eksis — itu **HALUSINASI**.

2. **"Tunjukin fungsi freezeAccount()"** — Di ERC20 standar openzeppelin TIDAK ADA `freezeAccount()`. Itu fitur token khusus kayak USDT punya. AI sering "nambahin" fungsi keren yang nggak ada di code kita — jebakan klasik.

3. **"balanceOf() makan gas?"** — AI bilang "tergantung". Tapi `balanceOf()` di ERC20 itu `view` function, artinya baca doang. **Gratis**. Kalau AI bilang bayar gas, dia salah.

4. **"Harga tetap 1:1 terus?"** — AI jawab dengan rumus `x*y=k` yang bener: harga berubah setiap swap karena constant product. Ini yang paling akurat dari AI.

**Kesimpulan:** Dari 4, AI ngarang di nomor 1 & 2, dan salah di nomor 3. Hanya nomor 4 yang bener. Ini bukti kenapa KITA harus verifikasi — AI suka percaya diri walau salah.

## 4. Kenapa transaksi on-chain harus dicek DULU sebelum tanda tangan?

Karena **transaksi di blockchain itu FINAL**. Nggak ada undo, nggak ada "maaf salah kirim". Begitu tanda tangan MetaMask dan transaksi masuk ke blok, token udah kepindah dan nggak bisa dibalikin. Jadi wajib dicek:
- Alamat tujuan bener?
- Jumlah token bener?
- Jaringan udah Sepolia (bukan mainnet)?
- Gas wajar?

Banyak orang rugi karena buru-buru "Confirm" tanpa baca. Pelajaran: **Cek 3x, tandatangan 1x.**

---

**Token:** Renzie ETH (RZH)
- TokenKu (RZH): `0xf214e045E9D2249a5cD2feF26eE2D79263A1F1dd`
- ETHJKT: `0x7E96fed902B0A26b62DA78e8112253920Fc55936`
- AMM (SimpleAMM): `0xe2418A85060977cBCD13E7ecc2e88E98A0428456`

**Tx Deploy:** 0xb1196dc7fc2e6b35abbcd3e6e22e98bcd0fd599007d9ff35de4cabc14e990ef8
