Alamat Kontrak 
Token Saya MaxWinToken:0xd40f54780F1bEE5b911EA9e7cD23bAAD25C68A4D
Ethjkt : 0x7E96fed902B0A26b62DA78e8112253920Fc55936
SimpleAMM : 0xEB954Fb197C404B68A1d983a21d362E232d4b2c9


Checkpoint 6
- TokenKu (MaxWinToken/ MWT)
TokenKu itu kayak buku catatan yang menyimpan saldo tiap alamat jadi tugasnya mencatat, alamat siapa punya berapa banyak token

Fungsi transfer itu kayak "kirim uang" pindahin sejumlah koin dari dompet saya ke dompet orang lain

Fungsi approve itu untuk memberikan izin ke pihak lain (misalnya contract) supaya boleh menarik sejumlah token dari saldo kita tapi tokennya belum berpindah saat itu juga, baru izinnya doang yang dikasih

- SimpleAMM (Pasar)
Pool itu kayak "kolam" tempat dua jenis koin (koin saya + ETHJKT) disimpen bareng-bareng, siap buat dituker.

addLiquidity itu kayak "nyetor modal" ke kolam itu saya kasih 
sejumlah koin saya + sejumlah ETHJKT, biar kolamnya ada isinya dan orang bisa mulai tuker-menuker.

swap itu kayak "tukar barang di kolam" saya masukin koin A, 
ambil koin B sebagai gantinya, dan jumlahnya dihitung otomatis 
sama rumus matematika yamg udah diatur, bukan harga tetap.

- Baris yang tadinya bingung
Baris di TokenKu.sol:
"_mint(msg.sender, 1_000_000 * 10 ** decimals());"

Awalnya saya bingung kenapa kok harus dikali "10 ** decimals()". Sekarang paham itu karena token pakai 18 angka desimal, jadi "1 juta token" sebenarnya disimpan jadi angka yang jauh lebih besar di belakang layar biar lebih presisi.

![checkpoint1-mint-ethjkt](<Screenshot 2026-07-10 130802.png>)
![checkpoint2a-deploy-popup](<Screenshot 2026-07-10 132002.png>)
![checkpoint2b-deploy-confirmed](<Screenshot 2026-07-10 133932.png>)
![checkpoint2c-deploy-etherscan](<Screenshot 2026-07-10 134032.png>)
![checkpoint3a-approve-tokenku](<Screenshot 2026-07-10 140123.png>)
![checkpoint3b-approve-tokenku-confirmed](<Screenshot 2026-07-10 140155.png>)
![checkpoint3c-approve-ethjkt](<Screenshot 2026-07-10 143011.png>)
![checkpoint4-addliquidity](<Screenshot 2026-07-10 143203.png>)
![checkpoint5a-swap-confirm](<Screenshot 2026-07-10 144049.png>)


Checkpoint 7
SEBELUM SWAP:
![Reserve A](<Screenshot 2026-07-10 214034.png>)
![Reserve B](<Screenshot 2026-07-10 214117.png>)

reserveA = 1100 KOIN (1100000000000000000000)
reserveB = 909.338910611985086842 ETHJKT (909338910611985086842)
k_sebelum = 1100 × 909.338910611985086842 = 1,000,272.80...

SWAP: swapAforB(1 KOIN) → dapet ~0.823 ETHJKT

SESUDAH SWAP:
![Reserve A](<Screenshot 2026-07-10 214835.png>)
![Reserve B](<Screenshot 2026-07-10 214901.png>)
reserveA = 1101 KOIN
reserveB = 908.515465231225512446 ETHJKT
k_sesudah = 1101 × 908.515465231225512446 ≈ 1,000,275.53

Selisih k = k_sesudah - k_sebelum ≈ +2.73

Kenapa k naik dikit, bukan tetep persis? Soalnya tiap swap kena fee 0.3%, dan fee itu nggak diambil keluar dari pool — malah nambah jadi bagian dari reserve. Jadi total token di pool jadi sedikit lebih “tebel” dari kondisi kalau swap-nya tanpa fee. Makanya jadi keliatan k-nya naik dikit. Ini juga yang bikin jadi LP bisa untung pelan-pelan, karena isi pool makin nambah dari fee tiap ada orang swap.

Checkpoint 8
![Reserve A sebelum uji AI (1101 koin)](<Screenshot 2026-07-10 220909.png>)
![Reserve B sebelum uji AI (908.515465231225512446 ETHJKT)](<Screenshot 2026-07-10 220957.png>)
![Hasil getAmountOut dari contract (input: 5 koin)](<Screenshot 2026-07-10 221345.png>)

Input: reserveIn = 1101 koin, reserveOut = 908.515465231225512446 ETHJKT, amountIn = 5 koin

Prediksi AI: 4.094946671227603 ETHJKT (price impact ~0.749%)
Hasil getAmountOut (contract): 4.094946671227601802 ETHJKT

