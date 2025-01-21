import pickle
import numpy as np
import pandas as pd
from django.http import JsonResponse
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.authentication import BasicAuthentication
import json
from django.core.cache import cache
from django.views.decorators.csrf import csrf_exempt
import os
from django.conf import settings
from django.core.management import call_command

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
@authentication_classes([])  # Skip authentication
@permission_classes([])      # Skip permissions
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
