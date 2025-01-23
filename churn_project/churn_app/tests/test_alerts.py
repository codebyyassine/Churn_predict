from django.test import TestCase
from django.urls import reverse
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from ..models import AlertConfiguration, AlertHistory, CustomerChurn
from django.utils import timezone
import json

class AlertEndpointsTest(TestCase):
    def setUp(self):
        # Create admin user
        self.admin_user = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='adminpass123'
        )
        
        # Create regular user
        self.regular_user = User.objects.create_user(
            username='user',
            email='user@example.com',
            password='userpass123'
        )
        
        # Create test customer
        self.customer = CustomerChurn.objects.create(
            customer_id=1,
            surname='Test Customer',
            credit_score=750
        )
        
        # Create test alert configuration
        self.alert_config = AlertConfiguration.objects.create(
            webhook_url='https://discord.com/api/webhooks/test',
            is_enabled=True,
            high_risk_threshold=0.7,
            risk_increase_threshold=20.0
        )
        
        # Create test alert history
        self.alert_history = AlertHistory.objects.create(
            customer=self.customer,
            alert_type='HIGH_RISK',
            message={'text': 'Test alert'},
            was_sent=True
        )
        
        # Setup API client
        self.client = APIClient()
    
    def test_manage_alert_config_get(self):
        # Unauthenticated request should fail
        response = self.client.get(reverse('manage_alert_config'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Non-admin request should fail
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(reverse('manage_alert_config'))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Admin request should succeed
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(reverse('manage_alert_config'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['webhook_url'], 'https://discord.com/api/webhooks/test')
    
    def test_manage_alert_config_post(self):
        self.client.force_authenticate(user=self.admin_user)
        
        new_config = {
            'webhook_url': 'https://discord.com/api/webhooks/new',
            'is_enabled': True,
            'high_risk_threshold': 0.8,
            'risk_increase_threshold': 25.0
        }
        
        response = self.client.post(
            reverse('manage_alert_config'),
            data=json.dumps(new_config),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['webhook_url'], new_config['webhook_url'])
        self.assertEqual(response.data['high_risk_threshold'], new_config['high_risk_threshold'])
    
    def test_get_alert_history(self):
        self.client.force_authenticate(user=self.admin_user)
        
        # Test without filters
        response = self.client.get(reverse('get_alert_history'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        
        # Test with filters
        response = self.client.get(
            reverse('get_alert_history'),
            {'alert_type': 'HIGH_RISK', 'success_only': 'true'}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        
        # Test with date filters
        response = self.client.get(
            reverse('get_alert_history'),
            {
                'date_from': timezone.now().date().isoformat(),
                'date_to': timezone.now().date().isoformat()
            }
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_get_alert_stats(self):
        self.client.force_authenticate(user=self.admin_user)
        
        response = self.client.get(reverse('get_alert_stats'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_alerts', response.data)
        self.assertIn('successful_alerts', response.data)
        self.assertIn('success_rate', response.data)
        self.assertIn('alerts_by_type', response.data)
        self.assertIn('recent_failures', response.data)
    
    def test_get_risk_dashboard(self):
        self.client.force_authenticate(user=self.admin_user)
        
        response = self.client.get(reverse('risk-dashboard'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('high_risk_customers', response.data)
        self.assertIn('significant_increases', response.data)
        self.assertIn('risk_distribution', response.data)
        self.assertIn('risk_trend', response.data)
        self.assertIn('thresholds', response.data) 