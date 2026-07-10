- [x] TokenKu: "koin ini nyimpen apa? fungsi transfer & approve buat apa?"
    - Coin ini Simpan saldo setiap orang punya berapa banyak
    - Fungsi transfer adalah untuk mengirim dari alamat 1 ke alamat lain contohnya seperti yang ada di Day3
      Yaitu dengan mengirim Token yang dibuat ke alamat zexoverz
    - Fungsi approve adalah untuk memberikan izin kepada approval agar bisa menggunakan dan memberikan
      akses kepada smartcontract atau coin itu sendiri

- [x] SimpleAMM: "pool itu apa? addLiquidity ngapain? swap ngapain?"
    - Pool adalah tempat penyimpanan token TAC dan token ETHJKT
    - addLiquidity adalah untuk menambahkan token TAC dan token ETHJKT ke dalam pool
    - swap adalah untuk menukar token TAC dengan Token ETHJKT

- [x] Tunjuk 1 baris kode yang kemarin kamu NGGAK ngerti, sekarang paham.

    ```solidity
    {
        // cetak 1.000.000 token ke kamu (deployer). "10 ** decimals()"
        // karena token pakai 18 angka di belakang koma, sama kayak ETH.
        _mint(msg.sender, 1_000_000 * 10 ** decimals());
    }
    ```

    ITU SIH, jadi tau decimal token tuh ternyata ngaruh dan saya tau kalau semua token juga ada masing
    masing decimal tidak melulu 18 ada juga 8 dll

---

- [x] Baca reserveA & reserveB SEBELUM swap. Catat. k_sebelum = reserveA * reserveB.

    **Sebelum swap:**
    - reserveA = 36597442422855460996
    - reserveB = 16634986946048141264
    - k_sebelum = 36597442422855460996 × 16634986946048141264 = 6085314960899931533728711729818592304

- [x] Lakuin 1 swap kecil (swapAforB jumlah kecil).

    **Sesudah swap kecil:**
    - reserveA = 28159035363073130012
    - reserveB = 21634986946048141264
    - k_sesudah = 28159035363073130012 × 21634986946048141264 = 61015531409579364084075629089112167424

- [x] Baca reserveA & reserveB SESUDAH. Catat. k_sesudah = reserveA * reserveB.
- [x] Bandingin: k_sesudah harusnya >= k_sebelum (naik dikit karena fee 0.3%).

    **Kesimpulan:**
    - k_sebelum = 6085314960899931533728711729818592304
    - k_sesudah = 61015531409579364084075629089112167424
    - k NAIK → karena fee 0.3% dari swap masuk ke pool, bikin nilai k sedikit lebih besar dari sebelumnya.

---

## AI Swap Advisor (saya) bilang:

```json
{
  "reserveIn": "28159035363073130012",
  "reserveOut": "21634986946048141264",
  "amountIn": "10000000000000000000 (10 token)",
  "perkiraanTerima": "5657127640344134834 (~5.66 token)",
  "priceImpact": "~35.51%"
}
```

**Kesimpulan:**
- swap kecil = price impact tinggi (35.51%).
- karena pool masih tipis (kecil), tiap token masuk/keluar bikin harga berubah drastis.

| Sumber | Hasil |
|---|---|
| AI bilang | 5657127640344134834 (~5.66 token) |
| Contract bilang | 5657127640344134834 (~5.66 token) |
| Beda | 0 (sama persis) |

Artinya: kali ini AI bener hitungnya, karena rumusnya simple (x\*y=k + fee).
Tapi kalau angkanya lebih kompleks atau pool besar, AI bisa meleset.
Makanya SELALU cek ke contract langsung sebelum transaksi!

- Disini saya langsung call dari EtherScan semua datanya

---

# LOG PEMAHAMAN

**1. DeFi itu apa, bedanya sama bank? (bahasa sendiri)**

DeFi adalah Decentralized Finance dimana dia terbuka untuk semuanya dan siapapun bisa menukar apa yang
dia mau selagi dia punya dan tanpa ada pihak 3 di dalamnya yang mengatur transaksi itu.
Bank adalah itu menurut pemahaman saya adalah semua data dan transaksi di atur olehnya,
dan apapun yang dilakukan oleh kita di proses oleh pihak ke 3 bank itu sendiri.

**2. ERC20 kasih kamu fungsi apa aja? Kenapa swap butuh approve dulu?**

Swap butuh approve agar wallet bisa membaca berapa banyak token yang bisa di proses dan bisa di tukar
untuk proses swap atau penukaran, jadi swap penting agar wallet tahu kalau token ini bisa di proses
berapa aja sesuai yang sudah di approve

**3. Tempel bukti x\*y=k kamu (angka sebelum/sesudah + hasil kali).**

Ini ada di atas sih

**4. Seberapa meleset AI Swap Advisor vs getAmountOut? Apa artinya buat kamu?**

Ada di atas

**5. Slippage itu apa, kapan bikin rugi?**

Slippage adalah perubahan harga saat melakukan transaksi swap,
ini terjadi karena pergerakan harga yang cepat di pasar,
Rugi SP biasanya saat melakukan transaksi swap dengan jumlah yang besar
maka kemungkinan besar akan mendapatkan harga yang tidak sesuai

---

# RECAP PROSES INTERAKSI DEFI

### Deploy siumpleAMM

TX Hash: [0x192bec85b6c17d7fde7b44a7b6374b3915c918bba0fe64f6ecd051f32d5dc022](https://sepolia.etherscan.io/tx/0x192bec85b6c17d7fde7b44a7b6374b3915c918bba0fe64f6ecd051f32d5dc022)

### Approval Token

- TAC: [0xb1460643c5fdb708a58fd6f3bd6b68a238c12beb4b98382bd46e958fd1bfedce](https://sepolia.etherscan.io/tx/0xb1460643c5fdb708a58fd6f3bd6b68a238c12beb4b98382bd46e958fd1bfedce)
- ETHKJKT: [0x0a67d860eba0e7697833917a288f300ab3f9e3e94af0184dc9250cfaf694442a](https://sepolia.etherscan.io/tx/0x0a67d860eba0e7697833917a288f300ab3f9e3e94af0184dc9250cfaf694442a)

### ADD liduity

TX Hash: [0xaad912b9a6a4326cea9c33569d9d505da96c55f853b769032ce5bdf73be78409](https://sepolia.etherscan.io/tx/0xaad912b9a6a4326cea9c33569d9d505da96c55f853b769032ce5bdf73be78409)

### Remove Liquidty

TX Hash: [0x9e6abdc1f80dc411589dc047af10e8e204432f9414fbf3cde41c8d80c951c033](https://sepolia.etherscan.io/tx/0x9e6abdc1f80dc411589dc047af10e8e204432f9414fbf3cde41c8d80c951c033)

### SWAP

- Swap B for A: [0x77bb6d4ee657e214a7c6ea5cde202d2dfbb0233800d87b0b03b2aca255a84809](https://sepolia.etherscan.io/tx/0x77bb6d4ee657e214a7c6ea5cde202d2dfbb0233800d87b0b03b2aca255a84809)
- Swap A for B: [0xffac6f6e32d4f28dc9e1113415ec4c19f3be459205be9b866b2d25be6275c136](https://sepolia.etherscan.io/tx/0xffac6f6e32d4f28dc9e1113415ec4c19f3be459205be9b866b2d25be6275c136)