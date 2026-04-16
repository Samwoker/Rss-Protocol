import { useEffect, useState } from "react";
import { useAccount, useBalance, useDisconnect } from "wagmi";
import { Button } from "@/components/ui/button";
import { canAccessView, isProtectedView, resolveRole } from "@/contract";
import type { View } from "@/App";

interface NavbarProps {
  currentView: View;
  onNavigate: (v: View) => void;
  onConnectWallet: () => void;
}

const NAV_LINKS = [
  { label: "Home", view: "landing" as View },
  { label: "Dashboard", view: "dashboard" as View },
  { label: "Worker", view: "worker-dashboard" as View },
  { label: "Explorer", view: "explorer" as View },
  { label: "Deploy", view: "deploy" as View },
] as const;

export function Navbar({
  currentView,
  onNavigate,
  onConnectWallet,
}: NavbarProps) {
  const { address, isConnected } = useAccount();
  const { data: balanceData } = useBalance({ address });
  const { disconnect } = useDisconnect();
  const role = resolveRole(address);
  const [isCopied, setIsCopied] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const truncatedAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "";
  const balanceValue = balanceData
    ? `${Number(balanceData.formatted).toFixed(3)} ${balanceData.symbol}`
    : "0 ETH";
  const visibleLinks = NAV_LINKS.filter(
    (link) => !isProtectedView(link.view) || canAccessView(role, link.view),
  );

  useEffect(() => {
    if (!isCopied) return;

    const timeout = window.setTimeout(() => setIsCopied(false), 1400);
    return () => window.clearTimeout(timeout);
  }, [isCopied]);

  const handleCopyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setIsCopied(true);
    } catch (error) {
      console.error("Failed to copy address", error);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar__inner">
        <div className="navbar__brand" onClick={() => onNavigate("landing")}>
          SalaryStreamer
        </div>

        <div className="navbar__links">
          {visibleLinks.map((link) => {
            const isActive =
              currentView === link.view ||
              (currentView === "landing" && link.label === "Dashboard");
            return (
              <button
                key={link.label}
                onClick={() => onNavigate(link.view)}
                className={`navbar__link ${isActive ? "navbar__link--active" : ""}`}
              >
                {link.label}
              </button>
            );
          })}
        </div>

        <div className="navbar__actions">
          {isConnected ? (
            <div className="navbar__connected">
              <div className="navbar__wallet-chip">
                <div className="wallet-chip__section wallet-chip__section--end">
                  <span className="wallet-chip__label">Balance</span>
                  <span className="wallet-chip__value wallet-chip__value--secondary">
                    {balanceValue}
                  </span>
                </div>
                <div className="wallet-chip__divider" />
                <div className="wallet-chip__section">
                  <span className="wallet-chip__label">Address</span>
                  <span className="wallet-chip__value-row">
                    <span className="wallet-chip__value wallet-chip__value--primary">
                      {truncatedAddress}
                    </span>
                    <button
                      type="button"
                      className="wallet-chip__copy-btn"
                      aria-label="Copy wallet address"
                      title={isCopied ? "Copied" : "Copy address"}
                      onClick={handleCopyAddress}
                    >
                      {isCopied ? (
                        <span className="material-symbols-outlined">check</span>
                      ) : (
                        <span className="material-symbols-outlined">
                          content_copy
                        </span>
                      )}
                    </button>
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="btn-sm border-slate-200 navbar__disconnect-btn"
                onClick={() => disconnect()}
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <div className="navbar__connect-controls">
              <Button variant="outline" className="btn-sm border-slate-200">
                Ethereum
              </Button>
              <Button
                onClick={onConnectWallet}
                className="btn-primary"
                style={{ padding: "12px 32px", borderRadius: "9999px" }}
              >
                Connect Wallet
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
