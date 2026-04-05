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
  return (
    <nav className="navbar">
      <div className="navbar__inner">
        <div
          className="navbar__brand cursor-pointer"
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
      </div>
    </nav>
  )
}
