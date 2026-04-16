import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import {
  HeroSection,
  StatsSection,
  FeaturesBento,
  CtaSection,
} from "@/components/landing-page"
import { DeployPage } from "@/pages/DeployPage"
import { ExplorerPage } from "@/pages/ExplorerPage"
import { ContractDashboard } from "@/pages/ContractDashboard"
import { WorkerDashboard } from "@/pages/WorkerDashboard"
import { ConnectWalletModal } from "@/components/modals/ConnectWalletModal"
import {
  canAccessView,
  getAccessDeniedMessage,
  getFallbackView,
  resolveRole,
} from "@/contract"
import { Web3Provider } from "./providers/Web3Provider"

export type View = "landing" | "deploy" | "explorer" | "dashboard" | "worker-dashboard"

export default function App() {
  return (
    <Web3Provider>
      <AppContent />
    </Web3Provider>
  )
}

const parseHashToView = (): View => {
  const hash = window.location.hash.replace("#", "") as View
  if (hash === "deploy") return "deploy"
  if (hash === "explorer") return "explorer"
  if (hash === "dashboard") return "dashboard"
  if (hash === "worker-dashboard") return "worker-dashboard"
  return "landing"
}

const viewToHash = (view: View): string => (view === "landing" ? "" : view)

function AppContent() {
  const { address } = useAccount()
  const role = resolveRole(address)

  const [view, setView] = useState<View>("landing")
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false)
  const [guardNotice, setGuardNotice] = useState("")

  const resolveAuthorizedView = (requestedView: View): View => {
    if (canAccessView(role, requestedView)) return requestedView
    return getFallbackView(role)
  }

  // Handle browser back/forward buttons via hash
  useEffect(() => {
    const handleHash = () => {
      const requestedView = parseHashToView()
      const authorizedView = resolveAuthorizedView(requestedView)

      if (authorizedView !== requestedView) {
        setGuardNotice(getAccessDeniedMessage(role, requestedView))
        const expectedHash = viewToHash(authorizedView)
        const currentHash = window.location.hash.replace("#", "")
        if (currentHash !== expectedHash) {
          window.location.hash = expectedHash
        }
      }

      setView(authorizedView)
    }

    window.addEventListener("hashchange", handleHash)
    window.addEventListener("popstate", handleHash)
    handleHash()

    return () => {
      window.removeEventListener("hashchange", handleHash)
      window.removeEventListener("popstate", handleHash)
    }
  }, [role])

  useEffect(() => {
    if (!guardNotice) return

    const timeout = window.setTimeout(() => {
      setGuardNotice("")
    }, 3500)

    return () => window.clearTimeout(timeout)
  }, [guardNotice])

  const navigate = (requestedView: View) => {
    const authorizedView = resolveAuthorizedView(requestedView)

    if (authorizedView !== requestedView) {
      setGuardNotice(getAccessDeniedMessage(role, requestedView))
    }

    window.location.hash = viewToHash(authorizedView)
    setView(authorizedView)
    window.scrollTo(0, 0)
  }

  return (
    <>
      <Navbar
        currentView={view}
        onNavigate={navigate}
        onConnectWallet={() => setIsConnectModalOpen(true)}
      />

      <main className="landing-main">
        {guardNotice && (
          <div className="route-guard-banner" role="status">
            {guardNotice}
          </div>
        )}

        {view === "landing" ? (
          <>
            <HeroSection
              onNavigate={navigate}
              onConnectWallet={() => setIsConnectModalOpen(true)}
            />
            <StatsSection />
            <FeaturesBento />
            <CtaSection />
          </>
        ) : view === "deploy" ? (
          <DeployPage onConnectWallet={() => setIsConnectModalOpen(true)} />
        ) : view === "explorer" ? (
          <ExplorerPage />
        ) : view === "worker-dashboard" ? (
          <WorkerDashboard onConnectWallet={() => setIsConnectModalOpen(true)} />
        ) : (
          <ContractDashboard onConnectWallet={() => setIsConnectModalOpen(true)} />
        )}
      </main>

      <Footer />

      <ConnectWalletModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
      />
    </>
  )
}
