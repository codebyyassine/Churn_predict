"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function Home() {
  const [prediction, setPrediction] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      creditScore: "",
      age: "",
      tenure: "",
      balance: "",
      numOfProducts: "",
      hasCard: "0",
      isActiveMember: "0",
      estimatedSalary: "",
      geography: "France",
      gender: "Female",
    },
  });

  const onSubmit = async (data: any) => {
    try {
      const response = await fetch("/api/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          credit_score: parseInt(data.creditScore),
          age: parseInt(data.age),
          tenure: parseInt(data.tenure),
          balance: parseFloat(data.balance),
          num_of_products: parseInt(data.numOfProducts),
          has_cr_card: parseInt(data.hasCard),
          is_active_member: parseInt(data.isActiveMember),
          estimated_salary: parseFloat(data.estimatedSalary),
          geography: data.geography,
          gender: data.gender,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Prediction failed");
      }

      const result = await response.json();
      setPrediction(result.churn_probability);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to get prediction. Please try again.");
      setPrediction(null);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Customer Churn Prediction</CardTitle>
          <CardDescription>
            Enter customer details to predict the likelihood of churn
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="geography"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Geography</FormLabel>
                      <FormControl>
                        <select
                          className="w-full p-2 border rounded"
                          {...field}
                        >
                          <option value="France">France</option>
                          <option value="Germany">Germany</option>
                          <option value="Spain">Spain</option>
                        </select>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <FormControl>
                        <select
                          className="w-full p-2 border rounded"
                          {...field}
                        >
                          <option value="Female">Female</option>
                          <option value="Male">Male</option>
                        </select>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="creditScore"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Credit Score</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Enter credit score" {...field} />
                      </FormControl>
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
                        <Input type="number" placeholder="Enter age" {...field} />
                      </FormControl>
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
                        <Input type="number" placeholder="Enter tenure" {...field} />
                      </FormControl>
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
                        <Input type="number" step="0.01" placeholder="Enter balance" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="numOfProducts"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Products</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Enter number of products" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hasCard"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Has Credit Card</FormLabel>
                      <FormControl>
                        <select
                          className="w-full p-2 border rounded"
                          {...field}
                        >
                          <option value="0">No</option>
                          <option value="1">Yes</option>
                        </select>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isActiveMember"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Is Active Member</FormLabel>
                      <FormControl>
                        <select
                          className="w-full p-2 border rounded"
                          {...field}
                        >
                          <option value="0">No</option>
                          <option value="1">Yes</option>
                        </select>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="estimatedSalary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated Salary</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="Enter estimated salary" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" className="w-full">
                Predict Churn
              </Button>
            </form>
          </Form>

          {prediction !== null && (
            <div className="mt-6">
              <Alert>
                <AlertTitle>Prediction Result</AlertTitle>
                <AlertDescription>
                  The probability of customer churn is: {(prediction * 100).toFixed(2)}%
                </AlertDescription>
              </Alert>
            </div>
          )}

          {error && (
            <div className="mt-6">
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
