## LOG HARI 4 — Misi AMM (Automated Market Maker) di Sepolia

---

## DATA KONTRAK
Biar gak lupa, ini alamat contract yang gw pake selama hari ke-4:
* **Token ADT (TokenKu):** `0x6Cf3E11055f1158844F688f6CBD2e665A6ee0f70`
* **Token ETHJKT (Token Kampus):** `0x7E96fed902B0A26b62DA78e8112253920Fc55936`
* **SimpleAMM (Pool):** `0x69eE68Dfa2b81930951a8A1cf80518b3B9A47E8B`

---

## 1. CHECKPOINT 6 — TokenKu (ERC20) & SimpleAMM buat Orang Awam

Kalo bokap/nyokap nanya apa yang gw buat hari ini, gw bakal ngejelasinnya kayak gini:
* **TokenKu (ERC20):** Ini ibaratnya kayak koin timezone atau voucher fisik yang gw cetak sendiri. Bedanya, koin ini digital dan pake standar global bernama ERC20. Standar ini bikin dompet digital kayak MetaMask langsung otomatis ngenalin nama, simbol, dan bisa ngirim koin ini dengan gampang tanpa ribet bikin sistem transfer dari nol.
* **SimpleAMM (Pool):** Ini ibaratnya lapak tukar uang otomatis di pinggir jalan, tapi gak ada penjaganya sama sekali. Lapak ini isinya kotak kaca berisi tumpukan koin TokenKu dan koin ETHJKT. Orang bisa bebas dateng buat nuker koin mereka kapan aja. Harganya bakal dihitung otomatis sama rumus matematika berdasarkan sisa jumlah koin di dalem kotak. Jadi, makin tipis koin di dalem kotak, harganya bakal otomatis makin mahal.

