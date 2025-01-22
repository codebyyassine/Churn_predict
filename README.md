# Customer Churn Prediction Application

A full-stack web application for predicting and analyzing customer churn using machine learning.

## Features

### Authentication & Authorization
- Secure login system with protected routes
- Role-based access control for admin features
- Session management with automatic redirects

### Dashboard
- Real-time analytics dashboard with key metrics:
  - Total customers and active customer percentage
  - Current churn rate with number of churned customers
  - Average credit score and customer age
  - Average balance statistics
- Interactive visualizations:
  - Customer distribution by geography (horizontal bar chart)
  - Churn rate by geography with precise percentages
  - Product distribution analysis

### Customer Management
- Comprehensive customer list with pagination
- Advanced filtering capabilities:
  - Geography filter
  - Age range
  - Credit score range
  - Balance range
  - Active/Inactive status
- Search functionality
- Sorting by multiple fields
- Bulk operations support
- Individual customer operations:
  - View details
  - Edit information
  - Delete records
  - Predict churn risk

### Churn Prediction
- Individual customer churn prediction
- Real-time prediction results
- Confidence scores and risk levels
- Feature importance visualization
- Asynchronous processing for large prediction batches

### Admin Panel
- Model management:
  - Trigger model retraining
  - View training metrics and performance
  - Monitor model status
  - Background processing with Celery
- User management:
  - View registered users
  - Add new users
  - Manage permissions

## Technical Stack

### Frontend
- Next.js 13+ with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- Shadcn UI components
- Recharts for data visualization
- React Hook Form with Zod validation
- Responsive design with mobile support

### Backend
- Django REST Framework
- PostgreSQL database
- Random Forest model for predictions
- Django Filter for advanced querying
- JWT authentication
- RESTful API endpoints with pagination
- Celery for asynchronous task processing (model training and predictions)
- Redis as message broker and result backend

### API Endpoints
- `/api/customers/` - Customer management (GET, POST, PUT, DELETE)
- `/api/predict/` - Churn prediction endpoint
- `/api/dashboard/stats/` - Dashboard statistics
- `/api/train/` - Model training endpoint (async with Celery)
- `/api/users/` - User management

## Getting Started

### Prerequisites
- Node.js 16+
- Python 3.8+
- Docker and Docker Compose
- Redis (included in Docker setup)

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
```

2. Start the backend services (includes Django, PostgreSQL, Redis, and Celery workers):
```bash
docker compose up -d
```

3. Verify Celery worker status:
```bash
docker compose logs celery
```

4. Install frontend dependencies:
```bash
cd front
npm install
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Database Migration

1. Apply migrations:
```bash
# Apply migrations for each app separately, excluding churn_app
docker compose exec web python manage.py migrate auth
docker compose exec web python manage.py migrate admin
docker compose exec web python manage.py migrate contenttypes
docker compose exec web python manage.py migrate sessions

# Mark churn_app migrations as applied without running them
docker compose exec web python manage.py migrate churn_app --fake
```

### Create Superuser

Create an admin user to access the admin panel:
```bash
docker compose exec web python manage.py createsuperuser
```
Follow the prompts to set username, email, and password.

## Usage

1. Login with your credentials
2. Navigate through the application using the navigation bar
3. Access different features based on your role:
   - Regular users: Dashboard, Customer Management, Churn Prediction
   - Admin users: Additional access to Admin Panel
4. Note: Long-running operations like model training are processed in the background

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request