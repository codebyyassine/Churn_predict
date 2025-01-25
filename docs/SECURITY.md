# Security Documentation

## Overview

This document outlines the security measures and best practices implemented in the Customer Churn Prediction System to protect sensitive data and ensure secure operations.

## Authentication & Authorization

### JWT Authentication

```python
# settings.py
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ]
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': env('SECRET_KEY'),
    
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}
```

### Role-Based Access Control

```python
# permissions.py
from rest_framework import permissions

class IsRiskAnalyst(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.groups.filter(name='Risk Analysts').exists()

class IsModelManager(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.groups.filter(name='Model Managers').exists()

# views.py
class CustomerViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated & (IsRiskAnalyst | IsModelManager)]
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    
    def get_queryset(self):
        # Filter based on user's organization
        return self.queryset.filter(organization=self.request.user.organization)
```

## Data Protection

### Database Encryption

```python
# settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': env('DB_NAME'),
        'USER': env('DB_USER'),
        'PASSWORD': env('DB_PASSWORD'),
        'HOST': env('DB_HOST'),
        'PORT': env('DB_PORT'),
        'OPTIONS': {
            'sslmode': 'verify-full',
            'sslcert': '/path/to/client-cert.pem',
            'sslkey': '/path/to/client-key.pem',
            'sslrootcert': '/path/to/server-ca.pem',
        }
    }
}
```

### Data Masking

```python
# utils.py
def mask_pii(data):
    """Mask personally identifiable information."""
    if not data:
        return data
        
    # Mask email
    if '@' in data:
        username, domain = data.split('@')
        return f"{username[0]}{'*' * (len(username)-2)}{username[-1]}@{domain}"
    
    # Mask phone number
    if data.isdigit() and len(data) >= 10:
        return f"{'*' * (len(data)-4)}{data[-4:]}"
    
    return data

# serializers.py
class CustomerSerializer(serializers.ModelSerializer):
    email = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()
    
    class Meta:
        model = Customer
        fields = '__all__'
    
    def get_email(self, obj):
        if self.context['request'].user.has_perm('view_pii'):
            return obj.email
        return mask_pii(obj.email)
    
    def get_phone(self, obj):
        if self.context['request'].user.has_perm('view_pii'):
            return obj.phone
        return mask_pii(obj.phone)
```

### Secure File Handling

```python
# storage.py
from storages.backends.s3boto3 import S3Boto3Storage

class EncryptedS3Storage(S3Boto3Storage):
    def __init__(self):
        super().__init__()
        self.default_acl = 'private'
        self.file_overwrite = False
        self.object_parameters = {
            'ServerSideEncryption': 'AES256'
        }

# models.py
class SecureDocument(models.Model):
    file = models.FileField(
        storage=EncryptedS3Storage(),
        upload_to='secure-documents/%Y/%m/%d/'
    )
    
    def save(self, *args, **kwargs):
        if self.file:
            # Scan file for malware
            if not scan_file(self.file):
                raise ValidationError("File failed security scan")
        super().save(*args, **kwargs)
```

## API Security

### Rate Limiting

```python
# settings.py
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/day',
        'user': '1000/day',
        'prediction': '100/hour'
    }
}

# throttling.py
class PredictionRateThrottle(UserRateThrottle):
    rate = '100/hour'
    scope = 'prediction'

# views.py
class PredictionView(APIView):
    throttle_classes = [PredictionRateThrottle]
    
    def post(self, request):
        # Make prediction
        pass
```

### Input Validation

```python
# serializers.py
class CustomerInputSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    phone = serializers.RegexField(
        regex=r'^\+?1?\d{9,15}$',
        message="Phone number must be in E.164 format"
    )
    age = serializers.IntegerField(min_value=18, max_value=120)
    balance = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=0
    )
    
    def validate_email(self, value):
        if Customer.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists")
        return value

# middleware.py
class SecurityHeadersMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        response = self.get_response(request)
        
        # Security headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        response['Content-Security-Policy'] = "default-src 'self'"
        
        return response
```

