"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ApiService } from "@/lib/api"
import { useRouter } from "next/navigation"

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    ApiService.clearCredentials()
    router.push("/login")
  }

  const isActive = (path: string) => pathname === path

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-8">
        <div className="flex-none w-48">
          <Link href="/dashboard" className="text-xl font-bold bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
            CodeByYassine
          </Link>
        </div>
        <div className="flex justify-center flex-1 space-x-8">
          <Link
            href="/dashboard"
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary relative py-2",
              isActive("/dashboard")
                ? "text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
                : "text-muted-foreground"
            )}
          >
            Dashboard
          </Link>
          <Link
            href="/customers"
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary relative py-2",
              isActive("/customers")
                ? "text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
                : "text-muted-foreground"
            )}
          >
            Customer Management
          </Link>
          <Link
            href="/risk"
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary relative py-2",
              isActive("/risk")
                ? "text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
                : "text-muted-foreground"
            )}
          >
            Risk Monitoring
          </Link>
          <Link
            href="/predict"
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary relative py-2",
              isActive("/predict")
                ? "text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
                : "text-muted-foreground"
            )}
          >
            Churn Prediction
          </Link>
          <Link
            href="/admin"
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary relative py-2",
              isActive("/admin")
                ? "text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
                : "text-muted-foreground"
            )}
          >
            Admin Panel
          </Link>
        </div>
        <div className="flex-none w-48 flex justify-end">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="text-sm font-medium hover:text-primary"
          >
            Logout
          </Button>
        </div>
      </div>
    </nav>
  )
} 