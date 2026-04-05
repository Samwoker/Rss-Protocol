import * as React from "react"
import { Button } from "@/components/ui/button"

export function CtaSection() {
  return (
    <section className="cta">
      <div className="cta__bg" />

      <div className="cta__content">
        <h2 className="cta__title">
          Ready to Stream Your Payroll?
        </h2>
        <p className="cta__description">
          Join thousands of decentralized organizations using SalaryStreamer to
          power the future of work.
        </p>

        <div className="cta__actions">
          <Button variant="primary" size="lg">
            Get Started Now
          </Button>
          <Button variant="secondary" size="lg">
            Documentation
          </Button>
        </div>
      </div>
    </section>
  )
}
