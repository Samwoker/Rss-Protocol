import { useState } from "react"
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

export function WorkerDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [withdrawalStatus, setWithdrawalStatus] = useState<WithdrawalStatus>("idle")

  const handleWithdraw = () => {
    setWithdrawalStatus("signing")
    
    // Simulate flow for demo purposes
    setTimeout(() => {
      setWithdrawalStatus("pending")
      setTimeout(() => {
        setWithdrawalStatus("success")
      }, 2000)
    }, 1500)
  }

  const navItems = [
    { label: "Dashboard", icon: "dashboard" },
    { label: "Streams", icon: "waves" },
    { label: "Analytics", icon: "insights" },
    { label: "Settings", icon: "settings" }
  ]

  return (
    <div className="dashboard-layout">
      {/* Sidebar Navigation */}
      <aside className="dashboard-sidebar">
        <div className="connected-card">
          <div className="connected-card__icon">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>wallet</span>
          </div>
          <div>
            <p className="connected-card__label">Connected</p>
            <p className="connected-card__address">0x...1234</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const isActive = activeTab === item.label.toLowerCase()
            return (
              <button
                key={item.label}
                onClick={() => setActiveTab(item.label.toLowerCase())}
                className={`sidebar-nav__item ${isActive ? "sidebar-nav__item--active" : ""}`}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="dashboard-main">
        {/* Hero Balance Section */}
        <section className="hero-dashboard">
          <div className="hero-dashboard__content">
            <span className="hero-dashboard__label">Worker Dashboard</span>
            <h2 className="hero-dashboard__title">Withdrawable Balance</h2>
            <div className="hero-dashboard__balance">
              0.25 <span className="hero-dashboard__currency">ETH</span>
            </div>
            <div className="hero-dashboard__info">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>schedule</span>
              Next claim available in <strong>4h 12m</strong>
            </div>
          </div>

          <button className="withdraw-btn" onClick={handleWithdraw}>
            WITHDRAW
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>account_balance_wallet</span>
          </button>
        </section>

        {/* Content Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '64px', alignItems: 'start' }}>
          
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
                  <span>0x71C7...6b8f</span>
                  <span className="material-symbols-outlined" style={{ color: 'var(--secondary)', cursor: 'pointer', fontSize: '20px' }}>content_copy</span>
                </div>
              </div>

              <div className="contract-field">
                <span className="contract-field__label">Worker Address (You)</span>
                <div className="contract-field__value-box">
                  <span>0x00...1234</span>
                  <span className="material-symbols-outlined" style={{ color: 'var(--secondary)', cursor: 'pointer', fontSize: '20px' }}>content_copy</span>
                </div>
              </div>

              <div className="contract-stats-grid">
                <div className="contract-stat-box">
                  <span className="contract-stat-box__label">Total Salary</span>
                  <span className="contract-stat-box__value">5.00 ETH</span>
                </div>
                <div className="contract-stat-box">
                  <span className="contract-stat-box__label">Payment Period</span>
                  <span className="contract-stat-box__value">7 Days</span>
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
        onClose={() => setWithdrawalStatus("idle")} 
        onRetry={handleWithdraw}
        amount="0.25 ETH"
      />
    </div>
  )
}
