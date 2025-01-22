import pickle
import numpy as np
import pandas as pd
from django.http import JsonResponse
from rest_framework.decorators import api_view, authentication_classes, permission_classes
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
from .models import CustomerChurn
from .serializers import UserSerializer, CustomerChurnSerializer
from django.shortcuts import get_object_or_404

# Define features directly
numerical_features = [
    "credit_score", "age", "tenure", "balance", 
    "num_of_products", "has_cr_card", "is_active_member", 
    "estimated_salary"
]
categorical_features = ["geography", "gender"]

# Load your pipeline objects once on module import
model_path = os.path.join(settings.BASE_DIR, "churn_model.pkl")
with open(model_path, "rb") as f:
    pipeline = pickle.load(f)

model = pipeline["model"]
scaler = pipeline["scaler"]
le_geo = pipeline["label_encoder_geo"]
le_gender = pipeline["label_encoder_gender"]
feature_cols = numerical_features + categorical_features
feature_importance = pipeline.get("feature_importance", [])

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
        
        # Reload the model after training
        global model, scaler, le_geo, le_gender, feature_importance
        with open(model_path, "rb") as f:
            pipeline = pickle.load(f)
            
        model = pipeline["model"]
        scaler = pipeline["scaler"]
        le_geo = pipeline["label_encoder_geo"]
        le_gender = pipeline["label_encoder_gender"]
        feature_importance = pipeline.get("feature_importance", [])
        
        return JsonResponse({
            "status": "success",
            "message": "Model training completed successfully"
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
    if not isinstance(request.data, list):
        return Response(
            {"error": "Expected a list of customers"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    serializer = CustomerChurnSerializer(data=request.data, many=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def bulk_update_customers(request):
    if not isinstance(request.data, list):
        return Response(
            {"error": "Expected a list of customers"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    updated_customers = []
    for customer_data in request.data:
        if 'id' not in customer_data:
            return Response(
                {"error": "Each customer must have an id"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        customer = get_object_or_404(CustomerChurn, id=customer_data['id'])
        serializer = CustomerChurnSerializer(customer, data=customer_data, partial=True)
        if serializer.is_valid():
            serializer.save()
            updated_customers.append(serializer.data)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    return Response(updated_customers)

@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def bulk_delete_customers(request):
    if not isinstance(request.data, list):
        return Response(
            {"error": "Expected a list of customer IDs"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    CustomerChurn.objects.filter(id__in=request.data).delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
