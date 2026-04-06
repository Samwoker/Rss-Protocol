import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mainnet, sepolia } from "wagmi/chains";

// Using a placeholder Project ID for WalletConnect.
// In professional settings, this would be in an .env file.
const WALLET_CONNECT_PROJECT_ID = "YOUR_PROJECT_ID";

export const config = getDefaultConfig({
  appName: "SalaryStreamer",
  projectId: WALLET_CONNECT_PROJECT_ID,
  chains: [mainnet, sepolia],
  ssr: false,
});
