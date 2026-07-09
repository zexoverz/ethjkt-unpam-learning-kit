# MISI HARI 3 — BIKIN KOIN + PASAR SENDIRI (KampusSwap)

Hari ini bersejarah: kalian bikin KOIN sendiri dan PASARNYA, terus
naruh ke blockchain ASLI (Sepolia) buat pertama kalinya. Kita pakai
Remix IDE (editor Solidity di browser) + MetaMask (dompet) + faucet
gratis. Nggak perlu install Remix, cukup install MetaMask.

Bahasa barunya: Solidity. Tenang inget prinsip kita: AI = tukang ketik.
Kalian nggak dituntut hafal Solidity, tapi dituntut NGERTI & VERIFIKASI.

File di folder ini:
```
TokenKu.sol      -> koin kamu (ganti nama & simbol di sini).
EthjktToken.sol  -> token bersama (biasanya pengajar yang deploy).
SimpleAMM.sol     -> mesin pasar/swap (x*y=k).
app/              -> interface web (Stretch): index.html, main.js, config.js, styles.css
```

Mentok? Tanya AI ("jelasin error ini"), atau tanya pengajar/mentor di kelas.

---

## ATURAN EMAS (lanjutan Hari 1-2)

```
Hari 1: AI tukang ketik, kamu pilot.
Hari 2: baca & verifikasi kode AI.
Hari 3: verifikasi juga OMONGAN AI. Cocokin sama kenyataan di layar.

Pelajaran bintang hari ini: transaksi on-chain itu FINAL.
Sekali tanda tangan, token kepotong, nggak ada undo. Cek dulu, baru klik.
```

KEAMANAN (WAJIB baca):
```
- SEED PHRASE / PRIVATE KEY = kunci dompetmu. RAHASIA MUTLAK.
  Jangan screenshot, jangan tempel ke chat, JANGAN kasih ke AI.
- Kita cuma main di jaringan SEPOLIA. Jangan pernah pakai uang asli.
```

---

## CHECKPOINT 0 — Siapin MetaMask + Sepolia + Faucet

```
[ ] Install extension MetaMask (metamask.io). Bikin dompet baru.
    -> Simpan seed phrase di tempat aman. JANGAN dibagi.
[ ] Di MetaMask, buka daftar jaringan -> aktifkan "Sepolia".
    (Kalau nggak ada: Settings -> Advanced -> "Show test networks" ON.)
[ ] Copy alamat dompetmu (mulai 0x...).
[ ] Ambil ETH Sepolia GRATIS di faucet:
    https://cloud.google.com/application/web3/faucet/ethereum/sepolia
    -> login Google, tempel alamatmu, klaim. Tunggu masuk di MetaMask.
```

Kenapa butuh ETH? Buat bayar "gas" tiap nulis ke chain. Di Sepolia gratis.

---

## CHECKPOINT 1 — Jadikan Koin Itu MILIKMU

```
[ ] Buka https://remix.ethereum.org
[ ] Buat file baru: TokenKu.sol, salin isi dari folder ini.
[ ] Cari baris >>> GANTI DI SINI <<<. Ganti nama & simbol jadi koinmu:
       ERC20("Mie Ayam Coin", "MIEAYAM")   <- contoh, bebas & lucu boleh.
[ ] Buka Codex/AI di sebelah. Minta: "jelasin baris per baris TokenKu.sol
    ini pakai bahasa gampang." Baca. Cocok nggak sama komentar di file?
    (jangan langsung percaya kita uji AI di Checkpoint 5).
```

---

## CHECKPOINT 2 — Compile

```
[ ] Klik ikon Solidity Compiler (ikon "S" di kiri).
[ ] Pastikan versi compiler 0.8.20 ke atas.
[ ] Klik "Compile TokenKu.sol". (Remix otomatis ngambil OpenZeppelin.)
[ ] Centang hijau = SUKSES. Merah? baca errornya -> tanya AI/pengajar.
```

---

## CHECKPOINT 3 — Deploy Koin ke Sepolia (blockchain ASLI)

```
[ ] Klik ikon "Deploy & Run" (panah).
[ ] Di "ENVIRONMENT" pilih "Injected Provider - MetaMask".
    -> MetaMask nyambung. PASTIKAN jaringannya SEPOLIA.
[ ] Klik "Deploy". MetaMask muncul minta TANDA TANGAN + gas -> Confirm.
[ ] Tunggu. Di bawah muncul "Deployed Contracts" -> koinmu HIDUP.
[ ] COPY alamat contract-nya (ikon copy). Simpan baik-baik.
```

