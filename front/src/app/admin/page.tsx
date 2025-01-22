"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminPanel } from "@/components/AdminPanel"
import { ApiService } from "@/lib/api"

export default function AdminPage() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        await ApiService.getUsers()
      } catch (error) {
        // If not authenticated, redirect to login
        router.push("/login")
      }
    }

    checkAuth()
  }, [router])

  return (
    <div className="container py-8">
      <AdminPanel />
    </div>
  )
} 