import { useEffect } from "react"
import { useConnect, useAccount, type Connector } from "wagmi"
import { Button } from "@/components/ui/button"

interface ConnectWalletModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ConnectWalletModal({ isOpen, onClose }: ConnectWalletModalProps) {
  const { connectors, connect, isPending, variables } = useConnect()
  const { isConnected } = useAccount()

  // Auto-close modal when successfully connected
  useEffect(() => {
    if (isConnected && isOpen) {
      onClose()
    }
  }, [isConnected, isOpen, onClose])

  if (!isOpen) return null

  // Find connectors by name
  const metamask = connectors.find((c: Connector) => c.id === 'metaMaskSDK' || c.name.toLowerCase().includes('metamask'))
  const walletConnect = connectors.find((c: Connector) => c.id === 'walletConnect' || c.name.toLowerCase().includes('walletconnect'))
  const coinbase = connectors.find((c: Connector) => c.id === 'coinbaseWalletSDK' || c.name.toLowerCase().includes('coinbase'))

  const handleConnect = (connector: Connector | undefined) => {
    if (connector) {
      connect({ connector })
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="connect-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="modal-close" onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title font-headline">Connect Wallet</h2>
          <p className="modal-subtitle">Select your preferred entry into the atelier.</p>
        </div>

        {/* Network Selector */}
        <div className="modal-section">
          <label className="modal-label font-mono">Network Protocol</label>
          <div className="network-selector">
            <div className="network-selector__inner">
              <div className="network-dot"></div>
              <span className="font-mono text-sm font-medium">Ethereum Mainnet</span>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-on-surface-variant">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </div>

        {/* Wallet Options */}
        <div className="wallet-stack">
          {/* MetaMask */}
          <div className="wallet-option group">
            <div className="wallet-info">
              <div className="wallet-icon-box bg-surface-container-low text-primary">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3" />
                  <rect x="15" y="11" width="6" height="4" rx="1" />
                </svg>
              </div>
              <div className="wallet-text">
                <p className="wallet-name">MetaMask</p>
                <p className="wallet-desc">Browser Extension</p>
              </div>
            </div>
            <Button 
              variant="primary" 
              size="sm" 
              className="wallet-connect-btn"
              onClick={() => handleConnect(metamask)}
              disabled={isPending && variables?.connector === metamask}
            >
              {isPending && variables?.connector === metamask ? "Connecting..." : "Connect"}
            </Button>
          </div>

          {/* WalletConnect */}
          <div className="wallet-option group">
            <div className="wallet-info">
              <div className="wallet-icon-box bg-surface-container-low text-secondary">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                </svg>
              </div>
              <div className="wallet-text">
                <p className="wallet-name">WalletConnect</p>
                <p className="wallet-desc">Mobile Scanning</p>
              </div>
            </div>
            <Button 
              variant="primary" 
              size="sm" 
              className="wallet-connect-btn"
              onClick={() => handleConnect(walletConnect)}
              disabled={isPending && variables?.connector === walletConnect}
            >
              {isPending && variables?.connector === walletConnect ? "Connecting..." : "Connect"}
            </Button>
          </div>

          {/* Coinbase Wallet */}
          <div className="wallet-option group">
            <div className="wallet-info">
              <div className="wallet-icon-box bg-surface-container-low text-on-surface">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="4" />
                </svg>
              </div>
              <div className="wallet-text">
                <p className="wallet-name">Coinbase Wallet</p>
                <p className="wallet-desc">Smart Contract Wallet</p>
              </div>
            </div>
            <Button 
              variant="primary" 
              size="sm" 
              className="wallet-connect-btn"
              onClick={() => handleConnect(coinbase)}
              disabled={isPending && variables?.connector === coinbase}
            >
              {isPending && variables?.connector === coinbase ? "Connecting..." : "Connect"}
            </Button>
          </div>
        </div>

        {/* Footer Area */}
        <div className="modal-footer">
          <p className="legal-text">
            By connecting a wallet, you agree to the <a href="#">Terms of Service</a> and acknowledge our <a href="#">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  )
}
