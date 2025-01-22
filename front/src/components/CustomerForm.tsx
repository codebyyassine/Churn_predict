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
  has_cr_card: z.boolean(),
  is_active_member: z.boolean(),
  estimated_salary: z.string().transform(Number).pipe(
    z.number().min(0)
  ),
  geography: z.string(),
  gender: z.string(),
})

interface CustomerFormProps {
  customer?: any
  onSuccess?: () => void
  onCancel?: () => void
}

export function CustomerForm({ customer, onSuccess, onCancel }: CustomerFormProps) {
  const [loading, setLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: customer ? {
      credit_score: customer.credit_score?.toString() || "650",
      age: customer.age?.toString() || "35",
      tenure: customer.tenure?.toString() || "5",
      balance: customer.balance?.toString() || "50000",
      num_of_products: customer.num_of_products?.toString() || "1",
      has_cr_card: customer.has_cr_card || false,
      is_active_member: customer.is_active_member || false,
      estimated_salary: customer.estimated_salary?.toString() || "75000",
      geography: customer.geography || "France",
      gender: customer.gender || "Female",
    } : {
      credit_score: "650",
      age: "35",
      tenure: "5",
      balance: "50000",
      num_of_products: "1",
      has_cr_card: false,
      is_active_member: false,
      estimated_salary: "75000",
      geography: "France",
      gender: "Female",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setLoading(true)
      const transformedValues = {
        ...values,
        credit_score: Number(values.credit_score),
        age: Number(values.age),
        tenure: Number(values.tenure),
        balance: Number(values.balance),
        num_of_products: Number(values.num_of_products),
        estimated_salary: Number(values.estimated_salary),
      }
      
      if (customer?.customer_id) {
        await ApiService.updateCustomer(customer.customer_id, transformedValues)
        toast({
          title: "Success",
          description: "Customer updated successfully",
        })
      } else {
        await ApiService.createCustomer(transformedValues)
        toast({
          title: "Success",
          description: "Customer created successfully",
        })
      }
      onSuccess?.()
    } catch (error) {
      toast({
        title: "Error",
        description: customer?.customer_id ? "Failed to update customer" : "Failed to create customer",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="credit_score"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Credit Score</FormLabel>
                <FormControl>
                  <Input placeholder="650" {...field} />
                </FormControl>
                <FormDescription>
                  Score between 0-1000
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
                  <Input placeholder="35" {...field} />
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
                  <Input placeholder="5" {...field} />
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
                  <Input placeholder="50000" {...field} />
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
                  <Input placeholder="1" {...field} />
                </FormControl>
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
                  <Input placeholder="75000" {...field} />
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

          <FormField
            control={form.control}
            name="has_cr_card"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormLabel>Has Credit Card</FormLabel>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_active_member"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormLabel>Is Active Member</FormLabel>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : customer?.customer_id ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  )
} 