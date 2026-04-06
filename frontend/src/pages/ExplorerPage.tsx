import { useEffect, useState, useCallback } from "react";
import { formatEther } from "ethers";
import { useAccount } from "wagmi";
import {
  getAllStreams,
  getStreamSnapshotAt,
  withdrawFromStreamAt,
  BLOCK_EXPLORER_BASE_URL,
  humanizeError,
} from "@/contract";
import {
  WithdrawModal,
  type WithdrawalStatus,
} from "@/components/modals/WithdrawModal";

type StreamStatus = "All" | "Active" | "Completed" | "Cancelled";

interface StreamData {
  address: string;
  employer: string;
  worker: string;
  totalSalary: string; // ETH as string
  statusStr: StreamStatus;
  statusNum?: number;
  withdrawableWei?: bigint;
  withdrawable?: string; // ETH string for display
  type:
    | "waves"
    | "bolt"
    | "monitoring"
    | "stream"
    | "assignment_turned_in"
    | "cancel";
}

export function ExplorerPage() {
  const { address, isConnected } = useAccount();

  const [activeTab, setActiveTab] = useState<StreamStatus>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [streams, setStreams] = useState<StreamData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Withdraw modal state
  const [withdrawStatus, setWithdrawStatus] =
    useState<WithdrawalStatus>("idle");
  const [currentWithdrawAddress, setCurrentWithdrawAddress] = useState<
    string | null
  >(null);
  const [currentWithdrawAmount, setCurrentWithdrawAmount] =
    useState<string>("0.0000 ETH");
  const [withdrawTxHash, setWithdrawTxHash] = useState<string | null>(null);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  const fetchAllStreams = useCallback(async () => {
    setIsLoading(true);
    try {
      const addresses = await getAllStreams();
      const results = await Promise.all(
        addresses.map(async (addr) => {
          try {
            const snap = await getStreamSnapshotAt(addr);

            // Map numeric status to UI string
            // Contract README: 0 = PENDING, 1 = ACTIVE, 2 = ENDED
            let s: StreamStatus = "Active";
            if (snap.status === 0) s = "Active"; // show pending as active
            if (snap.status === 2) s = "Completed";

            // If we can detect cancellation explicitly we'd map to Cancelled.
            // For now treat ENDED (2) as Completed (unless a cancel event exists).
            let type: StreamData["type"] = "stream";
            if (snap.totalDuration < 86400n * 7n) type = "bolt";
            if (snap.totalSalary > 10n * 10n ** 18n) type = "waves"; // > 10 ETH

            const withdrawableWei = snap.withdrawable ?? 0n;
            const withdrawable = `${Number(formatEther(withdrawableWei)).toFixed(6)} ETH`;

            return {
              address: addr,
              employer: snap.employer,
              worker: snap.worker,
              totalSalary: formatEther(snap.totalSalary),
              statusStr: s,
              statusNum: snap.status,
              type,
              withdrawableWei,
              withdrawable,
            } as StreamData;
          } catch (err) {
            // ignore individual failures so one bad stream doesn't stop listing
            console.error("Failed to load stream", addr, err);
            return null;
          }
        }),
      );

      setStreams(results.filter(Boolean) as StreamData[]);
    } catch (err) {
      console.error("Failed to fetch streams", err);
      setStreams([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAllStreams();

    // Optionally refresh periodically for near-real-time UI
    const tid = window.setInterval(() => {
      void fetchAllStreams();
    }, 15_000);

    return () => {
      window.clearInterval(tid);
    };
  }, [fetchAllStreams]);

  const normalizeWithdrawError = (err: unknown): string => {
    if (!err || typeof err !== "object")
      return "Withdrawal failed. Please try again.";

    const e = err as Record<string, unknown>;
    if (typeof e["reason"] === "string" && (e["reason"] as string).length > 0) {
      return e["reason"] as string;
    }
    if (
      typeof e["message"] === "string" &&
      (e["message"] as string).length > 0
    ) {
      return e["message"] as string;
    }

    // Try nested shapes some providers use
    const nested = (e["error"] ?? e["data"]) as
      | Record<string, unknown>
      | undefined;
    if (nested && typeof nested["message"] === "string")
      return nested["message"] as string;

    return String(err);
  };

  // Per-address withdraw flow (no global active stream mutation)
  const handleWithdraw = async (
    streamAddr: string,
    withdrawableWei?: bigint,
  ) => {
    // If nothing is withdrawable, early return
    if (!withdrawableWei || withdrawableWei <= 0n) {
      setWithdrawError("No funds are currently available for withdrawal.");
      setWithdrawStatus("error");
      setCurrentWithdrawAddress(streamAddr);
      setCurrentWithdrawAmount("0.0000 ETH");
      return;
    }

    setWithdrawError(null);
    setWithdrawStatus("signing");
    setCurrentWithdrawAddress(streamAddr);
    setCurrentWithdrawAmount(
      `${Number(formatEther(withdrawableWei)).toFixed(6)} ETH`,
    );
    setWithdrawTxHash(null);

    try {
      const tx = await withdrawFromStreamAt(streamAddr);
      // Safely read the hash without using `any`
      const txHash = (tx as { hash?: string })?.hash ?? null;
      setWithdrawTxHash(txHash);
      setWithdrawStatus("pending");
      await tx.wait();
      setWithdrawStatus("success");
      // refresh streams to reflect updated withdrawable/balance
      await fetchAllStreams();
    } catch (err) {
      console.error("Withdraw failed", err);
      // Show a concise, user-friendly message (avoid raw RPC error dumps)
      setWithdrawError(humanizeError(err));
      setWithdrawStatus("error");
    }
  };

  const closeWithdrawModal = () => {
    setWithdrawStatus("idle");
    setCurrentWithdrawAddress(null);
    setWithdrawTxHash(null);
    setWithdrawError(null);
    setCurrentWithdrawAmount("0.0000 ETH");
  };

  const retryWithdraw = async () => {
    if (!currentWithdrawAddress) return;
    const stream = streams.find((s) => s.address === currentWithdrawAddress);
    await handleWithdraw(currentWithdrawAddress, stream?.withdrawableWei);
  };

  const filteredStreams = streams.filter((s) => {
    const matchesTab = activeTab === "All" || s.statusStr === activeTab;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      q.length === 0 ||
      s.employer.toLowerCase().includes(q) ||
      s.worker.toLowerCase().includes(q) ||
      s.address.toLowerCase().includes(q);
    return matchesTab && matchesSearch;
  });

  const truncate = (str: string) => `${str.slice(0, 6)}...${str.slice(-4)}`;

  return (
    <div className="explorer-container">
      <header className="explorer-header">
        <div className="explorer-header-content">
          <h1 className="explorer-title">Contract Explorer</h1>
          <p className="explorer-subtitle">
            Browse deployed salary streams and interact when you're the
            registered worker.
          </p>

          <div className="explorer-search-wrap">
            <div className="search-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <input
              type="text"
              className="explorer-search-input"
              placeholder="Search by contract address, employer or worker"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </header>

      <div className="explorer-toolbar">
        <div className="explorer-tabs">
          {(["All", "Active", "Completed", "Cancelled"] as StreamStatus[]).map(
            (tab) => (
              <button
                key={tab}
                className={`explorer-tab ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ),
          )}
        </div>

        <div className="explorer-metrics">
          <div className="metric-item">
            <span className="metric-label">Total Volume</span>
            <span className="metric-value secondary-text">
              {streams
                .reduce((acc, s) => acc + parseFloat(s.totalSalary), 0)
                .toFixed(2)}{" "}
              ETH
            </span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Live Streams</span>
            <span className="metric-value primary-text">{streams.length}</span>
          </div>
        </div>
      </div>

      <div className="explorer-grid">
        {isLoading ? (
          <div className="col-span-full py-20 text-center">
            <div className="tx-spinner-soul mx-auto mb-4" />
            <p className="text-on-surface-variant font-medium">
              Querying Factory Archive...
            </p>
          </div>
        ) : filteredStreams.length > 0 ? (
          filteredStreams.map((stream) => {
            const isWorkerConnected =
              isConnected &&
              address &&
              address.toLowerCase() === stream.worker.toLowerCase();
            const withdrawableValue = stream.withdrawableWei ?? 0n;
            const canWithdraw = withdrawableValue > 0n && isWorkerConnected;

            return (
              <div key={stream.address} className="explorer-card">
                <div className="card-header">
                  <div
                    className={`card-icon-box ${stream.statusStr.toLowerCase()}`}
                  >
                    {renderIcon(stream.type)}
                  </div>
                  <span
                    className={`status-badge ${stream.statusStr.toLowerCase()}`}
                  >
                    {stream.statusStr}
                  </span>
                </div>

                <div className="card-body">
                  <div className="card-section">
                    <span className="card-label">Contract Address</span>
                    <code className="card-hash font-mono">
                      {truncate(stream.address)}
                    </code>
                  </div>

                  <div className="card-meta-grid">
                    <div className="meta-item">
                      <span className="card-label">Employer</span>
                      <p className="meta-text truncate">
                        {truncate(stream.employer)}
                      </p>
                    </div>
                    <div className="meta-item">
                      <span className="card-label">Worker</span>
                      <p className="meta-text truncate">
                        {truncate(stream.worker)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="card-footer">
                  <div className="card-footer-left">
                    <span className="card-label">Total Salary</span>
                    <p className="card-amount font-mono">
                      {parseFloat(stream.totalSalary).toFixed(3)}{" "}
                      <span className="card-currency">ETH</span>
                    </p>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--on-surface-variant)",
                      }}
                    >
                      Withdrawable: {stream.withdrawable ?? "0.000000 ETH"}
                    </div>
                  </div>

                  <div
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    <button
                      className="card-action-btn"
                      onClick={() => {
                        // View in dashboard - focus to dashboard view
                        setActiveTab("All");
                        window.location.hash = "#dashboard";
                        // Also set the active stream locally in storage for dashboard pages
                        try {
                          localStorage.setItem(
                            "rss_active_stream_address",
                            stream.address,
                          );
                        } catch {
                          // ignore localStorage write failures (e.g., private mode or disabled storage)
                        }
                      }}
                      title="View in Dashboard"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                      >
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </button>

                    {isWorkerConnected ? (
                      <button
                        className="btn-withdraw"
                        onClick={() =>
                          handleWithdraw(stream.address, stream.withdrawableWei)
                        }
                        disabled={
                          !canWithdraw ||
                          withdrawStatus === "signing" ||
                          withdrawStatus === "pending"
                        }
                        style={{
                          padding: "8px 12px",
                          borderRadius: 8,
                          background: canWithdraw
                            ? "#06b6d4"
                            : "rgba(6,182,212,0.25)",
                          color: canWithdraw
                            ? "white"
                            : "rgba(255,255,255,0.6)",
                          border: "none",
                          cursor: canWithdraw ? "pointer" : "not-allowed",
                        }}
                      >
                        {withdrawStatus !== "idle" &&
                        currentWithdrawAddress === stream.address
                          ? withdrawStatus === "signing"
                            ? "Confirm in Wallet..."
                            : withdrawStatus === "pending"
                              ? "Processing..."
                              : withdrawStatus === "success"
                                ? "Done"
                                : withdrawStatus === "error"
                                  ? "Retry"
                                  : "Withdraw"
                          : "Withdraw"}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-outline-variant rounded-3xl">
            <p className="text-on-surface-variant">
              No salary streams found matching your criteria.
            </p>
          </div>
        )}
      </div>

      <div className="explorer-pagination">
        <div className="pagination-numbers">
          <button className="page-btn">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button className="page-btn active">1</button>
          <button className="page-btn">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>

      <WithdrawModal
        status={withdrawStatus}
        onClose={closeWithdrawModal}
        onRetry={retryWithdraw}
        amount={currentWithdrawAmount}
        txHash={withdrawTxHash}
        explorerUrl={
          BLOCK_EXPLORER_BASE_URL
            ? BLOCK_EXPLORER_BASE_URL.replace(/\/$/, "")
            : null
        }
        errorMessage={withdrawError}
      />
    </div>
  );
}

function renderIcon(type: StreamData["type"]) {
  switch (type) {
    case "waves":
      return (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M2 12s3-4 5-4c3 0 4 2 6 2 3 0 4-2 6-2 2 0 5 4 5 4" />
        </svg>
      );
    case "bolt":
      return (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      );
    case "monitoring":
      return (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M3 3v18h18M7 16l4-4 4 4 4-5" />
        </svg>
      );
    case "stream":
      return (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16" />
        </svg>
      );
    case "assignment_turned_in":
      return (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      );
    case "cancel":
      return (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      );
    default:
      return null;
  }
}
