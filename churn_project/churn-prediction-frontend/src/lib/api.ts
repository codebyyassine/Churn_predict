import { 
  CustomerFilters, 
  AlertHistoryFilters,
  Customer,
  PredictionResult,
  PaginatedResponse,
  BulkOperationResponse,
  ImportResponse,
  AlertConfig,
  AlertHistory,
  RiskDashboardData,
  AlertStats,
  Credentials
} from "../types"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Store credentials in memory
let credentials: Credentials | null = null

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }

  if (credentials) {
    headers['Authorization'] = 'Basic ' + btoa(`${credentials.username}:${credentials.password}`)
  }

  return headers
}

// Helper to build query string from customer filters
const buildQueryString = (filters?: CustomerFilters): string => {
  if (!filters) return '';
  
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== null && value !== 'all') {
      // Handle boolean values
      if (typeof value === 'boolean') {
        params.append(key, value.toString());
      } else {
        params.append(key, value.toString());
      }
    }
  });
  
  // Add default pagination if not provided
  if (!filters.page) {
    params.append('page', '1');
  }
  if (!filters.page_size) {
    params.append('page_size', '10');
  }
  
  return params.toString();
};

// Helper to build query string from alert history filters
const buildAlertHistoryQueryString = (filters?: AlertHistoryFilters): string => {
  if (!filters) return '';
  
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== null) {
      // Handle boolean values
      if (typeof value === 'boolean') {
        params.append(key, value.toString());
      } else {
        params.append(key, value.toString());
      }
    }
  });
  
  return params.toString();
};

