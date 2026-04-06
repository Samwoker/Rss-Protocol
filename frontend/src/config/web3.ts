import { getDefaultConfig } from "@rainbow-me/rainbowkit"
import { sepolia } from "wagmi/chains"

const WALLET_CONNECT_PROJECT_ID =
  import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID?.trim() || "YOUR_PROJECT_ID"

export const config = getDefaultConfig({
  appName: "SalaryStreamer",
  projectId: WALLET_CONNECT_PROJECT_ID,
  // Force wallet connections to Sepolia testnet only.
  chains: [sepolia],
  ssr: false,
})
