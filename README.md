# KampusSwap — Renzie ETH (RZH)

Short Course "AI & Blockchain" | Universitas Pamulang (UNPAM)
Pengajar: Faisal "Zexo" — Founder ETHJKT (Ethereum Jakarta)

KampusSwap adalah DEX (Decentralized Exchange) mini berbasis AMM x*y=k yang di-deploy di **Sepolia testnet**. Peserta bikin koin ERC20 sendiri, bikin pasar, dan ngerasain langsung gimana DeFi bekerja.

## Detail Projek

**Koin Saya:** Renzie ETH (`RZH`)

### 3 Alamat Contract (Sepolia)

| Contract | Alamat | Etherscan |
|----------|--------|-----------|
| Renzie ETH (RZH) | `0xf214e045E9D2249a5cD2feF26eE2D79263A1F1dd` | [Lihat](https://sepolia.etherscan.io/address/0xf214e045E9D2249a5cD2feF26eE2D79263A1F1dd) |
| ETHJKT Token | `0x7E96fed902B0A26b62DA78e8112253920Fc55936` | [Lihat](https://sepolia.etherscan.io/address/0x7E96fed902B0A26b62DA78e8112253920Fc55936) |
| SimpleAMM (Pasar) | `0xe2418A85060977cBCD13E7ecc2e88E98A0428456` | [Lihat](https://sepolia.etherscan.io/address/0xe2418A85060977cBCD13E7ecc2e88E98A0428456) |

### Cara Jalankan App

```bash
cd hari-4/app
npm install
npm run dev
```

Buka browser ke `http://localhost:5173`, connect MetaMask (Sepolia), dan swap.

### Cara Jalankan Contract (via Remix)

1. Buka https://remix.ethereum.org
2. Compile `Renzie.sol` / `SimpleAMM.sol` (Solc 0.8.20+, OpenZeppelin otomatis)
3. Deploy ke Sepolia lewat MetaMask (Injected Provider)
4. Approve → Add Liquidity → Swap

## Struktur Repo

```
├── hari-1/        # Gacha Pokémon (pengenalan AI + coding)
├── hari-2/        # Bug bounty & review keamanan
├── hari-3/        # Bikin token ERC20 + pasar + swap
├── hari-4/        # Bedah DeFi + demo + push GitHub
│   ├── Renzie.sol         # Koin ERC20: Renzie ETH (RZH)
│   ├── EthjktToken.sol    # Token bersama ETHJKT
│   ├── SimpleAMM.sol      # Mesin AMM x*y=k
│   └── app/               # Interface web React + wagmi
├── ai/            # Prompt AI Swap Advisor & Market Vibe
├── KARIER.md      # Bacaan lanjutan karier Web3
└── README.md
```

## Sumber Daya

- [ETHJKT Course](https://github.com/Ethereum-Jakarta/ethjkt-course)
- [Sepolia Etherscan](https://sepolia.etherscan.io)
- [Remix IDE](https://remix.ethereum.org)

---

Projek ini dibuat untuk tugas akhir short course AI & Blockchain — ETHJKT x UNPAM.
