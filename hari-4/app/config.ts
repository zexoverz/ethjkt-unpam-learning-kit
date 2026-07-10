// ============================================================
// KONFIG KAMPUSSWAP  —  >>> MURID CUKUP EDIT FILE INI SAJA <<<
//
// Multi-Pool: tambahkan pool baru ke array POOLS.
// Ganti alamat contract + logo token jadi punyamu sendiri.
// Logo: taruh file gambar di folder "public/", lalu tulis path-nya
// "/namafile.png" (awali garis miring) di "logo".
// ============================================================

export interface PoolConfig {
  name: string;
  ammAddress: string;
  tokenA: { address: string; logo: string };
  tokenB: { address: string; logo: string };
}

export const CONFIG = {
  // Sepolia testnet.
  SEPOLIA_CHAIN_ID: 11155111,

  // RPC publik Sepolia -> dipakai buat BACA data pool tanpa perlu wallet.
  RPC_URL: "https://eth-sepolia.g.alchemy.com/v2/2jQGgnFb_KYUUrY87IGjw",

  // WalletConnect projectId (buat RainbowKit). GRATIS: bikin di
  // https://cloud.reown.com -> New Project -> copy Project ID.
  // Kalau kosong, connect MetaMask masih jalan, tapi QR WalletConnect nggak.
  WALLETCONNECT_PROJECT_ID: "19835202-80d8-4bb6-b959-b266c2299fdd",

  // Multi-Pool: array of pools. Tambah pool baru di sini.
  POOLS: [
    {
      name: "TAC / ETHJKT",
      ammAddress: "0xDc2Ee0e5B19B66D64F978B2D6088DAb3193296eB",
      tokenA: {
        address: "0xf8CaEFAA59fF0d939dF0681A29d5464EBa4a203E",
        logo: "/tac.jpg",
      },
      tokenB: {
        address: "0x7E96fed902B0A26b62DA78e8112253920Fc55936",
        logo: "/ethjkt-logo.png",
      },
    },
    // Tambah pool kedua di sini:
    // {
    //   name: "TOKEN X / ETHJKT",
    //   ammAddress: "0x...",
    //   tokenA: { address: "0x...", logo: "/tokenx.png" },
    //   tokenB: { address: "0x7E96fed902B0A26b62DA78e8112253920Fc55936", logo: "/ethjkt-logo.png" },
    // },
  ] as PoolConfig[],

  // Branding header.
  BRAND_LOGO: "/ethjkt-logo.png",
  TITLE_IMG: "/ai-blockhain-title.png",
};

// Backward-compatible exports (point ke pool pertama)
export const AMM_ADDRESS = CONFIG.POOLS[0]?.ammAddress ?? "";
export const TOKEN_A = CONFIG.POOLS[0]?.tokenA;
export const TOKEN_B = CONFIG.POOLS[0]?.tokenB;
