# Customer Churn Prediction API

A machine learning-powered API service that predicts customer churn probability using a trained Random Forest model. Built with Django, Docker, and MLflow for experiment tracking.

## Project Overview

This project provides a REST API endpoint that predicts the likelihood of customer churn based on various customer attributes. It uses a machine learning model trained on historical customer data and provides real-time predictions through a cached API endpoint.

### Features

- RESTful API endpoint for churn prediction
- Automated model training pipeline
- Redis-based prediction caching
- Docker containerization
- MLflow experiment tracking
- PostgreSQL database integration
- Advanced filtering and pagination
- Search functionality
- Ordering capabilities

## Technical Stack

- **Backend Framework**: Django + Django REST Framework
- **Machine Learning**: scikit-learn (Random Forest)
- **Database**: PostgreSQL
- **Caching**: Redis
- **Containerization**: Docker
- **ML Experiment Tracking**: MLflow
- **Frontend**: Next.js + Tailwind CSS
- **Key Libraries**: pandas, numpy, django-filter

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

## API Documentation

### Authentication

The API uses Basic Authentication for secure endpoints. To use authenticated endpoints:
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

### Pagination

All list endpoints support pagination with the following parameters:
- `page`: Page number (default: 1)
- `page_size`: Number of items per page (default: 10, max: 100)

Example:
```http
GET /api/customers/?page=2&page_size=20
```

Response format:
```json
{
    "count": 100,
    "next": "http://localhost:8000/api/customers/?page=3",
    "previous": "http://localhost:8000/api/customers/?page=1",
    "results": [...]
}
```

### Filtering

The API supports various filtering options:

#### Range Filters
- `min_age` & `max_age`: Filter by age range
- `min_credit_score` & `max_credit_score`: Filter by credit score range
- `min_balance` & `max_balance`: Filter by balance range

Example:
```http
GET /api/customers/?min_age=30&max_age=50&min_credit_score=600
```

#### Exact Filters
- `geography`: Filter by country
- `gender`: Filter by gender
- `exited`: Filter by churn status
- `has_cr_card`: Filter by credit card status
- `is_active_member`: Filter by membership status

Example:
```http
GET /api/customers/?geography=France&exited=true
```

### Search

The API supports searching across multiple fields:
- `surname`
- `geography`
- `gender`

Example:
```http
GET /api/customers/?search=Smith
```

### Ordering

Results can be ordered by the following fields:
- `customer_id`
- `age`
- `credit_score`
- `balance`
- `estimated_salary`

Use `-` prefix for descending order.

Example:
```http
GET /api/customers/?ordering=-credit_score
```

### User Management API

Requires admin authentication for all operations.

#### List Users
```http
GET /api/users/
Authorization: Basic <credentials>
```

#### Create User
```http
POST /api/users/
Authorization: Basic <credentials>

{
    "username": "newuser",
    "email": "user@example.com",
    "password": "securepassword",
    "first_name": "John",
    "last_name": "Doe",
    "is_staff": false
}
```

#### Get User Details
```http
GET /api/users/{id}/
Authorization: Basic <credentials>
```

#### Update User
```http
PUT /api/users/{id}/
Authorization: Basic <credentials>

{
    "email": "newemail@example.com",
    "first_name": "John",
    "last_name": "Smith"
}
```

#### Delete User
```http
DELETE /api/users/{id}/
Authorization: Basic <credentials>
```

### Customer Management API

#### List Customers (with filters)
```http
GET /api/customers/

# Example with multiple filters
GET /api/customers/?min_age=30&max_age=50&geography=France&ordering=-balance&page=2&page_size=20
```

Response:
```json
{
    "count": 150,
    "next": "http://localhost:8000/api/customers/?page=3",
    "previous": "http://localhost:8000/api/customers/?page=1",
    "results": [
        {
            "customer_id": 15,
            "credit_score": 619,
            "age": 42,
            "tenure": 2,
            "balance": 0.0,
            "num_of_products": 1,
            "has_cr_card": true,
            "is_active_member": true,
            "estimated_salary": 101348.88,
            "geography": "France",
            "gender": "Female",
            "exited": false
        },
        // ... more customers
    ]
}
```

#### Create Customer
```http
POST /api/customers/

{
    "credit_score": 600,
    "age": 40,
    "tenure": 3,
    "balance": 60000,
    "num_of_products": 2,
    "has_cr_card": true,
    "is_active_member": true,
    "estimated_salary": 100000,
    "geography": "France",
    "gender": "Female"
}
```

#### Update Customer
```http
PUT /api/customers/{id}/

{
    "credit_score": 650,
    "balance": 65000
}
```

#### Delete Customer
```http
DELETE /api/customers/{id}/
```

### Bulk Operations API

#### Bulk Create Customers
```http
POST /api/customers/bulk/create/
Authorization: Basic <credentials>

[
    {
        "credit_score": 600,
        "age": 40,
        "tenure": 3,
        "balance": 60000,
        "num_of_products": 2,
        "has_cr_card": true,
        "is_active_member": true,
        "estimated_salary": 100000,
        "geography": "France",
        "gender": "Female",
        "exited": false
    },
    {
        "credit_score": 700,
        "age": 35,
        "tenure": 5,
        "balance": 45000,
        "num_of_products": 1,
        "has_cr_card": true,
        "is_active_member": true,
        "estimated_salary": 85000,
        "geography": "Germany",
        "gender": "Male",
        "exited": false
    }
]
```

