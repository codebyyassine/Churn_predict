# Customer Churn Prediction API

A machine learning-powered API service that predicts customer churn probability using a trained logistic regression model. Built with Django, Docker, and MLflow for experiment tracking.

## Project Overview

This project provides a REST API endpoint that predicts the likelihood of customer churn based on various customer attributes. It uses a machine learning model trained on historical customer data and provides real-time predictions through a cached API endpoint.

### Features

- RESTful API endpoint for churn prediction
- Automated model training pipeline
- Redis-based prediction caching
- Docker containerization
- MLflow experiment tracking
- PostgreSQL database integration

## Technical Stack

- **Backend Framework**: Django + Django REST Framework
- **Machine Learning**: scikit-learn
- **Database**: PostgreSQL
- **Caching**: Redis
- **Containerization**: Docker
- **ML Experiment Tracking**: MLflow
- **Key Libraries**: pandas, numpy, psycopg2

## Model Features

The model uses the following features for prediction:

### Numerical Features
- Credit Score
- Age
- Tenure
- Balance
- Number of Products
- Has Credit Card (0/1)
- Is Active Member (0/1)
- Estimated Salary

### Categorical Features
- Geography
- Gender

## API Usage

### Authentication

The API uses Basic Authentication for secure endpoints. To use authenticated endpoints:

1. Create an admin user:
```bash
docker compose exec web python manage.py createsuperuser
```

2. Use the credentials in API requests:
```bash
# Example using curl with Basic Auth
curl -X POST http://localhost:8000/api/train/ -u "username:password"
```

### Rate Limiting

The API implements rate limiting to prevent abuse:
- Anonymous users: 100 requests per day
- Authenticated users: 1000 requests per day

### Prediction Endpoint

```http
POST /api/predict/
```

This endpoint is publicly accessible and does not require authentication.

#### Request Body Example:
```json
{
    "credit_score": 600,
    "age": 40,
    "tenure": 3,
    "balance": 60000,
    "num_of_products": 2,
    "has_cr_card": 1,
    "is_active_member": 1,
    "estimated_salary": 100000,
    "geography": "France",
    "gender": "Female"
}
```

#### Response Example:
```json
{
    "churn_probability": 0.245
}
```

### Training Endpoint

```http
POST /api/train/
```

This endpoint triggers model retraining. It requires admin authentication using Basic Auth.

#### Authentication Required
- Basic Authentication
- Admin privileges

#### Request Example:
```bash
curl -X POST http://localhost:8000/api/train/ -u "admin:password"
```

#### Response Example (Success):
```json
{
    "status": "success",
    "message": "Model training completed successfully"
}
```

#### Response Example (Error):
```json
{
    "status": "error",
    "message": "Error details..."
}
```

## Setup and Installation

1. Clone the repository:
```bash
git clone <repository-url>
```

2. Start the Docker containers:
```bash
docker compose up -d
```

3. Train the model:
```bash
docker compose exec web python manage.py train_churn
```

## Model Training

The model training pipeline includes:
- Data loading from PostgreSQL
- Basic data cleaning and preprocessing
- Feature encoding and scaling
- Model training with LogisticRegression
- Performance evaluation
- Model persistence
- MLflow tracking

## Caching

Predictions are cached using Redis with a TTL of 1 hour to improve performance for repeated queries.

## Development

To retrain the model with new data:
```bash
# Using the CLI:
docker compose exec web python manage.py train_churn

# Using the API (requires admin authentication):
curl -X POST http://localhost:8000/api/train/ -u "admin:password"
```

To restart the web service:
```bash
docker compose restart web
```

## Performance

The current model achieves approximately 82% validation accuracy on the test set.

## Contributing

Feel free to submit issues and enhancement requests.

## License

[Specify your license here]
