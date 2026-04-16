import type { View } from "@/App"
import {
  EMPLOYER_ADDRESS,
  WORKER_ADDRESS,
  isRoleMappingEnabled,
} from "./config"

export type AppRole = "guest" | "connected" | "employer" | "worker"

const PROTECTED_VIEWS: ReadonlyArray<View> = ["dashboard", "worker-dashboard"]

const normalizeAddress = (address?: string): string =>
  address?.trim().toLowerCase() ?? ""

export function resolveRole(address?: string): AppRole {
  const normalized = normalizeAddress(address)

  if (!normalized) return "guest"
  if (EMPLOYER_ADDRESS && normalized === EMPLOYER_ADDRESS) return "employer"
  if (WORKER_ADDRESS && normalized === WORKER_ADDRESS) return "worker"
  return "connected"
}

export function isProtectedView(view: View): boolean {
  return PROTECTED_VIEWS.includes(view)
}

export function canAccessView(role: AppRole, view: View): boolean {
  if (!isProtectedView(view)) return true
  if (role === "guest") return false

  // If role mapping is not configured yet, allow any connected wallet.
  if (!isRoleMappingEnabled) return true

  if (view === "dashboard") return role === "employer"
  if (view === "worker-dashboard") return role === "worker"
  return true
}

export function getFallbackView(role: AppRole): View {
  if (role === "employer") return "dashboard"
  if (role === "worker") return "worker-dashboard"
  return "landing"
}

export function getAccessDeniedMessage(role: AppRole, view: View): string {
  if (role === "guest") {
    return "Connect your wallet to open dashboard routes."
  }

  if (view === "dashboard") {
    return "Only the employer wallet can access Employer Dashboard."
  }

  if (view === "worker-dashboard") {
    return "Only the worker wallet can access Worker Dashboard."
  }

  return "You do not have permission to access this route."
}
