// KampusSwap multi-pool configuration. Add new tokens and pools here.
export const CONFIG = {
  SEPOLIA_CHAIN_ID: 11155111,
  RPC_URL: "https://ethereum-sepolia-rpc.publicnode.com",
  WALLETCONNECT_PROJECT_ID: "GANTI_DENGAN_PROJECT_ID_KAMU",
  ROUTER_ADDRESS: "0x417bf7FB8224fA42230cCA7e3Fa04F81f7d9Fd43",
  TOKENS: [
    { id: "getoken", name: "GeToken", symbol: "GETOKEN", address: "0x938b70f60AEda1525dcd00A5E3d8f2668EF986Cf", logo: "/token-getoken.jpg" },
    { id: "ethjkt", name: "Ethjkt Token", symbol: "ETHJKT", address: "0x7E96fed902B0A26b62DA78e8112253920Fc55936", logo: "/token-ethjkt.png" },
    { id: "reze", name: "Reze", symbol: "REZE", address: "0xe43676c5B912E1907445E94512941A68C1420E70", logo: "/token-reze.png" },
    { id: "ronova", name: "Ronova", symbol: "RONOVA", address: "0xC03D4590FA13ea10487CA17766eEA659F9949987", logo: "/token-ronova.png" },
    { id: "ronin", name: "Ronin", symbol: "RONIN", address: "0xE148bC1B15853185cB6922DFBeD21396D467B17a", logo: "/token-ronin.png" },
  ],
  POOLS: [
    { id: "getoken-ethjkt", tokenA: "getoken", tokenB: "ethjkt", address: "0xBF213C8dD19F5415Ee360DBb8ba88A6Dc915D9f5" },
    { id: "reze-ethjkt", tokenA: "reze", tokenB: "ethjkt", address: "0x469314Dd77461295BE3C14af25899EC3ee241d2E" },
    { id: "reze-ronova", tokenA: "reze", tokenB: "ronova", address: "0x46FC76c87aA272A3A1Bd54eBa285f303DC3D0CD3" },
    { id: "ronin-ethjkt", tokenA: "ronin", tokenB: "ethjkt", address: "0x08C496613E6fc4A66587bB050FE45E6a47Ebb8f7" },
  ],
  BRAND_LOGO: "/token-ethjkt.png",
  TITLE_IMG: "/ai-blockhain-title.png",
} as const;
