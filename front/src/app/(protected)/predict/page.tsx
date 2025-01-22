"use client"

import { ChurnPredictionForm } from "@/components/ChurnPredictionForm"

export default function PredictPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Churn Prediction</h1>
        <p className="text-muted-foreground mt-2">
          Predict customer churn risk using machine learning
        </p>
      </div>
      <ChurnPredictionForm />
    </div>
  )
} 