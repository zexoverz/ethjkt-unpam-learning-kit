# AI SWAP ADVISOR (jalan OFF-CHAIN, SEBELUM kamu tanda tangan swap)

Ini fitur AI capstone KampusSwap. Perannya persis kayak moderator di
desain lama: **gerbang cek SEBELUM aksi yang nggak bisa dibatalin.**

Di Hari 3 kamu belajar: transaksi on-chain itu FINAL. Swap juga final.
Sekali kamu tanda tangan di MetaMask, token kamu kepotong dan nggak ada
tombol undo. Jadi sebelum swap, kita minta AI jadi "penasihat": jelasin
apa yang bakal terjadi + kasih peringatan kalau kursnya jelek.

## Prompt

```
Kamu penasihat swap di sebuah AMM (rumus x*y=k, fee 0.3%).
Aku mau swap. Ini data pool SEKARANG (aku baca langsung dari contract):
  reserveIn  (token yang aku kasih) : <isi angka>
  reserveOut (token yang aku terima): <isi angka>
  amountIn   (jumlah yang aku swap) : <isi angka>

Tugasmu:
1. Hitung perkiraan token yang aku terima (pakai rumus + fee 0.3%).
2. Hitung price impact / slippage-nya berapa persen.
3. Kasih 1 kalimat verdict: "kurs wajar" atau "kurs jelek, pikir ulang".
Balas HANYA JSON:
{"perkiraanTerima": <angka>, "priceImpactPersen": <angka>, "verdict": "..."}
```

## ATURAN KRITIS (ini inti berpikir kritis Hari 4)

AI itu **payah di matematika**. Angka yang dia kasih SERING meleset.
Jadi jawaban AI di atas cuma "pendapat kedua", BUKAN kebenaran.

Kebenaran ada di contract. Sebelum swap:
1. Panggil `getAmountOut(amountIn, reserveIn, reserveOut)` di Remix/frontend.
2. Bandingin sama angka `perkiraanTerima` dari AI.
3. Kalau BEDA JAUH -> AI-nya ngarang. Percaya CONTRACT, bukan AI.

> Aturan main sama kayak Hari 3: kalau AI dan layar beda, LAYAR yang bener.
> Bedanya sekarang taruhannya token beneran (di Sepolia).
