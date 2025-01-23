import pickle
import numpy as np
import pandas as pd
from django.http import JsonResponse
from rest_framework.decorators import api_view, authentication_classes, permission_classes, parser_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.authentication import BasicAuthentication
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
import json
from django.core.cache import cache
from django.views.decorators.csrf import csrf_exempt
import os
from django.conf import settings
from django.core.management import call_command
from rest_framework import viewsets, permissions, status, filters
from django_filters.rest_framework import DjangoFilterBackend, FilterSet, NumberFilter
from django.contrib.auth.models import User
from .models import CustomerChurn, ChurnRiskHistory, AlertConfiguration, AlertHistory
from .serializers import UserSerializer, CustomerChurnSerializer, CSVImportSerializer, AlertConfigurationSerializer, AlertHistorySerializer
from django.shortcuts import get_object_or_404
import joblib
import traceback
from django.db.models import Count, Avg, Q, F, Max
from pathlib import Path
from django.utils import timezone
from django.db import transaction
from rest_framework.parsers import MultiPartParser

# Define features directly
numerical_features = [
    "credit_score", "age", "tenure", "balance", 
    "num_of_products", "has_cr_card", "is_active_member", 
    "estimated_salary"
]
categorical_features = ["geography", "gender"]

def load_latest_model():
    """Load the latest trained model and its components"""
    models_dir = Path(settings.BASE_DIR) / "models"
    latest_model_path = models_dir / "latest_model.joblib"
    
    if not latest_model_path.exists():
        raise FileNotFoundError("No trained model found. Please train a model first.")
    
    model_data = joblib.load(latest_model_path)
    return model_data

# Load model components for prediction
def get_model_components():
    try:
        model_data = load_latest_model()
        
        # Initialize components dictionary with model data
        components = {
            'model': model_data['model'],
            'scaler': model_data['scaler'],
            'label_encoder_geo': model_data['label_encoder_geo'],
            'label_encoder_gender': model_data['label_encoder_gender'],
            'feature_importance': {}  # Default empty dict for feature importance
        }
        
        # Try to load metrics if available
        try:
            models_dir = Path(settings.BASE_DIR) / "models"
            latest_metrics_path = models_dir / "latest_metrics.json"
            
            if latest_metrics_path.exists():
                with open(latest_metrics_path, 'r') as f:
                    metrics_data = json.load(f)
                components['feature_importance'] = metrics_data.get('feature_importance', {})
        except Exception as metrics_error:
            print(f"Warning: Could not load metrics file: {str(metrics_error)}")
            # Continue without metrics
        
        return components
        
    except Exception as e:
        print(f"Error loading model components: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        return None

# Add cache TTL constant (1 hour)
CACHE_TTL = 60 * 60

def generate_cache_key(features):
    """Generate a consistent cache key from input features"""
    feature_str = json.dumps(features, sort_keys=True)
    return f"churn_pred_{feature_str}"

@api_view(["POST"])
@csrf_exempt
@authentication_classes([BasicAuthentication])
@permission_classes([IsAdminUser])
def trigger_training(request):
    """
    API endpoint to trigger model training.
    Requires admin authentication.
    """
    try:
        # Call the training command
        call_command('train_churn')
        
        # Load metrics and training status
        models_dir = Path(settings.BASE_DIR) / "models"
        latest_metrics_path = models_dir / "latest_metrics.json"
        best_metrics_path = models_dir / "best_metrics.json"
        training_status_path = models_dir / "training_status.json"
        
        with open(latest_metrics_path, 'r') as f:
            latest_metrics = json.load(f)
        
        with open(best_metrics_path, 'r') as f:
            best_metrics = json.load(f)
            
        with open(training_status_path, 'r') as f:
            training_status = json.load(f)
        
        response = {
            "status": "success",
            "message": "Model training completed successfully",
            "latest_metrics": latest_metrics,
            "best_metrics": best_metrics,
            "is_new_best": training_status.get('is_best', False)
        }
        
        return JsonResponse(response)
        
    except Exception as e:
        print(f"Training error: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        return JsonResponse({
            "status": "error",
            "message": str(e),
            "details": {
                "error_type": type(e).__name__,
                "error_message": str(e),
                "traceback": traceback.format_exc()
            }
        }, status=500)

