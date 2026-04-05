import { useState } from "react"

interface FundingHistory {
  id: string
  txHash: string
  amount: string
  date: string
  status: "SUCCESS" | "FAILED"
}

const FUNDING_HISTORY: FundingHistory[] = [
  { id: "1", txHash: "0x7a...4e1b", amount: "0.50 ETH", date: "Oct 24, 2023", status: "SUCCESS" },
  { id: "2", txHash: "0x2c...9f32", amount: "1.25 ETH", date: "Oct 12, 2023", status: "SUCCESS" },
  { id: "3", txHash: "0x88...a210", amount: "0.50 ETH", date: "Sep 28, 2023", status: "SUCCESS" },
]

export function ContractDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [depositAmount, setDepositAmount] = useState("")

  const navItems = [
    { label: "Dashboard", icon: "dashboard" },
    { label: "Streams", icon: "waves" },
    { label: "Analytics", icon: "insights" },
    { label: "Settings", icon: "settings" }
  ]

  return (
    <div className="dashboard-layout">
      {/* Sidebar Navigation - Shared with Worker Dashboard */}
      <aside className="dashboard-sidebar">
        <div className="connected-card">
          <div className="connected-card__icon">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
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
        <div className="employer-header">
           <div>
              <h1 className="employer-header__title">Employer Dashboard</h1>
              <p className="employer-header__subtitle">
                Manage your smart contract liquidity, track funding history, and oversee payroll automation.
              </p>
           </div>
           <div className="status-pill-active">
              <span className="status-pill-active__dot"></span>
              ACTIVE PROTECTION
           </div>
        </div>

        {/* Hero Metrics Bento */}
        <div className="employer-bento">
           <div className="card-employer card-employer--balance">
              <span className="card-employer__label">Contract Balance</span>
              <div className="card-employer__balance-row">
                 <span className="balance-value-lg">2.25</span>
                 <span className="balance-unit-lg">ETH</span>
              </div>
              <div className="sub-metrics-row">
                 <div className="sub-metric">
                    <span className="sub-metric__label">Estimated Runway</span>
                    <span className="sub-metric__value">42 Days</span>
                 </div>
                 <div className="sub-metric">
                    <span className="sub-metric__label">Active Streams</span>
                    <span className="sub-metric__value">12</span>
                 </div>
              </div>
              <div className="card-employer__bg-decoration"></div>
           </div>

           <div className="card-employer card-employer--clawback">
              <div>
                 <div className="flex items-center gap-2 mb-4" style={{ color: 'var(--primary)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>verified_user</span>
                    <span className="text-[11px] font-bold uppercase tracking-widest">Clawback Protection</span>
                 </div>
                 <p className="text-[13px] text-slate-500 leading-relaxed">
                    Eligible to reclaim inactive funds from terminated streams. Status: <strong>3.4 ETH Available</strong>
                 </p>
              </div>
              <button 
                className="btn-secondary" 
                style={{ padding: '14px', borderRadius: '12px', fontSize: '13px', width: '100%', border: '1px solid var(--outline-variant)' }}
              >
                 <span className="material-symbols-outlined" style={{ fontSize: '18px', marginRight: '8px' }}>history_edu</span>
                 Trigger Clawback
              </button>
           </div>
        </div>

        {/* Action Section: History & Deposit */}
        <div className="employer-layout-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '48px', alignItems: 'start' }}>
           
           {/* Left: Funding History */}
           <div className="history-section">
              <h3 className="section-title-employer">Funding History</h3>
              
              <div className="history-header-labels" style={{ 
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 100px', padding: '0 32px 12px',
                fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#94a3b8'
              }}>
                 <span>Tx Hash</span>
                 <span>Amount</span>
                 <span>Date</span>
                 <span style={{ textAlign: 'right' }}>Status</span>
              </div>

              <div className="history-list">
                 {FUNDING_HISTORY.map((tx) => (
                    <div key={tx.id} className="history-item-employer">
                       <span className="history-item__hash">{tx.txHash}</span>
                       <span className="history-item__amount">{tx.amount}</span>
                       <span className="history-item__date">{tx.date}</span>
                       <div style={{ textAlign: 'right' }}>
                          <span className="status-badge status-badge--success" style={{ fontSize: '9px', padding: '4px 8px' }}>
                             {tx.status}
                          </span>
                       </div>
                    </div>
                 ))}
              </div>
           </div>

           {/* Right: Deposit Panel */}
           <div className="deposit-section">
              <div className="deposit-panel">
                 <h3 className="section-title-employer" style={{ fontSize: '20px', marginBottom: '32px' }}>Deposit Funds</h3>
                 
                 <div className="field-group">
                    <label className="field-label">Asset to Stream</label>
                    <div className="asset-selector">
                       <div className="asset-icon-box">
                          <img src="https://cryptologos.cc/logos/ethereum-eth-logo.png?v=024" alt="ETH" style={{ width: '18px' }} />
                       </div>
                       <div className="asset-info">
                          <p className="asset-name">Ethereum</p>
                          <p className="asset-symbol">Native Currency</p>
                       </div>
                       <span className="material-symbols-outlined text-slate-400">expand_more</span>
                    </div>
                 </div>

                 <div className="field-group" style={{ marginBottom: '32px' }}>
                    <label className="field-label">Amount (ETH)</label>
                    <div className="amount-input-group">
                       <input 
                         type="text" 
                         className="amount-input-field" 
                         placeholder="0.00" 
                         value={depositAmount}
                         onChange={(e) => setDepositAmount(e.target.value)}
                       />
                       <div className="amount-actions">
                          <button className="btn-amount-preset" onClick={() => setDepositAmount("0.56")}>25%</button>
                          <button className="btn-amount-preset" onClick={() => setDepositAmount("2.25")}>MAX</button>
                       </div>
                    </div>
                 </div>

                 <div className="tx-details-box">
                    <div className="tx-detail-row">
                       <span className="tx-detail-label">Network Fee</span>
                       <span className="tx-detail-value">~0.002 ETH</span>
                    </div>
                    <div className="tx-detail-row">
                       <span className="tx-detail-label">Estimated Confirmation</span>
                       <span className="tx-detail-value">&lt; 15 Seconds</span>
                    </div>
                 </div>

                 <button className="btn-fund">
                    FUND CONTRACT
                 </button>
              </div>
           </div>

        </div>
      </main>
    </div>
  )
}
