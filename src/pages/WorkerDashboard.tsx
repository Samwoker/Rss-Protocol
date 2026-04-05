import { useState } from "react"

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

  return (
    <div className="gt-layout">
      {/* Sidebar - Ground Truth */}
      <aside className="gt-sidebar">
        <div className="mb-8">
          <div className="flex items-center gap-3 p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
            <div className="w-10 h-10 rounded-full bg-[#e0f7f8] flex items-center justify-center text-[#006970]">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Connected</p>
              <p className="text-sm font-mono font-bold text-slate-900">0x...1234</p>
            </div>
          </div>
        </div>

        <nav className="space-y-1">
          {["Dashboard", "Streams", "Analytics", "Settings"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                activeTab === tab.toLowerCase() 
                  ? "bg-white text-[#983784] font-bold shadow-sm" 
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              <span>{tab}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content - Ground Truth */}
      <main className="gt-main">
        <div className="max-w-5xl mx-auto space-y-12">
          
          {/* Hero Section */}
          <section className="gt-hero-card">
            <div className="space-y-4">
              <span className="text-[#006970] font-bold tracking-widest uppercase text-xs">Worker Dashboard</span>
              <h2 className="text-slate-500 text-lg font-medium mb-1">Withdrawable Balance</h2>
              <div className="flex items-baseline mb-4">
                <span className="gt-balance-hero">0.25</span>
                <span className="gt-balance-unit">ETH</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <p>Next claim available in <span className="font-mono font-bold text-slate-900">4h 12m</span></p>
              </div>
            </div>
            <button className="gt-withdraw-btn shadow-xl hover:shadow-teal-900/20">
              WITHDRAW
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h9zm-9-2h10V8H12v8z"/>
              </svg>
            </button>
          </section>

          {/* Ledger & Sidebar Grid */}
          <div className="grid grid-cols-12 gap-10">
            
            {/* Withdrawal History */}
            <div className="col-span-12 lg:col-span-7 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Withdrawal History</h3>
                <button className="text-[#983784] font-bold text-sm flex items-center gap-1 hover:underline">
                  View All
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-3 px-6 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <div>Date</div>
                  <div className="text-center">Status</div>
                  <div className="text-right">Amount</div>
                </div>

                {ACTIVITIES.map((tx) => (
                  <div key={tx.id} className="gt-ledger-row">
                    <div className="flex flex-col">
                      <span className="text-slate-900 font-bold">{tx.date}</span>
                      <span className="text-xs text-slate-400 font-mono">Tx: {tx.txHash}</span>
                    </div>
                    <div className="gt-status-pill">
                      <div className="gt-status-dot" />
                      {tx.status}
                    </div>
                    <div className="text-right font-mono font-bold text-slate-900">
                      {tx.amount}
                    </div>
                  </div>
                ))}

                {/* Pagination */}
                <div className="flex items-center justify-center gap-6 pt-8 border-t border-slate-100">
                  <button className="p-3 bg-white rounded-xl shadow-sm disabled:opacity-30" disabled>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
                  </button>
                  <span className="text-sm font-bold text-slate-500">Page <span className="text-slate-900">1</span> of 5</span>
                  <button className="p-3 bg-white rounded-xl shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Contract Manifest */}
            <div className="col-span-12 lg:col-span-5 space-y-8">
              <div className="gt-manifest-panel space-y-8">
                <h3 className="text-xl font-bold text-slate-900">Contract Details</h3>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#006970]/60">Employer Address</p>
                    <div className="gt-manifest-item">
                      <span className="font-mono text-sm text-slate-900">0x71C7...6b8f</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#006970" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cursor-pointer hover:scale-110 transition-transform"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#006970]/60">Worker Address (You)</p>
                    <div className="gt-manifest-item">
                      <span className="font-mono text-sm text-slate-900">0x00...1234</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#006970" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cursor-pointer hover:scale-110 transition-transform"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="gt-stat-brick">
                      <p className="text-[10px] font-bold text-[#006970]/60 uppercase mb-2">Total Salary</p>
                      <p className="text-xl font-mono font-extrabold text-slate-900">5.00 ETH</p>
                    </div>
                    <div className="gt-stat-brick">
                      <p className="text-[10px] font-bold text-[#006970]/60 uppercase mb-2">Period</p>
                      <p className="text-xl font-mono font-extrabold text-slate-900">7 Days</p>
                    </div>
                  </div>
                  <div className="pt-6 border-t border-[#006970]/10">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold text-slate-500">Contract Health</span>
                      <span className="text-xs font-mono font-bold text-[#006970]">Excellent</span>
                    </div>
                    <div className="gt-health-bar-bg">
                      <div className="gt-health-bar-fill w-[92%]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Help Card */}
              <div className="gt-help-card">
                <div className="gt-help-icon text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Need help?</h4>
                  <p className="text-xs text-slate-400 font-medium">Contact payroll support or view docs.</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}
