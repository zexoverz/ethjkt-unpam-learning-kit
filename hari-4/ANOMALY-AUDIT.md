# Audit Anomali Aplikasi DEX — Hari 4

Tanggal audit: 11 Juli 2026

## Temuan yang telah diperbaiki

| Temuan | Dampak | Perbaikan |
| --- | --- | --- |
| Fallback fee untuk SimpleAMM lama dihitung 0,35%, padahal contract lama memakai 0,30%. | Preview output dan routing quote dapat lebih kecil dari hasil swap on-chain. | Frontend sekarang memakai 30 bps jika `swapFeeBps()` tidak ada. Contract Dynamic Fee yang baru memakai `swapFeeBps + 5 bps protocol fee`. |
| `parseUnits()` dipanggil sebelum blok `try/catch` pada swap dan add liquidity. | Input angka tidak valid/terlalu banyak desimal dapat menghasilkan error yang tidak tertangani dan membuat UI macet. | Parsing dipindahkan ke dalam `try/catch`; kegagalan sekarang masuk ke Log dan status tombol dipulihkan. |
| Router dapat menemukan multi-hop, tetapi tombol Swap hanya mendukung satu SimpleAMM langsung. | Pengguna dapat mengira transaksi multi-hop akan dieksekusi, padahal transaksi sebenarnya tidak mengikuti rute tersebut. | Tombol sekarang dinonaktifkan untuk rute lebih dari satu hop dan menampilkan `Multi-hop belum tersedia`. Handler juga memiliki guard kedua. |
| Auto-pair liquidity mengubah nilai token ke `Number`. | Nilai token besar dapat kehilangan presisi sebelum dimasukkan kembali ke input. | Pemotongan maksimal enam desimal sekarang dilakukan sebagai string, tanpa konversi `Number`. |

## Temuan dependensi (belum diubah otomatis)

`npm audit --omit=dev --audit-level=high` menemukan **1 high** dan **21 moderate** vulnerability, terutama dependency transitive `ws` dan `uuid` dari WalletConnect/MetaMask melalui wagmi dan RainbowKit.

Perintah otomatis yang tersedia adalah `npm audit fix --force`, tetapi akan menaikkan `wagmi` ke v3 (breaking change). Upgrade tersebut tidak diterapkan otomatis karena dapat merusak integrasi RainbowKit, wagmi hooks, dan flow wallet saat ini. Lakukan upgrade dependency pada branch terpisah, lalu uji koneksi MetaMask, WalletConnect, read contract, approval, dan swap sebelum merge.

## Catatan keamanan contract

`SimpleAMM` adalah contract pembelajaran. Swap belum memiliki parameter `minAmountOut`, sehingga belum memiliki perlindungan slippage on-chain terhadap perubahan harga sebelum transaksi masuk blok. Perbaikan ini memerlukan perubahan ABI, deploy contract baru, dan pembaruan alamat di frontend; tidak dapat diterapkan aman pada contract yang sudah ter-deploy.

## Verifikasi yang dijalankan

```bash
cd hari-4/app
npm run typecheck
```

Hasil: lulus tanpa error TypeScript.
