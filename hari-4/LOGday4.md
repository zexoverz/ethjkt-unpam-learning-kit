# LOG Day 4 - Babak 2

Nama: Faqih
Token: Tompel Token (TMPLT)
Pasar: KampusSwap / SimpleAMM

## Checkpoint 6 - Jelasin Contract Sendiri

### TokenKu / TompelToken

TompelToken adalah koin ERC20 buatan saya. Contract ini menyimpan data penting seperti nama token, simbol token, total supply, dan saldo tiap alamat wallet.

Fungsi `transfer` dipakai untuk mengirim token dari wallet saya ke wallet orang lain.

Fungsi `approve` dipakai untuk memberi izin ke alamat lain, biasanya contract, supaya boleh memakai token saya dalam jumlah tertentu. Contohnya sebelum swap atau add liquidity, saya harus approve dulu ke contract SimpleAMM. Tanpa approve, SimpleAMM tidak bisa menarik token dari wallet saya.

Fungsi `mint` di TompelToken dipakai untuk mencetak token baru. Di latihan ini fungsi mint dibuat terbuka supaya mudah mencoba token. Tapi kalau di project asli, mint terbuka seperti ini bahaya karena siapa pun bisa mencetak token sebanyak-banyaknya.

### SimpleAMM

SimpleAMM adalah pasar otomatis untuk menukar 2 token. Di sini token A adalah TompelToken, dan token B adalah ETHJKT.

Pool adalah tempat penyimpanan 2 token di dalam contract. Misalnya pool berisi 1000 TMPLT dan 1000 ETHJKT. Orang yang mau swap akan menukar tokennya lewat isi pool ini.

`addLiquidity` dipakai untuk mengisi pool dengan 2 token. Saat saya menambahkan 1000 TMPLT dan 1000 ETHJKT, saya sedang membuat pasar awal dengan harga 1 TMPLT = 1 ETHJKT.

`swapAforB` dipakai untuk menukar token A menjadi token B. Dalam kasus saya, ini berarti menukar TMPLT menjadi ETHJKT.

`swapBforA` dipakai untuk menukar token B menjadi token A. Dalam kasus saya, ini berarti menukar ETHJKT menjadi TMPLT.

Harga di SimpleAMM tidak ditentukan admin. Harga berubah otomatis dari perbandingan jumlah token di pool. Rumus utamanya adalah:

```text
x * y = k
```

`x` adalah jumlah token A di pool, `y` adalah jumlah token B di pool, dan `k` adalah hasil kalinya.

### Baris kode yang sekarang saya pahami

Baris kode:

```solidity
uint256 amountInWithFee = amountIn * FEE_NUM;
```

Dulu saya cuma melihat ini sebagai hitungan biasa. Sekarang saya paham bahwa baris ini memasukkan fee 0.3% ke rumus swap. Karena `FEE_NUM = 997` dan `FEE_DEN = 1000`, berarti dari 1000 bagian token yang masuk, hanya 997 bagian yang dihitung untuk output swap. Sisa 3 bagian menjadi fee yang tertinggal di pool.

## Checkpoint 7 - Buktiin x*y=k Dengan Angka Sendiri

Data diambil dari contract SimpleAMM lewat Remix.

### Sebelum Swap

```text
reserveA sebelum = [isi dari reserveA sebelum swap]
reserveB sebelum = [isi dari reserveB sebelum swap]

k_sebelum = reserveA sebelum * reserveB sebelum
k_sebelum = [hasil perkalian]
```

### Swap Kecil

```text
Fungsi yang dipakai = [swapAforB / swapBforA]
amountIn = [jumlah token yang di-swap]
```

### Sesudah Swap

```text
reserveA sesudah = [isi dari reserveA sesudah swap]
reserveB sesudah = [isi dari reserveB sesudah swap]

k_sesudah = reserveA sesudah * reserveB sesudah
k_sesudah = [hasil perkalian]
```

### Kesimpulan

Setelah swap, nilai `k_sesudah` harus lebih besar atau sama dengan `k_sebelum`.

Kalau `k_sesudah` naik sedikit, itu karena ada fee 0.3% yang tertinggal di pool. Jadi rumus x*y=k tidak benar-benar tetap persis setelah fee, melainkan naik sedikit karena pool mendapatkan tambahan nilai dari fee swap.

Contoh jika pool awal:

```text
reserveA = 1000000000000000000000
reserveB = 1000000000000000000000
```

Maka:

```text
k = 1000000000000000000000 * 1000000000000000000000
```

Setelah swap, reserve token yang masuk akan bertambah, reserve token yang keluar akan berkurang, dan fee membuat hasil kali totalnya naik sedikit.

## Checkpoint 8 - Uji AI Swap Advisor vs Kenyataan

Data yang perlu saya ambil dari SimpleAMM:

```text
reserveIn = [isi reserve token yang masuk]
reserveOut = [isi reserve token yang keluar]
amountIn = [jumlah token yang mau di-swap]
```

Prompt ke AI:

```text
Saya mau swap di AMM x*y=k dengan fee 0.3%.
reserveIn = [reserveIn]
reserveOut = [reserveOut]
amountIn = [amountIn]

Berikan perkiraan amountOut dan price impact dalam format JSON.
```

Jawaban AI:

```json
{
  "estimatedAmountOut": "[isi jawaban AI]",
  "priceImpact": "[isi jawaban AI]"
}
```

Hasil dari contract lewat `getAmountOut(amountIn, reserveIn, reserveOut)`:

```text
getAmountOut = [isi hasil dari Remix]
```

Perbandingan:

```text
angka AI = [isi angka AI]
angka contract = [isi angka contract]
selisih = [angka AI - angka contract]
```

Kesimpulan saya:

AI bisa membantu menghitung dan menjelaskan, tapi angka final harus dicek ke contract. Untuk transaksi blockchain, yang benar adalah hasil dari contract, bukan perkiraan AI. Kalau AI salah rumus, salah urutan reserve, atau salah desimal, hasilnya bisa meleset dan transaksi tetap final kalau sudah ditandatangani.

## Checkpoint 9 - Bonus AI Market Vibe

Event yang perlu diambil dari Etherscan:

```text
Swapped event 1 = [isi dari tab Events]
Swapped event 2 = [isi dari tab Events]
Swapped event 3 = [isi dari tab Events]
```

Ringkasan market vibe:

Pasar Tompel Token mulai aktif karena sudah ada swap yang masuk ke pool. Pergerakan swap menunjukkan harga berubah mengikuti isi reserve, bukan karena diatur manual. Ini hanya ringkasan hiburan dari aktivitas contract, bukan saran finansial.

Disclaimer:

```text
Ini hanya latihan dan hiburan, bukan saran finansial.
```
