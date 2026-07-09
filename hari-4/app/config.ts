// ============================================================
// KONFIG KAMPUSSWAP 
// ============================================================

export const CONFIG = {
  // Sepolia testnet.
  SEPOLIA_CHAIN_ID: 11155111,

  // RPC publik Sepolia
  RPC_URL: "https://ethereum-sepolia-rpc.publicnode.com",

  // Bisa kamu isi kalau mau pakai WalletConnect, kalau cuma MetaMask 
  // boleh dikosongkan atau biarkan seperti itu.
  WALLETCONNECT_PROJECT_ID: "GANTI_DENGAN_PROJECT_ID_KAMU",

  // GANTI DENGAN ALAMAT SIMPLEAMM KAMU DIBAWAH INI:
  AMM_ADDRESS: "0x519A58F552d4aF1400cF40E3505c55BFC3Dcb78e",

TOKEN_A: {
    address: "0x52BB960d6c0e57ff09897E0a02A560B3e81b7509",
    logo: "/dkt-logo.png",
    symbol: "DKT", // Tambahkan baris ini
  },

  // TOKEN B = ETHJKT (Token dari pengajar)
  TOKEN_B: {
    address: "0x7E96fed902B0A26b62DA78e8112253920Fc55936",
    logo: "/ethjkt-logo.png",
  },

  // Branding header.
  BRAND_LOGO: "/ethjkt-logo.png",
  TITLE_IMG: "/ai-blockhain-title.png",
};