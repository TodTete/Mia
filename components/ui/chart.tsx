"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"
import { cn } from "@/lib/utils"

const THEMES = { light: "", dark: ".dark" } as const

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
>

type ChartContextProps = { config: ChartConfig }
const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)
  if (!context) throw new Error("useChart must be used within a <ChartContainer />")
  return context
}

export function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig
  children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"]
}) {
  const uniqueId = React.useId()
  const chartId = `chart-${id ?? uniqueId.replace(/:/g, "")}`

  const [isMounted, setIsMounted] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = React.useState<{ width: number; height: number } | null>(null)

  React.useEffect(() => {
    setIsMounted(true)
    
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect()
        if (width > 0 && height > 0) {
          setDimensions({ width, height })
        }
      }
    }

    // Initial check
    updateDimensions()
    
    // Observer for changes
    const observer = new ResizeObserver(updateDimensions)
    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        ref={containerRef}
        data-slot="chart"
        data-chart={chartId}
        className={cn(
          "block text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector]:outline-hidden [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-surface]:outline-hidden",
          !className?.includes("aspect-") && !className?.includes("h-") && "aspect-video",
          "min-h-0 min-w-0 w-full relative",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        {isMounted && dimensions ? (
          <div className="absolute inset-0">
            <RechartsPrimitive.ResponsiveContainer width={dimensions.width} height={dimensions.height}>
              {children}
            </RechartsPrimitive.ResponsiveContainer>
          </div>
        ) : null}
      </div>
    </ChartContext.Provider>
  )
}

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(([, config]) => config.theme ?? config.color)
  if (!colorConfig.length) return null

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(([theme, prefix]) => `
            ${prefix} [data-chart=${id}] {
              ${colorConfig.map(([key, itemConfig]) => {
                const color = itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ?? itemConfig.color
                return color ? `--color-${key}: ${color};` : null
              }).join("\n")}
            }
          `).join("\n"),
      }}
    />
  )
}

export const ChartTooltip = RechartsPrimitive.Tooltip

export interface ChartTooltipContentProps
  extends React.ComponentProps<"div"> {
    active?: boolean
    payload?: any[]
    label?: any
    labelFormatter?: any
    labelClassName?: string
    formatter?: any
    color?: string
    nameKey?: string
    labelKey?: string
    hideLabel?: boolean
    indicator?: "line" | "dot" | "dashed"
  }

export function ChartTooltipContent({
  active,
  payload,
  className,
  indicator = "dot",
  hideLabel = false,
  label,
  labelFormatter,
  labelClassName,
  formatter,
  color,
  nameKey,
  labelKey,
}: ChartTooltipContentProps) {
  const { config } = useChart()

  const tooltipLabel = React.useMemo(() => {
    if (hideLabel || !payload?.length) return null
    const [item] = payload
    const key = `${labelKey ?? item?.dataKey ?? item?.name ?? "value"}`
    const itemConfig = getPayloadConfigFromPayload(config, item, key)
    const value = !labelKey && typeof label === "string" ? (config[label]?.label ?? label) : itemConfig?.label
    if (labelFormatter) return <div className={cn("font-medium", labelClassName)}>{labelFormatter(value, payload)}</div>
    return value ? <div className={cn("font-medium", labelClassName)}>{value}</div> : null
  }, [label, labelFormatter, payload, hideLabel, labelClassName, config, labelKey])

  if (!active || !payload?.length) return null
  const nestLabel = payload.length === 1 && indicator !== "dot"

  return (
    <div className={cn("grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl", className)}>
      {!nestLabel ? tooltipLabel : null}
      <div className="grid gap-1.5">
        {payload.filter((item) => item.type !== "none").map((item, index) => {
          const key = `${nameKey ?? item.name ?? item.dataKey ?? "value"}`
          const itemConfig = getPayloadConfigFromPayload(config, item, key)
          const indicatorColor = color ?? item.payload?.fill ?? item.color
          return (
            <div key={index} className={cn("flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground", indicator === "dot" && "items-center")}>
              {formatter && item?.value !== undefined && item.name ? (
                formatter(item.value, item.name, item, index, item.payload)
              ) : (
                <>
                  {!itemConfig?.icon ? (
                    <div className={cn("shrink-0 rounded-[2px] border-(--color-border) bg-(--color-bg)", {
                      "h-2.5 w-2.5": indicator === "dot",
                      "w-1": indicator === "line",
                      "w-0 border-[1.5px] border-dashed bg-transparent": indicator === "dashed",
                    })} style={{ "--color-bg": indicatorColor, "--color-border": indicatorColor } as React.CSSProperties} />
                  ) : <itemConfig.icon />}
                  <div className={cn("flex flex-1 justify-between leading-none", nestLabel ? "items-end" : "items-center")}>
                    <div className="grid gap-1.5">
                      {nestLabel ? tooltipLabel : null}
                      <span className="text-muted-foreground">{itemConfig?.label ?? item.name}</span>
                    </div>
                    {item.value != null && (
                      <span className="font-mono font-medium text-foreground tabular-nums">
                        {typeof item.value === "number" ? item.value.toLocaleString() : String(item.value)}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function getPayloadConfigFromPayload(config: ChartConfig, payload: unknown, key: string) {
  if (typeof payload !== "object" || payload === null) return undefined
  const payloadPayload = "payload" in payload && typeof payload.payload === "object" && payload.payload !== null ? payload.payload : undefined
  let configLabelKey: string = key
  if (key in payload && typeof payload[key as keyof typeof payload] === "string") {
    configLabelKey = payload[key as keyof typeof payload] as string
  } else if (payloadPayload && key in payloadPayload && typeof payloadPayload[key as keyof typeof payloadPayload] === "string") {
    configLabelKey = payloadPayload[key as keyof typeof payloadPayload] as string
  }
  return configLabelKey in config ? config[configLabelKey] : config[key]
}
