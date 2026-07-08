# 📖 LEARN.md — Penjelasan Baris per Baris Kode Solidity (Hari 3)

> Dokumen ini menjelaskan **setiap baris** dari 3 file Solidity di folder `hari-3`:
> 1. **TokenKu.sol** — koin pribadi kamu
> 2. **EthjktToken.sol** — mata uang kampus bersama
> 3. **SimpleAMM.sol** — mesin tukar (pasar otomatis)
>
> Ditulis dengan bahasa yang gampang dimengerti, khusus untuk yang baru pertama kali lihat kode Solidity.

---

## 📑 Daftar Isi

- [1. TokenKu.sol — Koin Pribadi Kamu](#1-tokenkusol--koin-pribadi-kamu)
- [2. EthjktToken.sol — Mata Uang Kampus](#2-ethjjttokensol--mata-uang-kampus)
- [3. SimpleAMM.sol — Mesin Tukar / Pasar Otomatis](#3-simpleammsol--mesin-tukar--pasar-otomatis)
- [4. Rangkuman Konsep Kunci](#4-rangkuman-konsep-kunci)

---

## 1. TokenKu.sol — Koin Pribadi Kamu

File: [TokenKu.sol](file:///c:/Users/USER/Documents/Folder%20Kuliah/ShortCourse/Semester6/Day1/ethjkt-unpam-learning-kit/hari-3/TokenKu.sol)

### Baris 1: Lisensi

```solidity
// SPDX-License-Identifier: MIT
```

**Artinya:** Kode ini open-source dengan lisensi MIT. Bebas dipakai, diubah, dan disebar siapa pun. Tanpa baris ini, compiler Solidity akan **kasih warning** (peringatan).

**Analogi:** Kayak label "boleh dipakai gratis" di atas produk.

---

### Baris 2: Versi Compiler

```solidity
pragma solidity ^0.8.20;
```

**Artinya:** Kode ini ditulis untuk Solidity versi **0.8.20 ke atas** (tanda `^` artinya "minimum versi ini, tapi masih satu major version"). Compiler yang lebih tua nggak akan bisa compile kode ini.

**Kenapa penting?** Tiap versi Solidity punya fitur & aturan keamanan yang beda. Versi 0.8.x ke atas sudah **otomatis cek overflow** (angka kebabasan), jadi lebih aman.

**Analogi:** Kayak "butuh Android 13 ke atas buat jalanin app ini."

---

### Baris 3-34: Komentar Penjelasan

```solidity
// ============================================================
// TOKEN-KU - ERC20 PERTAMA KAMU (Hari 3)  ->  ini "koin" milikmu
// ... (komentar panjang)
// ============================================================
```

**Artinya:** Ini semua **komentar** (diawali `//`). Kompiler **nggak baca** ini — cuma buat manusia. Komentar ini jelasin apa itu ERC20, kenapa pakai OpenZeppelin, dan cara pakai di Remix.

**Yang penting dipahami dari komentar ini:**
- **ERC20** = standar token Ethereum. Kayak "aturan main" buat bikin koin. Karena pakai standar yang sama, semua wallet (MetaMask, dll) otomatis ngerti koin kamu.
- **OpenZeppelin** = library (kumpulan kode siap pakai) yang udah diaudit keamanannya ribuan proyek. Kita nggak nulis ERC20 dari nol — cukup "warisi" kode yang udah teruji.

---

### Baris 36: Import Library

```solidity
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
```

**Artinya:** Ambil kode `ERC20` dari library OpenZeppelin supaya bisa dipakai di file ini.

**Analogi:** Kayak `import` di Python atau `<script src="...">` di HTML. Kita "pinjam" kode yang udah ada biar nggak nulis ulang.

**Detail teknis:**
- `{ERC20}` — kita cuma ambil bagian `ERC20`-nya (bukan seluruh library)
- `@openzeppelin/contracts/...` — path ke file ERC20 di library OpenZeppelin. Saat compile di Remix, ini otomatis di-download.

---

### Baris 38: Deklarasi Contract

```solidity
contract TokenKu is ERC20 {
```

**Artinya:** Bikin contract baru bernama `TokenKu` yang **mewarisi** (`is`) semua fungsi dari `ERC20`.

**Analogi:** `is` itu kayak "anak dari". `TokenKu` adalah "anak" dari `ERC20` — dia dapet semua fungsi ERC20 secara gratis (transfer, balanceOf, approve, dll). Kita cukup nambahin yang khusus buat koin kita.

**Kenapa "is" bukan "extends"?** Solidity pakai kata `is` (dari "is-a"). `TokenKu` **is-a** ERC20.

---

### Baris 39-42: Constructor

```solidity
    constructor()
        // >>> GANTI DI SINI <<<  ("Nama Panjang Token", "SIMBOL")
        // contoh: ERC20("Mie Ayam Coin", "MIEAYAM")
        ERC20("Gare Coin", "GRC")
    {
```

**Artinya:** `constructor` = fungsi yang jalan **SATU KALI** saat contract pertama kali di-deploy (dipasang ke blockchain).

**Detail per bagian:**

| Bagian | Arti |
|---|---|
| `constructor()` | Fungsi spesial yang jalan sekali saat deploy. Tidak ada parameter (kosong `()`). |
| `ERC20("Gare Coin", "GRC")` | Karena kita mewarisi ERC20, kita harus panggil constructor ERC20-nya juga. Kirim 2 hal: **nama panjang** dan **simbol/singkatan** koin. |
| `"Gare Coin"` | Nama panjang koin. Bebas diganti. |
| `"GRC"` | Simbol/singkatan (biasanya 3-5 huruf). Bebas diganti. |

**Analogi:** Kayak saat buka rekening bank baru — kamu isi nama rekening dan singkatannya sekali di awal.

---

### Baris 44-47: Cetak Token Awal (Mint)

```solidity
        // cetak 1.000.000 token ke kamu (deployer). "10 ** decimals()"
        // karena token pakai 18 angka di belakang koma, sama kayak ETH.
        _mint(msg.sender, 1_000_000 * 10 ** decimals());
```

**Artinya:** Cetak **1.000.000 token** dan kasih langsung ke orang yang deploy contract ini.

**Detail per bagian:**

| Bagian | Arti |
|---|---|
| `_mint(...)` | Fungsi internal dari ERC20 buat **mencetak** (membuat) token baru. Garis bawah `_` di depan artinya "internal" — cuma bisa dipanggil dari dalam contract, bukan dari luar. |
| `msg.sender` | Alamat wallet orang yang lagi deploy contract ini. **Ini kamu.** `msg` = pesan/transaksi yang lagi dikirim. `sender` = pengirim. Jadi token masuk ke dompetmu. |
| `1_000_000` | Angka 1 juta. Garis bawah `_` cuma biar gampang dibaca manusia (kayak koma pemisah ribuan). Sama aja kayak `1000000`. |
| `*` | Kali (perkalian). |
| `10 ** decimals()` | `**` artinya "pangkat". `decimals()` = 18 (default ERC20). Jadi `10 ** 18` = 1 diikuti 18 nol. |
| `1_000_000 * 10 ** 18` | Total = 1 juta × 10^18 = angka besar banget. Ini karena token pakai **18 desimal** (sama kayak ETH). "1 token" di blockchain disimpan sebagai `1000000000000000000` (1 + 18 nol). |

**Kenapa 18 desimal?** Supaya bisa kirim jumlah kecil (misal 0.001 token). Kayak rupiah pakai 2 angka di belakang koma (Rp 1.500,50), token pakai 18.

**Analogi:** Kayak saat cetak uang baru — pemerintah cetak 1 juta lembar dan langsung masuk ke kas negara (dalam hal ini, dompetmu).

---

### Baris 49-57: Faucet / Mint Terbuka

```solidity
    // FAUCET TERBUKA: siapa pun boleh cetak token buat latihan.
    // >> SENGAJA nggak aman <<. Di dunia nyata, cetak token WAJIB
    // dibatasi (cuma owner). Ini teachable moment: kalau AI ngasih kamu
    // token dengan mint terbuka kayak gini buat proyek beneran, itu BUG
    // serius. Untuk kelas, ini bikin gampang bagi-bagi token ke temen
    // biar bisa nyobain swap bareng.
    function mint(uint256 jumlah) external {
        _mint(msg.sender, jumlah);
    }
```

**Artinya:** Bikin fungsi `mint` yang **siapa pun** bisa panggil buat cetak token tambahan.

**Detail per bagian:**

| Bagian | Arti |
|---|---|
| `function mint(...)` | Bikin fungsi baru bernama `mint` (cetak). Fungsi ini BUKAN dari ERC20 standar — ini kita tambah sendiri. |
| `uint256 jumlah` | Parameter input: berapa token mau dicetak. `uint256` = angka bulat positif (unsigned integer, 256-bit). Maksimal angkanya gede banget. |
| `external` | Fungsi ini bisa dipanggil dari **luar** contract (dari wallet/contract lain). Kalau `internal` cuma bisa dari dalam. |
| `_mint(msg.sender, jumlah)` | Cetak sejumlah `jumlah` token ke `msg.sender` (orang yang manggil fungsi ini). |
| `{ ... }` | Isi fungsi. Cukup 1 baris: cetak token ke pemanggil. |

**⚠️ Catatan keamanan (penting!):** Fungsi ini **SENGAJA nggak aman**. Di dunia nyata, siapa pun bisa cetak token sebanyak-banyaknya = nilai token jadi nol (inflasi tak terbatas). Ini cuma buat kelas supaya gampang. Di proyek beneran, `mint` harus dibatasi cuma owner yang bisa (pakai `onlyOwner` modifier dari OpenZeppelin `Ownable`).

**Analogi:** Kayak keran air umum di taman — siapa pun boleh ambil air gratis. Praktis buat kelas, tapi kalau ini bank beneran, bebas cetak uang = bencana.

---

### Baris 58: Penutup

```solidity
}
```

**Artinya:** Kurung kurawal tutup — menutup contract `TokenKu`. Semua kode contract ada di dalam `{ ... }` ini.

---

## 2. EthjktToken.sol — Mata Uang Kampus

File: [EthjktToken.sol](file:///c:/Users/USER/Documents/Folder%20Kuliah/ShortCourse/Semester6/Day1/ethjkt-unpam-learning-kit/hari-3/EthjktToken.sol)

Contract ini **struktur dan logikanya IDENTIK** dengan `TokenKu.sol`. Bedanya cuma **nama & simbol token**. Jadi kita bedah bagian yang beda aja.

---

### Baris 1-2: Lisensi & Versi (sama kayak TokenKu)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
```

Sama persis kayak TokenKu. Lihat penjelasan di atas.

---

### Baris 4-20: Komentar Penjelasan

```solidity
// ETHJKT TOKEN - "MATA UANG KAMPUS" BERSAMA (Hari 3)
// ...
```

Komentar ini ngejelasin kenapa butuh token kedua: **swap = tukeran**, jadi butuh 2 koin. ETHJKT = "rupiah"-nya kampus. Semua koin pribadi (TokenKu) diadu lawan ETHJKT.

**Bedanya sama TokenKu:**
- `TokenKu` = koin pribadi tiap murid (punyamu sendiri)
- `EthjktToken` = token bersama satu kelas (deploy-nya pengajar, murid cukup pakai alamatnya)

---

### Baris 22: Import (sama)

```solidity
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
```

Sama kayak TokenKu — warisi ERC20 dari OpenZeppelin.

---

### Baris 24-27: Constructor

```solidity
contract EthjktToken is ERC20 {
    constructor() ERC20("Ethjkt Token", "ETHJKT") {
        _mint(msg.sender, 1_000_000 * 10 ** decimals());
    }
```

**Bedanya sama TokenKu:**

| Bagian | TokenKu | EthjktToken |
|---|---|---|
| Nama contract | `TokenKu` | `EthjktToken` |
| Nama token | `"Gare Coin"` | `"Ethjkt Token"` |
| Simbol | `"GRC"` | `"ETHJKT"` |

Selebihnya identik: cetak 1 juta token ke deployer (pengajar).

> **Catatan:** Di TokenKu, constructor ditulis multi-baris dengan komentar `>>> GANTI DI SINI <<<`. Di EthjktToken, ditulis satu baris karena nggak perlu diganti murid (pengajar yang deploy).

---

### Baris 29-33: Faucet Mint (sama)

```solidity
    function mint(uint256 jumlah) external {
        _mint(msg.sender, jumlah);
    }
}
```

Identik dengan TokenKu. Faucet terbuka — siapa pun bisa cetak ETHJKT buat latihan.

---

## 3. SimpleAMM.sol — Mesin Tukar / Pasar Otomatis

File: [SimpleAMM.sol](file:///c:/Users/USER/Documents/Folder%20Kuliah/ShortCourse/Semester6/Day1/ethjkt-unpam-learning-kit/hari-3/SimpleAMM.sol)

Ini contract yang **paling kompleks**. Mari bedah pelan-pelan.

---

### Baris 1-2: Lisensi & Versi

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
```

Sama kayak dua contract di atas.

---

### Baris 4-40: Komentar Penjelasan Panjang

Komentar ini ngejelasin konsep **AMM (Automated Market Maker)**:

- **AMM** = mesin tukar otomatis. Nggak ada penjual-pembeli yang harus ketemu. Cuma ada **kolam (pool)** berisi 2 token + **rumus** yang nentuin harga.
- **Rumus ajaib: `x * y = k`** — hasil kali jumlah kedua token di pool harus tetap setelah tiap swap. Kalau token B berkurang (diambil), harganya naik (jadi langka).
- **Slippage** = makin banyak kamu tuker sekaligus, makin jelek kursnya. Nggak ada admin yang set harga — semuanya matematika.
- **Liquidity Provider (LP)** = orang yang nyetor token ke pool. Dapet "shares" (bukti kepemilikan). Tiap swap kena fee 0.3% yang numpuk di pool → LP untung.

---

### Baris 42: Import

```solidity
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
```

**Artinya:** Import `IERC20` — ini **interface** (kerangka/daftar fungsi) untuk ERC20.

**Bedanya sama import di TokenKu:**
- TokenKu import `ERC20` (implementasi lengkap) → karena mau **warisi** semuanya
- SimpleAMM import `IERC20` (cuma daftar nama fungsi, tanpa isi) → karena cuma mau **pakai** token, bukan bikin token baru

**Analogi:**
- `ERC20` = blueprint lengkap rumah (pakai buat bangun rumah baru)
- `IERC20` = daftar fasilitas rumah (pintu, jendela, kamar — tahu ada, tapi nggak peduli cara bikinnya)

---

### Baris 44: Deklarasi Contract

```solidity
contract SimpleAMM {
```

**Artinya:** Bikin contract baru bernama `SimpleAMM`. **Tidak ada `is ERC20`** — contract ini BUKAN token, dia **mesin** yang ngatur tukar token.

---

### Baris 45-46: Variabel Token

```solidity
    IERC20 public tokenA; // TokenKu (koin kamu)
    IERC20 public tokenB; // ETHJKT (mata uang kampus)
```

**Artinya:** Simpan alamat 2 token yang akan ditukar di pool ini.

**Detail per bagian:**

| Bagian | Arti |
|---|---|
| `IERC20` | Tipe data: alamat token yang punya fungsi ERC20 (transfer, balanceOf, dll). |
| `public` | Bisa diakses dari luar (otomatis bikin fungsi getter — bisa "baca" nilai variabel ini dari Remix/wallet). |
| `tokenA` / `tokenB` | Nama variabel. `tokenA` = koin kamu, `tokenB` = ETHJKT. |
| `// ...` | Komentar penjelas. |

**Analogi:** Kayak mesin penukar uang di bandara — dia catat "uang apa yang bisa ditukar di sini" (misal: USD dan EUR).

---

### Baris 48-50: Variabel Reserve

```solidity
    uint256 public reserveA;
    uint256 public reserveB;
```

**Artinya:** Catatan berapa token A dan token B yang **ada di pool** sekarang.

**Kenapa perlu dicatat?** Karena rumus `x * y = k` butuh tahu nilai `x` (reserveA) dan `y` (reserveB) setiap saat. Tiap swap mengubah reserve.

**Analogi:** Kayak layar di mesin penukar uang yang nunjukin "stok USD: 500, stok EUR: 450".

---

### Baris 52-54: Variabel Shares

```solidity
    uint256 public totalShares;
    mapping(address => uint256) public shares;
```

**Artinya:** Sistem "saham" untuk Liquidity Provider (LP).

**Detail per bagian:**

| Bagian | Arti |
|---|---|
| `totalShares` | Total semua saham yang beredar di pool ini. |
| `mapping(address => uint256)` | Kayak "buku catatan" — tiap alamat (orang) punya jumlah saham masing-masing. `address` = key (alamat wallet), `uint256` = value (jumlah saham). |
| `shares` | Nama mapping ini. Bisa cek "berapa saham si alamat X punya" lewat `shares(0x...)`. |

**Analogi:** Kayak buku tamu koperasi — tiap anggota punya catatan berapa saham mereka punya. `totalShares` = total semua saham semua anggota.

---

### Baris 56-58: Konstanta Fee

```solidity
    uint256 public constant FEE_NUM = 997;
    uint256 public constant FEE_DEN = 1000;
```

**Artinya:** Fee 0.3% per swap, disimpan sebagai pecahan 997/1000.

**Detail per bagian:**

| Bagian | Arti |
|---|---|
| `uint256` | Tipe data angka bulat positif. |
| `public` | Bisa dibaca dari luar. |
| `constant` | Nilainya **tetap selamanya** — nggak bisa diubah setelah deploy. Hemat gas karena nilainya langsung disisipkan ke kode (nggak baca dari storage). |
| `FEE_NUM = 997` | Pembilang: dari tiap 1000 token masuk, 997 dihitung buat itung harga. |
| `FEE_DEN = 1000` | Penyebut. |
| `997/1000 = 0.997` | Artinya yang dihitung 99.7% → 0.3% sisanya jadi fee buat LP. |

**Kenapa nggak tulis `0.003` langsung?** Karena Solidity nggak support angka desimal (titik). Semua harus angka bulat. Jadi pakai pecahan `997/1000`.

**Analogi:** Tiap tukar uang di money changer kena biaya 0.3%. Dari Rp 100.000 yang ditukar, Rp 300 jadi fee, Rp 99.700 yang benar-benar ditukar.

---

### Baris 60-62: Events

```solidity
    event LiquidityAdded(address indexed lp, uint256 amountA, uint256 amountB, uint256 sharesMinted);
    event LiquidityRemoved(address indexed lp, uint256 amountA, uint256 amountB, uint256 sharesBurned);
    event Swapped(address indexed user, address tokenIn, uint256 amountIn, uint256 amountOut);
```

**Artinya:** Deklarasi 3 "event" — kayak **sirene/notifikasi** yang bunyi saat sesuatu terjadi.

**Detail per event:**

| Event | Kapan dipicu | Data yang disimpan |
|---|---|---|
| `LiquidityAdded` | Saat seseorang nyetor token ke pool | Siapa (`lp`), berapa token A, berapa token B, berapa shares dapet |
| `LiquidityRemoved` | Saat seseorang tarik token dari pool | Siapa (`lp`), berapa token A keluar, berapa token B keluar, berapa shares dibakar |
| `Swapped` | Saat seseorang tukar token | Siapa (`user`), token apa yang masuk, berapa masuk, berapa keluar |

**Kenapa pakai `indexed`?** Supaya bisa di-filter/search di frontend. Misal: "tampilkan semua swap oleh alamat 0xABC..." — `indexed` bikin query ini murah dan cepat.

**Analogi:** Kayak notifikasi push di HP — "Anda menerima Rp 500.000 dari Budi." Frontend (app/web) bisa "dengar" event ini dan update tampilan otomatis.

---

### Baris 64-67: Constructor

```solidity
    constructor(address _tokenA, address _tokenB) {
        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);
    }
```

**Artinya:** Saat deploy, harus kasih 2 alamat token. Contract ini akan catat dan siap dipakai.

**Detail per bagian:**

| Bagian | Arti |
|---|---|
| `constructor(address _tokenA, address _tokenB)` | Saat deploy, harus isi 2 alamat: token A (koin kamu) dan token B (ETHJKT). |
| `tokenA = IERC20(_tokenA)` | Simpan alamat token A sebagai objek `IERC20` supaya bisa panggil fungsi ERC20 (transfer, dll). |
| `tokenB = IERC20(_tokenB)` | Sama untuk token B. |

**Analogi:** Kayak daftar di mesin penukar uang — saat pasang mesin, kasih tahu "mesin ini tukar USD dan EUR."

---

### Baris 73-100: Fungsi addLiquidity (Nyetor Token ke Pool)

```solidity
    function addLiquidity(uint256 amountA, uint256 amountB) external returns (uint256 minted) {
```

**Artinya:** Fungsi buat nyetor token A & B ke pool. Yang nyetor dapet shares.

| Bagian | Arti |
|---|---|
| `function addLiquidity(...)` | Nama fungsi. |
| `uint256 amountA, uint256 amountB` | 2 parameter: berapa token A dan B mau disetor. |
| `external` | Bisa dipanggil dari luar (dari wallet). |
| `returns (uint256 minted)` | Balikan: berapa shares yang dicetak untuk si penyetor. |

---

```solidity
        require(amountA > 0 && amountB > 0, "jumlah nol");
```

**Artinya:** Cek bahwa jumlah token yang disetor **bukan nol**. Kalau nol → gagal, keluar pesan error "jumlah nol".

| Bagian | Arti |
|---|---|
| `require(...)` | Fungsi bawaan Solidity buat **validasi**. Kalau kondisinya false → transaksi **gagal (revert)**, semua perubahan dibatalkan. |
| `amountA > 0 && amountB > 0` | Kedua jumlah harus lebih besar dari 0. `&&` = "DAN" (keduanya harus true). |
| `"jumlah nol"` | Pesan error yang muncul kalau gagal. |

**Analogi:** Kayak satpam di pintu masuk — "mau masuk?最低 harus bawa sesuatu, nggak boleh kosong."

---

```solidity
        tokenA.transferFrom(msg.sender, address(this), amountA);
        tokenB.transferFrom(msg.sender, address(this), amountB);
```

**Artinya:** Tarik token dari dompet penyetor ke contract (pool) ini.

| Bagian | Arti |
|---|---|
| `tokenA.transferFrom(...)` | Panggil fungsi `transferFrom` di token A (fungsi ERC20 standar). |
| `msg.sender` | Dari siapa: orang yang manggil fungsi ini (penyetor). |
| `address(this)` | Ke mana: alamat contract ini sendiri (`this` = contract sendiri, `address()` = ubah ke bentuk alamat). |
| `amountA` | Berapa: sesuai parameter. |

**⚠️ Penting:** `transferFrom` butuh **approve** dulu! Penyetor harus kasih izin ke contract AMM buat narik token-nya. Kalau belum approve → gagal "insufficient allowance." Itu sebabnya README selalu bilang "approve dulu sebelum addLiquidity."

**Analogi:** Kayak transfer uang dari rekening A ke rekening B — bank butuh otorisasi (tanda tangan) sebelum narik uang dari rekening A.

---

```solidity
        if (totalShares == 0) {
            minted = _sqrt(amountA * amountB);
```

**Artinya:** Kalau ini **LP pertama** (pool masih kosong), shares = akar dari (A × B).

| Bagian | Arti |
|---|---|
| `if (totalShares == 0)` | Cek apakah belum ada saham sama sekali = pool masih kosong = ini orang pertama. |
| `_sqrt(...)` | Fungsi akar (sqrt). Didefinisikan di baris 176. |
| `amountA * amountB` | Hasil kali jumlah kedua token. |

**Kenapa akar?** Supaya shares proporsional terhadap "luas" pool (geometric mean). Kalau A=1000 dan B=1000, shares = √(1000×1000) = √1.000.000 = 1000. Angka yang bagus dan rapi.

**Analogi:** Orang pertama yang buka koperasi bebas tentukan rasio modal awal. Shares-nya dihitung dari total modalnya.

---

```solidity
        } else {
            minted = _min(
                (amountA * totalShares) / reserveA,
                (amountB * totalShares) / reserveB
            );
        }
```

**Artinya:** Kalau **bukan LP pertama**, shares dihitung proporsional — ambil yang paling kecil supaya nggak bisa curang.

| Bagian | Arti |
|---|---|
| `(amountA * totalShares) / reserveA` | Rasio token A yang disetor terhadap pool = seberapa persen pool nambah. Dikali totalShares = berapa shares yang "seharusnya" dapet berdasarkan token A. |
| `(amountB * totalShares) / reserveB` | Sama, berdasarkan token B. |
| `_min(...)` | Ambil yang lebih kecil. Kenapa? Supaya nggak ada yang curang: kalau someone setorkan 1 token A + 1 juta token B (rasio timpang), dia cuma dapet shares berdasarkan yang paling sedikit kontribusinya. |

**Analogi:** Kalau koperasi udah ada modal Rp 1.000.000 dan kamu setor Rp 100.000 (10% dari modal), kamu dapet 10% saham. Tapi kalau kamu setor 1 juta token A tapi cuma 1 token B, shares-nya dihitung dari token B (yang kurang) supaya nggak curang.

---

```solidity
        require(minted > 0, "shares nol");
```

**Artinya:** Pastikan shares yang dihitung bukan nol. Kalau nol → gagal.

---

```solidity
        shares[msg.sender] += minted;
        totalShares += minted;
        reserveA += amountA;
        reserveB += amountB;
```

**Artinya:** Update semua catatan.

| Baris | Arti |
|---|---|
| `shares[msg.sender] += minted` | Tambah saham si penyetor. |
| `totalShares += minted` | Tambah total saham beredar. |
| `reserveA += amountA` | Tambah stok token A di pool. |
| `reserveB += amountB` | Tambah stok token B di pool. |

**Analogi:** Update buku kas koperasi — catat saham anggota, total saham, dan stok modal.

---

```solidity
        emit LiquidityAdded(msg.sender, amountA, amountB, minted);
    }
```

**Artinya:** Bunyikan sirene "LiquidityAdded!" dengan data siapa, berapa A, berapa B, berapa shares. Lalu tutup fungsi.

| Bagian | Arti |
|---|---|
| `emit` | Perintah untuk "menyalakan" event yang udah dideklarasi di baris 60. |
| `LiquidityAdded(...)` | Nama event. Data: alamat penyetor, jumlah A, jumlah B, shares. |

---

### Baris 105-126: Fungsi removeLiquidity (Tarik Token dari Pool)

```solidity
    function removeLiquidity(uint256 shareAmount)
        external
        returns (uint256 amountA, uint256 amountB)
    {
```

**Artinya:** Fungsi buat tarik token dari pool — "bakar" shares, ambil balik token sesuai porsi.

| Bagian | Arti |
|---|---|
| `shareAmount` | Berapa shares mau dibakar/dikembalikan. |
| `returns (uint256 amountA, uint256 amountB)` | Balikan: berapa token A dan B yang didapat balik. |

---

```solidity
        require(shareAmount > 0, "nol");
        require(shares[msg.sender] >= shareAmount, "shares kurang");
```

**Artinya:** 2 cek: (1) jumlah shares bukan nol, (2) shares kamu cukup (nggak bisa bakar lebih dari yang kamu punya).

---

```solidity
        amountA = (shareAmount * reserveA) / totalShares;
        amountB = (shareAmount * reserveB) / totalShares;
        require(amountA > 0 && amountB > 0, "output nol");
```

**Artinya:** Hitung berapa token yang bisa diambil.

**Rumusnya:** `porsi kamu = shareAmount / totalShares`. Misal kamu punya 10% shares → dapet 10% dari semua token A dan token B di pool.

---

```solidity
        shares[msg.sender] -= shareAmount;
        totalShares -= shareAmount;
        reserveA -= amountA;
        reserveB -= amountB;
```

**Artinya:** Kurangi semua catatan DULU sebelum kirim token.

**Kenapa kurang dulu?** Ini pola keamanan bernama **checks-effects-interactions**:
1. **Checks** — validasi (sudah dilakukan di `require` di atas)
2. **Effects** — update catatan internal (baris ini)
3. **Interactions** — kirim token ke luar (baris berikutnya)

Urutan ini penting buat hindari **reentrancy attack** — hack di mana penyerang "manggil balik" contract sebelum update selesai.

---

```solidity
        tokenA.transfer(msg.sender, amountA);
        tokenB.transfer(msg.sender, amountB);
        emit LiquidityRemoved(msg.sender, amountA, amountB, shareAmount);
    }
```

**Artinya:** Kirim token A & B ke dompet LP, lalu bunyikan sirene "LiquidityRemoved."

| Bagian | Arti |
|---|---|
| `tokenA.transfer(...)` | Kirim token A dari pool ke dompet LP. Pakai `transfer` (bukan `transferFrom`) karena ngirim dari pool milik sendiri. |
| `tokenB.transfer(...)` | Sama untuk token B. |
| `emit LiquidityRemoved(...)` | Bunyikan event. |

**Kenapa nggak perlu approve di sini?** Karena token yang dikirim adalah milik pool (contract), bukan milik orang lain. Contract boleh kirim miliknya sendiri tanpa izin.

---

### Baris 133-144: Fungsi getAmountOut (Preview Harga — Gratis!)

```solidity
    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) public pure returns (uint256) {
```

**Artinya:** Fungsi buat **ngintip** berapa token yang akan kamu dapat SEBELUM swap beneran. Gratis (nggak bayar gas).

| Bagian | Arti |
|---|---|
| `amountIn` | Berapa token mau ditukar. |
| `reserveIn` | Berapa token "dari" yang ada di pool. |
| `reserveOut` | Berapa token "ke" yang ada di pool. |
| `public` | Bisa dipanggil dari mana saja. |
| `pure` | **Nggak baca/modifikasi data apapun** di blockchain. Pure function = fungsi matematika murni. Karena nggak sentuh storage → **GRATIS** (nggak bayar gas). |
| `returns (uint256)` | Balikan: berapa token yang akan kamu dapat. |

---

```solidity
        require(amountIn > 0, "input nol");
        require(reserveIn > 0 && reserveOut > 0, "pool kosong");
```

**Artinya:** Validasi: input bukan nol, pool nggak kosong.

---

```solidity
        uint256 amountInWithFee = amountIn * FEE_NUM;
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = reserveIn * FEE_DEN + amountInWithFee;
        return numerator / denominator;
```

**Artinya:** Ini rumus **x × y = k** lengkap dengan fee 0.3%.

**Mari bedah rumusnya:**

| Langkah | Kode | Arti |
|---|---|---|
| 1 | `amountInWithFee = amountIn * 997` | Token masuk dikurangi fee. Dari 1000, cuma 997 yang "benar-benar masuk" untuk itung. |
| 2 | `numerator = amountInWithFee * reserveOut` | Pembilang = (token masuk setelah fee) × (stok token tujuan di pool). |
| 3 | `denominator = reserveIn * 1000 + amountInWithFee` | Penyebut = (stok token asal × 1000) + (token masuk setelah fee). |
| 4 | `return numerator / denominator` | Hasil = pembilang dibagi penyebut. Ini jumlah token yang kamu dapat. |

**Rumus aslinya (matematika):**

```
amountOut = (amountIn × 997 × reserveOut) / (reserveIn × 1000 + amountIn × 997)
```

**Kenapa begitu?** Dari `x × y = k`:
- Sebelum swap: `k = reserveIn × reserveOut`
- Setelah swap: `(reserveIn + amountIn_after_fee) × (reserveOut - amountOut) = k`
- Diselesaikan untuk `amountOut` → rumus di atas.

**Analogi:** Kayak kalkulator di mesin penukar uang — kamu ketik "mau tukar 100 USD" dan mesin nunjukin "kamu akan dapat 1.450.000 IDR" SEBELUM kamu konfirmasi.

---

### Baris 149-159: Fungsi swapAforB (Tukar Token A → Token B)

```solidity
    function swapAforB(uint256 amountIn) external returns (uint256 amountOut) {
        require(amountIn > 0, "input nol");
        amountOut = getAmountOut(amountIn, reserveA, reserveB);
```

**Artinya:** Tukar token A (koin kamu) → token B (ETHJKT).

| Bagian | Arti |
|---|---|
| `amountIn` | Berapa token A mau ditukar. |
| `amountOut = getAmountOut(...)` | Hitung berapa token B yang akan didapat, pakai fungsi `getAmountOut` di atas. |
| `reserveA, reserveB` | Stok token A dan B di pool sekarang. |

---

```solidity
        tokenA.transferFrom(msg.sender, address(this), amountIn);
        tokenB.transfer(msg.sender, amountOut);
```

**Artinya:** Tarik token A dari dompet swapper → masuk ke pool. Kirim token B dari pool → dompet swapper.

| Baris | Arti |
|---|---|
| `tokenA.transferFrom(...)` | Narik token A dari dompetmu (butuh approve!). |
| `tokenB.transfer(...)` | Kirim token B dari pool ke dompetmu (nggak butuh approve — pool kirim miliknya sendiri). |

---

```solidity
        reserveA += amountIn;
        reserveB -= amountOut;
        emit Swapped(msg.sender, address(tokenA), amountIn, amountOut);
    }
```

**Artinya:** Update stok pool — token A nambah, token B berkurang. Lalu bunyikan sirene "Swapped!"

**⚠️ Catatan urutan:** Di fungsi ini, `transferFrom` dipanggil SEBELUM update reserve. Ini **bukan best practice** (seharusnya pakai checks-effects-interactions kayak di `removeLiquidity`). Komentar di baris 37-39 udah bilang ini versi belajar yang masih kurang perlindungan keamanan.

---

### Baris 162-172: Fungsi swapBforA (Tukar Token B → Token A)

```solidity
    function swapBforA(uint256 amountIn) external returns (uint256 amountOut) {
        require(amountIn > 0, "input nol");
        amountOut = getAmountOut(amountIn, reserveB, reserveA);

        tokenB.transferFrom(msg.sender, address(this), amountIn);
        tokenA.transfer(msg.sender, amountOut);

        reserveB += amountIn;
        reserveA -= amountOut;
        emit Swapped(msg.sender, address(tokenB), amountIn, amountOut);
    }
```

**Artinya:** Sama kayak `swapAforB`, tapi **terbalik** — tukar token B → token A.

**Bedanya:**
- `getAmountOut(amountIn, reserveB, reserveA)` — reserveIn dan reserveOut dibalik
- `tokenB.transferFrom` — tarik token B (bukan A)
- `tokenA.transfer` — kirim token A (bukan B)
- `reserveB += amountIn` — token B nambah (bukan A)
- `reserveA -= amountOut` — token A berkurang (bukan B)

---

### Baris 176-187: Fungsi _sqrt (Akar Kuadrat)

```solidity
    function _sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }
```

**Artinya:** Fungsi bantu buat hitung akar kuadrat. Solidity nggak punya fungsi `sqrt()` bawaan, jadi nulis sendiri.

| Bagian | Arti |
|---|---|
| `internal` | Cuma bisa dipanggil dari dalam contract ini (nggak bisa dari luar). |
| `pure` | Nggak baca/tulis data blockchain — pure matematika. |
| Algoritma | **Newton's method** (metode Newton) — tebak akar, terus perbaiki tebakan sampai konvergen. |

**Cara kerjanya (disederhanakan):**
1. Mulai dengan tebakan awal: `x = y/2 + 1`
2. Loop: hitung tebakan baru `x = (y/x + x) / 2` (rata-rata dari tebakan dan hasil bagi)
3. Ulangi sampai tebakan berhenti berubah (`x >= z`)
4. Hasil: `z` = akar kuadrat dari `y`

**Hanya dipakai di:** `addLiquidity` baris 83, saat LP pertama nyetor (`minted = _sqrt(amountA * amountB)`).

---

### Baris 189-191: Fungsi _min (Ambil yang Lebih Kecil)

```solidity
    function _min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
```

**Artinya:** Fungsi bantu — balikin angka yang lebih kecil dari 2 input.

| Bagian | Arti |
|---|---|
| `internal pure` | Cuma untuk dipanggil dari dalam contract, pure matematika. |
| `a < b ? a : b` | **Ternary operator**: kalau `a < b` → balikin `a`, kalau tidak → balikin `b`. Kayak: "kalau A lebih kecil, ambil A. Kalau B lebih kecil, ambil B." |

**Hanya dipakai di:** `addLiquidity` baris 87-90, saat LP berikutnya nyetor (`minted = _min(...)`).

---

### Baris 192: Penutup

```solidity
}
```

Tutup contract `SimpleAMM`.

---

## 4. Rangkuman Konsep Kunci

### 🪙 ERC20 (TokenKu & EthjktToken)

| Konsep | Penjelasan Singkat |
|---|---|
| `pragma` | Versi compiler Solidity yang dipakai |
| `import` | Ambil kode dari library lain (OpenZeppelin) |
| `contract ... is ERC20` | Mewarisi semua fungsi ERC20 (transfer, balanceOf, dll) |
| `constructor` | Fungsi yang jalan sekali saat deploy |
| `_mint` | Cetak token baru (internal, dari ERC20) |
| `msg.sender` | Alamat orang yang manggil fungsi ini |
| `decimals()` | Jumlah angka di belakang koma (default 18) |
| `10 ** 18` | 1 token = 10^18 unit terkecil (wei) |
| `external` | Bisa dipanggil dari luar contract |
| `public` | Bisa dibaca dari luar contract |

### 🔄 AMM (SimpleAMM)

| Konsep | Penjelasan Singkat |
|---|---|
| `IERC20` | Interface (daftar fungsi) ERC20 — cuma pakai, bukan warisi |
| `mapping(address => uint256)` | Buku catatan: tiap alamat → jumlah |
| `constant` | Nilai tetap selamanya, hemat gas |
| `require` | Validasi — kalau false, transaksi gagal (revert) |
| `transferFrom` | Tarik token dari dompet orang (butuh approve!) |
| `transfer` | Kirim token dari dompet sendiri |
| `emit` | Bunyikan event (notifikasi) |
| `pure` | Nggak baca/tulis blockchain — gratis |
| `view` | Baca blockchain tapi nggak ubah — juga gratis |
| `x * y = k` | Rumus AMM: hasil kali kedua token tetap |
| `indexed` | Bisa di-filter/search di frontend |
| `address(this)` | Alamat contract sendiri |

### 🧮 Rumus AMM (getAmountOut)

```
amountOut = (amountIn × 997 × reserveOut) / (reserveIn × 1000 + amountIn × 997)
```

- `997/1000` = dikurangi fee 0.3%
- Kalau pool makin timpang (satu token makin sedikit) → kurs makin jelek (slippage)

---

> **Tips terakhir:** Kalau bingung, inget prinsip dari README Hari 3:
> - **AI = tukang ketik, kamu = pilot.** Nggak perlu hafal, tapi harus NGERTI & VERIFIKASI.
> - Transaksi on-chain itu **FINAL**. Cek dulu, baru klik.
> - Fungsi `pure`/`view` = gratis (baca doang). Fungsi yang ubah data = bayar gas.
> - `approve` selalu sebelum `transferFrom`/`addLiquidity`/`swap`.

---

*Dokumen ini dibuat untuk ETHJKT UNPAM Short Course — Hari 3.*
