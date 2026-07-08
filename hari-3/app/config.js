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
  AMM_ADDRESS: "0xa3698851Be62B6f5Df3dE76F7134f76DBbB798EE",

  // TOKEN A = KOIN KAMU (harus SAMA dengan tokenA di SimpleAMM).
  TOKEN_A: {
    address: "0x165DD40b8975790743Fa0423AdAecF5a6C6999Db",
    logo: "abimanyugaluh.webp", // ganti dengan logo koinmu (taruh file di app/)
  },

  // TOKEN B = ETHJKT (token bersama dari pengajar -> alamat dari pengajar).
  TOKEN_B: {
    address: "0x7E96fed902B0A26b62DA78e8112253920Fc55936",
    logo: "ethjkt-logo.png",
  },

  // Branding header.
  BRAND_LOGO: "ethjkt-logo.png",
  TITLE_IMG: "ai-blockhain-title.png",
};
