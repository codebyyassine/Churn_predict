import { LoginForm } from "@/components/LoginForm"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Login",
  description: "Login to access the admin panel",
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Admin Login
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your credentials to access the admin panel
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
} 