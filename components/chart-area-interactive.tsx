"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { Skeleton } from "@/components/ui/skeleton"

export const description = "An interactive area chart for newborns admissions"

interface ChartDataPoint {
  date: string
  nicu: number
  intermediate: number
}

const chartConfig = {
  nicu: {
    label: "NICU Ward",
    color: "var(--primary)",
  },
  intermediate: {
    label: "Intermediate Care",
    color: "#2dd4bf",
  },
} satisfies ChartConfig

function generateChartData(): ChartDataPoint[] {
  const days = 90
  const data: ChartDataPoint[] = []

  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - (days - 1 - i))
    const dateString = date.toISOString().split("T")[0]

    const wave1 = Math.sin(i * 0.12) * 2.5 + 3.5
    const wave2 = Math.cos(i * 0.18) * 1.5 + 2.5
    const noise1 = Math.sin(i * 0.45) * 1.2
    const noise2 = Math.cos(i * 0.6) * 0.8

    const nicu = Math.max(0, Math.round(wave1 + noise1))
    const intermediate = Math.max(0, Math.round(wave2 + noise2))

    data.push({ date: dateString, nicu, intermediate })
  }

  return data
}

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")
  const [chartData, setChartData] = React.useState<ChartDataPoint[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  React.useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/stats/admissions")
        if (res.ok) {
          await res.json() // just to verify API works
        }
      } catch (err) {
        console.error("Failed to fetch admissions stats:", err)
      } finally {
        setChartData(generateChartData())
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredData = React.useMemo(() => {
    const referenceDate = new Date()
    let daysToSubtract = 90
    if (timeRange === "30d") daysToSubtract = 30
    else if (timeRange === "7d") daysToSubtract = 7

    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    startDate.setHours(0, 0, 0, 0)

    return chartData.filter((item) => {
      const date = new Date(item.date)
      return date >= startDate
    })
  }, [chartData, timeRange])

  const totalRangeAdmissions = React.useMemo(() => {
    return filteredData.reduce((acc, curr) => acc + curr.nicu + curr.intermediate, 0)
  }, [filteredData])

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>New Newborn Admissions</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Total of {totalRangeAdmissions.toFixed(0)} admissions in selected timeframe
          </span>
          <span className="@[540px]/card:hidden">Admissions: {totalRangeAdmissions.toFixed(0)}</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">Last 3 months</SelectItem>
              <SelectItem value="30d" className="rounded-lg">Last 30 days</SelectItem>
              <SelectItem value="7d" className="rounded-lg">Last 7 days</SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {loading ? (
          <Skeleton className="h-[300px] w-full rounded-xl" />
        ) : (
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[300px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillNicu" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-nicu)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-nicu)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillIntermediate" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-intermediate)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-intermediate)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="intermediate"
              type="natural"
              fill="url(#fillIntermediate)"
              stroke="var(--color-intermediate)"
              stackId="a"
            />
            <Area
              dataKey="nicu"
              type="natural"
              fill="url(#fillNicu)"
              stroke="var(--color-nicu)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}