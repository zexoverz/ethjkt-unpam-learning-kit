# KampusSwap — Hari 3: Token & Pasar Pertama

**Nama:** Guntur Rizqi Rumbianto
**Koin:** Renzie ETH (RZH)

TxHash Deploy: https://sepolia.etherscan.io/tx/0xb1196dc7fc2e6b35abbcd3e6e22e98bcd0fd599007d9ff35de4cabc14e990ef8
Tokenku Address (RZH): 0xFb71727732795b8Cc57989b057DcC485De9a5720

Hari ini bersejarah: bikin KOIN sendiri dan PASARNYA, terus
naruh ke blockchain ASLI (Sepolia). Pakai Remix IDE (Solidity di browser)
+ MetaMask + faucet gratis.

File di folder ini:
```
TokenKu.sol       -> koin (Renzie ETH / RZH)
EthjktToken.sol   -> token bersama ETHJKT
SimpleAMM.sol     -> mesin pasar/swap (x*y=k)
app/              -> interface web (React + wagmi)
```

---

## ATURAN EMAS

```
Hari 1: AI tukang ketik, kamu pilot.
Hari 2: baca & verifikasi kode AI.
Hari 3: verifikasi juga OMONGAN AI. Cocokin sama kenyataan di layar.

Pelajaran bintang: transaksi on-chain itu FINAL.
Sekali tanda tangan, token kepotong, nggak ada undo. Cek dulu, baru klik.
```

KEAMANAN: SEED PHRASE / PRIVATE KEY = RAHASIA MUTLAK.
Jangan pernah share ke siapa pun, termasuk AI. Main di SEPOLIA aja.

---

## Checkpoint 0 — Siapin MetaMask + Sepolia + Faucet

- Install MetaMask, bikin dompet, simpan seed phrase.
- Aktifkan Sepolia (Settings > Advanced > Show test networks ON).
- Ambil ETH Sepolia gratis dari faucet Google Cloud.

## Checkpoint 1 — Bikin Koin

- Compile + deploy TokenKu.sol (ganti nama & simbol jadi Renzie ETH / RZH).
- Import alamat contract ke MetaMask.

## Checkpoint 2 — Deploy Pasar + Approve + Likuiditas + Swap

- Deploy SimpleAMM(\_TOKENA = RZH, \_TOKENB = ETHJKT).
- Approve 2 token ke alamat AMM.
- addLiquidity(1000 RZH, 1000 ETHJKT) -> pool lahir.
- swapAforB(100 RZH) -> dapet ~90,66 ETHJKT.

---

## Checkpoint 3 — UJI AI

AI suka ngarang: coba tanya fungsi `burn()` atau `freezeAccount()` yang
nggak ada di ERC20 standar. Verifikasi ke kode nyata di contract.

---

## LOG PEMAHAMAN

Lihat `LOG-HARI-3.md` di folder ini.

