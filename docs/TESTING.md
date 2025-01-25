# Testing Documentation

## Overview

This document outlines the testing strategy and procedures for the Customer Churn Prediction System. It covers unit tests, integration tests, end-to-end tests, and performance testing.

## Test Structure

```
tests/
├── unit/
│   ├── api/
│   ├── ml/
│   └── utils/
├── integration/
│   ├── api/
│   ├── ml/
│   └── tasks/
├── e2e/
│   ├── features/
│   └── steps/
└── performance/
    ├── locustfiles/
    └── scenarios/
```

## Backend Testing

### Unit Tests

```python
# tests/unit/ml/test_model.py
import pytest
from churn_app.ml.model import ChurnPredictor

def test_model_prediction():
    predictor = ChurnPredictor()
    features = {
        'age': 35,
        'tenure': 5,
        'balance': 50000,
        'products': 2,
        'credit_card': True,
        'active': True,
        'salary': 60000
    }
    
    prediction = predictor.predict(features)
    assert 0 <= prediction <= 1
    assert isinstance(prediction, float)

def test_feature_validation():
    predictor = ChurnPredictor()
    invalid_features = {
        'age': -1,  # Invalid age
        'tenure': 5,
        'balance': 50000
    }
    
    with pytest.raises(ValueError):
        predictor.predict(invalid_features)

# tests/unit/api/test_views.py
from django.test import TestCase
from rest_framework.test import APIClient
from churn_app.models import Customer

class CustomerViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.customer_data = {
            'name': 'John Doe',
            'email': 'john@example.com',
            'phone': '1234567890',
            'age': 35,
            'tenure': 5,
            'balance': 50000,
            'products': 2,
            'credit_card': True,
            'active': True,
            'salary': 60000
        }
    
    def test_create_customer(self):
        response = self.client.post('/api/customers/', self.customer_data)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Customer.objects.count(), 1)
        self.assertEqual(Customer.objects.get().name, 'John Doe')
```

### Integration Tests

```python
# tests/integration/api/test_prediction.py
from django.test import TestCase
from rest_framework.test import APIClient
from churn_app.models import Customer, RiskHistory
from churn_app.tasks import predict_customer_churn

class ChurnPredictionIntegrationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.customer = Customer.objects.create(
            name='John Doe',
            email='john@example.com',
            age=35,
            tenure=5,
            balance=50000
        )
    
    def test_prediction_flow(self):
        # Trigger prediction
        response = self.client.post(f'/api/predict/', {
            'customer_id': self.customer.id
        })
        self.assertEqual(response.status_code, 200)
        
        # Check risk history
        risk_history = RiskHistory.objects.filter(customer=self.customer)
        self.assertEqual(risk_history.count(), 1)
        
        # Verify prediction values
        prediction = risk_history.first()
        self.assertIsInstance(prediction.risk_score, float)
        self.assertGreaterEqual(prediction.risk_score, 0)
        self.assertLessEqual(prediction.risk_score, 1)

# tests/integration/tasks/test_monitoring.py
from django.test import TestCase
from unittest.mock import patch
from churn_app.tasks import monitor_customer_risk
from churn_app.models import Customer, AlertHistory

class RiskMonitoringIntegrationTests(TestCase):
    @patch('churn_app.utils.send_discord_alert')
    def test_monitoring_flow(self, mock_send_alert):
        # Create test customer
        customer = Customer.objects.create(
            name='High Risk Customer',
            email='high.risk@example.com'
        )
        
        # Run monitoring
        monitor_customer_risk(customer.id)
        
        # Check alert creation
        alerts = AlertHistory.objects.filter(customer=customer)
        self.assertTrue(alerts.exists())
        
        # Verify alert sending
        mock_send_alert.assert_called_once()
```

### End-to-End Tests

