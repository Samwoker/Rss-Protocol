import { getAddress, isAddress } from "ethers"

const parseChainId = (value: string | undefined): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 11155111
}

const normalizeLowerAddress = (value: string | undefined): string =>
  value?.trim().toLowerCase() ?? ""

export const CHAIN_ID = parseChainId(import.meta.env.VITE_CHAIN_ID)
export const RPC_URL = import.meta.env.VITE_RPC_URL?.trim() ?? ""
export const FACTORY_ADDRESS = import.meta.env.VITE_FACTORY_ADDRESS?.trim() ?? ""
export const STREAM_CONTRACT_ADDRESS =
  import.meta.env.VITE_STREAM_CONTRACT_ADDRESS?.trim() ?? FACTORY_ADDRESS
export const BLOCK_EXPLORER_BASE_URL =
  import.meta.env.VITE_BLOCK_EXPLORER_BASE_URL?.trim() ?? ""
export const EMPLOYER_ADDRESS = normalizeLowerAddress(
  import.meta.env.VITE_EMPLOYER_ADDRESS
)
export const WORKER_ADDRESS = normalizeLowerAddress(
  import.meta.env.VITE_WORKER_ADDRESS
)

export const isRoleMappingEnabled =
  EMPLOYER_ADDRESS.length > 0 || WORKER_ADDRESS.length > 0

// ─── Dynamic Stream Address Resolution ────────────────────────────────────────

const STREAM_ADDRESS_STORAGE_KEY = "rss_active_stream_address"

export function getActiveStreamAddress(): string {
  // 1. Check if a stream is focused in localStorage
  try {
    const stored = localStorage.getItem(STREAM_ADDRESS_STORAGE_KEY)
    if (stored && isAddress(stored)) return getAddress(stored)
  } catch {
    // localStorage unavailable
  }

  // 2. Fall back to .env configuration
  return requireStreamContractAddress()
}

export function setActiveStreamAddress(address: string): void {
  if (!isAddress(address)) return
  try {
    localStorage.setItem(STREAM_ADDRESS_STORAGE_KEY, getAddress(address))
  } catch {
    // ignore
  }
}

export function clearActiveStreamAddress(): void {
  try {
    localStorage.removeItem(STREAM_ADDRESS_STORAGE_KEY)
  } catch {
    // ignore
  }
}

// ─── Checks & Requirements ───────────────────────────────────────────────────

export function isStreamContractConfigured(): boolean {
  // If stored in localStorage, it is configured.
  try {
    const stored = localStorage.getItem(STREAM_ADDRESS_STORAGE_KEY)
    if (stored && isAddress(stored)) return true
  } catch { /* ignore */ }

  return isAddress(STREAM_CONTRACT_ADDRESS) && RPC_URL.length > 0
}

export function isFactoryConfigured(): boolean {
  return (
    (isAddress(FACTORY_ADDRESS) || isAddress(STREAM_CONTRACT_ADDRESS)) &&
    RPC_URL.length > 0
  )
}

export function requireStreamContractAddress(): string {
  if (!isAddress(STREAM_CONTRACT_ADDRESS)) {
    throw new Error(
      "Invalid stream contract address. Set VITE_STREAM_CONTRACT_ADDRESS (or VITE_FACTORY_ADDRESS for backward compatibility)."
    )
  }
  return getAddress(STREAM_CONTRACT_ADDRESS)
}

export function requireFactoryAddress(): string {
  if (isAddress(FACTORY_ADDRESS)) {
    return getAddress(FACTORY_ADDRESS)
  }

  if (isAddress(STREAM_CONTRACT_ADDRESS)) {
    return getAddress(STREAM_CONTRACT_ADDRESS)
  }

  throw new Error(
    "Invalid factory contract address. Set VITE_FACTORY_ADDRESS (or VITE_STREAM_CONTRACT_ADDRESS for backward compatibility)."
  )
}