@api_view(["GET"])
@authentication_classes([BasicAuthentication])
@permission_classes([IsAdminUser])
def get_model_metrics(request):
    """
    API endpoint to get both latest and best model metrics.
    """
    try:
        models_dir = Path(settings.BASE_DIR) / "models"
        latest_metrics_path = models_dir / "latest_metrics.json"
        best_metrics_path = models_dir / "best_metrics.json"
        
        latest_metrics = None
        best_metrics = None
        
        if latest_metrics_path.exists():
            with open(latest_metrics_path, 'r', encoding='utf-8-sig') as f:
                latest_metrics = json.load(f)
        
        if best_metrics_path.exists():
            with open(best_metrics_path, 'r', encoding='utf-8-sig') as f:
                best_metrics = json.load(f)
        
        return JsonResponse({
            "status": "success",
            "latest_metrics": latest_metrics,
            "best_metrics": best_metrics
        })
        
    except Exception as e:
        return JsonResponse({
            "status": "error",
            "message": str(e)
        }, status=500)

@api_view(["POST"])
@csrf_exempt
@authentication_classes([])
@permission_classes([permissions.AllowAny])
def predict_churn(request):
    """
    Expects a JSON payload with customer features:
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
    """
    try:
        data = request.data
        
        # Generate cache key from input data
        cache_key = generate_cache_key(data)
        
        # Check cache first
        cached_result = cache.get(cache_key)
        if cached_result is not None:
            return JsonResponse(cached_result)

        # Get model components
        components = get_model_components()
        if not components:
            return JsonResponse({"error": "Model not loaded. Please train the model first."}, status=400)

        model = components['model']
        scaler = components['scaler']
        le_geo = components['label_encoder_geo']
        le_gender = components['label_encoder_gender']
        feature_importance = components['feature_importance']

        # Create a DataFrame with the input data
        input_data = {
            "credit_score": float(data.get("credit_score", 0)),
            "age": float(data.get("age", 0)),
            "tenure": float(data.get("tenure", 0)),
            "balance": float(data.get("balance", 0)),
            "num_of_products": float(data.get("num_of_products", 1)),
            "has_cr_card": float(data.get("has_cr_card", 0)),
            "is_active_member": float(data.get("is_active_member", 0)),
            "estimated_salary": float(data.get("estimated_salary", 0)),
            "geography": data.get("geography", "France"),
            "gender": data.get("gender", "Female")
        }
        
        # Create DataFrame with proper column order
        df = pd.DataFrame([input_data])
        
        # Encode categorical variables
        df["geography"] = le_geo.transform(df["geography"])
        df["gender"] = le_gender.transform(df["gender"])
        
        # Scale numerical features only
        df[numerical_features] = scaler.transform(df[numerical_features])
        
        # Ensure proper feature order for prediction
        feature_cols = numerical_features + categorical_features
        feature_array = df[feature_cols].values

        # Predict
        prediction = model.predict(feature_array)[0]
        probability = model.predict_proba(feature_array)[0][1]

        # Prepare result with feature importance
        result = {
            "churn_probability": float(probability),
            "feature_importance": feature_importance
        }

        # Cache the result
        cache.set(cache_key, result, CACHE_TTL)

        return JsonResponse(result)
        
    except Exception as e:
        print(f"Prediction error: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        return JsonResponse({"error": str(e)}, status=400)

# User ViewSet
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        if user == request.user:
            return Response(
                {"error": "Cannot delete your own account"},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)

# Custom pagination class
class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

# Custom filter class
class CustomerChurnFilter(FilterSet):
    min_age = NumberFilter(field_name='age', lookup_expr='gte')
    max_age = NumberFilter(field_name='age', lookup_expr='lte')
    min_credit_score = NumberFilter(field_name='credit_score', lookup_expr='gte')
    max_credit_score = NumberFilter(field_name='credit_score', lookup_expr='lte')
    min_balance = NumberFilter(field_name='balance', lookup_expr='gte')
    max_balance = NumberFilter(field_name='balance', lookup_expr='lte')

    class Meta:
        model = CustomerChurn
        fields = {
            'geography': ['exact'],
            'gender': ['exact'],
            'exited': ['exact'],
            'has_cr_card': ['exact'],
            'is_active_member': ['exact'],
        }

# CustomerChurn ViewSet
class CustomerChurnViewSet(viewsets.ModelViewSet):
    queryset = CustomerChurn.objects.all()
    serializer_class = CustomerChurnSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = CustomerChurnFilter
    search_fields = ['surname', 'geography', 'gender']
    ordering_fields = ['customer_id', 'age', 'credit_score', 'balance', 'estimated_salary']
    ordering = ['customer_id']

    def get_queryset(self):
        queryset = CustomerChurn.objects.all()
        
        # Handle custom range filters
        min_age = self.request.query_params.get('min_age')
        max_age = self.request.query_params.get('max_age')
        min_credit_score = self.request.query_params.get('min_credit_score')
        max_credit_score = self.request.query_params.get('max_credit_score')
        min_balance = self.request.query_params.get('min_balance')
        max_balance = self.request.query_params.get('max_balance')
        
        if min_age:
            queryset = queryset.filter(age__gte=min_age)
        if max_age:
            queryset = queryset.filter(age__lte=max_age)
        if min_credit_score:
            queryset = queryset.filter(credit_score__gte=min_credit_score)
        if max_credit_score:
            queryset = queryset.filter(credit_score__lte=max_credit_score)
        if min_balance:
            queryset = queryset.filter(balance__gte=min_balance)
        if max_balance:
            queryset = queryset.filter(balance__lte=max_balance)
            
        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

# Bulk Operations for CustomerChurn
@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def bulk_create_customers(request):
    """
    Bulk create customers with validation and error handling.
    Expects a list of customer data in the request body.
    """
    try:
        if not isinstance(request.data, list):
            return Response(
                {
                    "status": "error",
                    "message": "Expected a list of customers",
                    "data": None
                }, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(request.data) > 1000:  # Limit bulk operations
            return Response(
                {
                    "status": "error",
                    "message": "Cannot process more than 1000 customers at once",
                    "data": None
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = CustomerChurnSerializer(data=request.data, many=True)
        if serializer.is_valid():
            customers = serializer.save()
            return Response(
                {
                    "status": "success",
                    "message": f"Successfully created {len(customers)} customers",
                    "data": serializer.data
                },
                status=status.HTTP_201_CREATED
            )
        return Response(
            {
                "status": "error",
                "message": "Validation error",
                "data": serializer.errors
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {
                "status": "error",
                "message": str(e),
                "data": None
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def bulk_update_customers(request):
    """
    Bulk update customers with validation and error handling.
    Expects a list of customer data with IDs in the request body.
    """
    try:
        if not isinstance(request.data, list):
            return Response(
                {
                    "status": "error",
                    "message": "Expected a list of customers",
                    "data": None
                }, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(request.data) > 1000:  # Limit bulk operations
            return Response(
                {
                    "status": "error",
                    "message": "Cannot process more than 1000 customers at once",
                    "data": None
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        updated_customers = []
        errors = []
        
        for customer_data in request.data:
            if 'id' not in customer_data:
                errors.append({
                    "error": "Missing ID",
                    "data": customer_data
                })
                continue
            
            try:
                customer = get_object_or_404(CustomerChurn, id=customer_data['id'])
                serializer = CustomerChurnSerializer(customer, data=customer_data, partial=True)
                if serializer.is_valid():
                    serializer.save()
                    updated_customers.append(serializer.data)
                else:
                    errors.append({
                        "id": customer_data['id'],
                        "errors": serializer.errors
                    })
            except CustomerChurn.DoesNotExist:
                errors.append({
                    "error": f"Customer with ID {customer_data['id']} not found",
                    "data": customer_data
                })
        
        response_data = {
            "status": "success" if not errors else "partial_success",
            "message": f"Updated {len(updated_customers)} customers",
            "data": {
                "updated": updated_customers,
                "errors": errors if errors else None
            }
        }
        
        return Response(
            response_data,
            status=status.HTTP_200_OK if not errors else status.HTTP_207_MULTI_STATUS
        )
    except Exception as e:
        return Response(
            {
                "status": "error",
                "message": str(e),
                "data": None
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def bulk_delete_customers(request):
    """
    Bulk delete customers with validation and error handling.
    Expects a list of customer IDs in the request body.
    """
    try:
        if not isinstance(request.data, list):
            return Response(
                {
                    "status": "error",
                    "message": "Expected a list of customer IDs",
                    "data": None
                }, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(request.data) > 1000:  # Limit bulk operations
            return Response(
                {
                    "status": "error",
                    "message": "Cannot process more than 1000 customers at once",
                    "data": None
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get the count of existing customers before deletion
        existing_count = CustomerChurn.objects.filter(customer_id__in=request.data).count()
        
        # Perform deletion
        deleted_count = CustomerChurn.objects.filter(customer_id__in=request.data).delete()[0]
        
        return Response(
            {
                "status": "success",
                "message": f"Successfully deleted {deleted_count} customers",
                "data": {
                    "deleted_count": deleted_count,
                    "not_found_count": len(request.data) - existing_count
                }
            },
            status=status.HTTP_200_OK
        )
    except Exception as e:
        return Response(
            {
                "status": "error",
                "message": str(e),
                "data": None
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
def get_dashboard_stats(request):
    """
    Get dashboard statistics including:
    - Total customers
    - Churn rate
    - Active customers
    - Inactive customers
    - Average credit score
    - Average age
    - Average balance
    - Geography distribution
    - Product distribution
    """
    try:
        # Get base queryset
        customers = CustomerChurn.objects.all()
        
        # Calculate basic stats
        total_customers = customers.count()
        churned_customers = customers.filter(exited=True).count()
        active_customers = customers.filter(is_active_member=True).count()
        
        # Calculate averages
        averages = customers.aggregate(
            avg_credit_score=Avg('credit_score'),
            avg_age=Avg('age'),
            avg_balance=Avg('balance')
        )
        
        # Get geography distribution
        geography_dist = list(customers.values('geography').annotate(
            count=Count('customer_id')
        ).order_by('-count'))
        
        # Get product distribution
        product_dist = list(customers.values('num_of_products').annotate(
            count=Count('customer_id')
        ).order_by('num_of_products'))
        
        # Calculate churn rate by geography
        churn_by_geography = list(customers.values('geography').annotate(
            total=Count('customer_id'),
            churned=Count('customer_id', filter=Q(exited=True))
        ).annotate(
            churn_rate=100.0 * F('churned') / F('total')
        ).order_by('-churn_rate'))
        
        return Response({
            'total_customers': total_customers,
            'churn_rate': (churned_customers / total_customers * 100) if total_customers > 0 else 0,
            'active_customers': active_customers,
            'inactive_customers': total_customers - active_customers,
            'averages': {
                'credit_score': round(averages['avg_credit_score'] or 0, 2),
                'age': round(averages['avg_age'] or 0, 2),
                'balance': round(averages['avg_balance'] or 0, 2)
            },
            'geography_distribution': geography_dist,
            'product_distribution': product_dist,
            'churn_by_geography': churn_by_geography
        })
        
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def get_risk_monitoring(request):
    """
    Get risk monitoring data including:
    - High risk customers
    - Recent risk changes
    - Risk history for specific customer
    """
    try:
        customer_id = request.query_params.get('customer_id')
        
        if customer_id:
            # Get risk history for specific customer
            customer = get_object_or_404(CustomerChurn, customer_id=customer_id)
            history = ChurnRiskHistory.objects.filter(customer=customer).order_by('-timestamp')[:10]
            
            return Response({
                'customer_id': customer_id,
                'current_probability': history[0].churn_probability if history else None,
                'is_high_risk': history[0].is_high_risk if history else False,
                'history': [{
                    'timestamp': h.timestamp,
                    'probability': h.churn_probability,
                    'risk_change': h.risk_change,
                    'is_high_risk': h.is_high_risk
                } for h in history]
            })
        
        # Get all high risk customers
        high_risk_records = ChurnRiskHistory.objects.filter(
            is_high_risk=True,
            timestamp__gte=timezone.now() - timezone.timedelta(days=7)
        ).select_related('customer').order_by('-timestamp')
        
        return Response({
            'high_risk_customers': [{
                'customer_id': record.customer.customer_id,
                'surname': record.customer.surname,
                'probability': record.churn_probability,
                'risk_change': record.risk_change,
                'timestamp': record.timestamp
            } for record in high_risk_records]
        })
        
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@csrf_exempt
@authentication_classes([BasicAuthentication])
@permission_classes([IsAdminUser])
def import_csv(request):
    """
    Import customer data from CSV file.
    Handles duplicate customer IDs by either skipping or updating based on update_existing parameter.
    """
    try:
        print(f"Request method: {request.method}")
        print(f"Request headers: {dict(request.headers)}")
        print(f"Request data: {request.data}")
        print(f"Request FILES: {request.FILES}")
        
        # Handle file upload
        csv_file = request.FILES.get('csv_file')
        if not csv_file:
            return JsonResponse({
                'status': 'error',
                'message': 'No CSV file provided'
            }, status=400)

        # Get update_existing parameter
        update_existing = request.data.get('update_existing', 'false').lower() == 'true'

        # Read CSV file
        df = pd.read_csv(csv_file)
        
        # Convert boolean columns
        df['HasCrCard'] = df['HasCrCard'].astype(bool)
        df['IsActiveMember'] = df['IsActiveMember'].astype(bool)
        df['Exited'] = df['Exited'].astype(bool)

        # Prepare data for bulk create/update
        records = []
        skipped = []
        updated = []
        created = []

        with transaction.atomic():
            for _, row in df.iterrows():
                customer_data = {
                    'customer_id': row['CustomerId'],
                    'row_number': row['RowNumber'],
                    'surname': row['Surname'],
                    'credit_score': row['CreditScore'],
                    'geography': row['Geography'],
                    'gender': row['Gender'],
                    'age': row['Age'],
                    'tenure': row['Tenure'],
                    'balance': row['Balance'],
                    'num_of_products': row['NumOfProducts'],
                    'has_cr_card': row['HasCrCard'],
                    'is_active_member': row['IsActiveMember'],
                    'estimated_salary': row['EstimatedSalary'],
                    'exited': row['Exited']
                }

                # Check if customer exists
                existing_customer = CustomerChurn.objects.filter(customer_id=customer_data['customer_id']).first()
                
                if existing_customer:
                    if update_existing:
                        for key, value in customer_data.items():
                            setattr(existing_customer, key, value)
                        existing_customer.save()
                        updated.append(customer_data['customer_id'])
                    else:
                        skipped.append(customer_data['customer_id'])
                else:
                    records.append(CustomerChurn(**customer_data))
                    created.append(customer_data['customer_id'])

            # Bulk create new records
            if records:
                CustomerChurn.objects.bulk_create(records)

        response_data = {
            'status': 'success',
            'created': len(created),
            'updated': len(updated),
            'skipped': len(skipped),
            'details': {
                'created_ids': created,
                'updated_ids': updated,
                'skipped_ids': skipped
            }
        }
        print(f"Response data: {response_data}")
        return JsonResponse(response_data)

    except Exception as e:
        error_response = {
            'status': 'error',
            'message': str(e),
            'details': traceback.format_exc()
        }
        print(f"Error response: {error_response}")
        return JsonResponse(error_response, status=400)

@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAdminUser])
def manage_alert_config(request):
    """
    GET: Retrieve current alert configuration
    POST: Update alert configuration
    """
    try:
        config = AlertConfiguration.objects.first()
        
        if request.method == 'POST':
            try:
                data = request.data
                print(f"Received POST data: {data}")  # Debug log
                
                if config:
                    serializer = AlertConfigurationSerializer(config, data=data)
                else:
                    serializer = AlertConfigurationSerializer(data=data)
                
                if serializer.is_valid():
                    config = serializer.save()
                    # Update settings
                    if not hasattr(settings, 'DISCORD_ALERTS'):
                        settings.DISCORD_ALERTS = {}
                    
                    settings.DISCORD_WEBHOOK_URL = config.webhook_url
                    settings.DISCORD_ALERTS['ENABLED'] = config.is_enabled
                    settings.DISCORD_ALERTS['HIGH_RISK_THRESHOLD'] = config.high_risk_threshold
                    settings.DISCORD_ALERTS['RISK_INCREASE_THRESHOLD'] = config.risk_increase_threshold
                    
                    print(f"Config updated successfully: {serializer.data}")  # Debug log
                    return Response(serializer.data)
                
                print(f"Validation errors: {serializer.errors}")  # Debug log
                return Response(
                    {
                        'error': 'Validation failed',
                        'details': serializer.errors
                    }, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            except Exception as e:
                print(f"Error processing POST request: {str(e)}")  # Debug log
                print(f"Traceback: {traceback.format_exc()}")  # Debug log
                return Response(
                    {
                        'error': 'Failed to process request',
                        'details': str(e)
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        # GET request
        try:
            if config:
                serializer = AlertConfigurationSerializer(config)
                return Response(serializer.data)
            return Response({})
        except Exception as e:
            print(f"Error processing GET request: {str(e)}")  # Debug log
            print(f"Traceback: {traceback.format_exc()}")  # Debug log
            return Response(
                {
                    'error': 'Failed to retrieve configuration',
                    'details': str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
    except Exception as e:
        print(f"Unexpected error in manage_alert_config: {str(e)}")  # Debug log
        print(f"Traceback: {traceback.format_exc()}")  # Debug log
        return Response(
            {
                'error': 'An unexpected error occurred',
                'details': str(e)
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def get_alert_history(request):
    """
    Get alert history with filtering options:
    - alert_type
    - customer_id
    - date_from
    - date_to
    - success_only
    """
    try:
        queryset = AlertHistory.objects.all()
        
        # Apply filters
        alert_type = request.query_params.get('alert_type')
        customer_id = request.query_params.get('customer_id')
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        success_only = request.query_params.get('success_only')
        
        if alert_type:
            queryset = queryset.filter(alert_type=alert_type)
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        if date_from:
            queryset = queryset.filter(sent_at__gte=date_from)
        if date_to:
            queryset = queryset.filter(sent_at__lte=date_to)
        if success_only:
            queryset = queryset.filter(was_sent=True)
            
        # Apply pagination
        paginator = StandardResultsSetPagination()
        paginated_queryset = paginator.paginate_queryset(queryset, request)
        
        serializer = AlertHistorySerializer(paginated_queryset, many=True)
        return paginator.get_paginated_response(serializer.data)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def get_alert_stats(request):
    """
    Get alert statistics:
    - Total alerts sent
    - Alerts by type
    - Success rate
    - Recent failures
    """
    try:
        total_alerts = AlertHistory.objects.count()
        successful_alerts = AlertHistory.objects.filter(was_sent=True).count()
        
        # Alerts by type
        alerts_by_type = AlertHistory.objects.values('alert_type').annotate(
            total=Count('id'),
            successful=Count('id', filter=Q(was_sent=True))
        )
        
        # Recent failures
        recent_failures = AlertHistory.objects.filter(
            was_sent=False,
            sent_at__gte=timezone.now() - timezone.timedelta(days=1)
        ).order_by('-sent_at')[:5]
        
        return Response({
            'total_alerts': total_alerts,
            'successful_alerts': successful_alerts,
            'success_rate': (successful_alerts / total_alerts * 100) if total_alerts > 0 else 0,
            'alerts_by_type': alerts_by_type,
            'recent_failures': AlertHistorySerializer(recent_failures, many=True).data
        })
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def get_risk_dashboard(request):
    """
    Get dashboard data for high-risk customers and risk changes:
    - High risk customers (current)
    - Recent risk changes
    - Risk trend over time
    - Risk distribution
    """
    try:
        # Get configuration
        config = AlertConfiguration.objects.first()
        high_risk_threshold = config.high_risk_threshold if config else 0.7
        risk_increase_threshold = config.risk_increase_threshold if config else 20.0

        # Get latest timestamp for each customer
        latest_records = ChurnRiskHistory.objects.filter(
            timestamp__gte=timezone.now() - timezone.timedelta(days=7)
        ).values('customer').annotate(
            latest_timestamp=Max('timestamp')
        )

        # Get current high risk customers (only latest record per customer)
        high_risk_customers = ChurnRiskHistory.objects.filter(
            is_high_risk=True,
            timestamp__gte=timezone.now() - timezone.timedelta(days=7)
        ).select_related('customer').filter(
            timestamp__in=[record['latest_timestamp'] for record in latest_records]
        ).order_by('-churn_probability')[:10]

        # Get significant risk increases (only latest record per customer)
        significant_increases = ChurnRiskHistory.objects.filter(
            risk_change__gte=risk_increase_threshold,
            timestamp__gte=timezone.now() - timezone.timedelta(days=7)
        ).select_related('customer').filter(
            timestamp__in=[record['latest_timestamp'] for record in latest_records]
        ).order_by('-timestamp')[:10]

        # Get risk distribution (using latest records only)
        risk_distribution = ChurnRiskHistory.objects.filter(
            timestamp__in=[record['latest_timestamp'] for record in latest_records]
        ).aggregate(
            very_high=Count('id', filter=Q(churn_probability__gte=0.8)),
            high=Count('id', filter=Q(churn_probability__range=(0.6, 0.8))),
            medium=Count('id', filter=Q(churn_probability__range=(0.4, 0.6))),
            low=Count('id', filter=Q(churn_probability__range=(0.2, 0.4))),
            very_low=Count('id', filter=Q(churn_probability__lt=0.2))
        )

        # Get daily average risk trend
        daily_risk_trend = ChurnRiskHistory.objects.filter(
            timestamp__gte=timezone.now() - timezone.timedelta(days=30)
        ).values('timestamp__date').annotate(
            avg_risk=Avg('churn_probability'),
            high_risk_count=Count('id', filter=Q(is_high_risk=True))
        ).order_by('timestamp__date')

        return Response({
            'high_risk_customers': [{
                'customer_id': h.customer.customer_id,
                'customer_name': h.customer.surname,
                'probability': h.churn_probability,
                'risk_change': h.risk_change,
                'last_updated': h.timestamp
            } for h in high_risk_customers],
            
            'significant_increases': [{
                'customer_id': h.customer.customer_id,
                'customer_name': h.customer.surname,
                'probability': h.churn_probability,
                'risk_change': h.risk_change,
                'previous_probability': h.previous_probability,
                'changed_at': h.timestamp
            } for h in significant_increases],
            
            'risk_distribution': risk_distribution,
            
            'risk_trend': [{
                'date': item['timestamp__date'],
                'avg_risk': item['avg_risk'],
                'high_risk_count': item['high_risk_count']
            } for item in daily_risk_trend],
            
            'thresholds': {
                'high_risk': high_risk_threshold,
                'risk_increase': risk_increase_threshold
            }
        })
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def trigger_monitoring(request):
    """
    Manually trigger the customer churn monitoring task.
    This will:
    1. Calculate churn probabilities for all customers
    2. Track risk changes
    3. Send alerts if configured
    """
    try:
        from .tasks import monitor_customer_churn
        
        try:
            # Load model components first to validate
            components = get_model_components()
            if not components:
                return Response(
                    {
                        'status': 'error',
                        'message': 'Model components not available. Please train the model first.'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            print("Starting manual monitoring task...")  # Debug log
            
            # Run the monitoring task synchronously for immediate feedback
            result = monitor_customer_churn()
            print(f"Monitoring task result: {result}")  # Debug log
            
            # Parse the result message
            if isinstance(result, str):
                if "Error" in result:
                    print(f"Monitoring task error: {result}")  # Debug log
                    return Response(
                        {
                            'status': 'error',
                            'message': result
                        },
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
                else:
                    print("Monitoring task completed successfully")  # Debug log
                    return Response({
                        'status': 'success',
                        'message': result
                    })
            else:
                print(f"Unexpected result type: {type(result)}")  # Debug log
                return Response({
                    'status': 'success',
                    'message': str(result)
                })
            
        except ImportError as e:
            print(f"Import error: {str(e)}")  # Debug log
            return Response(
                {
                    'status': 'error',
                    'message': 'Failed to import required components',
                    'details': str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
    except Exception as e:
        print(f"Error triggering monitoring: {str(e)}")  # Debug log
        print(f"Traceback: {traceback.format_exc()}")  # Debug log
        return Response(
            {
                'status': 'error',
                'message': f'Failed to trigger monitoring: {str(e)}',
                'details': traceback.format_exc()
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