```python
# tests/e2e/features/customer_monitoring.feature
Feature: Customer Risk Monitoring
  As a risk analyst
  I want to monitor customer churn risk
  So that I can take preventive actions

  Scenario: High risk customer detection
    Given a customer with the following details:
      | name | email              | age | tenure | balance |
      | John | john@example.com   | 35  | 5     | 50000   |
    When the risk monitoring job runs
    Then a risk score should be calculated
    And if the risk is high
    Then an alert should be created
    And the alert should be sent to Discord

# tests/e2e/steps/test_monitoring.py
from behave import given, when, then
from churn_app.models import Customer, RiskHistory, AlertHistory

@given('a customer with the following details')
def create_customer(context):
    for row in context.table:
        context.customer = Customer.objects.create(
            name=row['name'],
            email=row['email'],
            age=float(row['age']),
            tenure=int(row['tenure']),
            balance=float(row['balance'])
        )

@when('the risk monitoring job runs')
def run_monitoring(context):
    from churn_app.tasks import monitor_customer_risk
    monitor_customer_risk(context.customer.id)

@then('a risk score should be calculated')
def check_risk_score(context):
    risk_history = RiskHistory.objects.filter(customer=context.customer)
    assert risk_history.exists()
    context.risk_score = risk_history.first().risk_score

@then('if the risk is high')
def check_high_risk(context):
    context.is_high_risk = context.risk_score >= 0.7

@then('an alert should be created')
def check_alert_creation(context):
    if context.is_high_risk:
        alerts = AlertHistory.objects.filter(customer=context.customer)
        assert alerts.exists()
```

## Frontend Testing

### Component Tests

```typescript
// tests/components/RiskDistribution.test.tsx
import { render, screen } from '@testing-library/react'
import { RiskDistribution } from '@/components/charts/risk-distribution'

describe('RiskDistribution', () => {
  it('renders risk distribution chart', () => {
    const mockData = {
      low: 30,
      medium: 50,
      high: 20
    }
    
    render(<RiskDistribution data={mockData} />)
    
    expect(screen.getByText('Risk Distribution')).toBeInTheDocument()
    expect(screen.getByText('Low Risk: 30%')).toBeInTheDocument()
    expect(screen.getByText('Medium Risk: 50%')).toBeInTheDocument()
    expect(screen.getByText('High Risk: 20%')).toBeInTheDocument()
  })
})

// tests/components/CustomerList.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { CustomerList } from '@/components/customers/customer-list'

describe('CustomerList', () => {
  it('handles pagination correctly', async () => {
    render(<CustomerList />)
    
    // Click next page
    const nextButton = screen.getByText('Next')
    fireEvent.click(nextButton)
    
    // Check if page 2 is loaded
    expect(screen.getByText('Page 2')).toBeInTheDocument()
  })
  
  it('filters customers by search', async () => {
    render(<CustomerList />)
    
    const searchInput = screen.getByPlaceholderText('Search customers...')
    fireEvent.change(searchInput, { target: { value: 'John' } })
    
    // Check if results are filtered
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument()
  })
})
```

### API Integration Tests

```typescript
// tests/api/customers.test.ts
import { fetchCustomers, fetchCustomerDetails } from '@/lib/api'

describe('Customer API', () => {
  it('fetches customer list', async () => {
    const response = await fetchCustomers({
      page: 1,
      search: '',
      sort_by: 'id',
      order: 'desc'
    })
    
    expect(response.results).toBeDefined()
    expect(Array.isArray(response.results)).toBe(true)
  })
  
  it('fetches customer details', async () => {
    const customerId = 1
    const customer = await fetchCustomerDetails(customerId)
    
    expect(customer.id).toBe(customerId)
    expect(customer.risk_history).toBeDefined()
  })
})
```

## Performance Testing

### Load Testing

