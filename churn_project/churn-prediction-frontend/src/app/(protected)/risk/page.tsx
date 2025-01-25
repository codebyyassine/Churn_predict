"use client"

import { RiskDashboard } from "@/components/RiskDashboard"

export default function RiskPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Risk Monitoring</h1>
        <p className="text-muted-foreground mt-2">
          Monitor customer churn risk and identify high-risk customers
        </p>
      </div>
      <RiskDashboard />
    </div>
  )
} 