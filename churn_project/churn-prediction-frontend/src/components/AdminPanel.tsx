"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { ApiService } from "@/lib/api"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Icons } from "@/components/icons"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { ImportCustomersDialog } from "@/components/ImportCustomersDialog"
import { AlertsTab } from "@/components/AlertsTab"

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

interface TrainingMetrics {
  train_accuracy: number;
  test_accuracy: number;
  precision_class1: number;
  recall_class1: number;
  f1_class1: number;
  feature_importance: Array<{
    feature: string;
    importance: number;
  }>;
  training_details: {
    total_samples: number;
    training_time: number;
    cross_val_scores: number[];
  };
  best_params: Record<string, any>;
}

interface ModelMetrics {
  latest_metrics: TrainingMetrics;
  best_metrics: TrainingMetrics;
}

function UserManagementTab() {
  const [users, setUsers] = useState<User[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    is_staff: false,
  })

  const loadUsers = async () => {
    try {
      setLoading(true)
      const data = await ApiService.getUsers()
      setUsers(data.results)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleCreateUser = async () => {
    try {
      await ApiService.createUser(newUser)
      toast({
        title: "Success",
        description: "User created successfully",
      })
      setIsDialogOpen(false)
      loadUsers()
      setNewUser({
        username: "",
        email: "",
        password: "",
        first_name: "",
        last_name: "",
        is_staff: false,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">User Management</h2>
        <div className="flex gap-2">
          <ImportCustomersDialog />
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>Add User</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>
                  Create a new user account
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={newUser.first_name}
                    onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={newUser.last_name}
                    onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isAdmin"
                    checked={newUser.is_staff}
                    onChange={(e) => setNewUser({ ...newUser, is_staff: e.target.checked })}
                  />
                  <Label htmlFor="isAdmin">Admin User</Label>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleCreateUser}>Create User</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Admin</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{`${user.first_name} ${user.last_name}`}</TableCell>
                  <TableCell>{user.is_staff ? "Yes" : "No"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function ModelManagementTab() {
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [trainingStatus, setTrainingStatus] = useState<'idle' | 'training' | 'completed' | 'error'>('idle')
  const [activeMetrics, setActiveMetrics] = useState<'latest' | 'best'>('latest')

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        setLoading(true)
        const data = await ApiService.getModelMetrics()
        setMetrics(data)
      } catch (error) {
        console.error('Error loading metrics:', error)
        toast({
          title: "Error",
          description: "Failed to load model metrics",
          variant: "destructive",
        })
        setMetrics(null)
      } finally {
        setLoading(false)
      }
    }
    loadMetrics()
  }, [])

  const handleTraining = async () => {
    try {
      setTrainingStatus('training')
      const result = await ApiService.trainModel()
      setMetrics(result)
      setTrainingStatus('completed')
      toast({
        title: "Success",
        description: "Model training completed successfully",
      })
    } catch (error) {
      console.error('Training failed:', error)
      setTrainingStatus('error')
      toast({
        title: "Error",
        description: "Model training failed",
        variant: "destructive",
      })
    }
  }

  const getAverageCrossValScore = (scores: number[] | undefined) => {
    if (!scores?.length) return 0
    return scores.reduce((a, b) => a + b, 0) / scores.length
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-[300px]" />
        <Skeleton className="h-[300px]" />
        <Skeleton className="h-[300px]" />
      </div>
    )
  }

  if (!metrics || !metrics.latest_metrics) {
      return (
        <div className="text-center py-4 text-muted-foreground">
          No model metrics available
        </div>
    )
    }

  // Use selected metrics for display
  const currentMetrics = activeMetrics === 'latest' ? metrics.latest_metrics : metrics.best_metrics

    return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Model Performance</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border p-1">
            <Button
              variant={activeMetrics === 'latest' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveMetrics('latest')}
              className="relative"
            >
              Latest Model
              {activeMetrics === 'latest' && (
                <Badge variant="secondary" className="absolute -top-2 -right-2 h-4 w-4 p-0">
                  <Icons.check className="h-3 w-3" />
                </Badge>
              )}
            </Button>
            <Button
              variant={activeMetrics === 'best' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveMetrics('best')}
              className="relative"
            >
              Best Model
              {activeMetrics === 'best' && (
                <Badge variant="secondary" className="absolute -top-2 -right-2 h-4 w-4 p-0">
                  <Icons.check className="h-3 w-3" />
                </Badge>
              )}
            </Button>
          </div>
          <Button 
            onClick={handleTraining} 
            disabled={trainingStatus === 'training'}
            className="min-w-[120px]"
          >
            {trainingStatus === 'training' ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Training
              </>
            ) : (
              'Train Model'
            )}
          </Button>
        </div>
      </div>

      {trainingStatus === 'error' && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Training Failed</CardTitle>
            <CardDescription>An error occurred during model training</CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>Model accuracy and evaluation metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Training Accuracy</span>
                <span className="text-sm">{(currentMetrics.train_accuracy * 100).toFixed(1)}%</span>
              </div>
              <Progress value={currentMetrics.train_accuracy * 100} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Test Accuracy</span>
                <span className="text-sm">{(currentMetrics.test_accuracy * 100).toFixed(1)}%</span>
              </div>
              <Progress value={currentMetrics.test_accuracy * 100} />
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2">
              <div className="space-y-1">
                <span className="text-xs font-medium">Precision</span>
                <div className="text-lg font-bold">{(currentMetrics.precision_class1 * 100).toFixed(1)}%</div>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-medium">Recall</span>
                <div className="text-lg font-bold">{(currentMetrics.recall_class1 * 100).toFixed(1)}%</div>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-medium">F1 Score</span>
                <div className="text-lg font-bold">{(currentMetrics.f1_class1 * 100).toFixed(1)}%</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feature Importance */}
        <Card>
          <CardHeader>
            <CardTitle>Feature Importance</CardTitle>
            <CardDescription>Top factors influencing churn prediction</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px] pr-4">
              {currentMetrics.feature_importance
                .sort((a, b) => b.importance - a.importance)
                .map((feature) => (
                  <div key={feature.feature} className="mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{feature.feature}</span>
                      <span className="text-sm">{(feature.importance * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={feature.importance * 100} />
                  </div>
                ))}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Training Details */}
        <Card>
          <CardHeader>
            <CardTitle>Training Details</CardTitle>
            <CardDescription>Model parameters and training information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium mb-1">Total Samples</div>
                <div className="text-2xl font-bold">
                  {currentMetrics.training_details.total_samples.toLocaleString()}
                </div>
                </div>
              <div>
                <div className="text-sm font-medium mb-1">Training Time</div>
                <div className="text-2xl font-bold">
                  {currentMetrics.training_details.training_time.toFixed(2)}s
                </div>
              </div>
              <div>
                <div className="text-sm font-medium mb-1">Cross-Validation Score</div>
                <div className="text-2xl font-bold">
                  {(getAverageCrossValScore(currentMetrics.training_details.cross_val_scores) * 100).toFixed(1)}%
                      </div>
                <div className="text-sm text-muted-foreground">
                  Average of {currentMetrics.training_details.cross_val_scores.length} folds
                  </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    )
  }

export function AdminPanel() {
    return (
    <div className="container mx-auto py-10">
      <div className="space-y-6">
          <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage users, monitor model performance, and configure alerts
          </p>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="model">Model Performance</TabsTrigger>
            <TabsTrigger value="alerts">Risk Alerts</TabsTrigger>
          </TabsList>
          <TabsContent value="users" className="space-y-4">
            <UserManagementTab />
          </TabsContent>
          <TabsContent value="model" className="space-y-4">
            <ModelManagementTab />
          </TabsContent>
          <TabsContent value="alerts" className="space-y-4">
            <AlertsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 