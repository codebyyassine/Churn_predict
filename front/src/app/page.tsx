"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { ApiService } from "@/lib/api"

export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await ApiService.getUsers()
        // If authenticated, redirect to dashboard
        router.push("/dashboard")
      } catch (error) {
        // If not authenticated, redirect to login
        router.push("/login")
      }
    }

    checkAuth()
  }, [router])

  return null
}
