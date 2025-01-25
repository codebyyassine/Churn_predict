export interface CustomerFilters {
  search?: string;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
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
  ordering?: string;
  page_size?: number;
}

export interface AlertHistoryFilters {
  alert_type?: string;
  customer_id?: string;
  date_from?: string;
  date_to?: string;
  success_only?: boolean;
}

export interface RiskDashboardData {
  high_risk_customers: Array<{
    customer_id: number;
    customer_name: string;
    probability: number;
    risk_change: number;
    last_updated: string;
  }>;
  significant_increases: Array<{
    customer_id: number;
    customer_name: string;
    probability: number;
    risk_change: number;
    previous_probability: number;
    changed_at: string;
  }>;
  risk_distribution: {
    very_high: number;
    high: number;
    medium: number;
    low: number;
    very_low: number;
  };
  risk_trend: Array<{
    date: string;
    avg_risk: number;
    high_risk_count: number;
  }>;
  thresholds: {
    high_risk: number;
    risk_increase: number;
  };
}

export interface Credentials {
  username: string;
  password: string;
}

export interface Customer {
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

export interface PredictionResult {
  churn_probability: number;
  feature_importance: Array<{
    feature: string;
    importance: number;
  }>;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface BulkOperationResponse {
  status: 'success' | 'error' | 'partial_success';
  message: string;
  data: any;
}

export interface ImportResponse {
  status: 'success' | 'error';
  created: number;
  updated: number;
  skipped: number;
  details: {
    created_ids: number[];
    updated_ids: number[];
    skipped_ids: number[];
  };
  message?: string;
}

export interface AlertConfig {
  webhook_url: string;
  is_enabled: boolean;
  high_risk_threshold: number;
  risk_increase_threshold: number;
}

export interface AlertHistory {
  id: number;
  customer: number;
  customer_name: string;
  alert_type: 'HIGH_RISK' | 'RISK_INCREASE' | 'SUMMARY';
  message: any;
  sent_at: string;
  was_sent: boolean;
  error_message: string | null;
}

export interface AlertStats {
  total_alerts: number;
  success_rate: number;
  alert_types: {
    HIGH_RISK: number;
    RISK_INCREASE: number;
    SUMMARY: number;
  };
  daily_alerts: Array<{
    date: string;
    count: number;
    success_count: number;
  }>;
} 