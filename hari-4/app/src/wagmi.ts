import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia } from "wagmi/chains";
import { http, fallback } from "viem";
import { CONFIG } from "../config";

// Konfig wagmi + RainbowKit. Cuma jaringan Sepolia.
// Baca data pool pakai RPC publik (CONFIG.RPC_URL) -> jalan tanpa wallet.
// fallback: kalau RPC utama ngadat, otomatis pindah ke cadangan.
export const wagmiConfig = getDefaultConfig({
  appName: "KampusSwap",
  projectId: CONFIG.WALLETCONNECT_PROJECT_ID,
  chains: [sepolia],
  transports: {
    [sepolia.id]: fallback([
      http(CONFIG.RPC_URL),
      http("https://1rpc.io/sepolia"),
      http(), // default viem (cadangan terakhir)
    ]),
  },
  ssr: false,
});
