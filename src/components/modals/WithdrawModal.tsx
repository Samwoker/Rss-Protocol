import { Button } from "@/components/ui/button"

export type WithdrawalStatus = "idle" | "signing" | "pending" | "success" | "error"

interface WithdrawModalProps {
  status: WithdrawalStatus
  onClose: () => void
  onRetry?: () => void
  amount?: string
  txHash?: string | null
  explorerUrl?: string | null
  errorMessage?: string | null
}

export function WithdrawModal({
  status,
  onClose,
  onRetry,
  amount = "0.25 ETH",
  txHash,
  explorerUrl,
  errorMessage,
}: WithdrawModalProps) {
  if (status === "idle") return null

  const shortHash =
    txHash && txHash.length > 12
      ? `${txHash.slice(0, 6)}...${txHash.slice(-4)}`
      : txHash ?? "Awaiting signature"

  const renderContent = () => {
    switch (status) {
      case "signing":
        return (
          <div className="tx-content">
            <div className="tx-icon-wrap">
              <div className="tx-pulse-circle"></div>
              <div className="tx-icon-inner soul-gradient">
                <span className="material-symbols-outlined text-white text-4xl">fingerprint</span>
              </div>
            </div>
            <h2 className="tx-title">Confirm Withdrawal</h2>
            <p className="tx-description text-on-surface-variant/80">
              Please sign the withdrawal request in your wallet to transfer <strong>{amount}</strong> to your address.
            </p>
          </div>
        )
      case "pending":
        return (
          <div className="tx-content">
            <div className="tx-icon-wrap">
              <div className="tx-spinner-soul"></div>
              <div className="tx-icon-inner bg-surface-container-low text-primary">
                <span className="material-symbols-outlined text-4xl">hourglass_empty</span>
              </div>
            </div>
            <h2 className="tx-title">Processing Withdrawal</h2>
            <p className="tx-description text-on-surface-variant/80">
              The transaction is being processed on the network. Your funds are almost home.
            </p>
            <div className="tx-hash-box font-mono">
               <span className="text-xs opacity-40 mr-2 uppercase">Hash</span>
               <span className="text-secondary font-bold">{shortHash}</span>
            </div>
          </div>
        )
      case "success":
        return (
          <div className="tx-content">
            <div className="tx-icon-wrap tx-success-pop">
              <div className="tx-icon-inner bg-secondary/10 text-secondary">
                <span className="material-symbols-outlined text-5xl">task_alt</span>
              </div>
            </div>
            <h2 className="tx-title">Withdrawal Success</h2>
            <p className="tx-description text-on-surface-variant/80">
              <strong>{amount}</strong> has been successfully transferred to your wallet. You can now view the confirmed transaction on Etherscan.
            </p>
            <div className="tx-actions">
               <Button variant="primary" size="lg" className="w-full btn-primary" style={{ borderRadius: '16px' }} onClick={onClose}>
                  BACK TO DASHBOARD
               </Button>
               {explorerUrl ? (
                 <a
                   href={explorerUrl}
                   target="_blank"
                   rel="noreferrer"
                   className="tx-link-secondary mt-4 block text-sm font-bold text-slate-400 hover:text-slate-600"
                 >
                   VIEW ON ETHERSCAN
                 </a>
               ) : null}
            </div>
          </div>
        )
      case "error":
        return (
          <div className="tx-content">
            <div className="tx-icon-wrap">
              <div className="tx-icon-inner bg-error-container text-error">
                <span className="material-symbols-outlined text-5xl">error</span>
              </div>
            </div>
            <h2 className="tx-title">Withdrawal Failed</h2>
            <p className="tx-description text-on-surface-variant/80">
              {errorMessage ??
                "Something went wrong during the transfer. This could be due to network congestion or a rejected signature."}
            </p>
            <div className="tx-actions">
               {onRetry && (
                 <Button variant="primary" size="lg" className="w-full btn-primary" style={{ borderRadius: '16px' }} onClick={onRetry}>
                    RETRY WITHDRAWAL
                 </Button>
               )}
               <button className="tx-link-secondary block w-full mt-4 text-sm font-bold text-slate-400 hover:text-slate-600" onClick={onClose}>CANCEL</button>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="tx-modal" onClick={(e) => e.stopPropagation()}>
        {status !== "signing" && status !== "pending" && (
           <button className="modal-close" onClick={onClose}>
              <span className="material-symbols-outlined">close</span>
           </button>
        )}
        {renderContent()}
      </div>
    </div>
  )
}
