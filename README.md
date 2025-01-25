# Customer Churn Prediction System

A machine learning system that predicts customer churn risk and provides real-time monitoring.

## Key Features

- Machine Learning-based Churn Prediction
- Real-time Monitoring Dashboard
- Customer Data Management
- Risk Analysis and Trends
- Automated Discord Alerts
- Model Performance Monitoring
- High-Risk Customer Detection

## Technology Stack

**Backend**
- Django REST Framework
- PostgreSQL Database
- Redis & Celery
- MLflow & Scikit-learn

**Frontend**
- Next.js 13+ with TypeScript
- Tailwind CSS & Shadcn UI
- TanStack Query

**Infrastructure**
- Docker Containerization

## Setup Options

###  Docker Setup
```bash
# Clone the repository
git clone https://github.com/codebyyassine/churn-prediction.git
cd churn-prediction

# Start all services
docker-compose up -d
```

The following services will be available:
- Frontend: http://localhost:3000
- API: http://localhost:8000/api/

Default admin credentials:
- Username: root
- Password: root

## Project Structure
```
churn_project/          # Django Backend
├── churn_app/         # Core Application
├── api/              # REST API
└── ml/               # ML Pipeline
churn-prediction-frontend/  # Next.js Frontend
data/                  # Data Files
models/               # ML Models
docs/                 # Documentation
```

## Documentation
- [Architecture Overview](docs/ARCHITECTURE.md)
- [API Documentation](docs/API.md)
- [ML Pipeline](docs/ML_PIPELINE.md)
- [Frontend Guide](docs/FRONTEND.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

## Acknowledgments
- [Scikit-learn](https://scikit-learn.org/) - Machine Learning
- [MLflow](https://mlflow.org/) - ML Lifecycle
- [Next.js](https://nextjs.org/) - Frontend Framework
- [Django REST Framework](https://www.django-rest-framework.org/) - API
- [Shadcn UI](https://ui.shadcn.com/) - UI Components
- [Kaggle](https://www.kaggle.com/datasets/gauravtopre/bank-customer-churn-dataset) - Dataset
