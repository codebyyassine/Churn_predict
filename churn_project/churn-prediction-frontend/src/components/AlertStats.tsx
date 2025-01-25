"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ApiService } from "@/lib/api"
import { toast } from "@/components/ui/use-toast"

interface AlertStatsData {
  total_alerts: number
  successful_alerts: number
  success_rate: number
  alerts_by_type: {
    HIGH_RISK: number
    RISK_INCREASE: number
    SUMMARY: number
  }
  recent_failures: Array<{
    id: number
    customer: number
    customer_name: string
    alert_type: string
    error_message: string
    sent_at: string
  }>
}

export function AlertStats() {
  const [stats, setStats] = useState<AlertStatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true)
        const response = await ApiService.getAlertStats()
        setStats(response)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load alert statistics",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="h-5 w-40 bg-muted rounded animate-pulse" />
            <div className="h-4 w-60 bg-muted rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="h-[100px] bg-muted rounded animate-pulse" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="space-y-4">
      {/* Overall Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Alert Statistics</CardTitle>
          <CardDescription>Overview of alert system performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Total Alerts</p>
                <p className="text-2xl font-bold">{stats.total_alerts}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Successful</p>
                <p className="text-2xl font-bold">{stats.successful_alerts}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Success Rate</p>
                <p className="text-2xl font-bold">{stats.success_rate.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Failures */}
      {stats.recent_failures.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Failures</CardTitle>
            <CardDescription>Most recent alert delivery failures</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recent_failures.map((failure) => (
                <div key={failure.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{failure.customer_name}</p>
                      <Badge variant="outline">{failure.alert_type}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{failure.error_message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Failed at: {new Date(failure.sent_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 