#### Bulk Update Customers
```http
POST /api/customers/bulk/update/
Authorization: Basic <credentials>

[
    {
        "id": 1,
        "credit_score": 650,
        "balance": 65000
    },
    {
        "id": 2,
        "credit_score": 750,
        "balance": 50000
    }
]
```

#### Bulk Delete Customers
```http
POST /api/customers/bulk/delete/
Authorization: Basic <credentials>

[1, 2, 3]  // List of customer IDs to delete
```

### Prediction API

```http
POST /api/predict/

{
    "credit_score": 600,
    "age": 40,
    "tenure": 3,
    "balance": 60000,
    "num_of_products": 2,
    "has_cr_card": true,
    "is_active_member": true,
    "estimated_salary": 100000,
    "geography": "France",
    "gender": "Female"
}
```

Response:
```json
{
    "churn_probability": 0.245,
    "feature_importance": [
        {
            "feature": "age",
            "importance": 0.23
        },
        {
            "feature": "balance",
            "importance": 0.18
        }
        // ... other features
    ]
}
```

### Training API

```http
POST /api/train/
Authorization: Basic <credentials>
```

Response (Success):
```json
{
    "status": "success",
    "message": "Model training completed successfully"
}
```

Response (Error):
```json
{
    "status": "error",
    "message": "Error details..."
}
```

### Error Responses

The API returns appropriate HTTP status codes:

- 200: Success
- 201: Created successfully
- 204: Deleted successfully
- 400: Bad request (invalid data)
- 401: Unauthorized (authentication required)
- 403: Forbidden (insufficient permissions)
- 404: Not found
- 500: Server error

Error Response Format:
```json
{
    "error": "Error message description"
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

3. Install frontend dependencies:
```bash
cd front
npm install
```

4. Start the frontend development server:
```bash
npm run dev
```

5. Train the model:
```bash
docker compose exec web python manage.py train_churn
```

## Database Migration and Setup

Note: The `customer_churn` table is automatically created by the initialization scripts, so we'll skip the churn_app migrations.

1. Apply only Django system migrations (skipping churn_app):
```bash
# Apply migrations for each app separately, excluding churn_app
docker compose exec web python manage.py migrate auth
docker compose exec web python manage.py migrate admin
docker compose exec web python manage.py migrate contenttypes
docker compose exec web python manage.py migrate sessions

# Mark churn_app migrations as applied without running them
docker compose exec web python manage.py migrate churn_app --fake
```

2. Create a superuser for admin access:
```bash
docker compose exec web python manage.py createsuperuser
```

3. Verify database setup:
```bash
# Check tables
docker compose exec db psql -U postgres -d churn_db -c "\dt"

# Check data
docker compose exec db psql -U postgres -d churn_db -c "SELECT COUNT(*) FROM customer_churn;"
```

### Troubleshooting Database Issues

If you encounter database issues:

1. Check container logs:
```bash
docker compose logs db
```

2. If migrations are in an inconsistent state:
```bash
# Fake the initial migration
docker compose exec web python manage.py migrate churn_app zero --fake
docker compose exec web python manage.py migrate churn_app --fake

# If that doesn't work, try resetting migrations:
docker compose exec web python manage.py migrate churn_app zero
docker compose exec web python manage.py migrate churn_app --fake-initial
```

3. For a complete reset (if needed):
```bash
# Remove all volumes and containers
docker compose down -v

# Start fresh
docker compose up -d

# Apply migrations (skipping churn_app)
docker compose exec web python manage.py migrate auth
docker compose exec web python manage.py migrate admin
docker compose exec web python manage.py migrate contenttypes
docker compose exec web python manage.py migrate sessions
docker compose exec web python manage.py migrate churn_app --fake
```

Note: The project includes initialization scripts that automatically:
- Create the database (churn_db)
- Create required tables
- Load initial data from CSV

To manually reload the data:
```bash
docker compose restart db
```

Common Errors:
1. `relation "customer_churn" already exists`:
   - This happens when the table is already created by the initialization scripts
   - You can safely ignore this error if the table structure is correct
   - If you need to recreate the table, use the reset commands above

2. `permission denied to create database`:
   - Check if the postgres user has the right permissions
   - Verify the database credentials in settings.py match docker-compose.yml

## Model Training

The model training pipeline includes:
- Data loading from PostgreSQL
- Basic data cleaning and preprocessing
- Feature encoding and scaling
- Model training with RandomForest
- Performance evaluation
- Model persistence
- MLflow tracking

## Caching

Predictions are cached using Redis with a TTL of 1 hour to improve performance for repeated queries.

## Development

To retrain the model:
```bash
docker compose exec web python manage.py train_churn
```

To restart services:
```bash
# Restart Django
docker compose restart web

# Restart Next.js (in development)
cd front && npm run dev
```

## Performance

The current Random Forest model achieves:
- Validation accuracy: ~86%
- Precision (Churn): ~80%
- Recall (Churn): ~75%
- F1-Score (Churn): ~77%

## Contributing

Feel free to submit issues and enhancement requests.

## License

[MIT License](LICENSE)
