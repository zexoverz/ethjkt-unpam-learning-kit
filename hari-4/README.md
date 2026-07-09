# MISI HARI 4 — LENGKAPI PASARMU, lalu BUKTIIN KAMU PAHAM

Hari ini 2 babak:

- **BABAK 1 (BUILD):** kemarin koinmu (ERC20) udah ke-deploy, tapi pasarnya
  belum. Hari ini kita SELESAIN: deploy AMM + isi likuiditas + swap jalan.
- **BABAK 2 (PAHAM):** kamu MEMBUKTIKAN ngerti apa yang kamu bikin. Ini inti
  course — dinilai dari "bisa jelasin & verifikasi", bukan "kodenya jalan".

File di folder ini:
```
TokenKu.sol      -> koin kamu (udah kamu deploy kemarin).
EthjktToken.sol  -> token bersama (pengajar udah deploy — lihat di bawah).
SimpleAMM.sol    -> mesin pasar/swap (x*y=k). >> INI yang di-deploy hari ini.
app/             -> interface web (Stretch): React + wagmi, cukup edit config.ts
```

Siapin: alamat KOIN kamu dari Hari 3 + Remix + MetaMask (Sepolia + ada gas).

---

## ATURAN EMAS (puncak dari 4 hari)

```
H1: AI tukang ketik. H2: verifikasi kode AI. H3: verifikasi omongan AI.
H4: pakai AI buat MIKIR, pakai BUKTI (contract) buat PERCAYA.

Khusus AMM: AI sering salah rumus & payah ngitung.
Angka dari AI  <-->  cocokin  <-->  getAmountOut() on-chain.
Kalau beda -> CONTRACT yang bener.

Pelajaran bintang: transaksi on-chain itu FINAL. Cek dulu, baru tanda tangan.
```

KEAMANAN: SEED PHRASE / PRIVATE KEY = RAHASIA MUTLAK. Jangan kasih ke siapa
pun, termasuk AI. Kita cuma main di SEPOLIA — jangan pernah pakai uang asli.

===============================================================
# BABAK 1 — LENGKAPI PASARNYA (build yang ketunda)
===============================================================

Butuh 2 token buat ditukar: **KOINMU** (dari Hari 3) + **ETHJKT** (dari pengajar).

### >> JEBAKAN ANGKA (18 desimal) — baca dulu <<
Token pakai 18 angka di belakang koma. "1000 token" BUKAN `1000`, tapi 1000 + 18 nol:
```
      1 token      = 1000000000000000000          (1  + 18 nol)
      100 token    = 100000000000000000000        (100  + 18 nol)
      1000 token   = 1000000000000000000000       (1000 + 18 nol)
      100000 token = 100000000000000000000000     (100000 + 18 nol)
```
Salah jumlah nol = angka kekecilan/kegedean → getAmountOut bisa balik 0. Copy dari sini.

---

## CHECKPOINT 1 — Ambil Modal ETHJKT

ETHJKT resmi udah di-deploy pengajar & **SUDAH VERIFIED** di Etherscan:
```
ETHJKT = 0x7E96fed902B0A26b62DA78e8112253920Fc55936
sumber terverifikasi:
https://sepolia.etherscan.io/address/0x7E96fed902B0A26b62DA78e8112253920Fc55936#code
```
```
[ ] Di Remix panel "Deploy & Run" -> kolom "At Address", tempel alamat ETHJKT
    -> klik "At Address". Muncul contract ETHJKT.
[ ] Panggil:  mint(100000000000000000000000)      <- ini 100.000 ETHJKT
    -> Confirm di MetaMask. Sekarang kamu punya modal ETHJKT.
```
Karena ETHJKT udah verified, kamu bisa BACA source-nya di Etherscan (tab
"Contract") — cocokin sama EthjktToken.sol di folder ini. Itu latihan verifikasi.

---

## CHECKPOINT 2 — Deploy PASAR (SimpleAMM)

```
[ ] Compile SimpleAMM.sol (compiler 0.8.20+, Remix auto-ambil OpenZeppelin).
[ ] Di "Deploy", SimpleAMM minta 2 isian — URUTAN PENTING, jangan kebalik:
        _TOKENA = alamat KOINMU     (koin kamu, dari Hari 3)
        _TOKENB = alamat ETHJKT     (0x7E96... di atas)
    -> klik "Deploy" -> Confirm di MetaMask.
[ ] Copy alamat SimpleAMM (ini "pasar" kamu). Simpan.
```
Salah alamat / kebalik = pool nunjuk token salah, PERMANEN → deploy ulang.

---

## CHECKPOINT 3 — APPROVE 2 token (izinin pasar narik)

Pasar NGGAK BOLEH narik token dari dompetmu tanpa izin. Ganti `<PASAR>` dengan
alamat SimpleAMM tadi:
```
[ ] Di KOINMU (TokenKu) -> approve(<PASAR>, 1000000000000000000000000) -> Confirm.
[ ] Di ETHJKT           -> approve(<PASAR>, 1000000000000000000000000) -> Confirm.
    (angka = 1.000.000 token, sekali approve cukup buat banyak aksi.)
```
Lupa/kurang approve = error `insufficient allowance` (itu FITUR, bukan bug).

---

## CHECKPOINT 4 — ISI LIKUIDITAS (pasarmu LAHIR di sini)

```
[ ] Di SimpleAMM -> addLiquidity( 1000000000000000000000 , 1000000000000000000000 )
    (setor 1000 KOINMU + 1000 ETHJKT) -> Confirm.
[ ] Cek reserveA & reserveB -> dua-duanya 1000000000000000000000. Harga awal 1 : 1.
```
Gagal `insufficient allowance` -> balik Checkpoint 3. Gagal `jumlah nol` -> modal
ETHJKT/KOIN kurang (mint lagi / cek 18 desimal).

