# Perubahan UI/UX Swappy

Dokumen ini mencatat perubahan tampilan dan pengalaman pengguna pada web app di folder `app/`.

## Tujuan Perubahan

Tujuan utama perubahan ini adalah membuat tampilan web lebih profesional, tetap fun, dan memakai warna dominan pink tanpa mengganggu sistem utama yang sudah berjalan.

Perubahan hanya dilakukan di sisi frontend. Smart contract, ABI, alamat contract, dan logic transaksi tidak diubah.

## Branding

Nama aplikasi diubah dari:

```text
KampusSwap
```

menjadi:

```text
Swappy
```

Perubahan nama diterapkan pada:

- Judul halaman browser di `app/index.html`
- Nama aplikasi wallet/RainbowKit di `app/src/wagmi.ts`
- Header utama di `app/src/App.tsx`
- Label history transaksi dari `via KampusSwap` menjadi `via Swappy`

## Tema Visual

Tema visual diubah menjadi dominan pink dengan gaya glass dashboard.

Perubahan utama:

- Warna utama diganti ke pink (`#ec4899`)
- Warna pendukung memakai pink tua, soft pink, dan sedikit aksen ungu
- Background dibuat lebih modern dengan overlay radial pink
- Panel/card dibuat lebih solid dan rapi
- Border dan shadow disesuaikan agar terlihat lebih premium
- Tombol utama memakai gradient pink
- Connect wallet theme mengikuti warna pink

File utama:

```text
app/src/styles.css
app/src/main.tsx
```

## Perbaikan Layout dan Komponen

Beberapa elemen UI dirapikan agar lebih mudah dibaca:

- Panel swap dibuat lebih kontras
- Input token dibuat lebih jelas
- Token chip dibuat lebih rapi
- Tombol swap dan liquidity dibuat lebih menonjol
- History transaksi dibuat lebih mudah dibaca
- Link dan hover state dibuat lebih konsisten dengan tema pink

Perubahan ini tidak mengubah fungsi:

- `approve`
- `swapAforB`
- `swapBforA`
- `addLiquidity`
- `removeLiquidity`
- pembacaan saldo
- pembacaan reserve

## Fitur UI Tambahan

### 1. Price Rate Preview

Di halaman swap ditambahkan preview harga pool saat ini.

Contoh tampilan:

```text
1 TMPLT ~= 0.92 ETHJKT
```

Nilai ini dihitung dari reserve pool:

```text
rate A to B = reserveB / reserveA
rate B to A = reserveA / reserveB
```

Fitur ini hanya membaca data dari contract dan menghitung di frontend.

### 2. Price Impact

Ditambahkan estimasi price impact berdasarkan jumlah token yang dimasukkan user.

Tujuannya supaya user tahu apakah swap yang dilakukan terlalu besar dibanding isi pool.

Kategori tampilan:

- Low: price impact kecil
- Medium: price impact sedang
- High: price impact tinggi

Jika price impact tinggi, aplikasi menampilkan peringatan:

```text
Price impact tinggi. Coba jumlah swap lebih kecil supaya output lebih efisien.
```

Fitur ini hanya berupa peringatan UI. Transaksi tetap mengikuti logic contract.

### 3. Link AMM ke Etherscan

Di panel informasi kanan ditambahkan tombol:

```text
View AMM on Etherscan
```

Tombol ini membuka halaman contract AMM di Sepolia Etherscan:

```text
https://sepolia.etherscan.io/address/[AMM_ADDRESS]
```

Fitur ini membantu user memverifikasi contract langsung di block explorer.

## File yang Diubah

```text
app/index.html
app/src/App.tsx
app/src/main.tsx
app/src/wagmi.ts
app/src/styles.css
```

## File yang Tidak Diubah

File smart contract tidak diubah:

```text
SimpleAMM.sol
TompelToken.sol
EthjktToken.sol
```

File konfigurasi alamat contract juga tidak diubah:

```text
app/config.ts
```

Artinya alamat AMM, alamat token, RPC, dan WalletConnect Project ID tetap sama.

## Verifikasi

Setelah perubahan, build frontend dijalankan dengan command:

```text
npm.cmd run build
```

Hasil:

```text
Build berhasil
```

Ada warning ukuran bundle besar dari dependency wallet/RainbowKit. Warning ini tidak berasal dari perubahan UI/UX dan tidak menghentikan build.

## Kesimpulan

Swappy sekarang memiliki tampilan yang lebih profesional, dominan pink, dan tetap fun. Fitur tambahan seperti price rate preview, price impact warning, dan link Etherscan membantu user memahami kondisi swap tanpa mengubah logic blockchain yang sudah ada.
