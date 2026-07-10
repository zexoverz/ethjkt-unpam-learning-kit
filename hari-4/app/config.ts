// ============================================================
// KONFIG KAMPUSSWAP  —  >>> MURID CUKUP EDIT FILE INI SAJA <<<
//
// Ganti alamat contract + logo token jadi punyamu sendiri.
// Logo: taruh file gambar di folder "public/", lalu tulis path-nya
// "/namafile.png" (awali garis miring) di "logo".
// ============================================================

export const CONFIG = {
  // Sepolia testnet.
  SEPOLIA_CHAIN_ID: 11155111,

  // RPC publik Sepolia -> dipakai buat BACA data pool tanpa perlu wallet.
  RPC_URL: "https://ethereum-sepolia-rpc.publicnode.com",

  // WalletConnect projectId (buat RainbowKit). GRATIS: bikin di
  // https://cloud.reown.com -> New Project -> copy Project ID.
  // Kalau kosong, connect MetaMask masih jalan, tapi QR WalletConnect nggak.
  WALLETCONNECT_PROJECT_ID: "df65c5eb59c0dab5f861e27167ea0a6d",

  // Alamat pool AMM kamu (hasil deploy SimpleAMM di Remix).
  AMM_ADDRESS: "0x63f28F35d3e26ffae6D629EDedF330fF13e9eb5E",

  // TOKEN A = KOIN KAMU (harus SAMA dengan tokenA di SimpleAMM).
  TOKEN_A: {
    address: "0x7B2F5233f979556DeA08F01caef5c72bbF34d37c",
    logo: "/TompelCoin.webp", // ganti dengan logo koinmu (file di public/)
  },

  // TOKEN B = ETHJKT (token bersama dari pengajar).
  TOKEN_B: {
    address: "0x7E96fed902B0A26b62DA78e8112253920Fc55936",
    logo: "/ethjkt-logo.png",
  },

  // Branding header.
  BRAND_LOGO: "/ethjkt-logo.png",
  TITLE_IMG: "/ai-blockhain-title.png",
};
