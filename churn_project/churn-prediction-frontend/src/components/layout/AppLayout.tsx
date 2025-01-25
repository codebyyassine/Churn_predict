"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { ApiService } from "@/lib/api"
import { Navbar } from "./Navbar"
import { toast } from "@/components/ui/use-toast"
import { Icons } from "@/lib/icons"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Skip auth check for login page
        if (pathname === "/login") {
          setIsLoading(false)
          return
        }

        await ApiService.getUsers()
        setIsLoading(false)
      } catch (error) {
        toast({
          title: "Authentication required",
          description: "Please log in to continue.",
          variant: "destructive",
        })
        router.push("/login")
      }
    }

    checkAuth()
  }, [pathname, router])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Icons.spinner className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (pathname === "/login") {
    return children
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="rounded-lg border bg-card p-8 shadow-sm">
          {children}
        </div>
      </main>
    </div>
  )
} 