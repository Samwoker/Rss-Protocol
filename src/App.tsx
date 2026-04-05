import { useState, useEffect } from "react"
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

export type View = "landing" | "deploy" | "explorer" | "dashboard" | "worker-dashboard"

export default function App() {
  const [view, setView] = useState<View>("landing")
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false)

  // Handle browser back/forward buttons via hash
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace("#", "") as View
      if (hash === "deploy") setView("deploy")
      else if (hash === "explorer") setView("explorer")
      else if (hash === "dashboard") setView("dashboard")
      else if (hash === "worker-dashboard") setView("worker-dashboard")
      else setView("landing")
    }
    window.addEventListener("popstate", handleHash)
    handleHash() // Initial check
    return () => window.removeEventListener("popstate", handleHash)
  }, [])

  const navigate = (v: View) => {
    window.location.hash = v === "landing" ? "" : v
    setView(v)
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
          <WorkerDashboard />
        ) : (
          <ContractDashboard />
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
