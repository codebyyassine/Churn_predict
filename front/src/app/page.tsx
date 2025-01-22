"use client";

import { CustomerList } from "@/components/CustomerList"
import { ChurnPredictionForm } from "@/components/ChurnPredictionForm"
import { AdminPanel } from "@/components/AdminPanel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto py-10">
        <h1 className="text-4xl font-bold mb-8">Customer Churn Prediction</h1>
        
        <Tabs defaultValue="customers">
          <TabsList>
            <TabsTrigger value="customers">Customer Management</TabsTrigger>
            <TabsTrigger value="prediction">Churn Prediction</TabsTrigger>
            <TabsTrigger value="admin">Admin Panel</TabsTrigger>
          </TabsList>
          
          <TabsContent value="customers">
            <CustomerList />
          </TabsContent>
          
          <TabsContent value="prediction">
            <div className="max-w-2xl mx-auto">
              <ChurnPredictionForm />
            </div>
          </TabsContent>

          <TabsContent value="admin">
            <AdminPanel />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
