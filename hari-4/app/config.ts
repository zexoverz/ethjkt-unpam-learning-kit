// ============================================================
// KONFIG KAMPUSSWAP  —  >>> MURID CUKUP EDIT FILE INI SAJA <<<
//
// Ganti alamat contract + logo token jadi punyamu sendiri.
// Logo: taruh file gambar di folder "public/", lalu tulis path-nya
// "/namafile.png" (awali garis miring) di "logo".
// ============================================================

export const CONFIG = {
  SEPOLIA_CHAIN_ID: 11155111,
  RPC_URL: "https://ethereum-sepolia-rpc.publicnode.com",
  WALLETCONNECT_PROJECT_ID: "GANTI_DENGAN_PROJECT_ID_KAMU",

  // Alamat pool SimpleAMM kamu
  AMM_ADDRESS: "0x69eE68Dfa2b81930951a8A1cf80518b3B9A47E8B",

  // TOKEN A = AdelToken (ADT) kamu
  TOKEN_A: {
    address: "0x6Cf3E11055f1158844F688f6CBD2e665A6ee0f70",
    logo: "/AdelyaRevalina.png", // ganti kalau mau logo lain, atau biarin
  },

  TOKEN_B: {
    address: "0x7E96fed902B0A26b62DA78e8112253920Fc55936",
    logo: "/ethjkt-logo.png",
  },

  BRAND_LOGO: "/ethjkt-logo.png",
  TITLE_IMG: "/ai-blockhain-title.png",
};