## Monitoring & Logging

### Security Logging

```python
# logging.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        }
    },
    'handlers': {
        'security': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': 'logs/security.log',
            'maxBytes': 1024*1024*5,  # 5 MB
            'backupCount': 5,
            'formatter': 'verbose',
        }
    },
    'loggers': {
        'security': {
            'handlers': ['security'],
            'level': 'INFO',
            'propagate': True,
        }
    }
}

# utils.py
import logging

security_logger = logging.getLogger('security')

def log_security_event(event_type, user, details):
    security_logger.info(
        f"Security event: {event_type}",
        extra={
            'user_id': user.id if user else None,
            'ip_address': get_client_ip(),
            'details': details
        }
    )
```

### Audit Trail

```python
# models.py
class AuditLog(models.Model):
    user = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=50)
    resource_type = models.CharField(max_length=50)
    resource_id = models.IntegerField()
    changes = models.JSONField()
    ip_address = models.GenericIPAddressField()
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['user', 'action', 'timestamp']),
            models.Index(fields=['resource_type', 'resource_id'])
        ]

# middleware.py
class AuditMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        response = self.get_response(request)
        
        if request.method in ['POST', 'PUT', 'DELETE']:
            AuditLog.objects.create(
                user=request.user,
                action=request.method,
                resource_type=request.path.split('/')[2],
                resource_id=request.path.split('/')[3],
                changes=request.data,
                ip_address=get_client_ip(request)
            )
        
        return response
```

## Incident Response

### Alert Configuration

```python
# alerts.py
from django.core.mail import send_mail
from django.conf import settings

def send_security_alert(event_type, details):
    subject = f"Security Alert: {event_type}"
    message = f"""
    Security Event Detected
    
    Type: {event_type}
    Time: {timezone.now()}
    Details: {details}
    
    Please investigate immediately.
    """
    
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.SECURITY_EMAIL_FROM,
        recipient_list=settings.SECURITY_TEAM_EMAILS,
        fail_silently=False
    )

# monitoring.py
def monitor_failed_logins():
    threshold = 5
    window = timedelta(minutes=15)
    now = timezone.now()
    
    # Check for multiple failed login attempts
    failed_attempts = LoginAttempt.objects.filter(
        success=False,
        timestamp__gte=now - window
    ).values('ip_address').annotate(
        count=Count('id')
    ).filter(count__gte=threshold)
    
    for attempt in failed_attempts:
        send_security_alert(
            'multiple_failed_logins',
            {
                'ip_address': attempt['ip_address'],
                'count': attempt['count'],
                'window': window
            }
        )
```

### Incident Response Plan

```python
# incident_response.py
class SecurityIncident:
    def __init__(self, incident_type, severity, details):
        self.incident_type = incident_type
        self.severity = severity
        self.details = details
        self.timestamp = timezone.now()
        self.status = 'open'
    
    def create_incident_ticket(self):
        return IncidentTicket.objects.create(
            incident_type=self.incident_type,
            severity=self.severity,
            details=self.details,
            timestamp=self.timestamp
        )
    
    def notify_team(self):
        if self.severity >= 'high':
            # Send SMS alerts
            send_sms_alert(
                settings.SECURITY_TEAM_PHONES,
                f"High severity security incident: {self.incident_type}"
            )
        
        # Send email notification
        send_security_alert(self.incident_type, self.details)
    
    def block_ip(self, ip_address):
        # Add IP to blocked list
        BlockedIP.objects.create(
            ip_address=ip_address,
            reason=self.incident_type,
            blocked_at=self.timestamp
        )
        
        # Update firewall rules
        update_firewall_rules()
    
    def lock_account(self, user):
        user.is_active = False
        user.save()
        
        # Log account lock
        log_security_event(
            'account_locked',
            user,
            f"Account locked due to {self.incident_type}"
        )
```

## Compliance

### Data Retention

