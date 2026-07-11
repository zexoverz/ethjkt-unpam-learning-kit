# Smart Routing / Auto-Router

## Yang ditambahkan

- Utility [src/smartRouter.ts](app/src/smartRouter.ts) dengan fungsi `findBestRoute()`.
- Fungsi menerima `tokenIn`, `tokenOut`, `amountIn`, daftar pool, serta `maxHops` (default tiga hop).
- Router menelusuri semua jalur yang valid tanpa mengunjungi token/pool yang sama dua kali, mensimulasikan quote constant-product setiap hop, lalu memilih `amountOut` terbesar.
- UI Swap sekarang memuat label, misalnya `Routing: FFT > USDC > ETHJKT`. Pada konfigurasi Hari 4 yang hanya memiliki satu pool, rute yang muncul adalah rute langsung.
- Quote frontend kini membaca `swapFeeBps()` jika contract baru sudah dipakai, lalu menambahkan protocol fee 5 bps. Contract lama tetap memakai fallback total fee 35 bps untuk simulasi.

## Menghubungkan pool tambahan nanti

Tambahkan setiap pool ke array `routingPools` di `App.tsx` dengan struktur berikut:

```ts
{
  id: "alamat-pool-unik",
  token0: "alamat-token-0",
  token1: "alamat-token-1",
  reserve0: 1000n,
  reserve1: 1000n,
  feeBps: 35,
}
```

Contoh pool `FFT/USDC` dan `USDC/ETHJKT` akan memungkinkan router menghasilkan `FFT > USDC > ETHJKT` jika output-nya lebih besar daripada pool `FFT/ETHJKT` langsung.

## Batasan penting

Versi ini melakukan **pencarian dan quote rute di frontend**, tetapi tombol Swap saat ini hanya dapat mengeksekusi swap langsung ke `SimpleAMM`. Eksekusi multi-hop membutuhkan Router smart contract atau rangkaian transaksi aman yang menangani approval, slippage, dan atomicity.

## Cara tes

1. Dari folder `hari-4/app`, jalankan `npm run typecheck`.
2. Jalankan `npm run dev`, kemudian buka URL Vite.
3. Masukkan jumlah swap positif; label `Routing:` akan menampilkan pasangan token langsung.
4. Tambahkan pool mock ke `routingPools` sesuai contoh di atas. Gunakan reserve yang membuat jalur perantara lebih menguntungkan.
5. Masukkan ulang jumlah swap dan pastikan label berubah menjadi rute multi-hop dengan penanda `multi-hop simulasi`.