```python
# tests/performance/locustfiles/api_endpoints.py
from locust import HttpUser, task, between

class CustomerAPIUser(HttpUser):
    wait_time = between(1, 3)
    
    @task(3)
    def get_customers(self):
        self.client.get("/api/customers/")
    
    @task(2)
    def get_dashboard(self):
        self.client.get("/api/monitoring/dashboard/")
    
    @task(1)
    def predict_churn(self):
        customer_id = 1  # Replace with dynamic ID
        self.client.post("/api/predict/", json={
            "customer_id": customer_id
        })

# Run with: locust -f tests/performance/locustfiles/api_endpoints.py
```

### Stress Testing

```python
# tests/performance/scenarios/stress_test.py
import asyncio
import aiohttp
import time

async def make_predictions(session, num_requests):
    tasks = []
    for i in range(num_requests):
        task = asyncio.create_task(
            session.post(
                'http://localhost:8000/api/predict/',
                json={'customer_id': i % 100 + 1}
            )
        )
        tasks.append(task)
    return await asyncio.gather(*tasks)

async def stress_test():
    async with aiohttp.ClientSession() as session:
        start_time = time.time()
        
        # Make 1000 concurrent requests
        responses = await make_predictions(session, 1000)
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Calculate metrics
        successful = sum(1 for r in responses if r.status == 200)
        failed = len(responses) - successful
        
        print(f"Duration: {duration:.2f} seconds")
        print(f"Successful requests: {successful}")
        print(f"Failed requests: {failed}")
        print(f"Requests per second: {len(responses)/duration:.2f}")

# Run with: python -m tests.performance.scenarios.stress_test
```

## ML Model Testing

### Model Validation

```python
# tests/ml/test_validation.py
import numpy as np
from sklearn.model_selection import cross_val_score
from churn_app.ml.model import ChurnPredictor

def test_model_cross_validation():
    predictor = ChurnPredictor()
    X = np.random.rand(1000, 7)  # 7 features
    y = np.random.randint(2, size=1000)  # Binary target
    
    # Perform 5-fold cross-validation
    scores = cross_val_score(predictor.model, X, y, cv=5)
    
    # Check if average score meets threshold
    assert scores.mean() >= 0.7
    
    # Check score variance
    assert scores.std() < 0.1

def test_feature_importance():
    predictor = ChurnPredictor()
    feature_importance = predictor.get_feature_importance()
    
    # Check if importance scores sum to 1
    assert np.isclose(sum(feature_importance.values()), 1.0)
    
    # Check if all features have non-negative importance
    assert all(score >= 0 for score in feature_importance.values())
```

### Data Validation

```python
# tests/ml/test_data_validation.py
import pandas as pd
from churn_app.ml.validation import validate_features

def test_data_schema():
    # Valid data
    valid_data = pd.DataFrame({
        'age': [25, 30, 35],
        'tenure': [1, 5, 10],
        'balance': [1000, 5000, 10000],
        'products': [1, 2, 3],
        'credit_card': [True, False, True],
        'active': [True, True, False],
        'salary': [30000, 50000, 70000]
    })
    
    assert validate_features(valid_data) is True
    
    # Invalid data
    invalid_data = pd.DataFrame({
        'age': [-1, 30, 35],  # Invalid age
        'tenure': [1, 5, 10]
    })
    
    try:
        validate_features(invalid_data)
        assert False, "Should raise ValidationError"
    except ValueError:
        pass
```

## Test Coverage

To generate test coverage reports:

```bash
# Backend coverage
coverage run manage.py test
coverage report
coverage html

# Frontend coverage
npm test -- --coverage
```

## Continuous Integration

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_DB: test_db
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_password
        ports:
          - 5432:5432
        options: --health-cmd pg_isready
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.9'
      
      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt
      
      - name: Run tests
        env:
          DATABASE_URL: postgres://test_user:test_password@localhost:5432/test_db
        run: |
          python manage.py test
          coverage run manage.py test
          coverage report
      
      - name: Upload coverage
        uses: codecov/codecov-action@v2
``` 