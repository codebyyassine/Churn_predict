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
        router.push("/dashboard")
      } catch (error) {
        router.push("/login")
      }
    }

    checkAuth()
  }, [router])

  return null
}
