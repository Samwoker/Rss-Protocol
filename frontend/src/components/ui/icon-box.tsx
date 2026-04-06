import * as React from "react"
import { cn } from "@/lib/utils"

interface IconBoxProps {
  icon: React.ReactNode
  className?: string
  size?: "sm" | "md" | "lg"
}

/** Icon wrapped in a styled container — used across feature cards and stats */
export function IconBox({
  icon,
  className,
  size = "md",
}: IconBoxProps) {
  return (
    <div
      className={cn(
        "icon-box",
        `icon-box-${size}`,
        className
      )}
    >
      {icon}
    </div>
  )
}
