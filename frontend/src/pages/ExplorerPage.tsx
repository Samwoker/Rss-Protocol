import { useState, useEffect } from "react"
import { formatEther } from "ethers"
import { getAllStreams, getStreamSnapshotAt } from "@/contract/factory"
import { setActiveStreamAddress } from "@/contract/config"

type StreamStatus = "All" | "Active" | "Completed" | "Cancelled"

interface StreamData {
  address: string
  employer: string
  worker: string
  totalSalary: string
  statusStr: StreamStatus
  type: "waves" | "bolt" | "monitoring" | "stream" | "assignment_turned_in" | "cancel"
}

export function ExplorerPage() {
  const [activeTab, setActiveTab] = useState<StreamStatus>("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [streams, setStreams] = useState<StreamData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchAllStreams() {
      try {
        setIsLoading(true)
        const addresses = await getAllStreams()
        
        const detailedStreams = await Promise.all(
          addresses.map(async (addr) => {
            try {
              const snapshot = await getStreamSnapshotAt(addr)
              
              // Map contract status (uint8) to UI string
              // 0: PENDING, 1: ACTIVE, 2: ENDED
              let s: StreamStatus = "Active"
              if (snapshot.status === 0) s = "Active" // Treat pending as active in UI for now
              if (snapshot.status === 2) s = "Completed"
              
              // Deduce a type icon based on duration/salary for variety
              let type: StreamData["type"] = "stream"
              if (snapshot.totalDuration < 86400n * 7n) type = "bolt"
              if (snapshot.totalSalary > 10000000000000000000n) type = "waves" // > 10 ETH

              return {
                address: addr,
                employer: snapshot.employer,
                worker: snapshot.worker,
                totalSalary: formatEther(snapshot.totalSalary),
                statusStr: s,
                type,
              }
            } catch (err) {
              console.error(`Failed to fetch details for ${addr}`, err)
              return null
            }
          })
        )

        setStreams(detailedStreams.filter((s): s is StreamData => s !== null))
      } catch (error) {
        console.error("Failed to fetch explorer data", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAllStreams()
  }, [])

  const filteredStreams = streams.filter(s => {
    const matchesTab = activeTab === "All" || s.statusStr === activeTab
    const matchesSearch = 
      s.employer.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.worker.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesTab && matchesSearch
  })

  const handleSelectStream = (addr: string) => {
    setActiveStreamAddress(addr)
    // Shift focus to dashboard
    window.location.hash = "#dashboard"
  }

  const truncate = (str: string) => `${str.slice(0, 6)}...${str.slice(-4)}`

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
            <span className="metric-value secondary-text">
              {streams.reduce((acc, s) => acc + parseFloat(s.totalSalary), 0).toFixed(2)} ETH
            </span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Live Streams</span>
            <span className="metric-value primary-text">{streams.length}</span>
          </div>
        </div>
      </div>

      {/* Contract Results Grid */}
      <div className="explorer-grid">
        {isLoading ? (
          <div className="col-span-full py-20 text-center">
            <div className="tx-spinner-soul mx-auto mb-4"></div>
            <p className="text-on-surface-variant font-medium">Querying Factory Archive...</p>
          </div>
        ) : filteredStreams.length > 0 ? (
          filteredStreams.map((stream) => (
            <div key={stream.address} className="explorer-card">
              <div className="card-header">
                <div className={`card-icon-box ${stream.statusStr.toLowerCase()}`}>
                   {renderIcon(stream.type)}
                </div>
                <span className={`status-badge ${stream.statusStr.toLowerCase()}`}>
                  {stream.statusStr}
                </span>
              </div>

              <div className="card-body">
                <div className="card-section">
                  <span className="card-label">Contract Address</span>
                  <code className="card-hash font-mono">{truncate(stream.address)}</code>
                </div>

                <div className="card-meta-grid">
                  <div className="meta-item">
                    <span className="card-label">Employer</span>
                    <p className="meta-text truncate">{truncate(stream.employer)}</p>
                  </div>
                  <div className="meta-item">
                    <span className="card-label">Worker</span>
                    <p className="meta-text truncate">{truncate(stream.worker)}</p>
                  </div>
                </div>
              </div>

              <div className="card-footer">
                <div className="card-footer-left">
                  <span className="card-label">
                    Total Salary
                  </span>
                  <p className="card-amount font-mono">
                    {parseFloat(stream.totalSalary).toFixed(3)} <span className="card-currency">ETH</span>
                  </p>
                </div>
                <button 
                  className="card-action-btn"
                  onClick={() => handleSelectStream(stream.address)}
                  title="View in Dashboard"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-outline-variant rounded-3xl">
             <p className="text-on-surface-variant">No salary streams found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Pagination Simulation */}
      <div className="explorer-pagination">
          <div className="pagination-numbers">
             <button className="page-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg></button>
             <button className="page-btn active">1</button>
             <button className="page-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg></button>
          </div>
      </div>
    </div>
  )
}

function renderIcon(type: StreamData["type"]) {
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
    default:
      return null
  }
}
