const FOOTER_LINKS = [
  { label: "Terms", href: "#" },
  { label: "Privacy", href: "#" },
  { label: "Discord", href: "#" },
  { label: "Github", href: "#" },
] as const

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__meta">
          <span className="footer__version">
            SalaryStreamer_v2.0.4
          </span>
          <span className="footer__copy">
            © 2024 TrustlessSalaryStreamer
          </span>
        </div>

        <div className="footer__links">
          {FOOTER_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="footer__link"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}