Import koin ke MetaMask biar keliatan:
```
[ ] MetaMask -> Tokens -> Import tokens -> tempel alamat contract koinmu.
[ ] Muncul saldo 1.000.000 KOINMU. Selamat, kamu punya duit buatan sendiri.
```

Buktiin permanen: buka https://sepolia.etherscan.io, tempel alamat
contract -> transaksimu kelihatan, bisa dilihat SIAPA AJA di dunia.

---

## CHECKPOINT 4 — Bikin PASAR + SWAP (inti KampusSwap)

Ini bagian PALING BANYAK LANGKAHNYA. Santai, ikutin urut. Butuh 2 token
buat ditukar: KOINMU + ETHJKT (alamat dari pengajar).

### >> PENTING: JEBAKAN ANGKA (18 desimal) <<
Token pakai 18 angka di belakang koma. Jadi "1000 token" BUKAN diketik
"1000", tapi 1000 + 18 nol:
```
      1 token    = 1000000000000000000          (1  + 18 nol)
      1000 token = 1000000000000000000000        (1000 + 18 nol)
      100 token  = 100000000000000000000         (100  + 18 nol)
      100000 token = 100000000000000000000000    (100000 + 18 nol)
```
Salah jumlah nol = angka kekecilan/kegedean. Copy-paste dari sini aja.

### KENAPA LANGKAHNYA BANYAK?
Karena keamanan ERC20: pasar NGGAK BOLEH ambil token dari dompetmu tanpa
IZIN. Jadi tiap token harus di-`approve` DULU, baru pasar boleh narik.
Approve = kasih izin. Itu sebabnya ada langkah approve sebelum tiap aksi.

---

### 4a. Siapin bahan (2 token)
```
[ ] Catat ALAMAT ETHJKT dari pengajar. (contoh instruktur:
    0x7E96fed902B0A26b62DA78e8112253920Fc55936)
[ ] KOINMU: dari Checkpoint 3 kamu udah punya 1.000.000. Cukup.
[ ] Dapet ETHJKT buat modal: di Remix panel "Deploy & Run" ->
    kolom "At Address", tempel alamat ETHJKT -> klik "At Address".
    Muncul contract ETHJKT -> panggil:
        mint(100000000000000000000000)     <- ini 100.000 ETHJKT
    -> Confirm di MetaMask. (Sekarang kamu punya ETHJKT.)
```

### 4b. Deploy pasar (SimpleAMM)
```
[ ] Compile SimpleAMM.sol. Di "Deploy", contract SimpleAMM minta 2 isian:
        _TOKENA = alamat KOINMU     (koin kamu)
        _TOKENB = alamat ETHJKT     (token bersama)
    -> klik "Deploy" -> Confirm di MetaMask.
[ ] Copy alamat SimpleAMM (ini "pasar" kamu). Simpan.
```

### 4c. APPROVE 2 token (izinin pasar narik)
Ganti <ALAMAT_PASAR> dengan alamat SimpleAMM tadi. Pakai angka besar biar
sekali approve cukup buat banyak aksi:
```
[ ] Di KOINMU (TokenKu)  -> approve(<ALAMAT_PASAR>, 1000000000000000000000000) -> Confirm.
[ ] Di ETHJKT            -> approve(<ALAMAT_PASAR>, 1000000000000000000000000) -> Confirm.
    (angka di atas = 1.000.000 token, cukup buat latihan.)
```

### 4d. ISI LIKUIDITAS (pasar kamu lahir di sini)
```
[ ] Di SimpleAMM -> addLiquidity( 1000000000000000000000 , 1000000000000000000000 )
    (artinya: setor 1000 KOINMU + 1000 ETHJKT) -> Confirm.
[ ] Cek: panggil reserveA & reserveB -> dua-duanya harus 1000000000000000000000.
    Harga awal jadi 1 : 1.
```
Kalau gagal "insufficient allowance" -> balik ke 4c (approve kurang/lupa).

### 4e. SWAP (tukeran beneran!)
```
[ ] (intip dulu) getAmountOut( 100000000000000000000 , reserveA , reserveB )
    -> hasilnya sekitar 90660000000000000000 (= ~90,66 ETHJKT).
       Kok bukan 100? Itu slippage + fee. (besok dibahas.)
[ ] swapAforB( 100000000000000000000 )   <- swap 100 KOINMU -> ETHJKT -> Confirm.
[ ] Cek reserveA & reserveB berubah. reserveA jadi ~1100, reserveB ~909.
    Koinmu ketuker! Cek juga saldo ETHJKT-mu naik di MetaMask.
```

Selamat kalian baru aja jalanin bursa mini sendiri di blockchain asli.

