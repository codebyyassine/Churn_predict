# Contributing Guide

## Getting Started

Thank you for considering contributing to the Customer Churn Prediction System! This document explains the process for contributing to the project.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the issue list as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

* Use a clear and descriptive title
* Describe the exact steps which reproduce the problem
* Provide specific examples to demonstrate the steps
* Describe the behavior you observed after following the steps
* Explain which behavior you expected to see instead and why
* Include screenshots and animated GIFs if possible
* Include error messages and stack traces
* Include the version of all relevant software

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

* Use a clear and descriptive title
* Provide a step-by-step description of the suggested enhancement
* Provide specific examples to demonstrate the steps
* Describe the current behavior and explain which behavior you expected to see instead
* Explain why this enhancement would be useful
* List some other applications where this enhancement exists, if applicable

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. If you've changed APIs, update the documentation
4. Ensure the test suite passes
5. Make sure your code lints
6. Issue that pull request!

## Development Process

### Setting Up Development Environment

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/churn-prediction.git
   cd churn-prediction
   ```

2. Create a virtual environment
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   .\venv\Scripts\activate   # Windows
   ```

3. Install dependencies
   ```bash
   pip install -r requirements.txt
   pip install -r requirements-dev.txt
   ```

4. Set up pre-commit hooks
   ```bash
   pre-commit install
   ```

### Code Style

We use the following tools to maintain code quality:

* Black for Python code formatting
* isort for import sorting
* flake8 for style guide enforcement
* mypy for static type checking
* eslint for JavaScript/TypeScript
* prettier for frontend code formatting

```bash
# Format Python code
black .

# Sort imports
isort .

# Run linters
flake8 .
mypy .

# Format frontend code
cd frontend
npm run format
npm run lint
```

### Running Tests

```bash
# Backend tests
python manage.py test
pytest

# Frontend tests
cd frontend
npm test
```

### Documentation

* Use docstrings for Python functions and classes
* Update API documentation when changing endpoints
* Add JSDoc comments for TypeScript/JavaScript functions
* Update README.md if necessary

### Commit Messages

* Use the present tense ("Add feature" not "Added feature")
* Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
* Limit the first line to 72 characters or less
* Reference issues and pull requests liberally after the first line

Example:
```
feat: Add risk trend analysis chart

- Implement time series visualization for risk scores
- Add date range selector
- Include trend line calculation
- Update dashboard layout

Fixes #123
```

### Branch Naming

* `feature/*` for new features
* `fix/*` for bug fixes
* `docs/*` for documentation changes
* `refactor/*` for code refactoring
* `test/*` for adding or updating tests

Example: `feature/risk-trend-analysis`

## Project Structure

```
.
├── churn_project/          # Django backend
│   ├── churn_app/         # Main application
│   │   ├── api/          # API endpoints
│   │   ├── ml/           # ML pipeline
│   │   ├── tasks/        # Celery tasks
│   │   └── utils/        # Utilities
│   └── config/           # Project configuration
├── frontend/              # Next.js frontend
│   ├── app/             # App router pages
│   ├── components/      # React components
│   ├── lib/            # Utilities and hooks
│   └── styles/         # CSS styles
├── tests/                # Test suite
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── docs/                 # Documentation
```

## Release Process

1. Update version number in relevant files
2. Update CHANGELOG.md
3. Create a new release branch: `release/vX.Y.Z`
4. Run full test suite
5. Create pull request to `main`
6. After approval and merge, tag the release
7. Deploy to production

## CI/CD Pipeline

Our CI/CD pipeline runs the following checks on all pull requests:

1. Code linting and formatting
2. Type checking
3. Unit tests
4. Integration tests
5. Build checks
6. Security scanning
7. Performance benchmarks

Make sure all checks pass before requesting review.

## Writing Tests

### Unit Tests

```python
# tests/unit/test_model.py
from django.test import TestCase
from churn_app.ml.model import ChurnPredictor

class ChurnPredictorTests(TestCase):
    def setUp(self):
        self.predictor = ChurnPredictor()
        self.sample_features = {
            'age': 35,
            'tenure': 5,
            'balance': 50000
        }
    
    def test_prediction_range(self):
        """Test that predictions are between 0 and 1"""
        prediction = self.predictor.predict(self.sample_features)
        self.assertGreaterEqual(prediction, 0)
        self.assertLessEqual(prediction, 1)
```

### Integration Tests

```python
# tests/integration/test_api.py
from django.test import TestCase
from rest_framework.test import APIClient
from churn_app.models import Customer

class CustomerAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.customer = Customer.objects.create(
            name='Test Customer',
            email='test@example.com'
        )
    
    def test_prediction_endpoint(self):
        """Test the prediction API endpoint"""
        response = self.client.post(f'/api/predict/', {
            'customer_id': self.customer.id
        })
        
        self.assertEqual(response.status_code, 200)
        self.assertIn('risk_score', response.data)
```

### Frontend Tests

```typescript
// tests/components/RiskChart.test.tsx
import { render, screen } from '@testing-library/react'
import { RiskChart } from '@/components/RiskChart'

describe('RiskChart', () => {
  const mockData = {
    labels: ['Jan', 'Feb', 'Mar'],
    values: [0.2, 0.3, 0.4]
  }
  
  it('renders chart with correct data', () => {
    render(<RiskChart data={mockData} />)
    
    expect(screen.getByText('Risk Trend')).toBeInTheDocument()
    expect(screen.getByRole('img')).toBeInTheDocument()
  })
})
```

## Performance Considerations

When contributing, keep in mind:

1. Database query optimization
   * Use select_related() and prefetch_related()
   * Create appropriate indexes
   * Monitor query performance

2. Caching strategy
   * Use Redis for caching when appropriate
   * Cache expensive computations
   * Implement cache invalidation

3. Async operations
   * Use Celery for background tasks
   * Implement proper error handling
   * Monitor task queues

4. Frontend performance
   * Implement code splitting
   * Optimize bundle size
   * Use proper loading states

## Security Guidelines

1. Input validation
   * Validate all user input
   * Use Django's form validation
   * Implement proper sanitization

2. Authentication
   * Use proper authentication decorators
   * Implement rate limiting
   * Follow security best practices

3. Data protection
   * Encrypt sensitive data
   * Implement proper access controls
   * Follow GDPR requirements

## Getting Help

* Join our Slack channel
* Check the documentation
* Ask in GitHub issues
* Email the maintainers

## Recognition

Contributors will be:

* Added to CONTRIBUTORS.md
* Mentioned in release notes
* Invited to core team (for significant contributions)

Thank you for contributing! 