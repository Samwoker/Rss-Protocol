import { BrowserProvider, Contract, JsonRpcProvider } from "ethers";
import { streamFactoryAbi } from "./abi/factoryAbi";
import { streamerAbi } from "./abi/streamerAbi";
import {
  RPC_URL,
  getActiveStreamAddress,
  requireFactoryAddress,
} from "./config";

type Eip1193Provider = {
  request: (args: {
    method: string;
    params?: unknown[] | Record<string, unknown>;
  }) => Promise<unknown>;
};

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

let readProvider: JsonRpcProvider | null = null;

export function getReadProvider(): JsonRpcProvider {
  if (!RPC_URL) {
    throw new Error("Missing VITE_RPC_URL in .env");
  }

  if (!readProvider) {
    readProvider = new JsonRpcProvider(RPC_URL);
  }

  return readProvider;
}

export function getStreamReadContract(): Contract {
  return new Contract(getActiveStreamAddress(), streamerAbi, getReadProvider());
}

export function getStreamReadContractAt(address: string): Contract {
  return new Contract(address, streamerAbi, getReadProvider());
}

export function getFactoryReadContract(): Contract {
  return new Contract(
    requireFactoryAddress(),
    streamFactoryAbi,
    getReadProvider(),
  );
}

export async function getBrowserProvider(): Promise<BrowserProvider> {
  if (!window.ethereum) {
    throw new Error(
      "No injected wallet detected. Install MetaMask or use WalletConnect.",
    );
  }

  return new BrowserProvider(window.ethereum);
}

export async function getStreamWriteContract(): Promise<Contract> {
  const provider = await getBrowserProvider();
  const signer = await provider.getSigner();
  return new Contract(getActiveStreamAddress(), streamerAbi, signer);
}

/**
 * Create a write-enabled contract instance for a stream at an arbitrary address.
 * Useful for Explorer/other pages that operate on non-active stream contracts.
 */
export async function getStreamWriteContractAt(
  address: string,
): Promise<Contract> {
  const provider = await getBrowserProvider();
  const signer = await provider.getSigner();
  return new Contract(address, streamerAbi, signer);
}

export async function getFactoryWriteContract(): Promise<Contract> {
  const provider = await getBrowserProvider();
  const signer = await provider.getSigner();
  return new Contract(requireFactoryAddress(), streamFactoryAbi, signer);
}
