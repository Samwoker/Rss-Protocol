import { useEffect, useState } from "react";
import { formatEther } from "ethers";
import { useAccount } from "wagmi";
import {
  BLOCK_EXPLORER_BASE_URL,
  clawback,
  getStreamContractSnapshot,
  isStreamContractConfigured,
  getRecentStreamEvents,
  getActiveStreamAddress,
  getReadProvider,
  startWork,
  humanizeError,
} from "@/contract";
import {
  ClawbackModal,
  type ClawbackStatus,
} from "@/components/modals/ClawbackModal";

interface FundingHistory {
  id: string;
  txHash: string;
  amount: string;
  date: string;
  status: "SUCCESS" | "FAILED";
}

// fundingHistory is loaded dynamically from the on-chain contract using
// getRecentStreamEvents and displayed below.

interface ContractDashboardProps {
  onConnectWallet: () => void;
}

const truncateMiddle = (value: string, start = 6, end = 4): string => {
  if (!value) return "";
  if (value.length <= start + end) return value;
  return `${value.slice(0, start)}...${value.slice(-end)}`;
};

export function ContractDashboard({ onConnectWallet }: ContractDashboardProps) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [depositAmount, setDepositAmount] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [contractBalanceWei, setContractBalanceWei] = useState(0n);
  const [contractBalance, setContractBalance] = useState("0.0000");
  const [totalEarned, setTotalEarned] = useState("0.0000");
  const [clawbackAvailable, setClawbackAvailable] = useState("0.0000 ETH");
  const [clawbackStatus, setClawbackStatus] = useState<ClawbackStatus>("idle");
  const [clawbackError, setClawbackError] = useState<string | null>(null);
  const [clawbackTxHash, setClawbackTxHash] = useState<string | null>(null);
  const [streamStatus, setStreamStatus] = useState<number>(0);
  const [isStartWorkLoading, setIsStartWorkLoading] = useState(false);

  // Dynamic funding state
  const [fundingHistory, setFundingHistory] = useState<FundingHistory[]>([]);

  const { address, isConnected } = useAccount();

  const truncatedAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "Disconnected";
  const clawbackExplorerUrl =
    clawbackTxHash && BLOCK_EXPLORER_BASE_URL
      ? `${BLOCK_EXPLORER_BASE_URL.replace(/\/$/, "")}/tx/${clawbackTxHash}`
      : null;

  const navItems = [
    { label: "Dashboard", icon: "dashboard" },
    { label: "Streams", icon: "waves" },
    { label: "Explorer", icon: "search" },
    { label: "Analytics", icon: "insights" },
    { label: "Deploy", icon: "bolt" },
    { label: "Settings", icon: "settings" },
  ];

  const handleNavClick = (tab: string) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  const loadContractSnapshot = async () => {
    if (!isStreamContractConfigured()) return;

    try {
      const snapshot = await getStreamContractSnapshot();
      setContractBalanceWei(snapshot.contractBalance);
      setContractBalance(
        Number(formatEther(snapshot.contractBalance)).toFixed(4),
      );
      setTotalEarned(Number(formatEther(snapshot.earned)).toFixed(4));
      setClawbackAvailable(
        `${Number(formatEther(snapshot.contractBalance)).toFixed(4)} ETH`,
      );
      setStreamStatus(snapshot.status);
    } catch (error) {
      console.error("Failed to fetch contract snapshot", error);
    }
  };

  // Load funding history for the active stream
  const loadFundingHistory = async () => {
    if (!isStreamContractConfigured()) return;
    try {
      const addr = getActiveStreamAddress();
      const events = await getRecentStreamEvents(addr);
      const provider = getReadProvider();
      const items: FundingHistory[] = [];

      for (const ev of events.filter((e) => e.name === "ContractFunded")) {
        const block = ev.blockNumber
          ? await provider.getBlock(ev.blockNumber)
          : null;
        const ts =
          block &&
            typeof (block as unknown as { timestamp?: number }).timestamp ===
            "number"
            ? new Date(
              ((block as unknown as { timestamp?: number })
                .timestamp as number) * 1000,
            ).toLocaleString()
            : "Unknown";

        // event ContractFunded(address indexed employer,address indexed worker,uint256 totalSalary,uint256 totalDuration,uint8 paymentPeriod)
        // Normalize args: can be array-like or record depending on parseLog result
        const args = ev.args as unknown as Record<string, unknown> &
          ArrayLike<unknown>;
        const totalSalaryRaw = (args["totalSalary"] as unknown) ?? args[2];

        // Best-effort normalization to a human readable ETH string
        let amountStr = String(totalSalaryRaw ?? "0");
        try {
          if (typeof totalSalaryRaw === "bigint") {
            amountStr = formatEther(totalSalaryRaw);
          } else if (typeof totalSalaryRaw === "number") {
            // convert number to bigint then format (rare)
            amountStr = formatEther(BigInt(totalSalaryRaw));
          } else if (typeof totalSalaryRaw === "string") {
            if ((totalSalaryRaw as string).startsWith("0x")) {
              // hex string -> BigInt
              amountStr = formatEther(BigInt(totalSalaryRaw as string));
            } else {
              // decimal string, show as-is
              amountStr = totalSalaryRaw as string;
            }
          } else {
            // fallback to toString
            amountStr = String(totalSalaryRaw);
          }
        } catch {
          // if conversion fails, leave a best-effort string
          amountStr = String(totalSalaryRaw ?? "0");
        }

        items.push({
          id: ev.txHash,
          txHash: ev.txHash,
          amount: `${amountStr} ETH`,
          date: ts,
          status: "SUCCESS",
        });
      }

      setFundingHistory(items);
    } catch (err) {
      console.error("Failed to load funding history", err);
    }
  };

  useEffect(() => {
    void loadContractSnapshot();
    void loadFundingHistory();
  }, []);

  const handleClawback = async () => {
    if (!isConnected) {
      onConnectWallet();
      return;
    }

    try {
      if (!isStreamContractConfigured()) {
        throw new Error(
          "Missing contract setup. Ensure VITE_RPC_URL and VITE_STREAM_CONTRACT_ADDRESS are set in .env.",
        );
      }

      // Re-read the latest snapshot to validate caller role & fresh state
      const snapshot = await getStreamContractSnapshot();

      // Client-side role guard: only the configured employer should be able to clawback
      if (
        !address ||
        address.toLowerCase() !== snapshot.employer.toLowerCase()
      ) {
        setClawbackError(
          "Only the employer can trigger a clawback for this stream.",
        );
        setClawbackStatus("error");
        return;
      }

      // Ensure there is a reclaimable balance
      if (snapshot.contractBalance <= 0n) {
        setClawbackError(
          "No reclaimable contract balance is currently available.",
        );
        setClawbackStatus("error");
        return;
      }

      setClawbackError(null);
      setClawbackTxHash(null);
      setClawbackStatus("signing");

      const tx = await clawback();
      setClawbackTxHash(tx.hash);
      setClawbackStatus("pending");
      await tx.wait();
      setClawbackStatus("success");

      // Refresh UI after successful clawback
      await loadContractSnapshot();
      await loadFundingHistory();
    } catch (error) {
      console.error("Clawback transaction failed", error);
      // Show a concise, user-friendly message instead of raw RPC dumps
      setClawbackError(humanizeError(error));
      setClawbackStatus("error");
    }
  };

  const handleFund = async () => {
    if (!isConnected) {
      onConnectWallet();
      return;
    }

    try {
      if (!isStreamContractConfigured()) {
        throw new Error(
          "Missing contract setup. Ensure VITE_RPC_URL and VITE_STREAM_CONTRACT_ADDRESS are set in .env.",
        );
      }

      if (!depositAmount || depositAmount.trim() === "") {
        setFundingError("Please enter an amount to deposit (ETH).");
        setFundingStatus("error");
        return;
      }

      const amountWei = parseEther(depositAmount.trim());

      // Re-read the latest snapshot and confirm the connected wallet is the employer.
      const snapshot = await getStreamContractSnapshot();

      if (
        !address ||
        address.toLowerCase() !== snapshot.employer.toLowerCase()
      ) {
        // Friendly UX: tell the user who is allowed to fund this stream
        setFundingError(
          "Only the employer that created this stream can deposit funds.",
        );
        setFundingStatus("error");
        return;
      }

      setFundingError(null);
      setFundingStatus("signing");

      const addr = getActiveStreamAddress();
      const tx = await fundStreamAt(addr, amountWei);
      setFundingStatus("pending");
      await tx.wait();
      setFundingStatus("success");

      // Refresh UI after successful funding
      await loadContractSnapshot();
      await loadFundingHistory();
    } catch (error) {
      console.error("Funding transaction failed", error);
      // Surface a concise, user-friendly message instead of raw RPC traces
      setFundingError(humanizeError(error));
      setFundingStatus("error");
    }
  };

  const handleStartWork = async () => {
    if (!isConnected) {
      onConnectWallet();
      return;
    }

    try {
      setIsStartWorkLoading(true);
      const tx = await startWork();
      await tx.wait();
      await loadContractSnapshot();
    } catch (error) {
      console.error("Start work failed", error);
    } finally {
      setIsStartWorkLoading(false);
    }
  };

  const isClawbackBusy =
    clawbackStatus === "signing" || clawbackStatus === "pending";
  const isClawbackDisabled =
    isClawbackBusy || (isConnected && contractBalanceWei <= 0n);

  return (
    <div className="dashboard-layout">
      {/* Sidebar Navigation - Shared with Worker Dashboard */}
      <aside
        className={`dashboard-sidebar ${isSidebarOpen ? "dashboard-sidebar--open" : ""}`}
      >
        <button
          type="button"
          className="dashboard-sidebar__toggle"
          onClick={() => setIsSidebarOpen((prev) => !prev)}
          aria-expanded={isSidebarOpen}
          aria-controls="employer-sidebar-content"
        >
          <span className="material-symbols-outlined">
            {isSidebarOpen ? "close" : "menu"}
          </span>
          <span>{isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}</span>
        </button>

        <div
          id="employer-sidebar-content"
          className="dashboard-sidebar__content"
        >
          <div className="connected-card">
            <div
              className="connected-card__icon"
              style={{
                color: isConnected
                  ? "var(--secondary)"
                  : "var(--on-surface-variant)",
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontVariationSettings: isConnected ? "'FILL' 1" : "'FILL' 0",
                }}
              >
                {isConnected ? "account_balance_wallet" : "no_accounts"}
              </span>
            </div>
            <div>
              <p className="connected-card__label">
                {isConnected ? "Connected" : "Not Connected"}
              </p>
              <p className="connected-card__address">{truncatedAddress}</p>
            </div>
          </div>

          <nav className="sidebar-nav">
            {navItems.map((item) => {
              const isActive = activeTab === item.label.toLowerCase();
              return (
                <button
                  key={item.label}
                  onClick={() => handleNavClick(item.label.toLowerCase())}
                  className={`sidebar-nav__item ${isActive ? "sidebar-nav__item--active" : ""}`}
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="dashboard-main">
        <div className="employer-header">
          <div>
            <h1 className="employer-header__title">Employer Dashboard</h1>
            <p className="employer-header__subtitle">
              Manage your smart contract liquidity, track funding history, and
              oversee payroll automation.
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
              <span className="balance-value-lg">{contractBalance}</span>
              <span className="balance-unit-lg">ETH</span>
            </div>
            <div className="sub-metrics-row">
              <div className="sub-metric">
                <span className="sub-metric__label">Estimated Runway</span>
                <span className="sub-metric__value">42 Days</span>
              </div>
              <div className="sub-metric">
                <span className="sub-metric__label">Total Earned</span>
                <span className="sub-metric__value">{totalEarned} ETH</span>
              </div>
              <div className="sub-metric">
                <span className="sub-metric__label">Active Streams</span>
                <span className="sub-metric__value">1</span>
              </div>
            </div>
            <div className="card-employer__bg-decoration"></div>
          </div>

          <div className="card-employer card-employer--clawback">
            <div>
              <div
                className="flex items-center gap-2 mb-4"
                style={{ color: "var(--primary)" }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "20px" }}
                >
                  verified_user
                </span>
                <span className="text-[11px] font-bold uppercase tracking-widest">
                  Clawback Protection
                </span>
              </div>
              <p className="text-[13px] text-slate-500 leading-relaxed">
                Eligible to reclaim inactive funds from terminated streams.
                Status: <strong>{clawbackAvailable} Available</strong>
              </p>
            </div>
            <button
              className="btn-secondary"
              style={{
                padding: "14px",
                borderRadius: "12px",
                fontSize: "13px",
                width: "100%",
                border: "1px solid var(--outline-variant)",
              }}
              onClick={handleClawback}
              disabled={isClawbackDisabled}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "18px", marginRight: "8px" }}
              >
                history_edu
              </span>
              {isClawbackBusy ? "Processing..." : "Trigger Clawback"}
            </button>

            {streamStatus === 0 && (
              <button
                className="btn-primary"
                style={{
                  marginTop: "12px",
                  padding: "14px",
                  borderRadius: "12px",
                  fontSize: "13px",
                  width: "100%",
                  background: "#A855F7",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                }}
                onClick={handleStartWork}
                disabled={isStartWorkLoading}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "18px", marginRight: "8px" }}
                >
                  play_circle
                </span>
                {isStartWorkLoading ? "Starting..." : "Start Work"}
              </button>
            )}
          </div>
        </div>

        {/* Action Section: History & Deposit */}
        <div
          className="employer-layout-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(12, 1fr)",
            gap: "48px",
            alignItems: "start",
          }}
        >
          {/* Left: Funding History */}
          <div className="history-section">
            <h3 className="section-title-employer">Funding History</h3>

            <div
              className="history-header-labels"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr 100px",
                padding: "0 32px 12px",
                fontSize: "10px",
                fontWeight: "800",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                color: "#94a3b8",
              }}
            >
              <span>Tx Hash</span>
              <span>Amount</span>
              <span>Date</span>
              <span style={{ textAlign: "right" }}>Status</span>
            </div>

            <div className="history-list">
              {fundingHistory.length > 0 ? (
                fundingHistory.map((tx) => (
                  <div key={tx.id} className="history-item-employer">
                    <a
                      className="history-item__hash"
                      href={`${BLOCK_EXPLORER_BASE_URL}/tx/${tx.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      title={tx.txHash}
                    >
                      {truncateMiddle(tx.txHash)}
                    </a>
                    <span className="history-item__amount">{tx.amount}</span>
                    <span className="history-item__date">{tx.date}</span>
                    <div style={{ textAlign: "right" }}>
                      <span
                        className={`status-badge ${tx.status === "SUCCESS" ? "status-badge--success" : "status-badge--error"}`}
                        style={{ fontSize: "9px", padding: "4px 8px" }}
                      >
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-on-surface-variant">
                  No funding activity found for this contract.
                </div>
              )}
            </div>
          </div>

          {/* Right: Deposit Panel */}
          <div className="deposit-section">
            <div className="deposit-panel">
              <h3
                className="section-title-employer"
                style={{ fontSize: "20px", marginBottom: "32px" }}
              >
                Deposit Funds
              </h3>

              <div className="field-group">
                <label className="field-label">Asset to Stream</label>
                <div className="asset-selector">
                  <div className="asset-icon-box">
                    <img
                      src="https://cryptologos.cc/logos/ethereum-eth-logo.png?v=024"
                      alt="ETH"
                      style={{ width: "18px" }}
                    />
                  </div>
                  <div className="asset-info">
                    <p className="asset-name">Ethereum</p>
                    <p className="asset-symbol">Native Currency</p>
                  </div>
                  <span className="material-symbols-outlined text-slate-400">
                    expand_more
                  </span>
                </div>
              </div>

              <div className="field-group" style={{ marginBottom: "32px" }}>
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
                    <button
                      className="btn-amount-preset"
                      onClick={() => setDepositAmount("0.56")}
                    >
                      25%
                    </button>
                    <button
                      className="btn-amount-preset"
                      onClick={() => setDepositAmount("2.25")}
                    >
                      MAX
                    </button>
                  </div>
                </div>
              </div>

              <div className="tx-details-box">
                <div className="tx-detail-row">
                  <span className="tx-detail-label">Network Fee</span>
                  <span className="tx-detail-value">~0.002 ETH</span>
                </div>
                <div className="tx-detail-row">
                  <span className="tx-detail-label">
                    Estimated Confirmation
                  </span>
                  <span className="tx-detail-value">&lt; 15 Seconds</span>
                </div>
              </div>

              <div className="fund-actions">
                {/* Top-ups are not supported for arbitrary existing streams in the UI.
                    Disable the button to avoid confusing reverts from the contract
                    (some stream implementations don't accept raw ETH transfers). */}
                <button
                  className="btn-fund"
                  disabled
                  title="Top-ups unavailable: use the factory or contact the employer"
                  style={{
                    opacity: 0.75,
                    cursor: "not-allowed",
                    padding: "12px 20px",
                    borderRadius: 12,
                    fontWeight: "700",
                  }}
                >
                  TOP-UP UNAVAILABLE
                </button>

                <div
                  style={{
                    marginTop: 12,
                    fontSize: 13,
                    color: "var(--on-surface-variant)",
                  }}
                >
                  This stream does not accept direct top-ups via the UI. To add
                  funds, deploy a new stream via the Deploy page or contact the
                  employer to fund the contract through the factory.
                </div>

                {/* If you want to enable top-ups for your specific stream implementation,
                    implement a payable `fund`/`deposit` method on the contract and
                    update the frontend to call that function instead of a raw transfer. */}
              </div>
            </div>
          </div>
        </div>
      </main>

      <ClawbackModal
        status={clawbackStatus}
        onClose={() => {
          setClawbackStatus("idle");
          setClawbackError(null);
        }}
        onRetry={handleClawback}
        amount={clawbackAvailable}
        txHash={clawbackTxHash}
        explorerUrl={clawbackExplorerUrl}
        errorMessage={clawbackError}
      />
    </div>
  );
}
