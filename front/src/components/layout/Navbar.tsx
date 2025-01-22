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
    <nav className="border-b">
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center space-x-4 lg:space-x-6">
          <Link
            href="/dashboard"
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              isActive("/dashboard")
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            Dashboard
          </Link>
          <Link
            href="/customers"
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              isActive("/customers")
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            Customer Management
          </Link>
          <Link
            href="/predict"
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              isActive("/predict")
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            Churn Prediction
          </Link>
          <Link
            href="/admin"
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              isActive("/admin")
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            Admin Panel
          </Link>
        </div>
        <div className="ml-auto flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
      </div>
    </nav>
  )
} 