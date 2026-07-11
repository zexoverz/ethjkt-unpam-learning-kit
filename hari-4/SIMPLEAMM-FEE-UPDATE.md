# SimpleAMM: Dynamic Fee dan Protocol Fee

## Fitur baru

- `SimpleAMM` sekarang mewarisi OpenZeppelin `Ownable`. Owner awal adalah wallet yang melakukan deploy.
- `swapFeeBps` adalah fee untuk Liquidity Provider (LP), dengan nilai awal `30` bps = **0,30%**.
- Owner dapat mengubah fee LP melalui `setSwapFee(uint256 newSwapFeeBps)`.
- Batas fee LP adalah `1_000` bps = 10%, untuk mencegah konfigurasi yang tidak wajar.
- `PROTOCOL_FEE_BPS` bernilai tetap `5` bps = **0,05%** dari setiap input swap.
- Protocol fee token A dan B dicatat terpisah pada `protocolFeesA` dan `protocolFeesB`.
- Owner dapat menarik seluruh protocol fee dengan `withdrawProtocolFee()`.

## Cara kerja total fee

Total fee yang memengaruhi quote swap adalah:

```text
total fee = swapFeeBps + PROTOCOL_FEE_BPS
```

Dengan konfigurasi awal, total fee adalah `30 + 5 = 35` bps, atau **0,35%**.

- Bagian LP (`0,30%`) tetap di dalam reserve pool dan memberi nilai tambah untuk LP.
- Bagian protocol (`0,05%`) tidak dihitung sebagai reserve; nilainya ditampung pada variabel protocol fee hingga owner menariknya.

`getAmountOut()` diubah dari `pure` menjadi `view`, karena quote sekarang membaca `swapFeeBps` yang bisa berubah.

## Cara tes di Remix (Sepolia)

1. Compile `SimpleAMM.sol` dengan compiler Solidity `0.8.20` atau lebih baru.
2. Deploy seperti sebelumnya dengan dua alamat token. Deployer otomatis menjadi owner.
3. Panggil `owner()` dan pastikan hasilnya adalah alamat deployer.
4. Panggil `swapFeeBps()` dan pastikan nilai awalnya `30`.
5. Sebagai owner, panggil `setSwapFee(50)`; lalu cek `swapFeeBps()` menjadi `50`.
6. Dari wallet selain owner, coba `setSwapFee(50)` atau `withdrawProtocolFee()`; transaksi harus revert karena `onlyOwner`.
7. Tambahkan likuiditas, lakukan `swapAforB()` atau `swapBforA()`, lalu cek `protocolFeesA()` atau `protocolFeesB()` bertambah.
8. Sebagai owner, panggil `withdrawProtocolFee()`, lalu cek kedua variabel protocol fee kembali menjadi `0` dan saldo token owner bertambah.

## Catatan kompatibilitas OpenZeppelin

Kode ini menggunakan OpenZeppelin Contracts v5, yang membutuhkan `Ownable(msg.sender)` pada constructor. Jika environment masih memakai OpenZeppelin v4, ubah constructor menjadi tanpa `Ownable(msg.sender)`.