export const ApiService = {
  // Authentication
  setCredentials: (creds: Credentials) => {
    credentials = creds
  },

  clearCredentials: () => {
    credentials = null
  },

  // User Management
  getUsers: async () => {
    const response = await fetch(`${BASE_URL}/api/users/`, {
      headers: getAuthHeaders()
    })
    if (!response.ok) {
      throw new Error('Failed to fetch users')
    }
    return response.json()
  },

  createUser: async (userData: Partial<Credentials>) => {
    const response = await fetch(`${BASE_URL}/api/users/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    })
    if (!response.ok) {
      throw new Error('Failed to create user')
    }
    return response.json()
  },

  // Customer Management
  getCustomers: async (filters?: CustomerFilters): Promise<PaginatedResponse<Customer>> => {
    const queryString = buildQueryString(filters)
    const response = await fetch(`${BASE_URL}/api/customers/?${queryString}`, {
      headers: getAuthHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch customers')
    }
    
    return response.json()
  },

  createCustomer: async (customerData: Omit<Customer, 'customer_id'>) => {
    const response = await fetch(`${BASE_URL}/api/customers/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(customerData)
    })
    if (!response.ok) {
      throw new Error('Failed to create customer')
    }
    return response.json()
  },

  updateCustomer: async (customer_id: number, customerData: Partial<Customer>) => {
    const response = await fetch(`${BASE_URL}/api/customers/${customer_id}/`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ...customerData, customer_id })
    })
    if (!response.ok) {
      throw new Error('Failed to update customer')
    }
    return response.json()
  },

  deleteCustomer: async (customer_id: number) => {
    const response = await fetch(`${BASE_URL}/api/customers/${customer_id}/`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
    if (!response.ok) {
      throw new Error('Failed to delete customer')
    }
    return response.ok
  },

  // Bulk Operations
  bulkCreateCustomers: async (customers: Omit<Customer, 'customer_id'>[]) => {
    const response = await fetch(`${BASE_URL}/api/customers/bulk/create/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(customers)
    })
    if (!response.ok) {
      throw new Error('Failed to bulk create customers')
    }
    return response.json()
  },

  bulkUpdateCustomers: async (customers: (Partial<Customer> & { customer_id: number })[]) => {
    const response = await fetch(`${BASE_URL}/api/customers/bulk/update/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(customers)
    })
    if (!response.ok) {
      throw new Error('Failed to bulk update customers')
    }
    return response.json()
  },

  bulkDeleteCustomers: async (ids: number[]): Promise<BulkOperationResponse> => {
    const response = await fetch(`${BASE_URL}/api/customers/bulk/delete/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(ids)
    })
    if (!response.ok) {
      throw new Error('Failed to bulk delete customers')
    }
    return response.json()
  },

  // Prediction & Model Management
  predictChurn: async (customerData: Omit<Customer, 'customer_id' | 'exited' | 'surname'>): Promise<PredictionResult> => {
    const response = await fetch(`${BASE_URL}/api/predict/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(customerData)
    })
    if (!response.ok) {
      throw new Error('Failed to get prediction')
    }
    return response.json()
  },

  trainModel: async () => {
    const response = await fetch(`${BASE_URL}/api/train/`, {
      method: 'POST',
      headers: getAuthHeaders()
    })
    if (!response.ok) {
      throw new Error('Failed to train model')
    }
    return response.json()
  },

  getModelMetrics: async () => {
    const response = await fetch(`${BASE_URL}/api/model-metrics/`, {
      headers: getAuthHeaders()
    })
    if (!response.ok) {
      throw new Error('Failed to get model metrics')
    }
    return response.json()
  },

  // Dashboard & Stats
  getDashboardStats: async () => {
    const response = await fetch(`${BASE_URL}/api/dashboard/stats/`, {
      headers: getAuthHeaders()
    })
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard stats')
    }
    return response.json()
  },

  // File Import
  importCustomersCSV: async (file: File, updateExisting: boolean = false): Promise<ImportResponse> => {
    const formData = new FormData()
    formData.append('csv_file', file)
    formData.append('update_existing', updateExisting.toString())

    const headers = getAuthHeaders()
    // Remove Content-Type as it will be set automatically with the correct boundary
    delete headers['Content-Type']

    const response = await fetch(`${BASE_URL}/api/customers/import-csv/`, {
      method: 'POST',
      headers: headers,
      body: formData
    })

    if (!response.ok) {
      let errorMessage: string
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorData.detail || `HTTP error! status: ${response.status}`
      } catch {
        errorMessage = `HTTP error! status: ${response.status}`
      }
      throw new Error(errorMessage)
    }

    const data = await response.json()
    if (data.status === 'error') {
      throw new Error(data.message || 'Import failed')
    }

    return data
  },

  // Alert Management
  getAlertConfig: async (): Promise<AlertConfig> => {
    const response = await fetch(`${BASE_URL}/api/alerts/config/`, {
      headers: getAuthHeaders()
    })
    if (!response.ok) {
      throw new Error('Failed to fetch alert config')
    }
    return response.json()
  },

  updateAlertConfig: async (config: AlertConfig): Promise<AlertConfig> => {
    const response = await fetch(`${BASE_URL}/api/alerts/config/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(config)
    })
    if (!response.ok) {
      throw new Error('Failed to update alert config')
    }
    return response.json()
  },

  getAlertHistory: async (filters?: AlertHistoryFilters) => {
    const queryString = buildAlertHistoryQueryString(filters)
    const response = await fetch(`${BASE_URL}/api/alerts/history/?${queryString}`, {
      headers: getAuthHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch alert history')
    }
    
    return response.json()
  },

  getAlertStats: async () => {
    const response = await fetch(`${BASE_URL}/api/alerts/stats/`, {
      headers: getAuthHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch alert statistics')
    }
    
    return response.json()
  },

  getRiskDashboard: async () => {
    const response = await fetch(`${BASE_URL}/api/risk/dashboard/`, {
      headers: getAuthHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch risk dashboard')
    }
    
    return response.json()
  },

  triggerMonitoring: async () => {
    const response = await fetch(`${BASE_URL}/api/risk/monitor/trigger/`, {
      method: 'POST',
      headers: getAuthHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to trigger monitoring')
    }
    
    return response.json()
  },

  getMonitoringResult: async (customer_id: number) => {
    try {
      const response = await fetch(`${BASE_URL}/api/risk/monitoring/${customer_id}/`, {
        headers: getAuthHeaders()
      })
      
      if (!response.ok) {
        throw new Error('No monitoring data available')
      }
      
      return response.json()
    } catch (error) {
      throw error
    }
  },

  // Add new method for batch risk score fetching
  getRiskScores: async (customerIds: number[]) => {
    const queryString = new URLSearchParams();
    customerIds.forEach(id => queryString.append('customer_ids', id.toString()));
    
    const response = await fetch(`${BASE_URL}/api/risk/monitoring/batch/?${queryString}`, {
      headers: getAuthHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch risk scores')
    }
    
    return response.json()
  }
} 