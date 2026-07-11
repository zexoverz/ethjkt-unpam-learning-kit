# LOG DAY 4 — AISYAH

## CHECKPOINT 6 — Jelasin Contract-mu Sendiri
```
[ ] TokenKu: "koin ini nyimpen apa? fungsi transfer & approve buat apa?"
    - koin itu seberapa banyak kaya saldo yang kita punya gitu tapi kan memang disebut nya koin krena membahas blockchain.
    - transfer itu ngirim aset kaya token dari satu address ke adddress lainnya.
    - approve itu buat persetujuan tindakan yang kita lakuin gitu jujur keren sih kaya jadinya ga sembarangan transaksi terjadi gitu, kita jadi bisa makesure lagi.
[ ] SimpleAMM: "pool itu apa? addLiquidity ngapain? swap ngapain?"
    - poll itu kaya penggabungan aset dari dua atau lebih pengguna mungkin bisa lebih ya saya juga masih coba memahami karena kemarin itu yg saya paham intinya poll itu dua pengguna yang aset nya digabungin dan dikelola pakai smart contract
    - addliquidity itu mungkin bisa dikatakan menyetorkan aset kita ke pasar kita 
    - swap itu yang saya paham menukar aset jadi kaya misal yang ada di web. misal di case saya, saya mau punya token ethjkt tapi saya punya 9 token mrt nah brp token ethjkt yg bisa saya dapatkan 
[ ] Tunjuk 1 baris kode yang kemarin kamu NGGAK ngerti, sekarang paham.
    - sejujurnya saya masih mencoba untuk pahamin bukan hanya kode2 nya aja sir tapi saya masih memproses step by step nya tapi saya agak amaze di kode ini sih.
    contract MariteToken is ERC20 {
    constructor()
        // >>> GANTI DI SINI <<<  ("Nama Panjang Token", "SIMBOL")
        // contoh: ERC20("Mie Ayam Coin", "MIEAYAM")
        ERC20("Marite Token", "MRT")
    {
        // cetak 1.000.000 token ke kamu (deployer). "10 ** decimals()"
        // karena token pakai 18 angka di belakang koma, sama kayak ETH.
        _mint(msg.sender, 1_000_000 * 10 ** decimals());
    }

      kaya saya ternyata bisa punya nama token itu darisini hehe.
```
## CHECKPOINT 7 — Bukti x*y=k
```
[ ] Baca reserveA & reserveB SEBELUM swap. Catat. k_sebelum = reserveA * reserveB.
    k_sebelum = 1000 * 1000
    k_sebelum = 1.000.000
[ ] Lakuin 1 swap kecil (swapAforB jumlah kecil).
    - saya transfer 100 MRT (100000000000000000000)
[ ] Baca reserveA & reserveB SESUDAH. Catat. k_sesudah = reserveA * reserveB.
    k_sesudah = 1100 × 909.338910611985086842
          = 1,000,272.80 (dibulatkan)
[ ] Bandingin: k_sesudah harusnya >= k_sebelum (naik dikit karena fee 0.3%).
    k_sebelum  = 1,000,000
    k_sesudah  = 1,000,272.80
    k naik sedikit karena fee 0.3% dari tiap swap ketinggal di pool, nambahin cadangan buat penyedia likuiditas (liquidity provider).
```
## CHECKPOINT 8 — Uji AI Swap Advisor vs Contract
```
Data yang diuji:

```json
{"reserveIn":"1000000000000000000000","reserveOut":"1000000000000000000000","amountIn":"100000000000000000000"}
```

Hasil perhitungan AI Swap Advisor:

```json
{"perkiraanTerima":"90661089388014913158","priceImpactPersen":9.338910611985087,"verdict":"kurs wajar"}
```
```
Hasil dari contract:

text
getAmountOut(100000000000000000000, 1000000000000000000000, 1000000000000000000000)
= 90661089388014913158
Selisih AI dengan contract pada contoh ini adalah **0 wei**. Price impact-nya
sekitar 9,34% karena jumlah swap 100 token cukup besar dibanding reserve pool
yang hanya 1.000 token; angka ini sudah termasuk fee 0,3%. Walaupun hasil AI
kali ini benar, saya tetap harus memeriksa `getAmountOut` dari contract sebelum
swap karena reserve dan jumlah swap dapat berubah setiap saat.
```
## CHECKPOINT 9 (BONUS) — AI Market Vibe
```
foto swapped
Pasar KampusSwap MRT/ETHJKT ini baru "lahir" 53 menit lalu dan langsung dapet suntikan modal seimbang 1000:1000 dari sang pendiri — vibe-nya kayak toko yang baru buka, rak masih rapi, belum rame pembeli. Baru ada 1 aktivitas swap tercatat, jadi likuiditasnya masih "kolam pribadi" yang tenang, belum jadi arena rame-rame trader. Overall vibe: chill, early-stage, dan penuh potensi — tinggal nunggu trader lain nyemplung buat bikin airnya beneran "gerak".
```
## MY TOKEN2AN 
```
Token Contract  = 0x2736A7708a6b44A61e4054F1C0EeB0B226AB40E0												*diambil dari contract creation yang pertama
TxHash Deploy  = https://sepolia.etherscan.io/token/0x2736a7708a6b44a61e4054f1c0eeb0b226ab40e0							*diambil dari https browser nya
TOKEN USER ADDRESS = 0xa45D2940649CB3CF8Ebf07B0B6e39B8D25Da4B79
HTTPS USER ADDRESS = https://sepolia.etherscan.io/address/0xa45D2940649CB3CF8Ebf07B0B6e39B8D25Da4B79
FUNDED BY = 0x42645cE4Dd0B766dE53ee483cbf54bcEa670f9b2
alamat pasar gua = 0xf4b4357199c17c6dd95e8c851509737710749d3b
```
