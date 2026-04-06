import { useEffect, useState } from "react"
import { formatEther } from "ethers"
import { useAccount } from "wagmi"
import {
  BLOCK_EXPLORER_BASE_URL,
  getStreamContractSnapshot,
  isStreamContractConfigured,
  withdrawFromStream,
  cancelIfNotStarted,
} from "@/contract"
import { WithdrawModal, type WithdrawalStatus } from "@/components/modals/WithdrawModal"

interface WithdrawalHistory {
  id: string
  date: string
  txHash: string
  status: "Success" | "Pending" | "Failed"
  amount: string
}

const ACTIVITIES: WithdrawalHistory[] = [
  { id: "1", date: "Oct 24, 2023", txHash: "0x9a...e42c", status: "Success", amount: "0.125 ETH" },
  { id: "2", date: "Oct 17, 2023", txHash: "0xf2...11b0", status: "Success", amount: "0.125 ETH" },
  { id: "3", date: "Oct 10, 2023", txHash: "0x4d...889a", status: "Success", amount: "0.125 ETH" },
]

interface WorkerDashboardProps {
  onConnectWallet: () => void
}

const truncateAddress = (value: string): string =>
  value.length > 12 ? `${value.slice(0, 6)}...${value.slice(-4)}` : value

const formatDurationFromSeconds = (seconds: bigint): string => {
  const totalSeconds = Number(seconds)

  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return "Now"
  }

  if (totalSeconds < 60) {
    return `${Math.floor(totalSeconds)}s`
  }

  if (totalSeconds < 3600) {
    const minutes = Math.floor(totalSeconds / 60)
    const remainderSeconds = Math.floor(totalSeconds % 60)
    return remainderSeconds > 0
      ? `${minutes}m ${remainderSeconds}s`
      : `${minutes}m`
  }

  if (totalSeconds < 86400) {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
  }

  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  return hours > 0 ? `${days}d ${hours}h` : `${days}d`
}

const resolvePaymentPeriodLabel = (
  paymentPeriod: number,
  periodDuration: bigint
): string => {
  if (paymentPeriod === 0) return "Weekly"
  if (paymentPeriod === 1) return "Bi-weekly"
  if (paymentPeriod === 2) return "Monthly"

  const fallback = formatDurationFromSeconds(periodDuration)
  if (fallback === "Now") return "Custom"
  return fallback
}

const normalizeWithdrawError = (error: unknown): string => {
  if (!error || typeof error !== "object") {
    return "Withdrawal failed. Please try again."
  }

  const candidate = error as {
    code?: string | number
    shortMessage?: string
    message?: string
  }
  const message = candidate.shortMessage ?? candidate.message ?? ""

  if (
    candidate.code === 4001 ||
    candidate.code === "ACTION_REJECTED" ||
    message.toLowerCase().includes("user rejected")
  ) {
    return "Withdrawal request was rejected in your wallet."
  }

  return message || "Withdrawal failed. Please try again."
}

