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
  const [error, setError] = useState<string | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  })
  const [filters, setFilters] = useState({
    geography: '',
    gender: '',
    min_age: '',
    max_age: '',
    min_credit_score: '',
    max_credit_score: '',
    min_balance: '',
    max_balance: '',
    exited: undefined as boolean | undefined,
    has_cr_card: undefined as boolean | undefined,
    is_active_member: undefined as boolean | undefined,
    search: '',
    ordering: '',
    page: 1,
    page_size: 10,
  })

  const loadCustomers = async () => {
    try {
      setLoading(true)
      setError(null)
      const validFilters = Object.fromEntries(
        Object.entries(filters)
          .filter(([_, v]) => v !== '' && v !== undefined && v !== 'all')
      )
      console.log('Sending request with filters:', validFilters)
      const data = await ApiService.getCustomers(validFilters)
      console.log('Received data:', data)
      console.log('Results array:', data.results)
      setCustomers(data.results || [])
      setPagination({
        currentPage: filters.page,
        totalPages: Math.ceil(data.count / filters.page_size),
        totalItems: data.count,
      })
      console.log('Updated customers state:', data.results)
      console.log('Updated pagination:', {
        currentPage: filters.page,
        totalPages: Math.ceil(data.count / filters.page_size),
        totalItems: data.count,
      })
    } catch (error) {
      console.error('Error loading customers:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to load customers'
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCustomers()
  }, [filters])

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }))
  }

  const handleDelete = async (customer_id: number) => {
    try {
      await ApiService.deleteCustomer(customer_id)
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

  if (loading) {
    return <div className="flex justify-center items-center p-8">Loading customers...</div>
  }

  if (error) {
    return (
      <div className="flex flex-col items-center p-8">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={loadCustomers}>Retry</Button>
      </div>
    )
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
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Geography Filter */}
          <Select
            value={filters.geography || 'all'}
            onValueChange={(value) => setFilters({ ...filters, geography: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select geography" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Geographies</SelectItem>
              <SelectItem value="France">France</SelectItem>
              <SelectItem value="Germany">Germany</SelectItem>
              <SelectItem value="Spain">Spain</SelectItem>
            </SelectContent>
          </Select>

          {/* Gender Filter */}
          <Select
            value={filters.gender || 'all'}
            onValueChange={(value) => setFilters({ ...filters, gender: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genders</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
              <SelectItem value="Male">Male</SelectItem>
            </SelectContent>
          </Select>

          {/* Churn Status Filter */}
          <Select
            value={filters.exited?.toString() || 'all'}
            onValueChange={(value) => setFilters({ ...filters, exited: value === 'all' ? undefined : value === 'true' })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Churn status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="true">Churned</SelectItem>
              <SelectItem value="false">Active</SelectItem>
            </SelectContent>
          </Select>

          {/* Ordering */}
          <Select
            value={filters.ordering || 'customer_id'}
            onValueChange={(value) => setFilters({ ...filters, ordering: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="customer_id">ID (Ascending)</SelectItem>
              <SelectItem value="-customer_id">ID (Descending)</SelectItem>
              <SelectItem value="age">Age (Ascending)</SelectItem>
              <SelectItem value="-age">Age (Descending)</SelectItem>
              <SelectItem value="credit_score">Credit Score (Ascending)</SelectItem>
              <SelectItem value="-credit_score">Credit Score (Descending)</SelectItem>
              <SelectItem value="balance">Balance (Ascending)</SelectItem>
              <SelectItem value="-balance">Balance (Descending)</SelectItem>
            </SelectContent>
          </Select>

          {/* Range Filters */}
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Min Age"
              value={filters.min_age}
              onChange={(e) => setFilters({ ...filters, min_age: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Max Age"
              value={filters.max_age}
              onChange={(e) => setFilters({ ...filters, max_age: e.target.value })}
            />
          </div>

          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Min Credit Score"
              value={filters.min_credit_score}
              onChange={(e) => setFilters({ ...filters, min_credit_score: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Max Credit Score"
              value={filters.max_credit_score}
              onChange={(e) => setFilters({ ...filters, max_credit_score: e.target.value })}
            />
          </div>

          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Min Balance"
              value={filters.min_balance}
              onChange={(e) => setFilters({ ...filters, min_balance: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Max Balance"
              value={filters.max_balance}
              onChange={(e) => setFilters({ ...filters, max_balance: e.target.value })}
            />
          </div>

          {/* Search */}
          <Input
            type="text"
            placeholder="Search..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>

        {/* Table */}
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
              {customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-4">
                    No customers found
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer) => (
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
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((pagination.currentPage - 1) * filters.page_size) + 1} to {Math.min(pagination.currentPage * filters.page_size, pagination.totalItems)} of {pagination.totalItems} customers
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 