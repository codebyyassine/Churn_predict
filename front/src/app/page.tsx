"use client";

import { ChurnPredictionForm } from "@/components/ChurnPredictionForm"
import { AdminPanel } from "@/components/AdminPanel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Home() {
  return (
    <main className="container mx-auto py-10 px-4">
      <h1 className="text-4xl font-bold mb-8">Customer Churn Prediction</h1>
      
      <Tabs defaultValue="predict" className="space-y-4">
        <TabsList>
          <TabsTrigger value="predict">Predict Churn</TabsTrigger>
          <TabsTrigger value="admin">Admin Panel</TabsTrigger>
        </TabsList>
        
        <TabsContent value="predict" className="space-y-4">
          <div className="prose dark:prose-invert">
            <h2>Make a Prediction</h2>
            <p>
              Enter customer details below to predict their likelihood of churning.
              The model uses various customer attributes to calculate a churn probability.
            </p>
          </div>
          <ChurnPredictionForm />
        </TabsContent>
        
        <TabsContent value="admin">
          <div className="prose dark:prose-invert mb-4">
            <h2>Model Management</h2>
            <p>
              Admin section for model retraining and management.
              Authentication required.
            </p>
          </div>
          <AdminPanel />
        </TabsContent>
      </Tabs>
    </main>
  )
}
