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
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"

interface RiskScore {
  customer_id: number
  probability: number
  risk_change: number
}

interface RiskScoreMap {
  [key: number]: {
    risk_score: number
    risk_change: number
  }
}

export function CustomerList() {
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [selectedCustomers, setSelectedCustomers] = useState<number[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isBulkUpdateDialogOpen, setIsBulkUpdateDialogOpen] = useState(false)
  const [bulkUpdateData, setBulkUpdateData] = useState({
    geography: null as string | null,
    gender: null as string | null,
    has_cr_card: undefined as boolean | undefined,
    is_active_member: undefined as boolean | undefined,
    exited: undefined as boolean | undefined,
  })
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

      // Get all customer IDs
      const customerIds = data.results.map(customer => customer.customer_id).filter((id): id is number => id !== undefined)
      
      // Process each customer to get their risk scores
      const processedCustomers = await Promise.all(data.results.map(async (customer) => {
        if (!customer.customer_id) return customer;
        
        try {
          // Try to get monitoring data first
          const monitoringData = await ApiService.getMonitoringResult(customer.customer_id);
          return {
            ...customer,
            risk_score: monitoringData.probability,
            risk_change: monitoringData.risk_change
          };
        } catch {
          try {
            // Fall back to prediction if monitoring data is not available
            const prediction = await ApiService.predictChurn({
              credit_score: customer.credit_score,
              age: customer.age,
              tenure: customer.tenure,
              balance: customer.balance,
              num_of_products: customer.num_of_products,
              has_cr_card: customer.has_cr_card,
              is_active_member: customer.is_active_member,
              estimated_salary: customer.estimated_salary,
              geography: customer.geography,
              gender: customer.gender
            });
            return {
              ...customer,
              risk_score: prediction.churn_probability,
              risk_change: 0 // No change data for predictions
            };
          } catch (error) {
            console.log(`Could not get risk score for customer ${customer.customer_id}`, error);
            return customer;
          }
        }
      }));

      setCustomers(processedCustomers || [])
      setPagination({
        currentPage: filters.page,
        totalPages: Math.ceil(data.count / filters.page_size),
        totalItems: data.count,
      })
      console.log('Updated customers state:', processedCustomers)
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
      // First try to get monitoring data
      try {
        const monitoringData = await ApiService.getMonitoringResult(customer.customer_id)
        // Update the customer in the table with the monitoring data
        setCustomers(prev => prev.map(c => 
          c.customer_id === customer.customer_id 
            ? { 
                ...c, 
                risk_score: monitoringData.probability,
                risk_change: monitoringData.risk_change
              } 
            : c
        ))
        return
      } catch (error) {
        // If no monitoring data, fall back to prediction
        console.log('No monitoring data available, falling back to prediction')
      }

      // Fall back to prediction
      const { credit_score, age, tenure, balance, num_of_products, has_cr_card,
        is_active_member, estimated_salary, geography, gender } = customer
      
      const prediction = await ApiService.predictChurn({
        credit_score, age, tenure, balance, num_of_products, has_cr_card,
        is_active_member, estimated_salary, geography, gender
      })

      // Update the customer in the table with the prediction
      setCustomers(prev => prev.map(c => 
        c.customer_id === customer.customer_id 
          ? { 
              ...c, 
              risk_score: prediction.churn_probability,
              risk_change: 0 // No change data available for predictions
            } 
          : c
      ))

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get risk assessment",
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

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedCustomers(customers.map(c => c.customer_id))
    } else {
      setSelectedCustomers([])
    }
  }

  const handleSelectCustomer = (customerId: number) => {
    setSelectedCustomers(prev => {
      if (prev.includes(customerId)) {
        return prev.filter(id => id !== customerId)
      } else {
        return [...prev, customerId]
      }
    })
  }

  const handleBulkDelete = async () => {
    try {
      const response = await ApiService.bulkDeleteCustomers(selectedCustomers)
      
      switch (response.status) {
        case 'success':
          toast({
            title: "Success",
            description: response.message || "Selected customers deleted successfully",
          })
          setSelectedCustomers([])
          loadCustomers()
          break;
          
        case 'partial_success':
          toast({
            title: "Partial Success",
            description: response.message || "Some customers could not be deleted",
            variant: "warning",
          })
          setSelectedCustomers([])
          loadCustomers()
          break;
          
        case 'error':
          throw new Error(response.message || "Failed to delete customers")
          
        default:
          throw new Error("Unexpected response status")
      }
    } catch (error) {
      console.error('Bulk delete error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete selected customers",
        variant: "destructive",
      })
    }
  }

  const handleBulkUpdate = async () => {
    try {
      // Filter out undefined values
      const updateData = Object.fromEntries(
        Object.entries(bulkUpdateData)
          .filter(([_, v]) => v !== undefined && v !== '')
      )

      if (Object.keys(updateData).length === 0) {
        toast({
          title: "Error",
          description: "Please select at least one field to update",
          variant: "destructive",
        })
        return
      }

      // Create array of updates
      const updates = selectedCustomers.map(id => ({
        customer_id: id,
        ...updateData
      }))

      const response = await ApiService.bulkUpdateCustomers(updates)
      
      switch (response.status) {
        case 'success':
          toast({
            title: "Success",
            description: response.message || "Selected customers updated successfully",
          })
          setSelectedCustomers([])
          setIsBulkUpdateDialogOpen(false)
          setBulkUpdateData({
            geography: null,
            gender: null,
            has_cr_card: undefined,
            is_active_member: undefined,
            exited: undefined,
          })
          loadCustomers()
          break;
          
        case 'partial_success':
          toast({
            title: "Partial Success",
            description: response.message || "Some customers could not be updated",
            variant: "warning",
          })
          setSelectedCustomers([])
          setIsBulkUpdateDialogOpen(false)
          setBulkUpdateData({
            geography: null,
            gender: null,
            has_cr_card: undefined,
            is_active_member: undefined,
            exited: undefined,
          })
          loadCustomers()
          break;
          
        case 'error':
          throw new Error(response.message || "Failed to update customers")
          
        default:
          throw new Error("Unexpected response status")
      }
    } catch (error) {
      console.error('Bulk update error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update selected customers",
        variant: "destructive",
      })
    }
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
        <div className="flex items-center gap-2">
          {selectedCustomers.length > 0 && (
            <div className="flex items-center gap-2 mr-4">
              <span className="text-sm text-muted-foreground">
                {selectedCustomers.length} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsBulkUpdateDialogOpen(true)}
              >
                Update Selected
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
              >
                Delete Selected
              </Button>
            </div>
          )}
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
      </div>

      {/* Bulk Update Dialog */}
      <Dialog open={isBulkUpdateDialogOpen} onOpenChange={setIsBulkUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Update Customers</DialogTitle>
            <DialogDescription>
              Update multiple customers at once. Only selected fields will be updated.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Geography</Label>
              <Select
                value={bulkUpdateData.geography || "no_change"}
                onValueChange={(value) => setBulkUpdateData(prev => ({ 
                  ...prev, 
                  geography: value === "no_change" ? null : value 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select geography" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_change">No Change</SelectItem>
                  <SelectItem value="France">France</SelectItem>
                  <SelectItem value="Germany">Germany</SelectItem>
                  <SelectItem value="Spain">Spain</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Gender</Label>
              <Select
                value={bulkUpdateData.gender || "no_change"}
                onValueChange={(value) => setBulkUpdateData(prev => ({ 
                  ...prev, 
                  gender: value === "no_change" ? null : value 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_change">No Change</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Male">Male</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="has_cr_card"
                  className="rounded border-gray-300"
                  checked={bulkUpdateData.has_cr_card ?? false}
                  onChange={(e) => setBulkUpdateData(prev => ({ 
                    ...prev, 
                    has_cr_card: e.target.checked 
                  }))}
                />
                <Label htmlFor="has_cr_card">Has Credit Card</Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active_member"
                  className="rounded border-gray-300"
                  checked={bulkUpdateData.is_active_member ?? false}
                  onChange={(e) => setBulkUpdateData(prev => ({ 
                    ...prev, 
                    is_active_member: e.target.checked 
                  }))}
                />
                <Label htmlFor="is_active_member">Active Member</Label>
                <span className="text-sm text-muted-foreground ml-2">(Currently using services)</span>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="exited"
                  className="rounded border-gray-300"
                  checked={bulkUpdateData.exited ?? false}
                  onChange={(e) => setBulkUpdateData(prev => ({ 
                    ...prev, 
                    exited: e.target.checked 
                  }))}
                />
                <Label htmlFor="exited">Churned</Label>
                <span className="text-sm text-muted-foreground ml-2">(Customer has left)</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsBulkUpdateDialogOpen(false)
                setBulkUpdateData({
                  geography: null,
                  gender: null,
                  has_cr_card: undefined,
                  is_active_member: undefined,
                  exited: undefined,
                })
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleBulkUpdate}>
              Update {selectedCustomers.length} Customers
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            <>
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </>
          ) : (
            <>
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
                  <SelectItem value="all">All Churn Status</SelectItem>
                  <SelectItem value="true">Churned</SelectItem>
                  <SelectItem value="false">Retained</SelectItem>
                </SelectContent>
              </Select>

              {/* Active Member Filter */}
              <Select
                value={filters.is_active_member?.toString() || 'all'}
                onValueChange={(value) => setFilters({ ...filters, is_active_member: value === 'all' ? undefined : value === 'true' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Member status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Members</SelectItem>
                  <SelectItem value="true">Active Members</SelectItem>
                  <SelectItem value="false">Inactive Members</SelectItem>
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
            </>
          )}
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <div 
                    className="cursor-pointer hover:bg-muted flex items-center justify-center p-2 -m-2 rounded"
                    onClick={(e) => {
                      const newChecked = !(selectedCustomers.length === customers.length && customers.length > 0)
                      if (newChecked) {
                        setSelectedCustomers(customers.map(c => c.customer_id))
                      } else {
                        setSelectedCustomers([])
                      }
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCustomers.length === customers.length && customers.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Geography</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Credit Score</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Active Member</TableHead>
                <TableHead>Risk Score</TableHead>
                <TableHead>Churn Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: filters.page_size }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-8 w-16" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-4">
                    No customers found
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer) => (
                  <TableRow key={customer.customer_id}>
                    <TableCell 
                      className="cursor-pointer hover:bg-muted"
                      onClick={() => handleSelectCustomer(customer.customer_id)}
                    >
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={selectedCustomers.includes(customer.customer_id)}
                          onChange={() => handleSelectCustomer(customer.customer_id)}
                          className="rounded border-gray-300"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </TableCell>
                    <TableCell>{customer.customer_id}</TableCell>
                    <TableCell>{customer.geography}</TableCell>
                    <TableCell>{customer.gender}</TableCell>
                    <TableCell>{customer.age}</TableCell>
                    <TableCell>{customer.credit_score}</TableCell>
                    <TableCell>${customer.balance.toLocaleString()}</TableCell>
                    <TableCell>{customer.num_of_products}</TableCell>
                    <TableCell>
                      <Badge variant={customer.is_active_member ? "success" : "secondary"}>
                        {customer.is_active_member ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {customer.risk_score ? (
                        <div className="flex items-center gap-2">
                          <Progress
                            value={customer.risk_score * 100}
                            className="w-[60px]"
                          />
                          <span className="text-sm font-medium">
                            {(customer.risk_score * 100).toFixed(1)}%
                          </span>
                          {customer.risk_change > 0 && (
                            <Badge variant="destructive" className="ml-1">
                              +{customer.risk_change.toFixed(1)}%
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePredictChurn(customer)}
                        >
                          Calculate
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={customer.exited ? "destructive" : "success"}>
                        {customer.exited ? "Churned" : "Retained"}
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
          {loading ? (
            <>
              <Skeleton className="h-4 w-64" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  )
} 