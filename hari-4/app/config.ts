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
  WALLETCONNECT_PROJECT_ID: "GANTI_DENGAN_PROJECT_ID_KAMU",

  // Alamat pool AMM kamu (GANTI DENGAN ALAMAT SIMPLEAMM BARU HASIL DEPLOY DI REMIX).
  AMM_ADDRESS: "0x10846A1D982bC820626682b1BC019b2008120774",

  // TOKEN A = KOIN KAMU (Faiz Coin / FAIZ).
  TOKEN_A: {
    address: "0xCe105996E1ef40ef1D6a52BF03E50fc0A9BC80BD",
    logo: "/zexoverz.webp", // ganti dengan logo koinmu (file di public/)
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
