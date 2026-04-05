import { Button } from "@/components/ui/button"

export type TransactionStatus = "idle" | "signing" | "pending" | "success" | "error"

interface TransactionProgressModalProps {
  status: TransactionStatus
  onClose: () => void
  onRetry?: () => void
}

export function TransactionProgressModal({ status, onClose, onRetry }: TransactionProgressModalProps) {
  if (status === "idle") return null

  const renderContent = () => {
    switch (status) {
      case "signing":
        return (
          <div className="tx-content">
            <div className="tx-icon-wrap">
              <div className="tx-pulse-circle"></div>
              <div className="tx-icon-inner soul-gradient">
                 <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <path d="M12 19l7-7-7-7M5 12h14" />
                 </svg>
              </div>
            </div>
            <h2 className="tx-title">Confirm in Wallet</h2>
            <p className="tx-description text-on-surface-variant/80">
              Please sign the transaction in your connected wallet. This initiates the stream setup.
            </p>
          </div>
        )
      case "pending":
        return (
          <div className="tx-content">
            <div className="tx-icon-wrap">
              <div className="tx-spinner-soul"></div>
              <div className="tx-icon-inner bg-surface-container-low text-primary">
                 <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                 </svg>
              </div>
            </div>
            <h2 className="tx-title">Securing on Chain</h2>
            <p className="tx-description text-on-surface-variant/80">
              The transaction is being mined. This won't take long.
            </p>
            <div className="tx-hash-box font-mono">
               <span className="text-xs opacity-40 mr-2 uppercase">Hash</span>
               <span className="text-secondary font-bold">0x7a...d8e2</span>
               <button className="ml-2 p-1 hover:text-primary transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                     <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
                  </svg>
               </button>
            </div>
          </div>
        )
      case "success":
        return (
          <div className="tx-content">
            <div className="tx-icon-wrap tx-success-pop">
              <div className="tx-icon-inner bg-secondary/10 text-secondary">
                 <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
                    <path d="M20 6L9 17l-5-5" />
                 </svg>
              </div>
            </div>
            <h2 className="tx-title">Stream Initialized</h2>
            <p className="tx-description text-on-surface-variant/80">
              You have successfully deployed a trustless salary stream. Assets are now locked in the verified contract.
            </p>
            <div className="tx-actions">
               <Button variant="primary" size="lg" className="w-full" onClick={onClose}>
                  GO TO DASHBOARD
               </Button>
               <a href="#" className="tx-link-secondary">View on Etherscan</a>
            </div>
          </div>
        )
      case "error":
        return (
          <div className="tx-content">
            <div className="tx-icon-wrap">
              <div className="tx-icon-inner bg-error-container text-error">
                 <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M12 8v4M12 16h.01M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z" />
                 </svg>
              </div>
            </div>
            <h2 className="tx-title">Transaction Failed</h2>
            <p className="tx-description text-on-surface-variant/80">
              Something went wrong. It could be an out-of-gas error or a rejected signature.
            </p>
            <div className="tx-actions">
               {onRetry && (
                 <Button variant="primary" size="lg" className="w-full" onClick={onRetry}>
                    RETRY TRANSACTION
                 </Button>
               )}
               <button className="tx-link-secondary" onClick={onClose}>Cancel</button>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="tx-modal" onClick={(e) => e.stopPropagation()}>
        {status !== "signing" && status !== "pending" && (
           <button className="modal-close" onClick={onClose}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                 <line x1="18" y1="6" x2="6" y2="18" />
                 <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
           </button>
        )}
        {renderContent()}
      </div>
    </div>
  )
}
