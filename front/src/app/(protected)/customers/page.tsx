"use client"

import { CustomerList } from "@/components/CustomerList"

export default function CustomersPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Customer Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage customer data and predict churn risk
        </p>
      </div>
      <CustomerList />
    </div>
  )
} 