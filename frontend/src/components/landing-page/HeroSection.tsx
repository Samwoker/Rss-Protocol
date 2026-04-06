import { Button } from "@/components/ui/button"
import { StreamPreviewCard } from "./StreamPreviewCard"
import type { View } from "@/App"

interface HeroSectionProps {
  onNavigate: (v: View) => void
  onConnectWallet: () => void
}

export function HeroSection({ onNavigate, onConnectWallet }: HeroSectionProps) {
  return (
    <section className="hero">
      {/* Left — Copy & CTAs */}
      <div className="hero__content">
        <div className="hero__eyebrow">
          <div className="hero__dot"></div>
          Live Streaming Protocol
        </div>
        <h1 className="hero__heading">
          Trustless <br />
          <span className="text-gradient-soul">Salary Streaming</span>
        </h1>

        <p className="hero__subheading">
          Automate payroll with smart contracts. Secure, immutable, and
          continuous payment flows for the modern decentralized workforce.
        </p>

        <div className="hero__actions">
          <Button
            variant="primary"
            size="md"
            onClick={() => onNavigate("deploy")}
          >
            Deploy Contract
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={onConnectWallet}
          >
            Connect Wallet
          </Button>
          <Button variant="ghost" size="md">
            View Explorer
          </Button>
        </div>
      </div>

      {/* Right — Hero Visual */}
      <div className="hero__visual">
        <div className="hero__glow" />
        <StreamPreviewCard />
      </div>
    </section>
  )
}
