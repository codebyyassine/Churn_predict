"use client"

import { CustomerList } from "@/components/CustomerList"

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Customer Management</h1>
      </div>
      <CustomerList />
    </div>
  )
} 