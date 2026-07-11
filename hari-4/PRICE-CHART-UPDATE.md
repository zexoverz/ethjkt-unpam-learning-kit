# Update Price Chart — Hari 4

## Perubahan

- Menambahkan `recharts` sebagai dependensi aplikasi.
- Menambahkan komponen `src/PriceChart.tsx` di atas kotak Swap.
- Grafik menampilkan pasangan `TOKEN_A / TOKEN_B` serta harga 1 TOKEN_A dalam TOKEN_B.
- Harga acuan berasal dari reserve AMM: `reserveB / reserveA`.
- Karena aplikasi belum memiliki sumber candle/harga historis, grafik mengisi 36 titik data mock dan menambah satu titik setiap 3,5 detik.
- Generator memakai random walk kecil (maksimum sekitar ±0,9% per pembaruan) dan mean reversion ke harga reserve pool, sehingga pergerakannya tidak melonjak liar.
- Tooltip dapat di-hover untuk melihat waktu dan harga setiap titik.

## Catatan penting

Grafik ini adalah **simulasi UI**, bukan data harga historis on-chain dan bukan dasar keputusan finansial. Harga swap yang valid tetap berasal dari `getAmountOut()` di smart contract.

## Cara menjalankan dan menguji

1. Buka terminal pada folder `hari-4/app`.
2. Jalankan `npm install` bila dependensi belum terpasang.
3. Jalankan `npm run dev`.
4. Buka alamat lokal yang ditampilkan Vite (biasanya `http://localhost:5173`).
5. Di bagian atas panel Swap, pastikan kartu **Market trend · simulasi** tampil.
6. Tunggu minimal 3,5 detik; garis harus bergerak dan persentase perubahan ikut diperbarui.
7. Arahkan mouse ke garis grafik untuk memeriksa tooltip harga dan waktu.
8. Jika pool sudah berisi likuiditas, bandingkan harga label dengan `reserveB / reserveA` di panel pool. Saat reserve berubah setelah swap, grafik membuat simulasi baru di sekitar harga acuan terbaru.
9. Jalankan `npm run typecheck` untuk memeriksa TypeScript.
