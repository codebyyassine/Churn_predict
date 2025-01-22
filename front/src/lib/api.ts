interface Credentials {
  username: string;
  password: string;
}

interface Customer {
  customer_id?: number;
  credit_score: number;
  age: number;
  tenure: number;
  balance: number;
  num_of_products: number;
  has_cr_card: boolean;
  is_active_member: boolean;
  estimated_salary: number;
  geography: string;
  gender: string;
  exited?: boolean;
  surname?: string;
}

interface PredictionResult {
  churn_probability: number;
  feature_importance: Array<{
    feature: string;
    importance: number;
  }>;
}

interface CustomerFilters {
  geography?: string;
  gender?: string;
  min_age?: number;
  max_age?: number;
  min_credit_score?: number;
  max_credit_score?: number;
  min_balance?: number;
  max_balance?: number;
  exited?: boolean;
  has_cr_card?: boolean;
  is_active_member?: boolean;
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Use Django API URL directly
const BASE_URL = 'http://localhost:8000/api';

// Helper to ensure trailing slash
const url = (path: string) => `${BASE_URL}${path}/`;

// Helper to build query string from filters
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

export class ApiService {
  private static credentials: Credentials | null = null;

  static setCredentials(credentials: Credentials) {
    this.credentials = credentials;
  }

  static clearCredentials() {
    this.credentials = null;
  }

  private static getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (this.credentials) {
      headers['Authorization'] = 'Basic ' + btoa(`${this.credentials.username}:${this.credentials.password}`);
    }

    return headers;
  }

  // User Management
  static async getUsers() {
    const response = await fetch(url('/users'), {
      headers: this.getHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.statusText}`);
    }
    return response.json();
  }

  static async createUser(userData: Partial<Credentials>) {
    const response = await fetch(url('/users'), {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      throw new Error(`Failed to create user: ${response.statusText}`);
    }
    return response.json();
  }

  // Customer Management
  static async getCustomers(filters?: CustomerFilters): Promise<PaginatedResponse<Customer>> {
    const queryString = buildQueryString(filters);
    const response = await fetch(`${url('/customers')}?${queryString}`, {
      headers: this.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch customers: ${response.statusText}`);
    }
    
    return response.json();
  }

  static async createCustomer(customerData: Omit<Customer, 'customer_id'>) {
    const response = await fetch(url('/customers'), {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(customerData),
    });
    if (!response.ok) {
      throw new Error(`Failed to create customer: ${response.statusText}`);
    }
    return response.json();
  }

  static async updateCustomer(customer_id: number, customerData: Partial<Customer>) {
    const response = await fetch(url(`/customers/${customer_id}`), {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ ...customerData, customer_id }),
    });
    if (!response.ok) {
      throw new Error(`Failed to update customer: ${response.statusText}`);
    }
    return response.json();
  }

  static async deleteCustomer(customer_id: number) {
    const response = await fetch(url(`/customers/${customer_id}`), {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to delete customer: ${response.statusText}`);
    }
    return response.ok;
  }

  // Bulk Operations
  static async bulkCreateCustomers(customers: Omit<Customer, 'customer_id'>[]) {
    const response = await fetch(url('/customers/bulk/create'), {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(customers),
    });
    if (!response.ok) {
      throw new Error(`Failed to bulk create customers: ${response.statusText}`);
    }
    return response.json();
  }

  static async bulkUpdateCustomers(customers: (Partial<Customer> & { customer_id: number })[]) {
    const response = await fetch(url('/customers/bulk/update'), {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(customers),
    });
    if (!response.ok) {
      throw new Error(`Failed to bulk update customers: ${response.statusText}`);
    }
    return response.json();
  }

  static async bulkDeleteCustomers(ids: number[]) {
    const response = await fetch(url('/customers/bulk/delete'), {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(ids),
    });
    if (!response.ok) {
      throw new Error(`Failed to bulk delete customers: ${response.statusText}`);
    }
    return response.ok;
  }

  // Prediction
  static async predictChurn(customerData: Omit<Customer, 'customer_id' | 'exited' | 'surname'>): Promise<PredictionResult> {
    const response = await fetch(url('/predict'), {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(customerData),
    });
    if (!response.ok) {
      throw new Error(`Failed to get prediction: ${response.statusText}`);
    }
    return response.json();
  }

  // Model Training
  static async trainModel() {
    const response = await fetch(url('/train'), {
      method: 'POST',
      headers: this.getHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to train model: ${response.statusText}`);
    }
    return response.json();
  }

  static async getDashboardStats(): Promise<any> {
    const response = await fetch(url('/dashboard/stats'), {
      method: 'GET',
      headers: this.getHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch dashboard stats: ${response.statusText}`)
    }

    return response.json()
  }
} 