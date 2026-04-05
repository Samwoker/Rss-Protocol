import * as React from "react"
import { IconBox } from "@/components/ui/icon-box"

interface Feature {
  icon: React.ReactNode
  title: string
  description: string
}

const FEATURES: Feature[] = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 9.9-1" />
      </svg>
    ),
    title: "No middleman",
    description: "Direct peer-to-contract relationships. Remove administrative friction and centralized points of failure.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    title: "Time-locked payments",
    description: "Configurable vesting schedules and linear streaming. Funds are released second-by-second directly.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 14 4 9l5-5" />
        <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11" />
      </svg>
    ),
    title: "Clawback protection",
    description: "Programmable security for employers. Recover unvested funds if a contract is terminated prematurely.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
        <path d="M5 3v4" /><path d="M3 5h4" /><path d="M21 17v4" /><path d="M19 19h4" />
      </svg>
    ),
    title: "Auto-payments",
    description: "Set it and forget it. Funds are managed by smart contracts, eliminating manual transfers and approvals.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <path d="M7 12h10" /><path d="M12 7v10" />
      </svg>
    ),
    title: "Multi-chain",
    description: "Deploy on Ethereum, Polygon, Arbitrum, or Base. Optimize for gas costs and ecosystem compatibility.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
    title: "Audit Complete",
    description: "Rigorous security audits by top-tier firms. Battle-tested code ensuring payroll remains secure.",
  },
]

function FeatureCard({ feature }: { feature: Feature }) {
  return (
    <div className="feature-card">
      <div className="feature-card__icon-wrap">
        <IconBox icon={feature.icon} size="md" />
      </div>
      <h3 className="feature-card__title">{feature.title}</h3>
      <p className="feature-card__description">
        {feature.description}
      </p>
    </div>
  )
}

export function FeaturesBento() {
  return (
    <section className="features">
      <div className="features__header">
        <div>
          <span className="features__eyebrow">
            Engineered for Trust
          </span>
          <h2 className="features__title">
            Protocol Features
          </h2>
        </div>
        <p className="features__description">
          Every stream is governed by immutable code, ensuring payment certainty for contributors.
        </p>
      </div>

      <div className="features__grid">
        {FEATURES.map((feature) => (
          <FeatureCard key={feature.title} feature={feature} />
        ))}
      </div>
    </section>
  )
}