Selisih: ~0.0000000000000012 ETHJKT (praktis 0%, dapat diabaikan)

Refleksi: Kali ini AI ternyata AKURAT, hampir presisi sempurna sampai belasan digit desimal. Ini nunjukin AI BISA bener kalau rumusnya sederhana dan dikasih input yang jelas (constant product formula emang gampang dihitung). Tapi ini JUSTRU jadi alasan kenapa tetap harus verifikasi ke contract: kita ga bisa tau dari awal apakah AI bakal bener atau ngasal kadang AI bisa salah hitung desimal, lupa fee, atau keliru rumus di kasus lain. Satu-satunya cara mastiin 100% benar adalah cocokin ke fungsi on-chain (getAmountOut), karena itu SUMBER KEBENARAN yang sebenarnya dieksekusi pas transaksi jalan — bukan tebakan siapa pun, termasuk AI.

Checkpoint 9 

Vibe pasarnya kelihatan lagi rame di sisi ETHJKT — dari contoh swap yang keliatan,
banyak yang tukar MaxWinToken → ETHJKT, jadi token yang lagi paling diburu
keliatannya ETHJKT.
Arah transaksinya juga nunjukin orang-orang lagi lebih pengin pegang token keluar
daripada token masuk, jadi suasananya condong ke ngejar ETHJKT.
Intinya, pasar hari ini terasa aktif, agak agresif, dan lagi fokus ke satu token
yang sama, bukan sebar ke banyak token.

Disclaimer: ini cuma hiburan, bukan saran finansial.

Cara Menjalankan Web App
1. Masuk folder app/
2. npm install
3. Edit app/config.ts jika perlu (sudah terisi dengan alamat di atas)
4. npm run dev
5. Buka browser di alamat yang muncul (biasanya localhost:5173)
6. Connect wallet (MetaMask, network Sepolia)
7. Isi jumlah swap, klik Swap, konfirmasi di MetaMask

Swap Jalan 
![Konfirmasi Swap](<Screenshot 2026-07-10 233115.png>)
![Transaksi Dikonfirmasi](<Screenshot 2026-07-10 233157.png>)
![Verifikasi On Chain](<Screenshot 2026-07-10 233248.png>)

## Bonus: Verifikasi Contract di Etherscan

Setelah pasar (SimpleAMM) dan koin (TokenKu) berhasil di-deploy, kedua
contract diverifikasi di Etherscan supaya source code-nya terbuka untuk
publik — sama seperti ETHJKT yang sudah diverifikasi pengajar.

### Kontrak yang diverifikasi
- *MaxWinToken (MWT)*: 0xd40f54780F1bEE5b911EA9e7cD23bAAD25C68A4D
- *SimpleAMM*: 0xEB954Fb197C404B68A1d983a21d362E232d4b2c9

### Proses
1. Compile ulang contract di Remix dengan compiler version yang sama
   persis dengan saat deploy (v0.8.34+commit.80d5c536, optimization 200 runs).
2. Ambil field COMPILERINPUT (bukan METADATA) dari Compilation Details
   Remix — field ini berisi source code lengkap dalam format yang
   dibutuhkan Etherscan.
3. Simpan sebagai file .json, upload ke form "Verify and Publish"
   Etherscan dengan tipe compiler "Standard-Json-Input".
4. Constructor Arguments dibiarkan kosong karena constructor kedua
   contract tidak menerima parameter (nama/symbol/alamat token sudah
   hardcoded di dalam kode).

### Hasil
Kedua contract berhasil terverifikasi dengan pesan:
"Successfully generated matching Bytecode and ABI for Contract Address".
Source code sekarang bisa dibaca publik di tab "Contract" masing-masing
alamat di Etherscan.

### Refleksi
Awalnya sempat gagal karena salah copy field METADATA (isinya referensi
urls, bukan source code langsung) — Etherscan minta format
"content": "..." yang cuma ada di COMPILERINPUT. Ini ngajarin bahwa
verifikasi bukan cuma soal compiler version yang cocok, tapi juga format
data yang di-submit harus tepat.

![Verifikasi TokenKu(MaxWinToken) Berhasil](<Screenshot 2026-07-11 084256.png>)
![SimpleAMM — Source Code Verified](<Screenshot 2026-07-11 085146.png>)

Langkah Lanjut (Karier.md)
Jujur saya masih belum yakin 100% mau fokus ke Web3/blockchain atau eksplorasi bidang lain dulu, yang pasti saya masih pengen mencoba mencari pengalaman yang bener bener bakal jadi satu pilihan saya untuk kedepannya biar bisa nentuinnya. Dan juga dari course ini saya jadi lebih paham gimana rasanya kerja bareng AI secara bertanggung jawab gak cuma nyuruh AI ngoding, tapi verifikasi & paham apa yang dibikin.