---

## CHECKPOINT 5 — UJI-JEBAK AI (berpikir kritis)

AI itu pinter, tapi bisa NGARANG (inget Hari 1). Uji dia soal token/
blockchain, lalu COCOKIN jawabannya sama kenyataan di Remix/Etherscan.

Tanya AI, tebak dulu, lalu BUKTIIN:
```
1. "Di contract TokenKu ini, gimana cara MENGHAPUS koin punya orang lain?"
2. "Tunjukin fungsi freezeAccount() di token ERC20 standar ini."
3. "Fungsi balanceOf() makan gas nggak kalau cuma dipanggil buat baca?"
4. "Kalau aku swap, harganya tetap 1:1 terus atau berubah? Kenapa?"
```

Kamu jadi HAKIM: AI-nya bener atau NGARANG? Cek: fungsi yang ADA cuma
yang di file + warisan ERC20. Kalau AI "nunjukin" fungsi yang nggak ada,
itu HALUSINASI. Catat. (Coba sendiri dulu; kalau ragu, tanya pengajar.)

---

## STRETCH — Buka Interface Web (app/)

Di folder `app/` ada DEX mini siap pakai (tema "liquid glass", brand ETHJKT).
Kamu cukup ganti 3 alamat, nggak usah ngoding.

```
[ ] Buka app/config.js  <-- CUMA FILE INI yang kamu edit.
    Ganti:
       AMM_ADDRESS         = alamat SimpleAMM kamu
       TOKEN_A.address     = koinmu (TokenKu)
       TOKEN_B.address     = ETHJKT
    (Bisa juga ganti logo token: taruh file gambar di app/, tulis namanya
     di TOKEN_A.logo / TOKEN_B.logo.)
[ ] Buka interface pakai LIVE SERVER (JANGAN dobel-klik file HTML):
       1. Install extension "Live Server" by Ritwick Dey di VSCode (sekali aja).
       2. Di VSCode: File -> Open Folder -> pilih folder app/.
       3. Klik kanan index.html -> "Open with Live Server",
          ATAU klik tombol "Go Live" di pojok kanan-bawah VSCode.
       4. Browser kebuka otomatis (mis. http://127.0.0.1:5500).
    (Alternatif terminal: `cd app && python3 -m http.server 8000` -> http://localhost:8000)
[ ] Isi pool langsung kebaca TANPA connect (data publik lewat RPC).
[ ] Klik "Connect Wallet". Kalau jaringan salah, tombolnya berubah jadi
    "Ganti ke Sepolia" -> klik buat pindah otomatis.
[ ] Tombolnya SATU aja: pas swap/tambah, approve jalan otomatis dulu
    (perhatiin teks tombol: "Approve ... -> Konfirmasi ... di MetaMask").
```

Fitur interface (DEX mini beneran):
```
- SWAP        : tuker koinmu <-> ETHJKT, ada preview harga sebelum tanda tangan.
- LIQUIDITY   : Tambah (setor 2 token, jumlah auto ngikut rasio pool) &
                Tarik (bakar share, ambil balik 2 token).
- HISTORY     : daftar transaksi (token->token, harga, link Etherscan).
- Disconnect  : beneran cabut izin -> next connect nanya pilih akun lagi.
```

Kalau interface error, cek dulu yang paling sering: jaringan bukan Sepolia /
alamat di config.js belum diganti dari 0xISI_... / file dibuka pakai
dobel-klik (file://) bukan lewat Live Server. Masih mentok? tanya pengajar.

---

## LOG PEMAHAMAN + REFLEKSI (WAJIB — ini yang dinilai)

Bikin `LOG-HARI-3.md`, jawab pakai bahasa sendiri:
```
1. Token & ERC20 itu apa? Kenapa disebut "standar"?
2. Bedanya "aksi baca" (mis. balanceOf) vs "aksi nulis" (mis. swap)?
   Yang mana yang bayar gas, kenapa?
3. Dari 4 pertanyaan jebakan: mana yang AI-nya NGARANG? Gimana kamu tau?
4. Kenapa transaksi on-chain harus dicek DULU sebelum tanda tangan?
```

Sertakan: screenshot token di MetaMask + link transaksi swap di
Etherscan + alamat 3 contract-mu (buat dibedah besok). Push ke GitHub.

Nomor 3 itu emas. Bisa nangkep AI ngarang = kamu udah mikir kritis.

---

Selamat, kalian resmi punya koin + pasar sendiri di blockchain. Besok
kita bedah biar kalian bisa JELASIN semuanya.

-- Zexo, ETHJKT
