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
import { ApiService } from "@/lib/api"

const formSchema = z.object({
  credit_score: z.string(),
  age: z.string(),
  tenure: z.string(),
  balance: z.string(),
  num_of_products: z.string(),
  has_cr_card: z.string(),
  is_active_member: z.string(),
  estimated_salary: z.string(),
  geography: z.string(),
  gender: z.string(),
}).transform((data) => ({
  credit_score: Number(data.credit_score),
  age: Number(data.age),
  tenure: Number(data.tenure),
  balance: Number(data.balance),
  num_of_products: Number(data.num_of_products),
  has_cr_card: Boolean(Number(data.has_cr_card)),
  is_active_member: Boolean(Number(data.is_active_member)),
  estimated_salary: Number(data.estimated_salary),
  geography: data.geography,
  gender: data.gender,
}));

type FormInput = {
  credit_score: string;
  age: string;
  tenure: string;
  balance: string;
  num_of_products: string;
  has_cr_card: string;
  is_active_member: string;
  estimated_salary: string;
  geography: string;
  gender: string;
};

type FormValues = z.infer<typeof formSchema>;

export function ChurnPredictionForm() {
  const [loading, setLoading] = useState(false)
  const [prediction, setPrediction] = useState<{
    probability: number;
    featureImportance?: Array<{ feature: string; importance: number }>;
  } | null>(null)

  const form = useForm<FormInput>({
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

  async function onSubmit(values: FormInput) {
    try {
      setLoading(true)
      const result = await ApiService.predictChurn({
        credit_score: Number(values.credit_score),
        age: Number(values.age),
        tenure: Number(values.tenure),
        balance: Number(values.balance),
        num_of_products: Number(values.num_of_products),
        has_cr_card: Boolean(Number(values.has_cr_card)),
        is_active_member: Boolean(Number(values.is_active_member)),
        estimated_salary: Number(values.estimated_salary),
        geography: values.geography,
        gender: values.gender,
      });

      setPrediction({
        probability: result.churn_probability,
        featureImportance: result.feature_importance,
      })
      
      const riskLevel = result.churn_probability > 0.5 ? "High" : result.churn_probability > 0.3 ? "Medium" : "Low"
      const riskColor = result.churn_probability > 0.5 ? "red" : result.churn_probability > 0.3 ? "yellow" : "green"
      
      toast({
        title: "Prediction Complete",
        description: `Churn Risk: ${riskLevel} (${(result.churn_probability * 100).toFixed(2)}%)`,
        variant: riskColor === "red" ? "destructive" : undefined,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get prediction",
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