export function WorkerDashboard({ onConnectWallet }: WorkerDashboardProps) {
  const { address, isConnected } = useAccount()
  const [activeTab, setActiveTab] = useState("dashboard")
  const [withdrawalStatus, setWithdrawalStatus] = useState<WithdrawalStatus>("idle")
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [withdrawableWei, setWithdrawableWei] = useState(0n)
  const [withdrawableAmount, setWithdrawableAmount] = useState("0.0000 ETH")
  const [nextClaimLabel, setNextClaimLabel] = useState("Unknown")
  const [employerAddress, setEmployerAddress] = useState("—")
  const [workerAddress, setWorkerAddress] = useState("—")
  const [totalSalary, setTotalSalary] = useState("0.0000 ETH")
  const [totalEarned, setTotalEarned] = useState("0.0000 ETH")
  const [paymentPeriodLabel, setPaymentPeriodLabel] = useState("—")
  const [txHash, setTxHash] = useState<string | null>(null)
  const [withdrawError, setWithdrawError] = useState<string | null>(null)
  const [streamStatus, setStreamStatus] = useState<number>(0)
  const [deployTime, setDeployTime] = useState<bigint>(0n)
  const [isCancelLoading, setIsCancelLoading] = useState(false)

  const connectedAddressLabel = address ? truncateAddress(address) : "Disconnected"
  const withdrawableBalanceValue = withdrawableAmount.replace(" ETH", "")
  const explorerUrl =
    txHash && BLOCK_EXPLORER_BASE_URL
      ? `${BLOCK_EXPLORER_BASE_URL.replace(/\/$/, "")}/tx/${txHash}`
      : null

  const loadContractData = async () => {
    if (!isStreamContractConfigured()) return

    try {
      const snapshot = await getStreamContractSnapshot()
      setWithdrawableWei(snapshot.withdrawable)
      setWithdrawableAmount(`${Number(formatEther(snapshot.withdrawable)).toFixed(4)} ETH`)
      setNextClaimLabel(formatDurationFromSeconds(snapshot.timeUntilNextClaim))
      setEmployerAddress(snapshot.employer)
      setWorkerAddress(snapshot.worker)
      setTotalSalary(`${Number(formatEther(snapshot.totalSalary)).toFixed(4)} ETH`)
      setTotalEarned(`${Number(formatEther(snapshot.earned)).toFixed(4)} ETH`)
      setPaymentPeriodLabel(
        resolvePaymentPeriodLabel(snapshot.paymentPeriod, snapshot.periodDuration)
      )
      setStreamStatus(snapshot.status)
      setDeployTime(snapshot.deployTime)
    } catch (error) {
      console.error("Failed to load worker contract data", error)
    }
  }

  useEffect(() => {
    void loadContractData()
  }, [])

  const handleWithdraw = async () => {
    if (!isConnected) {
      onConnectWallet()
      return
    }

    try {
      if (!isStreamContractConfigured()) {
        throw new Error(
          "Missing contract setup. Ensure VITE_RPC_URL and VITE_STREAM_CONTRACT_ADDRESS are set in .env."
        )
      }

      if (withdrawableWei <= 0n) {
        throw new Error("No funds are currently available for withdrawal.")
      }

      setWithdrawError(null)
      setTxHash(null)
      setWithdrawalStatus("signing")
      const tx = await withdrawFromStream()
      setTxHash(tx.hash)
      setWithdrawalStatus("pending")
      await tx.wait()
      setWithdrawalStatus("success")
      await loadContractData()
    } catch (error) {
      console.error("Withdraw transaction failed", error)
      setWithdrawError(normalizeWithdrawError(error))
      setWithdrawalStatus("error")
    }
  }

  const handleCancel = async () => {
    if (!isConnected) {
      onConnectWallet()
      return
    }

    try {
      setIsCancelLoading(true)
      const tx = await cancelIfNotStarted()
      await tx.wait()
      await loadContractData()
    } catch (error) {
      console.error("Cancel stream failed", error)
    } finally {
      setIsCancelLoading(false)
    }
  }

  const isWithdrawBusy =
    withdrawalStatus === "signing" || withdrawalStatus === "pending"
  const isWithdrawDisabled =
    isWithdrawBusy || (isConnected && withdrawableWei <= 0n)

  const navItems = [
    { label: "Dashboard", icon: "dashboard" },
    { label: "Streams", icon: "waves" },
    { label: "Analytics", icon: "insights" },
    { label: "Settings", icon: "settings" }
  ]

  const handleNavClick = (tab: string) => {
    setActiveTab(tab)
    setIsSidebarOpen(false)
  }

  return (
    <div className="dashboard-layout">
      {/* Sidebar Navigation */}
      <aside className={`dashboard-sidebar ${isSidebarOpen ? "dashboard-sidebar--open" : ""}`}>
        <button
          type="button"
          className="dashboard-sidebar__toggle"
          onClick={() => setIsSidebarOpen((prev) => !prev)}
          aria-expanded={isSidebarOpen}
          aria-controls="worker-sidebar-content"
        >
          <span className="material-symbols-outlined">{isSidebarOpen ? "close" : "menu"}</span>
          <span>{isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}</span>
        </button>

        <div id="worker-sidebar-content" className="dashboard-sidebar__content">
          <div className="connected-card">
            <div className="connected-card__icon">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>wallet</span>
            </div>
            <div>
              <p className="connected-card__label">{isConnected ? "Connected" : "Not Connected"}</p>
              <p className="connected-card__address">{connectedAddressLabel}</p>
            </div>
          </div>

          <nav className="sidebar-nav">
            {navItems.map((item) => {
              const isActive = activeTab === item.label.toLowerCase()
              return (
                <button
                  key={item.label}
                  onClick={() => handleNavClick(item.label.toLowerCase())}
                  className={`sidebar-nav__item ${isActive ? "sidebar-nav__item--active" : ""}`}
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="dashboard-main">
        {/* Hero Balance Section */}
        <section className="hero-dashboard">
          <div className="hero-dashboard__content">
            <span className="hero-dashboard__label">Worker Dashboard</span>
            <h2 className="hero-dashboard__title">Withdrawable Balance</h2>
            <div className="hero-dashboard__balance">
              {withdrawableBalanceValue} <span className="hero-dashboard__currency">ETH</span>
            </div>
            <div className="hero-dashboard__info">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>schedule</span>
              {nextClaimLabel === "Now" ? (
                <strong>Claim available now</strong>
              ) : (
                <>
                  Next claim available in <strong>{nextClaimLabel}</strong>
                </>
              )}
            </div>
          </div>

          <button className="withdraw-btn" onClick={handleWithdraw} disabled={isWithdrawDisabled}>
            {isWithdrawBusy ? "PROCESSING" : "WITHDRAW"}
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>account_balance_wallet</span>
          </button>
        </section>

        {/* Content Grid */}
        <div className="dashboard-content-grid" style={{ gridTemplateColumns: '1fr 400px', gap: '64px' }}>
          
          {/* Left Column: Withdrawal History */}
          <section>
            <div className="section-header">
              <h3 className="section-title">Withdrawal History</h3>
              <a href="#" className="view-all-link">
                View All
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
              </a>
            </div>

            <div className="withdrawal-list">
              {/* List Header Labels */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr 100px', 
                padding: '0 32px 16px',
                fontSize: '11px',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: 'var(--on-surface-variant)',
                opacity: '0.4'
              }}>
                <div>Date</div>
                <div style={{ textAlign: 'center' }}>Status</div>
                <div style={{ textAlign: 'right' }}>Amount</div>
              </div>

              {ACTIVITIES.map((tx) => (
                <div key={tx.id} className="history-card">
                  <div className="history-card__main">
                    <span className="history-card__date">{tx.date}</span>
                    <span className="history-card__tx">Tx: {tx.txHash}</span>
                  </div>
                  <div className="status-badge status-badge--success">
                    <span className="status-badge__dot"></span>
                    {tx.status}
                  </div>
                  <div className="history-card__amount">
                    {tx.amount}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Right Column: Contract Details & Help */}
          <aside>
            <div className="contract-sidebar">
              <h3 className="contract-sidebar__title">Contract Details</h3>
              
              <div className="contract-field">
                <span className="contract-field__label">Employer Address</span>
                <div className="contract-field__value-box">
                  <span>{employerAddress === "—" ? "—" : truncateAddress(employerAddress)}</span>
                  <span className="material-symbols-outlined" style={{ color: 'var(--secondary)', cursor: 'pointer', fontSize: '20px' }}>content_copy</span>
                </div>
              </div>

              <div className="contract-field">
                <span className="contract-field__label">Worker Address (You)</span>
                <div className="contract-field__value-box">
                  <span>{workerAddress === "—" ? connectedAddressLabel : truncateAddress(workerAddress)}</span>
                  <span className="material-symbols-outlined" style={{ color: 'var(--secondary)', cursor: 'pointer', fontSize: '20px' }}>content_copy</span>
                </div>
              </div>

              <div className="contract-stats-grid">
                <div className="contract-stat-box">
                  <span className="contract-stat-box__label">Total Salary</span>
                  <span className="contract-stat-box__value">{totalSalary}</span>
                </div>
                <div className="contract-stat-box">
                  <span className="contract-stat-box__label">Payment Period</span>
                  <span className="contract-stat-box__value">{paymentPeriodLabel}</span>
                </div>
                <div className="contract-stat-box">
                  <span className="contract-stat-box__label">Total Earned</span>
                  <span className="contract-stat-box__value" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{totalEarned}</span>
                </div>
              </div>

              <div className="health-section">
                <div className="health-header">
                  <span className="health-label">Contract Health</span>
                  <span className="health-status">Excellent</span>
                </div>
                <div className="health-bar-bg">
                  <div className="health-bar-fill" style={{ width: '92%' }}></div>
                </div>
              </div>

              {streamStatus === 0 && (
                <div style={{ marginTop: '24px' }}>
                  <button 
                    className="btn-cancel" 
                    style={{ 
                      padding: '12px', 
                      borderRadius: '12px', 
                      fontSize: '13px', 
                      width: '100%', 
                      border: '1px solid #ef4444',
                      color: '#ef4444',
                      background: 'transparent',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onClick={handleCancel}
                    disabled={isCancelLoading}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', marginRight: '8px' }}>cancel</span>
                    {isCancelLoading ? "Cancelling..." : "Cancel Stream"}
                  </button>
                  <p style={{ fontSize: '11px', color: 'var(--on-surface-variant)', marginTop: '8px', textAlign: 'center', opacity: 0.7 }}>
                    Only available if work hasn't started and 7 days passed since deployment.
                  </p>
                </div>
              )}
            </div>

            {/* Support Card */}
            <div className="support-card">
              <div className="support-icon-box">
                <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>help</span>
              </div>
              <div className="support-text">
                <h4>Need help?</h4>
                <p>Contact payroll support or view documentation for stream details.</p>
              </div>
            </div>
          </aside>

        </div>
      </main>

      {/* Withdrawal Transaction Feedback */}
      <WithdrawModal 
        status={withdrawalStatus} 
        onClose={() => {
          setWithdrawalStatus("idle")
          setWithdrawError(null)
        }}
        onRetry={handleWithdraw}
        amount={withdrawableAmount}
        txHash={txHash}
        explorerUrl={explorerUrl}
        errorMessage={withdrawError}
      />
    </div>
  )
}
