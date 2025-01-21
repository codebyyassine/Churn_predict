"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"

const formSchema = z.object({
  credit_score: z.string().transform(Number).pipe(
    z.number().min(0).max(1000)
  ),
  age: z.string().transform(Number).pipe(
    z.number().min(18).max(120)
  ),
  tenure: z.string().transform(Number).pipe(
    z.number().min(0)
  ),
  balance: z.string().transform(Number).pipe(
    z.number().min(0)
  ),
  num_of_products: z.string().transform(Number).pipe(
    z.number().min(0)
  ),
  has_cr_card: z.string().transform(Number),
  is_active_member: z.string().transform(Number),
  estimated_salary: z.string().transform(Number).pipe(
    z.number().min(0)
  ),
  geography: z.string(),
  gender: z.string(),
})

export function ChurnPredictionForm() {
  const [loading, setLoading] = useState(false)
  const [prediction, setPrediction] = useState<{
    probability: number;
    featureImportance?: Array<{ feature: string; importance: number }>;
  } | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      credit_score: "600",
      age: "40",
      tenure: "3",
      balance: "60000",
      num_of_products: "2",
      has_cr_card: "1",
      is_active_member: "1",
      estimated_salary: "100000",
      geography: "France",
      gender: "Female",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setLoading(true)
      const response = await fetch("http://localhost:8000/api/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        throw new Error("Prediction failed")
      }

      const data = await response.json()
      setPrediction({
        probability: data.churn_probability,
        featureImportance: data.feature_importance,
      })
      
      const riskLevel = data.churn_probability > 0.5 ? "High" : data.churn_probability > 0.3 ? "Medium" : "Low"
      const riskColor = data.churn_probability > 0.5 ? "red" : data.churn_probability > 0.3 ? "yellow" : "green"
      
      toast({
        title: "Prediction Complete",
        description: (
          <div className="space-y-2">
            <p>Churn Risk: <span className={`font-bold text-${riskColor}-500`}>{riskLevel}</span></p>
            <p>Probability: {(data.churn_probability * 100).toFixed(2)}%</p>
          </div>
        ),
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get prediction. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="credit_score"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Credit Score</FormLabel>
                <FormControl>
                  <Input placeholder="600" {...field} />
                </FormControl>
                <FormDescription>
                  Enter credit score (0-1000)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="age"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Age</FormLabel>
                <FormControl>
                  <Input placeholder="40" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tenure"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tenure (years)</FormLabel>
                <FormControl>
                  <Input placeholder="3" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="balance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Balance</FormLabel>
                <FormControl>
                  <Input placeholder="60000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="num_of_products"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of Products</FormLabel>
                <FormControl>
                  <Input placeholder="2" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="has_cr_card"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Has Credit Card</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1">Yes</SelectItem>
                    <SelectItem value="0">No</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_active_member"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Is Active Member</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1">Yes</SelectItem>
                    <SelectItem value="0">No</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="estimated_salary"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estimated Salary</FormLabel>
                <FormControl>
                  <Input placeholder="100000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="geography"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Geography</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="France">France</SelectItem>
                    <SelectItem value="Germany">Germany</SelectItem>
                    <SelectItem value="Spain">Spain</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Male">Male</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? "Predicting..." : "Predict Churn"}
        </Button>

        {prediction !== null && (
          <div className="mt-4 space-y-4">
            <div className="p-4 bg-secondary rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Prediction Result</h3>
              <div className="space-y-2">
                <p className="text-sm">
                  Churn Risk: 
                  <span className={`ml-2 font-bold ${
                    prediction.probability > 0.5 
                      ? "text-red-500" 
                      : prediction.probability > 0.3 
                      ? "text-yellow-500" 
                      : "text-green-500"
                  }`}>
                    {prediction.probability > 0.5 
                      ? "High" 
                      : prediction.probability > 0.3 
                      ? "Medium" 
                      : "Low"}
                  </span>
                </p>
                <p className="text-sm">
                  Probability: {(prediction.probability * 100).toFixed(2)}%
                </p>
              </div>
            </div>

            {prediction.featureImportance && (
              <div className="p-4 bg-secondary rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Key Factors</h3>
                <div className="space-y-2">
                  {prediction.featureImportance.slice(0, 5).map((feature, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{feature.feature}</span>
                      <span className="font-mono">
                        {(feature.importance * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </form>
    </Form>
  )
} 