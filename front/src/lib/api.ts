interface Credentials {
  username: string;
  password: string;
}

interface Customer {
  id?: number;
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
  min_age?: number;
  max_age?: number;
  min_credit_score?: number;
  max_credit_score?: number;
  exited?: boolean;
}

// Use Django API URL directly
const BASE_URL = 'http://localhost:8000/api';

// Helper to ensure trailing slash
const url = (path: string) => `${BASE_URL}${path}/`;

export class ApiService {
  private static credentials: Credentials | null = null;

  static setCredentials(credentials: Credentials) {
    this.credentials = credentials;
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
  static async getCustomers(filters?: CustomerFilters) {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== 'all') {
          queryParams.append(key, value.toString());
        }
      });
    }

    const response = await fetch(`${url('/customers')}?${queryParams}`, {
      headers: this.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch customers: ${response.statusText}`);
    }
    
    return response.json();
  }

  static async createCustomer(customerData: Omit<Customer, 'id'>) {
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

  static async updateCustomer(id: number, customerData: Partial<Customer>) {
    const response = await fetch(url(`/customers/${id}`), {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(customerData),
    });
    if (!response.ok) {
      throw new Error(`Failed to update customer: ${response.statusText}`);
    }
    return response.json();
  }

  static async deleteCustomer(id: number) {
    const response = await fetch(url(`/customers/${id}`), {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to delete customer: ${response.statusText}`);
    }
    return response.ok;
  }

  // Bulk Operations
  static async bulkCreateCustomers(customers: Omit<Customer, 'id'>[]) {
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

  static async bulkUpdateCustomers(customers: (Partial<Customer> & { id: number })[]) {
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
  static async predictChurn(customerData: Omit<Customer, 'id' | 'exited'>): Promise<PredictionResult> {
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
} 