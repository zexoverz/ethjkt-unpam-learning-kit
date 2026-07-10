// ============================================================
// KONFIG XEVOSWAP — Multi-Pool
// Tambah pool baru di POOLS[], otomatis masuk ke router & UI.
// ============================================================

export const CONFIG = {
  SEPOLIA_CHAIN_ID: 11155111,
  RPC_URL: "https://ethereum-sepolia-rpc.publicnode.com",
  WALLETCONNECT_PROJECT_ID: "GANTI_DENGAN_PROJECT_ID_KAMU",

  // ── DAFTAR TOKEN ────────────────────────────────────────────
  TOKENS: {
    XEVO: {
      symbol: "XEVO",
      address: "0x65AA185B443aF0319e149B23d54fA3241D94e1cA" as `0x${string}`,
      logo: "/xevo.png",
      decimals: 18,
    },
    ETHJKT: {
      symbol: "ETHJKT",
      address: "0x7E96fed902B0A26b62DA78e8112253920Fc55936" as `0x${string}`,
      logo: "/ethjkt-logo.png",
      decimals: 18,
    },
    // Contoh token tambahan (mock untuk demo routing):
    // Uncomment & isi address kalau kamu deploy token baru
    // USDC: {
    //   symbol: "USDC",
    //   address: "0xYOUR_USDC_ADDRESS" as `0x${string}`,
    //   logo: "/usdc.png",
    //   decimals: 6,
    // },
  },

  // ── DAFTAR POOL ─────────────────────────────────────────────
  // Setiap pool = satu SimpleAMM contract yang udah di-deploy di Remix.
  // tokenA & tokenB HARUS sama persis dengan yang di-set waktu deploy.
  POOLS: [
    {
      id: "xevo-ethjkt",
      label: "XEVO / ETHJKT",
      ammAddress: "0xbFf9341A5d0010d07869f005FE53Db55D17e6Aa5" as `0x${string}`,
      tokenA: "XEVO",
      tokenB: "ETHJKT",
    },
    // Tambah pool baru di sini:
    // {
    //   id: "usdc-ethjkt",
    //   label: "USDC / ETHJKT",
    //   ammAddress: "0xYOUR_SECOND_AMM" as `0x${string}`,
    //   tokenA: "USDC",
    //   tokenB: "ETHJKT",
    // },
  ],

  // ── BRANDING ────────────────────────────────────────────────
  BRAND_LOGO: "/ethjkt-logo.png",
  TITLE_IMG: "/ai-blockhain-title.png",
} as const;

// Helper types
export type TokenSymbol = keyof typeof CONFIG.TOKENS;
export type PoolConfig = (typeof CONFIG.POOLS)[number];
export type TokenConfig = (typeof CONFIG.TOKENS)[TokenSymbol];
