export function StreamPreviewCard() {
  return (
    <div className="preview-card">
      <div className="preview-card__header">
        <span className="preview-card__title">LIVE STREAM PREVIEW</span>
        <div className="preview-card__icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
            <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
            <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
          </svg>
        </div>
      </div>

      <div className="preview-card__balance-box">
        <span className="preview-card__label">Current Balance</span>
        <div className="preview-card__value">
          42.069 <span className="preview-card__currency">ETH</span>
        </div>
      </div>

      <div className="preview-card__progress-section">
        <div className="preview-card__progress-header">
          <span className="preview-card__progress-label">Stream Progress</span>
          <span className="preview-card__progress-percent">74.2%</span>
        </div>
        <div className="preview-card__bar-bg">
          <div className="preview-card__bar-fill" style={{ width: '74.2%' }} />
        </div>
      </div>

      <div className="preview-card__footer">
        <div className="preview-card__footer-box">
          <span className="preview-card__footer-label">PER SECOND</span>
          <div className="preview-card__footer-value">0.000042 ETH</div>
        </div>
        <div className="preview-card__footer-box">
          <span className="preview-card__footer-label">STATUS</span>
          <div className="preview-card__status">
            <div className="preview-card__status-dot" />
            Streaming
          </div>
        </div>
      </div>
    </div>
  )
}
