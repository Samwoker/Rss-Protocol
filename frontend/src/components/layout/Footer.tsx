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
        <span>© 2024 TrustlessSalaryStreamer</span>
        
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
