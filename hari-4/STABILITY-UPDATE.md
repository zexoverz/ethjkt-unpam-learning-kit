# Stability Update — Hari 4

## Perbaikan yang diterapkan

- Validasi saldo dilakukan sebelum aplikasi meminta approval atau swap dari wallet. Ini menghindari transaksi yang pasti gagal karena saldo token tidak cukup.
- Add liquidity memeriksa saldo kedua token sebelum memulai approval.
- Remove liquidity memeriksa jumlah share agar tidak melebihi kepemilikan user.
- Seluruh transaksi sekarang memeriksa `receipt.status` setelah konfirmasi blok. History sukses tidak akan dibuat bila transaksi tidak berhasil dieksekusi on-chain.
- Field nominal memakai `type="text"` dengan `inputMode="decimal"`; nilai seperti notasi ilmiah `1e3` tetap ditolak aman oleh `parseUnits` dan dilaporkan ke Log.
- Formatter saldo tidak lagi mengubah `bigint` ke `Number`; tampilan saldo besar tetap presisi.

## Batasan yang tidak boleh disembunyikan

- Swap pada contract yang sudah ter-deploy belum memiliki `minAmountOut`; perlindungan slippage membutuhkan contract baru dan deploy ulang.
- Router multi-hop masih hanya melakukan simulasi. Tombol Swap sengaja dinonaktifkan saat rute membutuhkan lebih dari satu pool.
- Dependency audit memiliki perbaikan yang mengharuskan upgrade breaking ke wagmi v3. Upgrade tersebut perlu branch migrasi dan pengujian wallet lengkap, bukan `npm audit fix --force` langsung.

## Cara tes

1. Jalankan `npm run typecheck` dari `hari-4/app`.
2. Jalankan `npm run dev` dan hubungkan wallet di Sepolia.
3. Masukkan nominal lebih besar dari saldo: aplikasi harus memberi pesan gagal tanpa memunculkan MetaMask.
4. Masukkan nominal valid, lakukan swap/add/remove, lalu pastikan History hanya terisi setelah receipt sukses.
5. Masukkan `1e3` pada field nominal: aplikasi tidak menjalankan transaksi dan menampilkan error pada Log.
