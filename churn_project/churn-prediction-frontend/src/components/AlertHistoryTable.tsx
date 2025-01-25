"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { ApiService } from "@/lib/api"
import { Icons } from "@/lib/icons"
import { format } from "date-fns"

interface AlertHistory {
  id: number
  customer: number
  customer_name: string
  alert_type: 'HIGH_RISK' | 'RISK_INCREASE' | 'SUMMARY'
  message: any
  sent_at: string
  was_sent: boolean
  error_message: string | null
}

interface AlertHistoryFilters {
  alert_type: string
  customer_id: string
  date_from: string
  date_to: string
  success_only: boolean
}

export function AlertHistoryTable() {
  const [alerts, setAlerts] = useState<AlertHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<AlertHistoryFilters>({
    alert_type: 'ALL',
    customer_id: '',
    date_from: '',
    date_to: '',
    success_only: false,
  })

  const loadAlerts = async () => {
    try {
      setLoading(true)
      const response = await ApiService.getAlertHistory(filters)
      setAlerts(response.results)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load alert history",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAlerts()
  }, [filters])

  const getAlertTypeBadge = (type: AlertHistory['alert_type']) => {
    switch (type) {
      case 'HIGH_RISK':
        return <Badge variant="destructive">High Risk</Badge>
      case 'RISK_INCREASE':
        return <Badge variant="secondary">Risk Increase</Badge>
      case 'SUMMARY':
        return <Badge>Summary</Badge>
      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alert History</CardTitle>
        <CardDescription>
          View and filter alert history
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="grid gap-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Alert Type</Label>
              <Select
                value={filters.alert_type}
                onValueChange={(value) => setFilters(prev => ({ ...prev, alert_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All types</SelectItem>
                  <SelectItem value="HIGH_RISK">High Risk</SelectItem>
                  <SelectItem value="RISK_INCREASE">Risk Increase</SelectItem>
                  <SelectItem value="SUMMARY">Summary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Customer ID</Label>
              <Input
                placeholder="Filter by customer"
                value={filters.customer_id}
                onChange={(e) => setFilters(prev => ({ ...prev, customer_id: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>From Date</Label>
              <Input
                type="date"
                value={filters.date_from}
                onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>To Date</Label>
              <Input
                type="date"
                value={filters.date_to}
                onChange={(e) => setFilters(prev => ({ ...prev, date_to: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="success-only"
              checked={filters.success_only}
              onCheckedChange={(checked) => setFilters(prev => ({ ...prev, success_only: checked }))}
            />
            <Label htmlFor="success-only">Show successful alerts only</Label>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Sent At</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    <Icons.spinner className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : alerts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                    No alerts found
                  </TableCell>
                </TableRow>
              ) : (
                alerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell>{alert.customer_name}</TableCell>
                    <TableCell>{getAlertTypeBadge(alert.alert_type)}</TableCell>
                    <TableCell>{format(new Date(alert.sent_at), 'PPp')}</TableCell>
                    <TableCell>
                      {alert.was_sent ? (
                        <Badge variant="success">Sent</Badge>
                      ) : (
                        <Badge variant="destructive">Failed</Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      {alert.error_message || JSON.stringify(alert.message)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
} 