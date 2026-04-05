import { useAccount, useBalance, useDisconnect } from "wagmi"
import { Button } from "@/components/ui/button"
import type { View } from "@/App"

interface NavbarProps {
  currentView: View
  onNavigate: (v: View) => void
  onConnectWallet: () => void
}

const NAV_LINKS = [
  { label: "Dashboard", view: "dashboard" as View },
  { label: "Worker", view: "worker-dashboard" as View },
  { label: "Explorer", view: "explorer" as View }, 
  { label: "Deploy", view: "deploy" as View },
  { label: "Docs", view: "landing" as View },
] as const

export function Navbar({ currentView, onNavigate, onConnectWallet }: NavbarProps) {
  const { address, isConnected } = useAccount()
  const { data: balanceData } = useBalance({ address })
  const { disconnect } = useDisconnect()

  const truncatedAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ""
  const balanceValue = balanceData ? `${Number(balanceData.formatted).toFixed(3)} ${balanceData.symbol}` : "0 ETH"

  return (
    <nav className="navbar">
      <div className="navbar__inner">
        <div
          className="navbar__brand"
          onClick={() => onNavigate("landing")}
        >
          SalaryStreamer
        </div>

        <div className="navbar__links">
          {NAV_LINKS.map((link) => {
            const isActive = currentView === link.view || (currentView === "landing" && link.label === "Dashboard")
            return (
              <button
                key={link.label}
                onClick={() => onNavigate(link.view)}
                className={`navbar__link ${isActive ? "navbar__link--active" : ""}`}
              >
                {link.label}
                {isActive && <div className="navbar__link-indicator" />}
              </button>
            )
          })}
        </div>

        <div className="navbar__actions">
          {isConnected ? (
            <div className="navbar__connected">
              <div className="navbar__wallet-chip">
                <div className="wallet-chip__section wallet-chip__section--end">
                  <span className="wallet-chip__label">Balance</span>
                  <span className="wallet-chip__value wallet-chip__value--secondary">{balanceValue}</span>
                </div>
                <div className="wallet-chip__divider" />
                <div className="wallet-chip__section">
                  <span className="wallet-chip__label">Address</span>
                  <span className="wallet-chip__value wallet-chip__value--primary">{truncatedAddress}</span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="btn-sm border-slate-200 navbar__disconnect-btn"
                onClick={() => disconnect()}
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <div className="navbar__connect-controls">
              <Button variant="outline" className="btn-sm border-slate-200">
                Ethereum
              </Button>
              <Button
                onClick={onConnectWallet}
                className="btn-primary"
                style={{ padding: '12px 32px', borderRadius: '9999px' }}
              >
                Connect Wallet
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
