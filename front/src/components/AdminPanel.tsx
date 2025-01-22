"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  train_accuracy?: number;
  test_accuracy?: number;
  precision_class1?: number;
  recall_class1?: number;
  f1_class1?: number;
  feature_importance?: Array<{
    feature: string;
    importance: number;
  }>;
  best_params?: Record<string, any>;
  training_details?: {
    total_samples: number;
    training_samples: number;
    test_samples: number;
    training_time: number;
    cross_val_scores: number[];
    confusion_matrix: number[][];
    class_distribution: Record<string, number>;
  };
  model_info?: {
    model_type: string;
    n_estimators: number;
    max_depth: string | number;
    min_samples_split: number;
    min_samples_leaf: number;
  };
}

export function AdminPanel() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    is_staff: false,
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [trainingStatus, setTrainingStatus] = useState<'idle' | 'training' | 'completed' | 'error'>('idle')
  const [trainingMetrics, setTrainingMetrics] = useState<TrainingMetrics | null>(null)

  const handleLogin = () => {
    ApiService.setCredentials({ username, password })
    loadUsers()
  }

  const loadUsers = async () => {
    try {
      const data = await ApiService.getUsers()
      // Handle paginated response
      if (data && 'results' in data) {
        const paginatedData = data as PaginatedResponse<User>
        setUsers(paginatedData.results)
      } else {
        console.error('Received unexpected data format:', data)
        setUsers([])
      }
      setIsAuthenticated(true)
    } catch (error) {
      console.error('Error loading users:', error)
      toast({
        title: "Error",
        description: "Failed to authenticate. Please check your credentials.",
        variant: "destructive",
      })
      setIsAuthenticated(false)
      setUsers([])
    }
  }

  async function handleTraining() {
    try {
      setLoading(true)
      setTrainingStatus('training')
      setTrainingMetrics(null)
      
      const result = await ApiService.trainModel()
      
      if (result.status === 'success') {
        setTrainingStatus('completed')
        setTrainingMetrics({
          train_accuracy: result.train_accuracy,
          test_accuracy: result.test_accuracy,
          precision_class1: result.precision_class1,
          recall_class1: result.recall_class1,
          f1_class1: result.f1_class1,
          feature_importance: result.feature_importance,
          best_params: result.best_params,
          training_details: result.training_details,
          model_info: result.model_info
        })
        
        toast({
          title: "Success",
          description: "Model training completed successfully",
        })
      } else {
        throw new Error(result.message || 'Training failed')
      }
    } catch (error) {
      setTrainingStatus('error')
      toast({
        title: "Error",
        description: "Failed to trigger model training. Please check your credentials.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

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

  const renderTrainingMetrics = () => {
    if (!trainingMetrics) return null;

    return (
      <div className="space-y-6 mt-4">
        {/* Training Progress Summary */}
        <div className="p-4 bg-card rounded-lg">
          <h4 className="font-semibold mb-2">Training Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p>Total Samples: {trainingMetrics.training_details?.total_samples}</p>
              <p>Training Samples: {trainingMetrics.training_details?.training_samples}</p>
              <p>Test Samples: {trainingMetrics.training_details?.test_samples}</p>
            </div>
            <div>
              <p>Training Time: {trainingMetrics.training_details?.training_time.toFixed(2)}s</p>
              <p>Model Type: {trainingMetrics.model_info?.model_type}</p>
            </div>
          </div>
        </div>

        {/* Class Distribution */}
        {trainingMetrics.training_details?.class_distribution && (
          <div className="p-4 bg-card rounded-lg">
            <h4 className="font-semibold mb-2">Class Distribution</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {Object.entries(trainingMetrics.training_details.class_distribution).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span>Class {key}:</span>
                  <span>{value} samples</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Model Performance */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-card rounded-lg">
            <h4 className="font-semibold mb-2">Model Performance</h4>
            <div className="space-y-2 text-sm">
              <p>Training Accuracy: {(trainingMetrics.train_accuracy! * 100).toFixed(2)}%</p>
              <p>Test Accuracy: {(trainingMetrics.test_accuracy! * 100).toFixed(2)}%</p>
              <p>Precision (Churn): {(trainingMetrics.precision_class1! * 100).toFixed(2)}%</p>
              <p>Recall (Churn): {(trainingMetrics.recall_class1! * 100).toFixed(2)}%</p>
              <p>F1 Score (Churn): {(trainingMetrics.f1_class1! * 100).toFixed(2)}%</p>
            </div>
          </div>

          {/* Cross Validation Scores */}
          {trainingMetrics.training_details?.cross_val_scores && (
            <div className="p-4 bg-card rounded-lg">
              <h4 className="font-semibold mb-2">Cross-Validation Scores</h4>
              <div className="space-y-2 text-sm">
                {trainingMetrics.training_details.cross_val_scores.map((score, index) => (
                  <p key={index}>Fold {index + 1}: {(score * 100).toFixed(2)}%</p>
                ))}
                <p className="font-medium mt-2">
                  Mean: {(trainingMetrics.training_details.cross_val_scores.reduce((a, b) => a + b, 0) / 
                    trainingMetrics.training_details.cross_val_scores.length * 100).toFixed(2)}%
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Feature Importance */}
        {trainingMetrics.feature_importance && (
          <div className="p-4 bg-card rounded-lg">
            <h4 className="font-semibold mb-2">Feature Importance</h4>
            <div className="space-y-2">
              {trainingMetrics.feature_importance.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-32 text-sm">{feature.feature}</div>
                  <div className="flex-1 h-4 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary"
                      style={{ width: `${feature.importance * 100}%` }}
                    />
                  </div>
                  <div className="w-16 text-sm text-right">
                    {(feature.importance * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Confusion Matrix */}
        {trainingMetrics.training_details?.confusion_matrix && (
          <div className="p-4 bg-card rounded-lg">
            <h4 className="font-semibold mb-2">Confusion Matrix</h4>
            <div className="grid grid-cols-2 gap-2 text-sm max-w-md mx-auto">
              {trainingMetrics.training_details.confusion_matrix.map((row, i) => 
                row.map((value, j) => (
                  <div 
                    key={`${i}-${j}`} 
                    className={`p-2 text-center rounded ${
                      (i === j) ? 'bg-green-100' : 'bg-red-100'
                    }`}
                  >
                    <div className="font-medium">{value}</div>
                    <div className="text-xs opacity-70">
                      {i === 0 && j === 0 && 'True Negative'}
                      {i === 0 && j === 1 && 'False Positive'}
                      {i === 1 && j === 0 && 'False Negative'}
                      {i === 1 && j === 1 && 'True Positive'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Model Parameters */}
        {trainingMetrics.model_info && (
          <div className="p-4 bg-card rounded-lg">
            <h4 className="font-semibold mb-2">Model Parameters</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span>Number of Trees:</span>
                <span>{trainingMetrics.model_info.n_estimators}</span>
              </div>
              <div className="flex justify-between">
                <span>Max Depth:</span>
                <span>{trainingMetrics.model_info.max_depth}</span>
              </div>
              <div className="flex justify-between">
                <span>Min Samples Split:</span>
                <span>{trainingMetrics.model_info.min_samples_split}</span>
              </div>
              <div className="flex justify-between">
                <span>Min Samples Leaf:</span>
                <span>{trainingMetrics.model_info.min_samples_leaf}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="space-y-4 max-w-md mx-auto p-6 bg-card rounded-lg shadow">
        <h2 className="text-2xl font-bold">Admin Login</h2>
        <div className="grid gap-4">
          <div>
            <label className="text-sm font-medium">Username</label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Admin username"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin password"
            />
          </div>
          <Button onClick={handleLogin} disabled={!username || !password}>
            Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Admin Panel</h2>
        <Button onClick={() => setIsAuthenticated(false)}>Logout</Button>
      </div>

      <div className="grid gap-8">
        {/* User Management */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">User Management</h3>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>Add User</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                  <DialogDescription>
                    Enter the details for the new user below.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Username</label>
                    <Input
                      value={newUser.username}
                      onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Password</label>
                    <Input
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">First Name</label>
                    <Input
                      value={newUser.first_name}
                      onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Last Name</label>
                    <Input
                      value={newUser.last_name}
                      onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newUser.is_staff}
                      onChange={(e) => setNewUser({ ...newUser, is_staff: e.target.checked })}
                    />
                    <label className="text-sm font-medium">Admin Access</label>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateUser}>
                    Create User
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
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
                {Array.isArray(users) && users.length > 0 ? (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{`${user.first_name} ${user.last_name}`}</TableCell>
                      <TableCell>{user.is_staff ? "Yes" : "No"}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Model Training */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Model Management</h3>
          <div className="space-y-4">
            <Button onClick={handleTraining} disabled={loading || trainingStatus === 'training'}>
              {trainingStatus === 'training' ? "Training in progress..." : "Retrain Model"}
            </Button>

            {trainingStatus === 'training' && (
              <div className="p-4 bg-card rounded-lg">
                <p className="text-sm animate-pulse">
                  Training in progress... This may take a few minutes.
                </p>
              </div>
            )}

            {trainingStatus === 'completed' && renderTrainingMetrics()}

            {trainingStatus === 'error' && (
              <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
                <p className="text-sm">
                  An error occurred during model training. Please try again.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 