import { useState } from "react"

interface StreamActivity {
  id: string
  hash: string
  action: string
  amount: string
  timestamp: string
  status: "CONFIRMED" | "PENDING" | "FAILED"
}

const ACTIVITIES: StreamActivity[] = [
  { id: "1", hash: "0x4a2...9b1c", action: "Automatic Stream", amount: "0.05 ETH", timestamp: "2 hours ago", status: "CONFIRMED" },
  { id: "2", hash: "0x8f1...3e7d", action: "User Withdrawal", amount: "0.40 ETH", timestamp: "1 day ago", status: "CONFIRMED" },
  { id: "3", hash: "0x2d9...5a2b", action: "Automatic Stream", amount: "0.05 ETH", timestamp: "2 days ago", status: "CONFIRMED" },
  { id: "4", hash: "0xbc3...1c8e", action: "Contract Init", amount: "2.50 ETH", timestamp: "5 days ago", status: "CONFIRMED" },
]

export function ContractDashboard() {
  const [activeTab, setActiveTab] = useState("Dashboard")

  return (
    <div className="dashboard-v2-layout">
      {/* Sidebar Navigation */}
      <aside className="dashboard-v2-sidebar">
        <div className="sidebar-id-card">
           <div className="id-icon-box soul-gradient/10 rounded-xl p-2 mr-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5">
                 <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
           </div>
           <div className="id-text">
              <span className="id-status">CONNECTED</span>
              <span className="id-address font-mono">0x...1234</span>
           </div>
        </div>

        <nav className="sidebar-v2-nav">
          <SidebarLink label="Dashboard" icon="dashboard" active={activeTab === "Dashboard"} onClick={() => setActiveTab("Dashboard")} />
          <SidebarLink label="Streams" icon="waves" active={activeTab === "Streams"} onClick={() => setActiveTab("Streams")} />
          <SidebarLink label="Analytics" icon="insights" active={activeTab === "Analytics"} onClick={() => setActiveTab("Analytics")} />
          <SidebarLink label="Settings" icon="settings" active={activeTab === "Settings"} onClick={() => setActiveTab("Settings")} />
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="dashboard-v2-main">
        <div className="dashboard-v2-container">
          
          {/* Header & Global Actions */}
          <header className="dashboard-v2-header">
            <div className="header-v2-left">
              <div className="title-row">
                <h1 className="dashboard-v2-title">Contract Dashboard</h1>
                <span className="badge-active">Active</span>
              </div>
              <div className="address-bar-v2 font-mono">
                <span>0x71C7656EC7ab88b098defB751B7401B5f6d8976F</span>
                <button className="copy-btn-v2">
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                </button>
              </div>
            </div>

            <div className="header-v2-actions">
              <button className="btn-v2-action btn-withdraw">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mr-2"><path d="M3 11l18-5v12l-18-5z"/><path d="M21 11v2"/><path d="M3 11v2"/></svg>
                WITHDRAW
              </button>
              <button className="btn-v2-action btn-clawback">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mr-2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                CLAWBACK
              </button>
              <button className="btn-v2-action btn-cancel">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mr-2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                CANCEL
              </button>
            </div>
          </header>

          {/* Metric Cards Row */}
          <div className="metrics-v2-grid">
            {/* Total Salary Radial */}
            <div className="metric-v2-card text-center">
              <div className="radial-wrapper relative mx-auto mb-6">
                <svg width="120" height="120" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#f1f5f9" strokeWidth="8"/>
                  <circle cx="50" cy="50" r="45" fill="none" stroke="var(--primary)" strokeWidth="8" strokeDasharray="282.7" strokeDashoffset="70" strokeLinecap="round" transform="rotate(-90 50 50)"/>
                </svg>
                <div className="radial-inner">
                  <span className="radial-value font-mono">2.5</span>
                  <span className="radial-unit font-mono">ETH</span>
                </div>
              </div>
              <span className="metric-v2-label">TOTAL SALARY</span>
            </div>

            {/* Duration Left */}
            <div className="metric-v2-card">
              <div className="flex justify-between items-center mb-4">
                <span className="metric-v2-label">DURATION LEFT</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </div>
              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-3xl font-bold">45</span>
                <span className="text-slate-400 font-medium">/ 90 days</span>
              </div>
              <div className="progress-v2-container mb-2">
                <div className="progress-v2-bar soul-gradient" style={{ width: "50%" }}></div>
              </div>
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-tighter">50% REMAINING</span>
            </div>

            {/* Next Payment */}
            <div className="metric-v2-card">
              <span className="metric-v2-label mb-4 block">NEXT PAYMENT</span>
              <div className="flex items-center gap-2 mb-2">
                 <span className="text-2xl font-bold tracking-tight">Apr 15, 3PM</span>
              </div>
              <div className="badge-settle mb-6">AUTO-SETTLE</div>
              <div className="countdown-v2">
                 <span className="countdown-label">Countdown:</span>
                 <span className="countdown-timer font-mono text-fuchsia-600">04d : 12h : 30m</span>
              </div>
            </div>

            {/* Withdrawn */}
            <div className="metric-v2-card">
              <div className="flex justify-between items-baseline mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">0.80</span>
                  <span className="text-lg font-mono text-slate-400">ETH</span>
                </div>
                <div className="card-icon-box bg-fuchsia-50 p-2 rounded-lg">
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                </div>
              </div>
              <div className="flex justify-between items-center mb-2">
                 <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">PROGRESS</span>
                 <span className="text-[9px] font-extrabold text-fuchsia-600">32%</span>
              </div>
              <div className="progress-v2-container">
                <div className="progress-v2-bar soul-gradient" style={{ width: "32%" }}></div>
              </div>
            </div>
          </div>

          {/* Activity Table */}
          <section className="activity-v2-section">
            <div className="activity-v2-header flex justify-between items-center mb-8 px-4">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">Recent Stream Activity</h3>
              <a href="#" className="text-sm font-bold text-fuchsia-600 hover:text-fuchsia-700 transition-colors">View All Transactions</a>
            </div>

            <div className="activity-v2-table">
               <div className="activity-table-head">
                  <div>TRANSACTION HASH</div>
                  <div>ACTION</div>
                  <div>AMOUNT</div>
                  <div>TIMESTAMP</div>
                  <div className="text-right">STATUS</div>
               </div>
               
               <div className="activity-table-rows">
                  {ACTIVITIES.map((activity) => (
                    <div key={activity.id} className="activity-row group">
                       <div className="font-mono text-fuchsia-600 font-bold text-sm tracking-tight">{activity.hash}</div>
                       <div className="font-medium text-slate-700">{activity.action}</div>
                       <div className="font-mono font-bold text-slate-900">{activity.amount}</div>
                       <div className="text-slate-400 font-medium text-sm">{activity.timestamp}</div>
                       <div className="text-right">
                          <span className="badge-confirmed">CONFIRMED</span>
                       </div>
                    </div>
                  ))}
               </div>

               <div className="activity-pagination">
                  <button className="page-btn" disabled>
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
                  </button>
                  <span className="page-info">Page 1 of 5</span>
                  <button className="page-btn">
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
                  </button>
               </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  )
}

function SidebarLink({ label, icon, active, onClick }: { label: string; icon: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`sidebar-v2-link ${active ? "active" : ""}`}>
      <div className="sidebar-v2-icon">
         {renderIcon(icon)}
      </div>
      <span>{label}</span>
    </button>
  )
}

function renderIcon(iconName: string) {
  switch (iconName) {
    case "dashboard": return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
    case "waves": return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M2 12s3-4 5-4c3 0 4 2 6 2 3 0 4-2 6-2 2 0 5 4 5 4" /></svg>
    case "insights": return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 21H3V3M21 9l-7 7-4-4-7 7" /></svg>
    case "settings": return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
    default: return null
  }
}