### Baris Kode Rumus getAmountOut
Kemarin pas pertama kali liat fungsi [getAmountOut](file:///C:/Users/Dika%20Rahmat%20Fadillah/OneDrive/Kuliah/Adelya%20Revalina/ethjkt-unpam-learning-kit/hari-4/SimpleAMM.sol#L133-L144) di file [SimpleAMM.sol](file:///C:/Users/Dika%20Rahmat%20Fadillah/OneDrive/Kuliah/Adelya%20Revalina/ethjkt-unpam-learning-kit/hari-4/SimpleAMM.sol), gw sempet mumet liat baris ini:

```solidity
uint256 denominator = reserveIn * FEE_DEN + amountInWithFee;
```

**Kenapa tadinya bingung & sekarang paham:**
Dulu gw bingung kenapa penyebutnya harus pake dikali `FEE_DEN` (1000) segala, terus ditambah `amountInWithFee` yang udah dikali 997. Ternyata ini tuh versi Solidity untuk rumus matematika:
$$\Delta y = \frac{y \times \Delta x \times 0.997}{x + \Delta x \times 0.997}$$
Karena di Solidity gak bisa pake koma-komaan (floating point), rumusnya diakalin dengan cara pembilang dikali $997$ dan penyebut dikali $1000$ (disamain skalanya). Jadi baris itu tuh bagian bawah pembagian untuk menghitung harga setelah dikurangi fee swap 0.3%. Jenius banget sih trik matematika Solidity ini!

---

## 2. CHECKPOINT 7 — Pembuktian Rumus Ajaib $x \times y = k$

Nah, di checkpoint ini gw nyoba ngebuktiin apakah nilai konstan $k$ beneran stabil sebelum dan sesudah ada yang ngelakuin swap sebesar 100 ADT. Ini datanya:

| Kondisi | Reserve A (ADT) ($x$) | Reserve B (ETHJKT) ($y$) | Nilai $k$ ($x \times y$) |
| :--- | :--- | :--- | :--- |
| **Sebelum Swap** | 1.000 | 1.000 | 1.000.000 |
| **Sesudah Swap** | 1.100 | 909,34 | 1.000.274 |

### Kenapa Nilai $k$ Malah Naik Dikit?
Kalo di teori dasar kan harusnya $k$ itu konstan/tetap. Tapi pas gw hitung, nilai $k$ sesudah swap malah naik dikit jadi $1.000.274$. 
Hal ini terjadi karena adanya **fee swap sebesar 0.3%**. Setiap kali ada yang melakukan swap, 3 token dari tiap 1.000 token yang dimasukkan itu gak ikut ditukerin, melainkan ditinggal di dalam pool sebagai bonus buat Liquidity Provider (LP). Karena ada tambahan fee yang mengendap ini, otomatis perkalian reserve ($k$) setelah swap bakal selalu bertambah sedikit demi sedikit seiring berjalannya waktu ($k_{\text{sesudah}} \ge k_{\text{sebelum}}$).

---

## 3. CHECKPOINT 8 — Perbandingan AI Swap Advisor vs Real Contract

Sebelum transaksi dieksekusi on-chain, gw nyoba minta estimasi harga ke AI Swap Advisor dan ngebandingin langsung sama output fungsi [getAmountOut](file:///C:/Users/Dika%20Rahmat%20Fadillah/OneDrive/Kuliah/Adelya%20Revalina/ethjkt-unpam-learning-kit/hari-4/SimpleAMM.sol#L133-L144) dari smart contract [SimpleAMM](file:///C:/Users/Dika%20Rahmat%20Fadillah/OneDrive/Kuliah/Adelya%20Revalina/ethjkt-unpam-learning-kit/hari-4/SimpleAMM.sol#L44). Hasilnya kayak gini:

| Sumber Perhitungan | Hasil Output Swap (100 ADT) | Selisih vs Real Contract |
| :--- | :--- | :--- |
| **AI Swap Advisor** | ~91,20 ETHJKT | +0,54 ETHJKT (Terlalu Optimis) |
| **getAmountOut() On-chain** | ~90,66 ETHJKT | 0,00 (Akurat / Ground Truth) |

### Kenapa AI Bisa Meleset?
AI bisa meleset (beda sekitar 0,59% dibanding kenyataan) biasanya karena dia melakukan simplifikasi rumus. AI seringkali lupa masukin variabel fee 0.3% ke hitungannya, salah nentuin urutan reserve token yang mana yang masuk dan keluar, atau cuma ngitung perbandingan lurus tanpa nerapin efek slippage dari formula konstan $x \times y = k$. 
Pelajaran pentingnya: di dunia Web3, contract is law (hukum tertingginya ya kode on-chain). Jangan pernah percaya 100% sama hitungan AI buat estimasi harga sebelum dicocokin langsung sama fungsi view di contract.

---

## 4. CHECKPOINT 9 — Analisis Vibe Pasar dari Etherscan

Melihat log transaksi di Sepolia Etherscan:
1. **Event LiquidityAdded:** `1000 ADT` + `1000 ETHJKT` disetor ke pool, mencetak `1000 LP shares`.
2. **Event Swapped:** Aksi swap [swapAforB](file:///C:/Users/Dika%20Rahmat%20Fadillah/OneDrive/Kuliah/Adelya%20Revalina/ethjkt-unpam-learning-kit/hari-4/SimpleAMM.sol#L149-L159), di mana `100 ADT` masuk ke pool, dan `~90.66 ETHJKT` keluar.

### Vibe Pasar (3 Kalimat):
Lapak baru dibuka langsung dapet guyuran dana likuiditas awal yang lumayan gede dari para pendiri proyek biar pool-nya stabil. Eh gak lama kemudian, langsung ada paus yang datang nge-swap 100 ADT buat dituker ke ETHJKT, bikin reserve pool bergeser dan harga ADT langsung drop gara-gara terdepresiasi. Kelihatan banget pasarnya lagi rada fomo buat amankan profit token ETHJKT selagi likuiditasnya masih anget.

> *Disclaimer: Analisis vibe pasar di atas cuma buat seru-seruan tugas kuliah dan hiburan semata, bukan saran finansial atau ajakan investasi ya! Tetap DYOR (Do Your Own Research).*

---

## 5. LOG PEMAHAMAN

Di bagian ini, gw mau ngejelasin pemahaman gw pake bahasa gw sendiri tentang konsep DeFi dan AMM:

### a. DeFi itu apa, bedanya sama bank?
DeFi (Decentralized Finance) itu ekosistem keuangan baru yang berjalan di atas teknologi blockchain tanpa butuh perantara kayak bank tradisional atau broker. Bedanya, kalau di bank konvensional kita harus tunduk sama jam operasional mereka, lewat proses administrasi/KYC yang ribet, dan selalu ada risiko akun kita dibekukan sepihak. Sedangkan di DeFi, semua transaksi diatur oleh smart contract secara transparan, gak bisa disensor siapapun, aktif 24 jam nonstop, dan bisa diakses sama siapa aja cuma modal internet dan dompet kripto.

### b. ERC20 kasih fungsi apa aja? Kenapa swap butuh approve dulu?
Standar ERC20 ngasih fungsi dasar biar token bisa saling kompatibel, contohnya fungsi cek saldo (`balanceOf`), kirim token (`transfer`), kirim token atas nama orang lain (`transferFrom`), dan ngasih izin batas pengeluaran token (`approve`). Nah, swap itu butuh proses `approve` dulu karena pool AMM itu contract tersendiri yang perlu izin resmi buat narik token dari wallet kita secara aman. Tanpa adanya `approve` duluan, contract AMM gak bakal bisa nge-debit token kita buat dituker, jadi ini semacam fitur keamanan wajib biar saldo kita gak disedot sembarangan sama sembarang contract.

### c. Tempel bukti x*y=k (ulang dari data di atas)
Pembuktian rumus $x \times y = k$ di pool gw bisa dihitung dari data reserve saat transaksi swap 100 ADT:
* **Sebelum Swap:** $x \text{ (reserve ADT)} = 1000$ dan $y \text{ (reserve ETHJKT)} = 1000$. Hasil kali $k_{\text{awal}} = 1000 \times 1000 = 1.000.000$.
* **Sesudah Swap:** $x \text{ (reserve ADT)} = 1100$ dan $y \text{ (reserve ETHJKT)} = 909,34$. Hasil kali $k_{\text{akhir}} = 1100 \times 909,34 = 1.000.274$.
* **Hasil Akhir:** Terbukti bahwa nilai $k_{\text{akhir}} \ge k_{\text{awal}}$ ($1.000.274 > 1.000.000$). Selisih kenaikan nilai $k$ sebesar $274$ unit tersebut adalah bukti nyata kalau fee 0.3% berhasil masuk dan mengendap buat nambah aset likuiditas pool.

### d. Seberapa meleset AI Swap Advisor vs getAmountOut? Artinya apa buat saya?
Selisih antara prediksi AI Swap Advisor (~91,20 ETHJKT) dengan nilai asli dari contract (~90,66 ETHJKT) adalah sekitar 0,54 ETHJKT atau meleset sekitar 0,59%. Perbedaan ini membuktikan kalau AI kurang presisi karena tidak memperhitungkan efek komposit dari potongan fee 0.3% dan perubahan slippage secara real-time. Buat gw, ini artinya gw gak boleh males untuk selalu memanggil fungsi `getAmountOut()` langsung ke blockchain lewat Remix atau smart contract sebelum eksekusi transaksi asli, demi menghindari kerugian finansial akibat perkiraan palsu.

### e. Slippage itu apa, kapan bikin rugi?
Slippage adalah perbedaan harga antara harga perkiraan yang kita lihat di layar sebelum swap dengan harga asli yang kita dapatkan pas transaksi selesai dieksekusi di blok blockchain. Slippage ini bakal bikin kita rugi/boncos kalau kita nekat nge-swap token dalam jumlah yang terlalu gede di pool yang likuiditasnya tipis (dangkal), atau saat gas fee lagi melonjak tinggi dan antrean transaksi padat sehingga harga token sudah bergeser jauh sebelum transaksi kita berhasil masuk. Akhirnya, jumlah koin yang kita terima di wallet bakal jauh lebih sedikit dibanding perkiraan awal kita.
