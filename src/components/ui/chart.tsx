import type { ReactNode } from "react"
import { forwardRef } from "react"

export interface ChartConfig {
  [key: string]: {
    label: string
    color: string
  }
}

interface ChartContainerProps {
  children: ReactNode
  config: ChartConfig
  className?: string
}

export const ChartContainer = forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ children, config, className }, ref) => {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    )
  }
)
ChartContainer.displayName = "ChartContainer"

interface ChartTooltipProps {
  content: ReactNode
}

export function ChartTooltip({ content }: ChartTooltipProps) {
  return content
}

interface ChartTooltipContentProps {
  hideLabel?: boolean
}

export function ChartTooltipContent({ hideLabel }: ChartTooltipContentProps) {
  return null
} 