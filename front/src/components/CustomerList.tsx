"use client"

import { useState, useEffect } from 'react'
import { ApiService } from '@/lib/api'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { CustomerForm } from './CustomerForm'
import { Badge } from "@/components/ui/badge"

export function CustomerList() {
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [filters, setFilters] = useState({
    geography: '',
    min_age: '',
    max_age: '',
    min_credit_score: '',
    max_credit_score: '',
    exited: undefined as boolean | undefined
  })

  const loadCustomers = async () => {
    try {
      setLoading(true)
      const validFilters = Object.fromEntries(
        Object.entries(filters)
          .filter(([_, v]) => v !== '' && v !== undefined && v !== 'all')
      )
      const data = await ApiService.getCustomers(validFilters)
      setCustomers(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load customers",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCustomers()
  }, [filters])

  const handleDelete = async (id: number) => {
    try {
      await ApiService.deleteCustomer(id)
      toast({
        title: "Success",
        description: "Customer deleted successfully",
      })
      loadCustomers()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete customer",
        variant: "destructive",
      })
    }
  }

  const handlePredictChurn = async (customer: any) => {
    try {
      const { credit_score, age, tenure, balance, num_of_products, has_cr_card,
        is_active_member, estimated_salary, geography, gender } = customer
      
      const prediction = await ApiService.predictChurn({
        credit_score, age, tenure, balance, num_of_products, has_cr_card,
        is_active_member, estimated_salary, geography, gender
      })

      toast({
        title: "Churn Prediction",
        description: `Probability: ${(prediction.churn_probability * 100).toFixed(2)}%`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get prediction",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (customer: any) => {
    setSelectedCustomer(customer)
    setIsDialogOpen(true)
  }

  const handleFormSuccess = () => {
    setIsDialogOpen(false)
    setSelectedCustomer(null)
    loadCustomers()
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Customers</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedCustomer(null)}>
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>
                {selectedCustomer ? 'Edit Customer' : 'Add New Customer'}
              </DialogTitle>
              <DialogDescription>
                {selectedCustomer ? 'Edit customer details below' : 'Enter customer details below'}
              </DialogDescription>
            </DialogHeader>
            <CustomerForm
              customer={selectedCustomer}
              onSuccess={handleFormSuccess}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        <div className="flex gap-4 flex-wrap">
          <Select
            value={filters.geography || 'all'}
            onValueChange={(value) => setFilters({ ...filters, geography: value })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select geography" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Geographies</SelectItem>
              <SelectItem value="France">France</SelectItem>
              <SelectItem value="Germany">Germany</SelectItem>
              <SelectItem value="Spain">Spain</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.exited?.toString() || 'all'}
            onValueChange={(value) => setFilters({ ...filters, exited: value === 'all' ? undefined : value === 'true' })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Churn status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="true">Churned</SelectItem>
              <SelectItem value="false">Active</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Geography</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Credit Score</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.customer_id}>
                  <TableCell>{customer.customer_id}</TableCell>
                  <TableCell>{customer.geography}</TableCell>
                  <TableCell>{customer.gender}</TableCell>
                  <TableCell>{customer.age}</TableCell>
                  <TableCell>{customer.credit_score}</TableCell>
                  <TableCell>${customer.balance.toLocaleString()}</TableCell>
                  <TableCell>{customer.num_of_products}</TableCell>
                  <TableCell>
                    <Badge variant={customer.exited ? "destructive" : "success"}>
                      {customer.exited ? "Churned" : "Active"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(customer)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePredictChurn(customer)}
                      >
                        Predict
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(customer.customer_id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
} 