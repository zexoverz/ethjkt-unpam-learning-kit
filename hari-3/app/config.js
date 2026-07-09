// ============================================================
// KONFIG KAMPUSSWAP  —  >>> KAMU CUKUP EDIT FILE INI SAJA <<<
//
// Ganti 3 alamat di bawah jadi hasil deploy KAMU sendiri di Remix
// (Sepolia). Bisa juga ganti logo token: taruh file gambar (png/webp)
// di folder app/ ini, lalu tulis nama file-nya di "logo".
// ============================================================

const CONFIG = {
  // Sepolia testnet (jangan diubah).
  SEPOLIA_CHAIN_ID: 11155111,

  // RPC publik Sepolia -> dipakai buat BACA data pool tanpa perlu wallet.
  RPC_URL: "https://ethereum-sepolia-rpc.publicnode.com",

  // >>> GANTI 3 ALAMAT INI (dari Remix) <<<
  AMM_ADDRESS: "0xISI_ALAMAT_SIMPLEAMM_KAMU",

  // TOKEN A = KOIN KAMU (harus SAMA dengan tokenA di SimpleAMM).
  TOKEN_A: {
    address: "0xISI_ALAMAT_TOKENKU_KAMU",
    logo: "zexoverz.webp", // ganti dengan logo koinmu (taruh file di app/)
  },

  // TOKEN B = ETHJKT (token bersama dari pengajar -> alamat dari pengajar).
  TOKEN_B: {
    address: "0xISI_ALAMAT_ETHJKT",
    logo: "ethjkt-logo.png",
  },

  // Branding header.
  BRAND_LOGO: "ethjkt-logo.png",
  TITLE_IMG: "ai-blockhain-title.png",
};
