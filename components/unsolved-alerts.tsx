"use client"

import * as React from "react"
import { AlertTriangleIcon, ActivityIcon, ClockIcon, ThermometerIcon, ZapIcon, HeartIcon } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

interface Alert {
  id: string
  message: string
  type: string
  priority: string
  incubatorCode: string
  time: string
}

export function UnsolvedAlerts() {
  const [alerts, setAlerts] = React.useState<Alert[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    async function fetchAlerts() {
      try {
        const res = await fetch("/api/alerts")
        if (res.ok) {
          const data = await res.json()
          setAlerts(data)
        }
      } catch (err) {
        console.error("Failed to fetch alerts:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchAlerts()
  }, [])

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "oxygen":
        return <ActivityIcon className="size-3.5 text-sky-500" />
      case "temperature":
        return <ThermometerIcon className="size-3.5 text-amber-500" />
      case "respiration":
        return <ActivityIcon className="size-3.5 text-emerald-500" />
      case "system":
        return <ZapIcon className="size-3.5 text-purple-500" />
      case "cardiac":
        return <HeartIcon className="size-3.5 text-rose-500" />
      default:
        return <AlertTriangleIcon className="size-3.5 text-amber-500" />
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "critical":
        return (
          <Badge variant="destructive" className="font-semibold uppercase tracking-wider text-[10px] px-2 py-0.5 animate-pulse">
            Critical
          </Badge>
        )
      case "high":
        return (
          <Badge className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 hover:bg-orange-500/20 font-semibold uppercase tracking-wider text-[10px] px-2 py-0.5">
            High
          </Badge>
        )
      case "medium":
        return (
          <Badge className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20 font-semibold uppercase tracking-wider text-[10px] px-2 py-0.5">
            Medium
          </Badge>
        )
      default:
        return (
          <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20 font-semibold uppercase tracking-wider text-[10px] px-2 py-0.5">
            Low
          </Badge>
        )
    }
  }

  function formatTime(isoString: string) {
    const d = new Date(isoString)
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <AlertTriangleIcon className="size-5 text-destructive" />
            Unsolved Alerts
          </CardTitle>
          <CardDescription>
            Active critical alerts and system warnings needing attention
          </CardDescription>
        </div>
        <Badge variant="destructive" className="font-semibold px-2.5 py-0.5 animate-pulse">
          {alerts.length} Pending Alerts
        </Badge>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[280px]">Message</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead className="text-right">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alerts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  All alerts resolved. Excellent work!
                </TableCell>
              </TableRow>
            ) : (
              alerts.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium py-3 text-sm text-foreground max-w-[280px] truncate">
                    {row.message}
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-1.5 text-sm font-medium">
                      {getTypeIcon(row.type)}
                      <span>{row.type}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    {getPriorityBadge(row.priority)}
                  </TableCell>
                  <TableCell className="text-right py-3 text-muted-foreground font-mono text-xs">
                    <div className="flex items-center justify-end gap-1">
                      <ClockIcon className="size-3.5" />
                      <span>{formatTime(row.time)}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        )}
      </CardContent>
    </Card>
  )
}