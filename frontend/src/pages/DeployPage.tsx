import { useState } from "react"
import { useAccount } from "wagmi"
import { Button } from "@/components/ui/button"
import {
  deploySalaryStream,
  isFactoryConfigured,
  parseStreamAddressFromReceipt,
  type StreamFrequency,
} from "@/contract"
import { setActiveStreamAddress, BLOCK_EXPLORER_BASE_URL } from "@/contract/config"
import { TransactionProgressModal, type TransactionStatus } from "@/components/modals/TransactionProgressModal"

interface DeployPageProps {
  onConnectWallet: () => void
}

export function DeployPage({ onConnectWallet }: DeployPageProps) {
  const { isConnected } = useAccount()

  // Form State
  const [employer, setEmployer] = useState("")
  const [worker, setWorker] = useState("")
  const [salary, setSalary] = useState("12.50")
  const [duration, setDuration] = useState(180)
  const [frequency, setFrequency] = useState<StreamFrequency>("Bi-weekly")

  // Transaction State
  const [txStatus, setTxStatus] = useState<TransactionStatus>("idle")
  const [deployError, setDeployError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [deployedStreamAddress, setDeployedStreamAddress] = useState<string | null>(null)

  const normalizeDeployError = (error: unknown): string => {
    if (!error || typeof error !== "object") {
      return "Deployment failed. Please try again."
    }

    const candidate = error as {
      code?: string | number
      shortMessage?: string
      message?: string
      info?: {
        error?: {
          message?: string
        }
      }
    }
    const message =
      candidate.shortMessage ??
      candidate.message ??
      candidate.info?.error?.message ??
      ""
    const normalized = message.toLowerCase()

    if (
      candidate.code === 4001 ||
      candidate.code === "ACTION_REJECTED" ||
      normalized.includes("user rejected")
    ) {
      return "Transaction was rejected in your wallet."
    }

    if (
      candidate.code === "INSUFFICIENT_FUNDS" ||
      normalized.includes("insufficient funds")
    ) {
      return "Insufficient wallet funds. Fund your Sepolia wallet with enough ETH for salary value plus gas, then retry."
    }

    return message || "Deployment failed. Please try again."
  }

  const handleDeploy = async () => {
    if (!isConnected) {
      onConnectWallet()
      return
    }

    try {
      if (!isFactoryConfigured()) {
        throw new Error(
          "Missing factory setup. Ensure VITE_RPC_URL and VITE_FACTORY_ADDRESS are set in .env."
        )
      }

      setDeployError(null)
      setTxHash(null)
      setDeployedStreamAddress(null)
      setTxStatus("signing")
      const explicitEmployer = (employer || "").trim() || undefined

      const tx = await deploySalaryStream({
        employer: explicitEmployer,
        worker,
        salaryEth: salary,
        durationDays: duration,
        frequency,
      })
      
      setTxHash(tx.hash)
      setTxStatus("pending")
      
      const receipt = await tx.wait()
      if (!receipt) throw new Error("Transaction failed to mine.")

      const streamAddr = parseStreamAddressFromReceipt(receipt)
      setDeployedStreamAddress(streamAddr)
      setActiveStreamAddress(streamAddr)
      
      setTxStatus("success")
    } catch (error) {
      console.error("Contract transaction failed", error)
      setDeployError(normalizeDeployError(error))
      setTxStatus("error")
    }
  }

  // Calculations
  const ethPrice = 2276.0 // Dynamic value simulation
  const usdValue = (parseFloat(salary) || 0) * ethPrice
  const releaseRate = (parseFloat(salary) || 0) / duration
  const platformFee = (parseFloat(salary) || 0) * 0.001
  const totalRequired = (parseFloat(salary) || 0) + platformFee + 0.0042 // Adding est. gas

  return (
    <div className="deploy-container">
      {/* Left Panel: Form (60%) */}
      <section className="deploy-form-panel">
        <header className="deploy-header">
          <h1 className="deploy-title">Deploy Stream</h1>
          <p className="deploy-subtitle">
            Configure a permissionless, audit-verified salary streaming contract.
          </p>
        </header>

        <form className="deploy-form">
          <div className="form-stack">
            <div className="form-group-refined">
              <label className="form-label-refined">
                Employer Address
                <span className="form-label-tag">Source of Funds</span>
              </label>
              <div className="input-group-refined">
                <input
                  type="text"
                  className="input-refined font-mono"
                  placeholder="0x..."
                  value={employer}
                  onChange={(e) => setEmployer(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group-refined">
              <label className="form-label-refined">Worker Address</label>
              <div className="input-group-refined">
                <input
                  type="text"
                  className="input-refined font-mono"
                  placeholder="0x..."
                  value={worker}
                  onChange={(e) => setWorker(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="form-group-refined">
            <label className="form-label-refined">Total Salary Amount</label>
            <div className="salary-input-row">
              <div className="salary-input-box">
                <span className="salary-currency">ETH</span>
                <input
                  type="text"
                  className="salary-value font-headline"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                />
              </div>
              <div className="salary-meta-box">
                <span className="salary-meta-label">Est. Value</span>
                <span className="salary-meta-value">
                  ${usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          <div className="form-group-refined duration-section">
            <div className="duration-header">
              <label className="form-label-refined">Stream Duration</label>
              <span className="duration-display">
                {duration} <span className="duration-unit">Days</span>
              </span>
            </div>
            <input
              type="range"
              className="duration-slider"
              min="30"
              max="365"
              step="1"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
            />
            <div className="duration-labels">
              <span>30 Days (Min)</span>
              <span>365 Days (Max)</span>
            </div>
          </div>

          <div className="form-group-refined">
            <label className="form-label-refined">Payout Frequency</label>
            <div className="frequency-tabs">
              {["Weekly", "Bi-weekly", "Monthly"].map((freq) => (
                <button
                  key={freq}
                  type="button"
                  className={`frequency-tab ${frequency === freq ? "active" : ""}`}
                  onClick={() => setFrequency(freq as StreamFrequency)}
                >
                  {freq}
                </button>
              ))}
            </div>
          </div>
        </form>
      </section>

      {/* Right Panel: Live Preview Card (40%) */}
      <aside className="deploy-preview-panel">
        <div className="sticky-preview">
          <div className="preview-card-v2">
            <div className="preview-header-v2">
              <div className="preview-heading-row">
                <span className="preview-badge-live">Live Preview</span>
                <span className="preview-badge-audit">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ marginRight: 4 }}>
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  Audited
                </span>
              </div>
              <h2 className="preview-title-v2">Contract Summary</h2>
            </div>

            <div className="preview-stats-v2">
              <div className="preview-stat-row">
                <div className="preview-stat-icon-box">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                </div>
                <div className="preview-stat-data">
                  <p className="preview-stat-label">Net Stream Volume</p>
                  <p className="preview-stat-value">{salary || "0.00"} ETH</p>
                </div>
              </div>

              <div className="preview-breakdown">
                <div className="breakdown-item">
                  <span className="breakdown-label">Release Rate</span>
                  <span className="breakdown-value">{releaseRate.toFixed(4)} ETH / Day</span>
                </div>
                <div className="breakdown-item">
                  <span className="breakdown-label">Platform Fee (0.1%)</span>
                  <span className="breakdown-value">{platformFee.toFixed(4)} ETH</span>
                </div>
                <div className="breakdown-item">
                  <span className="breakdown-label">Est. Gas Cost</span>
                  <span className="breakdown-value highlight-cyan">0.0042 ETH</span>
                </div>
              </div>

              <div className="preview-total-row">
                <div className="total-main">
                  <p className="total-label">Total Required</p>
                  <p className="total-value">
                    {totalRequired.toFixed(4)} <span className="total-currency">ETH</span>
                  </p>
                </div>
                <div className="total-usd">
                  ≈ ${(totalRequired * ethPrice).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            <Button className="deploy-button-soul" size="lg" onClick={handleDeploy}>
              DEPLOY CONTRACT
            </Button>

            <p className="preview-legal">
              By deploying, you agree to lock assets in a smart contract for the duration specified. Assets
              can only be released per the schedule.
            </p>
          </div>

          <div className="deploy-helper-box">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <p className="helper-text">
              Your contract will be deployed on <strong>Sepolia</strong>. Ensure your wallet has enough test ETH for salary value plus gas fees.
            </p>
          </div>
        </div>
      </aside>

      <TransactionProgressModal
        status={txStatus}
        onClose={() => {
          setTxStatus("idle")
          setDeployError(null)
          if (deployedStreamAddress) {
            window.location.hash = "#dashboard"
          } else {
            window.location.hash = "#"
          }
        }}
        onRetry={handleDeploy}
        errorMessage={deployError}
        txHash={txHash}
        streamAddress={deployedStreamAddress}
        explorerUrl={BLOCK_EXPLORER_BASE_URL}
      />
    </div>
  )
}
