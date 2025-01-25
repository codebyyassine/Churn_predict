# API Documentation

## Authentication

### JWT Authentication
All API endpoints require JWT authentication except for the login endpoint. Include the JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

### Login
```http
POST /api/auth/login/
```

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "access": "string",
  "refresh": "string"
}
```

### Refresh Token
```http
POST /api/auth/refresh/
```

**Request Body:**
```json
{
  "refresh": "string"
}
```

**Response:**
```json
{
  "access": "string"
}
```

## Customer Endpoints

### List Customers
```http
GET /api/customers/
```

**Query Parameters:**
- `page`: integer (default: 1)
- `page_size`: integer (default: 10)
- `search`: string
- `sort_by`: string (options: id, name, risk_score)
- `order`: string (options: asc, desc)

**Response:**
```json
{
  "count": 0,
  "next": "string",
  "previous": "string",
  "results": [
    {
      "id": 0,
      "name": "string",
      "email": "string",
      "phone": "string",
      "risk_score": 0.0,
      "last_updated": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Get Customer
```http
GET /api/customers/{id}/
```

**Response:**
```json
{
  "id": 0,
  "name": "string",
  "email": "string",
  "phone": "string",
  "risk_score": 0.0,
  "last_updated": "2024-01-01T00:00:00Z",
  "risk_history": [
    {
      "score": 0.0,
      "timestamp": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Create Customer
```http
POST /api/customers/
```

**Request Body:**
```json
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "age": 0,
  "tenure": 0,
  "balance": 0.0,
  "products": 0,
  "credit_card": true,
  "active": true,
  "salary": 0.0
}
```

**Response:**
```json
{
  "id": 0,
  "name": "string",
  "email": "string",
  "phone": "string",
  "risk_score": 0.0,
  "last_updated": "2024-01-01T00:00:00Z"
}
```

### Update Customer
```http
PUT /api/customers/{id}/
```

**Request Body:**
```json
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "age": 0,
  "tenure": 0,
  "balance": 0.0,
  "products": 0,
  "credit_card": true,
  "active": true,
  "salary": 0.0
}
```

**Response:**
```json
{
  "id": 0,
  "name": "string",
  "email": "string",
  "phone": "string",
  "risk_score": 0.0,
  "last_updated": "2024-01-01T00:00:00Z"
}
```

### Delete Customer
```http
DELETE /api/customers/{id}/
```

**Response:** 204 No Content

## Prediction Endpoints

### Get Prediction
```http
POST /api/predict/
```

**Request Body:**
```json
{
  "customer_id": 0
}
```

**Response:**
```json
{
  "customer_id": 0,
  "risk_score": 0.0,
  "prediction_time": "2024-01-01T00:00:00Z",
  "features_used": {
    "age": 0,
    "tenure": 0,
    "balance": 0.0,
    "products": 0,
    "credit_card": true,
    "active": true,
    "salary": 0.0
  }
}
```

### Batch Prediction
```http
POST /api/predict/batch/
```

**Request Body:**
```json
{
  "customer_ids": [0, 1, 2]
}
```

**Response:**
```json
{
  "task_id": "string",
  "status": "string",
  "message": "string"
}
```

## Monitoring Endpoints

### Get Risk Dashboard
```http
GET /api/monitoring/dashboard/
```

**Response:**
```json
{
  "high_risk_customers": [
    {
      "id": 0,
      "name": "string",
      "risk_score": 0.0,
      "last_updated": "2024-01-01T00:00:00Z"
    }
  ],
  "risk_distribution": {
    "low": 0,
    "medium": 0,
    "high": 0
  },
  "risk_trend": [
    {
      "date": "2024-01-01",
      "average_risk": 0.0
    }
  ]
}
```

### Get Alert History
```http
GET /api/monitoring/alerts/
```

**Query Parameters:**
- `page`: integer (default: 1)
- `page_size`: integer (default: 10)
- `customer_id`: integer
- `start_date`: string (YYYY-MM-DD)
- `end_date`: string (YYYY-MM-DD)

**Response:**
```json
{
  "count": 0,
  "next": "string",
  "previous": "string",
  "results": [
    {
      "id": 0,
      "customer_id": 0,
      "alert_type": "string",
      "message": "string",
      "was_sent": true,
      "error_message": "string",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

## Model Management Endpoints

### Get Model Info
```http
GET /api/model/info/
```

**Response:**
```json
{
  "model_version": "string",
  "last_trained": "2024-01-01T00:00:00Z",
  "metrics": {
    "accuracy": 0.0,
    "precision": 0.0,
    "recall": 0.0,
    "f1_score": 0.0
  },
  "feature_importance": {
    "age": 0.0,
    "tenure": 0.0,
    "balance": 0.0
  }
}
```

### Trigger Model Training
```http
POST /api/model/train/
```

**Response:**
```json
{
  "task_id": "string",
  "status": "string",
  "message": "string"
}
```

### Get Training Status
```http
GET /api/model/train/{task_id}/
```

**Response:**
```json
{
  "task_id": "string",
  "status": "string",
  "progress": 0,
  "message": "string",
  "completed_at": "2024-01-01T00:00:00Z"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "string",
  "detail": "string"
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication credentials were not provided"
}
```

### 403 Forbidden
```json
{
  "error": "You do not have permission to perform this action"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 429 Too Many Requests
```json
{
  "error": "Request limit exceeded",
  "retry_after": 0
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "request_id": "string"
}
``` 