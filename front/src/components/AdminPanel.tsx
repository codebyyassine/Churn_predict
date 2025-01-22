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
      await ApiService.trainModel()
      toast({
        title: "Success",
        description: "Model training completed successfully",
      })
    } catch (error) {
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
          <Button onClick={handleTraining} disabled={loading}>
            {loading ? "Training..." : "Retrain Model"}
          </Button>
        </div>
      </div>
    </div>
  )
} 