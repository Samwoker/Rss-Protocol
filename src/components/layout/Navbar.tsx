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
          className="navbar__brand"
          style={{ cursor: 'pointer' }}
          onClick={() => onNavigate("landing")}
        >
          SalaryStreamer
        </div>

        <div className="navbar__links">
          {NAV_LINKS.map((link) => (
            <button
              key={link.label}
              onClick={() => onNavigate(link.view)}
              className={`navbar__link 
                ${currentView === link.view ? 'navbar__link--active' : ''}
                ${currentView === "landing" && link.label === "Dashboard" ? 'navbar__link--active' : ''}
              `}
            >
              {link.label}
            </button>
          ))}
        </div>

        <div className="navbar__actions">
          <Button variant="outline" size="sm">
            Ethereum
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onConnectWallet}
          >
            Connect Wallet
          </Button>
        </div>
      </div>
    </nav>
  )
}
