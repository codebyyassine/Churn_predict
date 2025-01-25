# Frontend Documentation

## Overview

The frontend is built with Next.js 13+ using the App Router, TypeScript, Tailwind CSS, and Shadcn UI components. It provides a modern, responsive interface for the customer churn prediction system.

## Project Structure

```
churn-prediction-frontend/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── dashboard/
│   │   ├── page.tsx
│   │   └── layout.tsx
│   ├── customers/
│   │   ├── [id]/
│   │   │   └── page.tsx
│   │   ├── page.tsx
│   │   └── layout.tsx
│   ├── monitoring/
│   │   ├── page.tsx
│   │   └── layout.tsx
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   ├── charts/
│   │   ├── risk-distribution.tsx
│   │   ├── risk-trend.tsx
│   │   └── ...
│   ├── customers/
│   │   ├── customer-list.tsx
│   │   ├── customer-details.tsx
│   │   └── ...
│   └── shared/
│       ├── header.tsx
│       ├── sidebar.tsx
│       └── ...
├── lib/
│   ├── api.ts
│   ├── auth.ts
│   └── utils.ts
├── styles/
│   └── globals.css
└── types/
    └── index.ts
```

## Key Components

### Authentication

```typescript
// app/(auth)/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { login } from '@/lib/auth'

export default function LoginPage() {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  })
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await login(credentials)
      router.push('/dashboard')
    } catch (error) {
      console.error('Login failed:', error)
    }
  }

  return (
    <form onSubmit={handleLogin}>
      <Input
        type="text"
        placeholder="Username"
        value={credentials.username}
        onChange={(e) => setCredentials({
          ...credentials,
          username: e.target.value
        })}
      />
      <Input
        type="password"
        placeholder="Password"
        value={credentials.password}
        onChange={(e) => setCredentials({
          ...credentials,
          password: e.target.value
        })}
      />
      <Button type="submit">Login</Button>
    </form>
  )
}
```

### Dashboard

```typescript
// app/dashboard/page.tsx
import { Suspense } from 'react'
import { RiskDistribution } from '@/components/charts/risk-distribution'
import { RiskTrend } from '@/components/charts/risk-trend'
import { HighRiskCustomers } from '@/components/customers/high-risk-customers'
import { DashboardSkeleton } from '@/components/skeletons'

export default function DashboardPage() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Suspense fallback={<DashboardSkeleton />}>
        <RiskDistribution />
        <RiskTrend />
        <HighRiskCustomers />
      </Suspense>
    </div>
  )
}
```

### Customer List

```typescript
// components/customers/customer-list.tsx
'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { fetchCustomers } from '@/lib/api'

export function CustomerList() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  
  const { data, isLoading } = useQuery({
    queryKey: ['customers', page, search],
    queryFn: () => fetchCustomers({ page, search })
  })

  return (
    <div>
      <Input
        placeholder="Search customers..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Risk Score</TableHead>
            <TableHead>Last Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.results.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell>{customer.id}</TableCell>
              <TableCell>{customer.name}</TableCell>
              <TableCell>{customer.risk_score}</TableCell>
              <TableCell>{customer.last_updated}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex justify-between mt-4">
        <Button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Previous
        </Button>
        <Button
          onClick={() => setPage(p => p + 1)}
          disabled={!data?.next}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
```

### Risk Charts

```typescript
// components/charts/risk-distribution.tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import { PieChart } from '@tremor/react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { fetchRiskDistribution } from '@/lib/api'

export function RiskDistribution() {
  const { data } = useQuery({
    queryKey: ['riskDistribution'],
    queryFn: fetchRiskDistribution
  })

  const chartData = [
    { name: 'Low Risk', value: data?.low || 0 },
    { name: 'Medium Risk', value: data?.medium || 0 },
    { name: 'High Risk', value: data?.high || 0 }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Risk Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <PieChart
          data={chartData}
          index="name"
          category="value"
          colors={['emerald', 'yellow', 'rose']}
        />
      </CardContent>
    </Card>
  )
}
```

## API Integration

### API Client

```typescript
// lib/api.ts
import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export async function fetchCustomers({
  page = 1,
  search = '',
  sort_by = 'id',
  order = 'desc'
}) {
  const { data } = await api.get('/api/customers/', {
    params: { page, search, sort_by, order }
  })
  return data
}

export async function fetchCustomerDetails(id: number) {
  const { data } = await api.get(`/api/customers/${id}/`)
  return data
}

export async function fetchRiskDistribution() {
  const { data } = await api.get('/api/monitoring/dashboard/')
  return data.risk_distribution
}

export async function fetchRiskTrend() {
  const { data } = await api.get('/api/monitoring/dashboard/')
  return data.risk_trend
}

export async function predictChurn(customerId: number) {
  const { data } = await api.post('/api/predict/', {
    customer_id: customerId
  })
  return data
}
```

### Authentication

```typescript
// lib/auth.ts
import { jwtDecode } from 'jwt-decode'
import { api } from './api'

interface Credentials {
  username: string
  password: string
}

interface AuthResponse {
  access: string
  refresh: string
}

export async function login(credentials: Credentials) {
  const { data } = await api.post<AuthResponse>('/api/auth/login/', credentials)
  
  localStorage.setItem('token', data.access)
  localStorage.setItem('refresh', data.refresh)
  
  return data
}

export async function refreshToken() {
  const refresh = localStorage.getItem('refresh')
  
  if (!refresh) {
    throw new Error('No refresh token')
  }
  
  const { data } = await api.post<AuthResponse>('/api/auth/refresh/', {
    refresh
  })
  
  localStorage.setItem('token', data.access)
  
  return data
}

export function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('refresh')
}

export function isAuthenticated() {
  const token = localStorage.getItem('token')
  
  if (!token) {
    return false
  }
  
  try {
    const decoded = jwtDecode(token)
    return decoded.exp * 1000 > Date.now()
  } catch {
    return false
  }
}
```

## State Management

### React Query Setup

```typescript
// app/providers.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1
    }
  }
})

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools />
    </QueryClientProvider>
  )
}
```

### Custom Hooks

```typescript
// lib/hooks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchCustomers, predictChurn } from './api'

export function useCustomers(params) {
  return useQuery({
    queryKey: ['customers', params],
    queryFn: () => fetchCustomers(params)
  })
}

export function useChurnPrediction() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: predictChurn,
    onSuccess: () => {
      queryClient.invalidateQueries(['customers'])
    }
  })
}
```

## Styling

### Tailwind Configuration

```javascript
// tailwind.config.js
const { fontFamily } = require('tailwindcss/defaultTheme')

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      fontFamily: {
        sans: ['var(--font-sans)', ...fontFamily.sans]
      }
    }
  },
  plugins: [require('tailwindcss-animate')]
}
```

### Global Styles

```css
/* styles/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
``` 