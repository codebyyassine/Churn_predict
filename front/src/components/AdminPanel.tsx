"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"

export function AdminPanel() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleTraining() {
    try {
      setLoading(true)
      const response = await fetch("http://localhost:8000/api/train", {
        method: "POST",
        headers: {
          "Authorization": `Basic ${btoa(`${username}:${password}`)}`,
        },
      })

      if (!response.ok) {
        throw new Error("Training failed")
      }

      const data = await response.json()
      toast({
        title: "Success",
        description: data.message,
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

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Admin Panel</h2>
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
        <Button onClick={handleTraining} disabled={loading || !username || !password}>
          {loading ? "Training..." : "Retrain Model"}
        </Button>
      </div>
    </div>
  )
} 