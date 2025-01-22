"use client"

import { ChurnPredictionForm } from "@/components/ChurnPredictionForm"

export default function PredictPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Churn Prediction</h1>
      </div>
      <div className="max-w-2xl mx-auto">
        <ChurnPredictionForm />
      </div>
    </div>
  )
} 