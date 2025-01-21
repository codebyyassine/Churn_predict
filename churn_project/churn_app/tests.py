from django.test import TestCase
from django.urls import reverse
import json

class PredictChurnTest(TestCase):
    def test_predict_churn_endpoint(self):
        url = reverse('predict_churn')  # or '/api/predict/'
        payload = {
            "credit_score": 600,
            "geography": "France",
            "gender": "Female",
            "age": 40,
            "tenure": 3,
            "balance": 60000,
            "num_of_products": 2,
            "has_cr_card": 1,
            "is_active_member": 1,
            "estimated_salary": 100000
        }
        response = self.client.post(url, data=json.dumps(payload), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertIn("prediction", response.json())
        self.assertIn("probability", response.json())