```python
# tasks.py
@periodic_task(run_every=timedelta(days=1))
def cleanup_old_data():
    # Delete old audit logs
    retention_period = timezone.now() - timedelta(days=365)
    AuditLog.objects.filter(timestamp__lt=retention_period).delete()
    
    # Archive old customer data
    archive_period = timezone.now() - timedelta(days=730)
    customers_to_archive = Customer.objects.filter(
        updated_at__lt=archive_period,
        archived=False
    )
    
    for customer in customers_to_archive:
        # Archive customer data
        archive_customer_data(customer)
        customer.archived = True
        customer.save()

# utils.py
def archive_customer_data(customer):
    # Create archive record
    archive = CustomerArchive.objects.create(
        customer_id=customer.id,
        data=customer.to_json(),
        archived_at=timezone.now()
    )
    
    # Encrypt archive
    archive.encrypt_data()
    
    # Store in secure storage
    archive.store_secure()
```

### GDPR Compliance

```python
# views.py
class DataExportView(APIView):
    def get(self, request):
        # Collect user's data
        user_data = {
            'personal_info': UserSerializer(request.user).data,
            'customers': CustomerSerializer(
                request.user.customers.all(),
                many=True
            ).data,
            'activity_log': AuditLogSerializer(
                AuditLog.objects.filter(user=request.user),
                many=True
            ).data
        }
        
        # Create encrypted export file
        export_file = create_encrypted_export(user_data)
        
        # Send download link via email
        send_secure_download_link(request.user.email, export_file)
        
        return Response({'status': 'Export initiated'})

class DataDeletionView(APIView):
    def post(self, request):
        # Validate deletion request
        if not verify_deletion_request(request):
            return Response(
                {'error': 'Invalid deletion request'},
                status=400
            )
        
        # Schedule data deletion
        deletion_job = schedule_data_deletion(request.user)
        
        # Send confirmation
        send_deletion_confirmation(request.user.email, deletion_job.id)
        
        return Response({'status': 'Deletion scheduled'})
```

## Security Testing

### Automated Security Tests

```python
# tests/security/test_authentication.py
class AuthenticationTests(TestCase):
    def test_password_complexity(self):
        weak_passwords = [
            'password123',
            'qwerty123',
            'abc123'
        ]
        
        for password in weak_passwords:
            with self.assertRaises(ValidationError):
                validate_password(password)
    
    def test_brute_force_protection(self):
        client = Client()
        
        # Attempt multiple failed logins
        for _ in range(10):
            response = client.post('/api/auth/login/', {
                'username': 'test',
                'password': 'wrong'
            })
        
        # Verify account is locked
        response = client.post('/api/auth/login/', {
            'username': 'test',
            'password': 'correct'
        })
        self.assertEqual(response.status_code, 403)

# tests/security/test_api_security.py
class APISecurityTests(TestCase):
    def test_rate_limiting(self):
        client = Client()
        
        # Make requests up to limit
        for _ in range(100):
            client.get('/api/customers/')
        
        # Verify rate limit is enforced
        response = client.get('/api/customers/')
        self.assertEqual(response.status_code, 429)
    
    def test_sql_injection_protection(self):
        client = Client()
        
        # Attempt SQL injection
        response = client.get(
            '/api/customers/?search=1 OR 1=1;--'
        )
        
        self.assertEqual(response.status_code, 400)
```

### Security Scanning

```python
# security/scanner.py
def run_security_scan():
    # Configuration
    scan_config = {
        'target_url': settings.SITE_URL,
        'auth': {
            'url': f"{settings.SITE_URL}/api/auth/login/",
            'credentials': {
                'username': 'test_user',
                'password': 'test_pass'
            }
        },
        'tests': [
            'xss',
            'sql_injection',
            'csrf',
            'open_redirect',
            'ssrf'
        ]
    }
    
    # Run tests
    results = []
    for test in scan_config['tests']:
        result = run_security_test(test, scan_config)
        results.append(result)
    
    # Generate report
    report = generate_security_report(results)
    
    # Send notifications
    if report.has_vulnerabilities():
        notify_security_team(report)
    
    return report
``` 