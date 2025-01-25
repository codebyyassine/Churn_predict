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

## Project Structure
```
ML_project/          # Django Backend
├── churn_app/         # Core Application
├── churn_project/     # Django Backend
├── churn-prediction-frontend/  # Next.js Frontend
├── mlruns/             # ML Runs
├── models/            # ML Models

Notebook&Data/
├──model_making.ipynb 
├──notebooks.ipynb
├──Churn_modelling.csv
```

###  Docker Setup
```bash
# Clone the repository
git clone https://github.com/codebyyassine/churn-prediction.git
cd churn-prediction/churn_project
# Build shared image
docker compose build migrations
# then Start all services to complete the setup
docker-compose up -d
```
## Post-Setup Instructions

After the first successful run:

1. Access the application at http://localhost:3000/login
2. Login with the default admin credentials:
   - Username: `root`
   - Password: `root`

3. Navigate to the Admin Panel
4. Import the initial dataset:
   - Locate `Notebook&Data/Churn_Modelling.csv` in your project directory
   - Use the import functionality in the Admin Panel to upload the file


## API Documentation

API documentation is available at http://localhost:8000/api/docs/


## Acknowledgments
- [Scikit-learn](https://scikit-learn.org/) - Machine Learning
- [MLflow](https://mlflow.org/) - ML Lifecycle
- [Next.js](https://nextjs.org/) - Frontend Framework
- [Django REST Framework](https://www.django-rest-framework.org/) - API
- [Shadcn UI](https://ui.shadcn.com/) - UI Components
- [Kaggle](https://www.kaggle.com/datasets/gauravtopre/bank-customer-churn-dataset) - Dataset


