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

  // >>> GANTI 3 ALAMAT INI (dari hasil deploy Anda di Remix) <<<
  AMM_ADDRESS: "0x2c5b8363Ae7683f51dF6AC5158e59DC330d17D2b",

  // TOKEN A = KOIN KAMU (Faiz Coin / FAIZ).
  TOKEN_A: {
    address: "0xCe105996E1ef40ef1D6a52BF03E50fc0A9BC80BD", // Ganti dengan alamat TokenKu (Faiz Coin) Anda
    logo: "zexoverz.webp", // ganti dengan logo koinmu (taruh file di app/)
  },

  // TOKEN B = ETHJKT (EthjktToken yang Anda deploy sendiri untuk latihan).
  TOKEN_B: {
    address: "0xC87C03754DD6C2950D3564aCe9D2ff54e99Ae47A", // Ganti dengan alamat EthjktToken Anda
    logo: "ethjkt-logo.png",
  },

  // Branding header.
  BRAND_LOGO: "ethjkt-logo.png",
  TITLE_IMG: "ai-blockhain-title.png",
};
