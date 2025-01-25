"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiService } from "@/lib/api"
import { Icons } from "@/lib/icons"
import { toast } from "@/components/ui/use-toast"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { RefreshCw, Info } from "lucide-react"
import { formatDateTime } from "@/lib/utils"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface RiskDashboardData {
  high_risk_customers: Array<{
    customer_id: number;
    customer_name: string;
    probability: number;
    risk_change: number;
    last_updated: string;
  }>;
  significant_increases: Array<{
    customer_id: number;
    customer_name: string;
    probability: number;
    risk_change: number;
    previous_probability: number;
    changed_at: string;
  }>;
  risk_distribution: {
    very_high: number;
    high: number;
    medium: number;
    low: number;
    very_low: number;
  };
  risk_trend: Array<{
    date: string;
    avg_risk: number;
    high_risk_count: number;
  }>;
  thresholds: {
    high_risk: number;
    risk_increase: number;
  };
}

interface MonitoringControlsProps {
  onComplete: () => void;
}

function MonitoringControls({ onComplete }: MonitoringControlsProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [lastRun, setLastRun] = useState<string | null>(null)

  const handleTriggerMonitoring = async () => {
    try {
      setIsRunning(true)
      const response = await ApiService.triggerMonitoring()
      
      if (response.status === 'success') {
        toast({
          title: "Monitoring Complete",
          description: response.message,
        })
        setLastRun(new Date().toISOString())
        onComplete()
      } else {
        toast({
          title: "Monitoring Failed",
          description: response.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to trigger monitoring. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monitoring Controls</CardTitle>
        <CardDescription>
          Manually trigger risk monitoring for all customers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={handleTriggerMonitoring}
          disabled={isRunning}
          className="w-full"
        >
          <RefreshCw className={cn("mr-2 h-4 w-4", { "animate-spin": isRunning })} />
          {isRunning ? "Running Monitoring..." : "Run Monitoring Now"}
        </Button>
        
        {lastRun && (
          <p className="text-sm text-muted-foreground">
            Last run: {formatDateTime(lastRun)}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

const RISK_COLORS = {
  very_high: "#ef4444", // red
  high: "#f97316",     // orange
  medium: "#eab308",   // yellow
  low: "#22c55e",      // green
  very_low: "#3b82f6"  // blue
}

const RISK_LABELS = {
  very_high: "Very High Risk (80-100%)",
  high: "High Risk (60-80%)",
  medium: "Medium Risk (40-60%)",
  low: "Low Risk (20-40%)",
  very_low: "Very Low Risk (0-20%)"
}

export function RiskDashboard() {
  const [data, setData] = useState<RiskDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null)

  const loadDashboard = async () => {
    try {
      setLoading(true)
      const response = await ApiService.getRiskDashboard()
      setData(response)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  if (loading) {
    return <DashboardSkeleton />
  }

  if (!data) {
    return null
  }

  const riskDistributionData = [
    { id: 'very_high', name: RISK_LABELS.very_high, value: data.risk_distribution.very_high },
    { id: 'high', name: RISK_LABELS.high, value: data.risk_distribution.high },
    { id: 'medium', name: RISK_LABELS.medium, value: data.risk_distribution.medium },
    { id: 'low', name: RISK_LABELS.low, value: data.risk_distribution.low },
    { id: 'very_low', name: RISK_LABELS.very_low, value: data.risk_distribution.very_low }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div className="col-span-full">
        <MonitoringControls onComplete={loadDashboard} />
      </div>

      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>High Risk Customers</CardTitle>
          <CardDescription>
            Customers with risk score above threshold
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {data.high_risk_customers.map((customer) => (
              <div key={customer.customer_id} className="flex items-center">
                <div className="space-y-1 flex-1">
                  <p className="text-sm font-medium leading-none">
                    {customer.customer_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Last updated: {formatDateTime(customer.last_updated)}
                  </p>
                </div>
                <div className="ml-4 space-x-2 flex items-center">
                  <Progress
                    value={customer.probability * 100}
                    className="w-[100px]"
                  />
                  <span className="text-sm font-medium">
                    {(customer.probability * 100).toFixed(1)}%
                  </span>
                  {customer.risk_change > 0 && (
                    <Badge variant="destructive">
                      +{customer.risk_change.toFixed(1)}%
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCustomerId(customer.customer_id)}
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Risk Distribution</CardTitle>
          <CardDescription>
            Distribution of customers by risk level
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 0, right: 0, bottom: 30, left: 0 }}>
                <Pie
                  data={riskDistributionData}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {riskDistributionData.map((entry) => (
                    <Cell key={`cell-${entry.id}`} fill={RISK_COLORS[entry.id as keyof typeof RISK_COLORS]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  iconSize={10}
                  wrapperStyle={{
                    fontSize: "11px",
                    paddingTop: "20px"
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>30-Day Risk Trend</CardTitle>
          <CardDescription>
            Average risk score and high-risk customer count over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={data.risk_trend}
                margin={{ top: 10, right: 30, bottom: 30, left: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  height={50}
                  tick={{ fontSize: 11 }}
                  tickMargin={10}
                />
                <YAxis 
                  yAxisId="left" 
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => `${value.toFixed(2)}%`}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  tick={{ fontSize: 11 }}
                />
                <Tooltip />
                <Legend 
                  verticalAlign="top"
                  height={36}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="avg_risk"
                  stroke="#2563eb"
                  name="Average Risk"
                  dot={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="high_risk_count"
                  stroke="#dc2626"
                  name="High Risk Count"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Dialog 
        open={selectedCustomerId !== null} 
        onOpenChange={() => setSelectedCustomerId(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Customer Risk Details</DialogTitle>
            <DialogDescription>
              Comprehensive risk information and customer details
            </DialogDescription>
          </DialogHeader>
          {selectedCustomerId && data && (
            <div className="space-y-6">
              {(() => {
                const customer = data.high_risk_customers.find(c => c.customer_id === selectedCustomerId)
                const significantIncrease = !customer ? 
                  data.significant_increases.find(c => c.customer_id === selectedCustomerId) : 
                  data.significant_increases.find(c => c.customer_id === selectedCustomerId && c.changed_at !== customer.last_updated)
                
                if (!customer && !significantIncrease) return null

                const displayCustomer = customer || significantIncrease!

                return (
                  <>
                    <div className="space-y-6">
                      {/* Customer Identity Section */}
                      <div className="p-4 border rounded-lg space-y-4">
                        <h3 className="font-semibold">Customer Information</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Customer Name</p>
                            <p className="text-sm font-medium">{displayCustomer.customer_name}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Customer ID</p>
                            <p className="text-sm font-medium">{displayCustomer.customer_id}</p>
                          </div>
                        </div>
                      </div>

                      {/* Current Risk Assessment Section */}
                      <div className="p-4 border rounded-lg space-y-4">
                        <h3 className="font-semibold">Current Risk Assessment</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Risk Score</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Progress
                                value={displayCustomer.probability * 100}
                                className="w-[100px]"
                              />
                              <Badge variant={displayCustomer.probability >= 0.8 ? "destructive" : "default"}>
                                {(displayCustomer.probability * 100).toFixed(1)}%
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Risk Level</p>
                            <p className="text-sm font-medium">
                              {displayCustomer.probability >= 0.8 ? "Very High Risk" :
                               displayCustomer.probability >= 0.6 ? "High Risk" :
                               displayCustomer.probability >= 0.4 ? "Medium Risk" :
                               displayCustomer.probability >= 0.2 ? "Low Risk" : "Very Low Risk"}
                            </p>
                          </div>
                          {displayCustomer.risk_change > 0 && (
                            <div className="col-span-2">
                              <p className="text-sm text-muted-foreground">Recent Change</p>
                              <p className="text-sm font-medium text-destructive">
                                Increased by {displayCustomer.risk_change.toFixed(1)}%
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Risk History Section */}
                      {significantIncrease && (
                        <div className="p-4 border rounded-lg space-y-4">
                          <h3 className="font-semibold">Risk Change History</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Previous Score</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Progress
                                  value={significantIncrease.previous_probability * 100}
                                  className="w-[100px]"
                                />
                                <span className="text-sm font-medium">
                                  {(significantIncrease.previous_probability * 100).toFixed(1)}%
                                </span>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Change Detected</p>
                              <p className="text-sm font-medium">
                                {formatDateTime(significantIncrease.changed_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Last Assessment Section */}
                      <div className="p-4 border rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm text-muted-foreground">Last Risk Assessment</p>
                            <p className="text-sm font-medium">
                              {formatDateTime(
                                'last_updated' in displayCustomer 
                                  ? displayCustomer.last_updated 
                                  : displayCustomer.changed_at
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Risk Threshold</p>
                            <p className="text-sm font-medium">{(data.thresholds.high_risk * 100).toFixed(1)}%</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div className="col-span-full">
        <Card>
          <CardHeader>
            <div className="h-5 w-40 bg-muted rounded animate-pulse" />
            <div className="h-4 w-60 bg-muted rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="h-9 bg-muted rounded animate-pulse" />
          </CardContent>
        </Card>
      </div>
      
      <Card className="col-span-full">
        <CardHeader>
          <div className="h-5 w-40 bg-muted rounded animate-pulse" />
          <div className="h-4 w-60 bg-muted rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center">
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-40 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-32 bg-muted rounded animate-pulse" />
                </div>
                <div className="ml-4 space-x-2 flex items-center">
                  <div className="h-2 w-[100px] bg-muted rounded animate-pulse" />
                  <div className="h-4 w-8 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="h-5 w-40 bg-muted rounded animate-pulse" />
          <div className="h-4 w-60 bg-muted rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="h-[200px] bg-muted rounded animate-pulse" />
        </CardContent>
      </Card>

      <Card className="col-span-2">
        <CardHeader>
          <div className="h-5 w-40 bg-muted rounded animate-pulse" />
          <div className="h-4 w-60 bg-muted rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="h-[200px] bg-muted rounded animate-pulse" />
        </CardContent>
      </Card>
    </div>
  )
} 