import { useEffect, useState } from "react";
import { useConnect, useAccount, type Connector } from "wagmi";
import { Button } from "@/components/ui/button";

interface ConnectWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConnectWalletModal({
  isOpen,
  onClose,
}: ConnectWalletModalProps) {
  const { connectors, connectAsync } = useConnect();
  const { isConnected } = useAccount();
  const [isConnecting, setIsConnecting] = useState(false);
  const [activeConnectorId, setActiveConnectorId] = useState<string | null>(null);
  const [connectHint, setConnectHint] = useState<string | null>(null);

  // Auto-close modal when successfully connected
  useEffect(() => {
    if (isConnected && isOpen) {
      onClose();
    }
  }, [isConnected, isOpen, onClose]);

  useEffect(() => {
    if (isOpen) return;
    setIsConnecting(false);
    setActiveConnectorId(null);
    setConnectHint(null);
  }, [isOpen]);

  // Debug: expose available connectors in console to help diagnose connection problems.
  // This will not break production — it's a helpful developer aid.
  useEffect(() => {
    try {
      // Only log when the modal is open to avoid noisy logs
      if (isOpen) {
        console.info(
          "Available wallet connectors:",
          connectors.map((c) => ({ id: c.id, name: c.name, ready: c.ready })),
        );
      }
    } catch {
      // no-op
    }
  }, [connectors, isOpen]);

  if (!isOpen) return null;

  const hasMetaMaskProvider = (): boolean => {
    if (typeof window === "undefined") return false;
    const ethereum = (
      window as Window & {
        ethereum?: { isMetaMask?: boolean; providers?: Array<{ isMetaMask?: boolean }> };
      }
    ).ethereum;

    if (!ethereum) return false;
    if (ethereum.isMetaMask) return true;
    if (Array.isArray(ethereum.providers)) {
      return ethereum.providers.some((provider) => Boolean(provider?.isMetaMask));
    }
    return false;
  };

  // MetaMask can appear as `metaMaskSDK`, `metaMask`, or generic `injected`.
  const metamask = connectors.find((c: Connector) => {
    const id = c.id.toLowerCase();
    const name = c.name.toLowerCase();
    return (
      id.includes("metamask") ||
      name.includes("metamask") ||
      (id === "injected" && hasMetaMaskProvider())
    );
  });
  const walletConnect = connectors.find(
    (c: Connector) =>
      c.id === "walletConnect" ||
      c.name.toLowerCase().includes("walletconnect"),
  );
  const coinbase = connectors.find(
    (c: Connector) =>
      c.id === "coinbaseWalletSDK" || c.name.toLowerCase().includes("coinbase"),
  );

  const getErrorMessage = (error: unknown): string => {
    if (!error || typeof error !== "object") return "Wallet connection failed. Please try again.";
    const candidate = error as {
      shortMessage?: string;
      message?: string;
      details?: string;
    };
    return candidate.shortMessage ?? candidate.details ?? candidate.message ?? "Wallet connection failed. Please try again.";
  };

  const isPendingPermissionError = (error: unknown): boolean => {
    if (!error || typeof error !== "object") return false;
    const candidate = error as {
      code?: number | string;
      shortMessage?: string;
      message?: string;
      details?: string;
    };
    const fullText = `${candidate.shortMessage ?? ""} ${candidate.details ?? ""} ${candidate.message ?? ""}`.toLowerCase();
    return (
      candidate.code === -32002 ||
      fullText.includes("already pending") ||
      (fullText.includes("wallet_requestpermissions") && fullText.includes("pending")) ||
      fullText.includes("requested resource not available")
    );
  };

  /**
   * Safer connect handler:
   * - Validates connector exists
   * - Logs a helpful diagnostic message
   * - Calls connect() in a try/catch to surface errors to console and show a minimal user-facing alert
   *
   * We avoid throwing here so the UI remains responsive even on failures.
   */
  const handleConnect = async (requestedConnector?: Connector) => {
    // Default to MetaMask when caller doesn't provide a connector.
    const connector = requestedConnector ?? metamask;

    if (isConnecting) {
      setConnectHint("A wallet connection request is already in progress. Please complete it in MetaMask.");
      return;
    }

    if (!connector) {
      console.warn("Requested connector is not available.");
      setConnectHint("Requested wallet connector is not available. Ensure the wallet extension is installed and unlocked.");
      return;
    }

    setConnectHint(null);
    setIsConnecting(true);
    setActiveConnectorId(connector.id);

    try {
      console.info(
        "Connecting with connector:",
        connector.id ?? connector.name,
      );
      await connectAsync({ connector });
      // Success path: auto-close is handled by effect watching isConnected
    } catch (err) {
      // Log full error for debugging (developer console)
      console.error("Wallet connection failed:", err);

      if (isPendingPermissionError(err)) {
        setConnectHint(
          "MetaMask already has a pending permission request. Open the MetaMask popup/extension, approve or reject it, then try again."
        );
        return;
      }

      setConnectHint(getErrorMessage(err));
    } finally {
      setIsConnecting(false);
      setActiveConnectorId(null);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="connect-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="modal-close" onClick={onClose}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title font-headline">Connect Wallet</h2>
          <p className="modal-subtitle">
            Select your preferred entry into the atelier.
          </p>
        </div>

        {/* Network Selector */}
        <div className="modal-section">
          <label className="modal-label font-mono">Network Protocol</label>
          <div className="network-selector">
            <div className="network-selector__inner">
              <div className="network-dot"></div>
              <span className="font-mono text-sm font-medium">
                Sepolia Testnet
              </span>
            </div>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-on-surface-variant"
            >
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
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
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
              disabled={!metamask || isConnecting}
            >
              {isConnecting && activeConnectorId === metamask?.id ? "Connecting..." : "Connect"}
            </Button>
          </div>

          {/* WalletConnect */}
          <div className="wallet-option group">
            <div className="wallet-info">
              <div className="wallet-icon-box bg-surface-container-low text-secondary">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
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
              disabled={!walletConnect || isConnecting}
            >
              {isConnecting && activeConnectorId === walletConnect?.id ? "Connecting..." : "Connect"}
            </Button>
          </div>

          {/* Coinbase Wallet */}
          <div className="wallet-option group">
            <div className="wallet-info">
              <div className="wallet-icon-box bg-surface-container-low text-on-surface">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
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
              disabled={!coinbase || isConnecting}
            >
              {isConnecting && activeConnectorId === coinbase?.id ? "Connecting..." : "Connect"}
            </Button>
          </div>
        </div>

        {connectHint ? (
          <p className="legal-text" role="status" aria-live="polite">
            {connectHint}
          </p>
        ) : null}

        {/* Footer Area */}
        <div className="modal-footer">
          <p className="legal-text">
            By connecting a wallet, you agree to the{" "}
            <a href="#">Terms of Service</a> and acknowledge our{" "}
            <a href="#">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
