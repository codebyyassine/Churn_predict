"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertConfigForm } from "@/components/AlertConfigForm"
import { AlertHistoryTable } from "@/components/AlertHistoryTable"
import { AlertStats } from "@/components/AlertStats"

export function AlertsTab() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Alert Configuration</h2>
      </div>

      <Tabs defaultValue="config" className="space-y-4">
        <TabsList>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="history">Alert History</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>
        <TabsContent value="config">
          <AlertConfigForm />
        </TabsContent>
        <TabsContent value="history">
          <AlertHistoryTable />
        </TabsContent>
        <TabsContent value="stats">
          <AlertStats />
        </TabsContent>
      </Tabs>
    </div>
  )
} 