---

## CHECKPOINT 5 — SWAP (tukeran beneran!)

```
[ ] (intip dulu) getAmountOut( 100000000000000000000 , reserveA , reserveB )
    -> hasil ~90660000000000000000 (= ~90,66 ETHJKT). Kok bukan 100? slippage + fee.
[ ] swapAforB( 100000000000000000000 )   <- swap 100 KOINMU -> ETHJKT -> Confirm.
[ ] Cek reserveA jadi ~1100, reserveB ~909. Saldo ETHJKT-mu di MetaMask naik.
```
Selamat — pasar koinmu resmi HIDUP di blockchain asli. Buka Etherscan buat lihat swap-nya.

===============================================================
# BABAK 2 — BUKTIIN KAMU PAHAM (ini yang dinilai)
===============================================================

## CHECKPOINT 6 — Jelasin Contract-mu Sendiri (bahasa manusia)

Tanpa istilah sok teknis. Bayangin jelasin ke temen yang gaptek.
```
[ ] TokenKu: "koin ini nyimpen apa? fungsi transfer & approve buat apa?"
[ ] SimpleAMM: "pool itu apa? addLiquidity ngapain? swap ngapain?"
[ ] Tunjuk 1 baris kode yang kemarin kamu NGGAK ngerti, sekarang paham.
```
Tulis di LOG pakai bahasamu (bukan copy-paste AI).

---

## CHECKPOINT 7 — Buktiin x*y=k Dengan Angka Sendiri

```
[ ] Baca reserveA & reserveB SEBELUM swap. Catat. k_sebelum = reserveA * reserveB.
[ ] Lakuin 1 swap kecil (swapAforB jumlah kecil).
[ ] Baca reserveA & reserveB SESUDAH. Catat. k_sesudah = reserveA * reserveB.
[ ] Bandingin: k_sesudah harusnya >= k_sebelum (naik dikit karena fee 0.3%).
```
Refleksi (LOG): kenapa k naik SEDIKIT, bukan tetap persis? (fee 0.3% ketinggal di pool.)

---

## CHECKPOINT 8 — Uji AI Swap Advisor vs Kenyataan (inti kritis)

Prompt lengkap: `../ai/swap-advisor-prompt.md`.
```
[ ] Baca reserveA & reserveB sekarang dari SimpleAMM.
[ ] Kasih ke AI: reserveIn, reserveOut, amountIn. Minta "perkiraan terima" +
    price impact (format JSON). CATAT angka dari AI.
[ ] Panggil getAmountOut(amountIn, reserveIn, reserveOut) di Remix.
[ ] Bandingin angka AI vs contract. Beda berapa?
```
Kamu jadi HAKIM. Meleset (sering!) = bukti kenapa SELALU verifikasi ke contract.

---

## CHECKPOINT 9 (BONUS) — AI Market Vibe

Prompt: `../ai/market-vibe-prompt.md`.
```
[ ] Buka contract-mu di sepolia.etherscan.io -> tab "Events".
[ ] Kumpulin beberapa event Swapped. Kasih ke AI, minta ringkasan "vibe pasar"
    3 kalimat santai. Tempel di LOG (disclaimer: hiburan, bukan saran finansial).
```

===============================================================

## STRETCH — Buka Interface Web (`app/`)

DEX mini React + wagmi. Cukup edit **satu file**: `app/config.ts`.
```
[ ] npm install && npm run dev  (di dalam folder app/)
[ ] Edit app/config.ts: AMM_ADDRESS, TOKEN_A.address (koinmu),
    TOKEN_B.address (ETHJKT 0x7E96...). Ganti logo token kalau mau.
[ ] (opsional) WALLETCONNECT_PROJECT_ID gratis di cloud.reown.com.
[ ] Connect Wallet -> swap lewat web. Isi pool kebaca tanpa connect (RPC publik).
```
Challenge lanjut (Challenge Ladder di slide): styling sendiri -> price chart ->
extend fee (bikin fee configurable / protocol-fee) -> routing.

**Verifikasi contract (challenge keren):** contract di `config.ts` (AMM + koin)
bisa kamu VERIFY di Etherscan biar source-nya kebuka publik. ETHJKT sudah
diverifikasi pengajar sebagai contoh. Tanya pengajar buat caranya.

---

## LOG PEMAHAMAN (WAJIB — `LOG-HARI-4.md`)
```
1. DeFi itu apa, bedanya sama bank? (bahasa sendiri)
2. ERC20 kasih kamu fungsi apa aja? Kenapa swap butuh approve dulu?
3. Tempel bukti x*y=k kamu (angka sebelum/sesudah + hasil kali).
4. Seberapa meleset AI Swap Advisor vs getAmountOut? Apa artinya buat kamu?
5. Slippage itu apa, kapan bikin rugi?
```

## TAKE-HOME (tugas akhir mandiri)
```
[ ] DEMO: tunjukin/rekam pasar koinmu -> connect wallet -> 1 swap jalan.
[ ] GITHUB: push contract + LOG hari 3 & 4 + screenshot. README repo
    (nama koin, 3 alamat, cara jalanin app/).
[ ] KARIER: baca ../KARIER.md, tulis 1 langkah lanjutmu.
```

---

Selamat. Kalau kamu bisa lengkapi pasarmu + jelasin cara kerjanya + nangkep AI
meleset, kamu udah jadi builder, bukan cuma user. Sampai ketemu di ETHJKT.

-- Zexo, ETHJKT
