import { useState } from "react"

type StreamStatus = "All" | "Active" | "Completed" | "Cancelled"

interface Stream {
  id: string
  hash: string
  employer: string
  worker: string
  amount: string
  currency: string
  status: StreamStatus
  type: "waves" | "bolt" | "monitoring" | "stream" | "assignment_turned_in" | "cancel"
}

const DUMMY_STREAMS: Stream[] = [
  { id: "1", hash: "0x71C765...69721", employer: "Aave Labs", worker: "0x9a2...1b4", amount: "5,250.00", currency: "USDC", status: "Active", type: "waves" },
  { id: "2", hash: "0x4a182b...e4f09", employer: "Uniswap Fnd.", worker: "0x1f2...9c8", amount: "12,000.00", currency: "DAI", status: "Completed", type: "assignment_turned_in" },
  { id: "3", hash: "0x992b11...33aa1", employer: "Chainlink Labs", worker: "0x77e...a21", amount: "8,500.00", currency: "LINK", status: "Active", type: "bolt" },
  { id: "4", hash: "0x1102e3...b1b22", employer: "OpenSea", worker: "0x883...22c", amount: "1,400.00", currency: "WETH", status: "Cancelled", type: "cancel" },
  { id: "5", hash: "0xb0442a...ff001", employer: "Paradigm", worker: "0x221...e00", amount: "15,000.00", currency: "USDC", status: "Active", type: "monitoring" },
  { id: "6", hash: "0xc8e011...db921", employer: "Lido Finance", worker: "0x334...90d", amount: "4,200.00", currency: "stETH", status: "Active", type: "stream" },
]

export function ExplorerPage() {
  const [activeTab, setActiveTab] = useState<StreamStatus>("All")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredStreams = DUMMY_STREAMS.filter(s => {
    const matchesTab = activeTab === "All" || s.status === activeTab
    const matchesSearch = s.employer.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         s.hash.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesTab && matchesSearch
  })

  return (
    <div className="explorer-container">
      {/* Hero Search Section */}
      <header className="explorer-header">
        <div className="explorer-header-content">
          <h1 className="explorer-title">Contract Explorer</h1>
          <p className="explorer-subtitle">
            Verify real-time payroll streams, employee contracts, and immutable transaction ledgers across the ecosystem.
          </p>
          
          <div className="explorer-search-wrap">
            <div className="search-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <input
              type="text"
              className="explorer-search-input"
              placeholder="Search by contract address or employer"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </header>

      {/* Filter Navigation & Metrics */}
      <div className="explorer-toolbar">
        <div className="explorer-tabs">
          {(["All", "Active", "Completed", "Cancelled"] as StreamStatus[]).map((tab) => (
            <button
              key={tab}
              className={`explorer-tab ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="explorer-metrics">
          <div className="metric-item">
            <span className="metric-label">Total Volume</span>
            <span className="metric-value secondary-text">$1,482,904.32</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Active Streams</span>
            <span className="metric-value primary-text">842</span>
          </div>
        </div>
      </div>

      {/* Contract Results Grid */}
      <div className="explorer-grid">
        {filteredStreams.map((stream) => (
          <div key={stream.id} className="explorer-card">
            <div className="card-header">
              <div className={`card-icon-box ${stream.status.toLowerCase()}`}>
                 {renderIcon(stream.type)}
              </div>
              <span className={`status-badge ${stream.status.toLowerCase()}`}>
                {stream.status}
              </span>
            </div>

            <div className="card-body">
              <div className="card-section">
                <span className="card-label">Contract Hash</span>
                <code className="card-hash font-mono">{stream.hash}</code>
              </div>

              <div className="card-meta-grid">
                <div className="meta-item">
                  <span className="card-label">Employer</span>
                  <p className="meta-text">{stream.employer}</p>
                </div>
                <div className="meta-item">
                  <span className="card-label">Worker</span>
                  <p className="meta-text truncate">{stream.worker}</p>
                </div>
              </div>
            </div>

            <div className="card-footer">
              <div className="card-footer-left">
                <span className="card-label">
                  {stream.status === "Completed" ? "Total Paid Out" : "Monthly Salary"}
                </span>
                <p className="card-amount font-mono">
                  {stream.amount} <span className="card-currency">{stream.currency}</span>
                </p>
              </div>
              <button className="card-action-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Simulation */}
      <div className="explorer-pagination">
          <div className="pagination-numbers">
             <button className="page-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg></button>
             <button className="page-btn active">1</button>
             <button className="page-btn">2</button>
             <button className="page-btn">3</button>
             <button className="page-btn dot">...</button>
             <button className="page-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg></button>
          </div>
          <button className="load-more-btn">LOAD MORE CONTRACTS</button>
      </div>
    </div>
  )
}

function renderIcon(type: Stream["type"]) {
  switch (type) {
    case "waves":
      return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3-4 5-4c3 0 4 2 6 2 3 0 4-2 6-2 2 0 5 4 5 4" /></svg>
    case "bolt":
      return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
    case "monitoring":
      return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18M7 16l4-4 4 4 4-5" /></svg>
    case "stream":
      return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16" /></svg>
    case "assignment_turned_in":
      return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
    case "cancel":
      return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
  }
}
