from celery import shared_task
from django.core.management import call_command
from django.conf import settings
from .models import CustomerChurn, ChurnRiskHistory
from .views import get_model_components
import numpy as np
import pandas as pd

@shared_task
def retrain_churn_model():
    # You can directly call your management command to retrain
    call_command("train_churn")  # from your earlier code
    return "Model retrained!"

@shared_task
def monitor_customer_churn():
    """
    Periodic task to monitor customer churn risk
    """
    try:
        # Load model components
        components = get_model_components()
        if not components:
            return "Model components not available"
            
        model = components['model']
        scaler = components['scaler']
        le_geo = components['label_encoder_geo']
        le_gender = components['label_encoder_gender']
        
        # Get all customers
        customers = CustomerChurn.objects.all()
        
        for customer in customers:
            # Prepare customer data
            input_data = {
                "credit_score": float(customer.credit_score),
                "age": float(customer.age),
                "tenure": float(customer.tenure),
                "balance": float(customer.balance),
                "num_of_products": float(customer.num_of_products),
                "has_cr_card": float(customer.has_cr_card),
                "is_active_member": float(customer.is_active_member),
                "estimated_salary": float(customer.estimated_salary),
                "geography": customer.geography,
                "gender": customer.gender
            }
            
            # Create DataFrame
            df = pd.DataFrame([input_data])
            
            # Encode categorical variables
            df["geography"] = le_geo.transform(df["geography"].values)
            df["gender"] = le_gender.transform(df["gender"].values)
            
            # Scale numerical features
            numerical_features = [
                "credit_score", "age", "tenure", "balance", 
                "num_of_products", "has_cr_card", "is_active_member", 
                "estimated_salary"
            ]
            df[numerical_features] = scaler.transform(df[numerical_features])
            
            # Make prediction
            feature_cols = numerical_features + ["geography", "gender"]
            probability = model.predict_proba(df[feature_cols])[0][1]
            
            # Get previous probability
            previous = ChurnRiskHistory.objects.filter(customer=customer).order_by('-timestamp').first()
            previous_prob = previous.churn_probability if previous else None
            
            # Calculate risk change
            risk_change = None
            if previous_prob is not None:
                risk_change = ((probability - previous_prob) / previous_prob) * 100
            
            # Determine if high risk (probability > 0.7 or significant increase)
            is_high_risk = probability > 0.7 or (risk_change is not None and risk_change > 20)
            
            # Create history record
            ChurnRiskHistory.objects.create(
                customer=customer,
                churn_probability=probability,
                previous_probability=previous_prob,
                risk_change=risk_change,
                is_high_risk=is_high_risk
            )
            
        return "Monitoring completed successfully"
        
    except Exception as e:
        return f"Error in monitoring: {str(e)}"
