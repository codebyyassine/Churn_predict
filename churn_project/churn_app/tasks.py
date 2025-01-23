from celery import shared_task
from django.core.management import call_command
from django.conf import settings
from .models import CustomerChurn, ChurnRiskHistory
from .views import get_model_components
from .utils import send_discord_alert, send_monitoring_summary
import numpy as np
import pandas as pd
import traceback

@shared_task
def retrain_churn_model():
    # You can directly call your management command to retrain
    call_command("train_churn")  # from your earlier code
    return "Model retrained!"

@shared_task
def monitor_customer_churn():
    """
    Periodic task to monitor customer churn risk and send alerts via Discord
    """
    try:
        print("Starting customer churn monitoring...")  # Debug log
        
        # Load model components
        components = get_model_components()
        if not components:
            error_msg = "Model components not available. Please train the model first."
            print(error_msg)  # Debug log
            return error_msg
            
        model = components['model']
        scaler = components['scaler']
        le_geo = components['label_encoder_geo']
        le_gender = components['label_encoder_gender']
        
        # Define feature order explicitly to match training
        numerical_features = [
            "credit_score", "age", "tenure", "balance", 
            "num_of_products", "has_cr_card", "is_active_member", 
            "estimated_salary"
        ]
        categorical_features = ["geography", "gender"]
        feature_cols = numerical_features + categorical_features
        
        # Get all customers
        customers = CustomerChurn.objects.all()
        if not customers.exists():
            return "No customers found in database"
            
        print(f"Found {customers.count()} customers to monitor")  # Debug log
        
        total_checked = 0
        high_risk_count = 0
        significant_increases = 0
        
        for customer in customers:
            try:
                total_checked += 1
                print(f"Processing customer {customer.customer_id}")  # Debug log
                
                # Create input data as numpy array first
                input_data = np.array([[
                    float(customer.credit_score or 0),
                    float(customer.age or 0),
                    float(customer.tenure or 0),
                    float(customer.balance or 0),
                    float(customer.num_of_products or 1),
                    float(customer.has_cr_card or 0),
                    float(customer.is_active_member or 0),
                    float(customer.estimated_salary or 0),
                    customer.geography or "Unknown",
                    customer.gender or "Unknown"
                ]])
                
                # Convert to DataFrame with explicit column names
                input_df = pd.DataFrame(
                    input_data, 
                    columns=feature_cols
                )
                
                try:
                    # Encode categorical variables
                    input_df["geography"] = le_geo.transform(input_df["geography"].values)
                    input_df["gender"] = le_gender.transform(input_df["gender"].values)
                except Exception as e:
                    print(f"Error encoding categorical variables for customer {customer.customer_id}: {str(e)}")
                    continue
                
                try:
                    # Scale numerical features
                    input_df[numerical_features] = scaler.transform(input_df[numerical_features])
                except Exception as e:
                    print(f"Error scaling features for customer {customer.customer_id}: {str(e)}")
                    continue
                
                try:
                    # Make prediction using ordered features
                    probability = model.predict_proba(input_df[feature_cols])[0][1]
                except Exception as e:
                    print(f"Error making prediction for customer {customer.customer_id}: {str(e)}")
                    continue
                
                # Get previous probability
                previous = ChurnRiskHistory.objects.filter(customer=customer).order_by('-timestamp').first()
                previous_prob = previous.churn_probability if previous else None
                
                # Calculate risk change
                risk_change = None
                if previous_prob is not None:
                    risk_change = ((probability - previous_prob) / previous_prob) * 100
                
                # Determine if high risk
                is_high_risk = probability > settings.DISCORD_ALERTS.get('HIGH_RISK_THRESHOLD', 0.7)
                has_significant_increase = (
                    risk_change is not None and 
                    risk_change > settings.DISCORD_ALERTS.get('RISK_INCREASE_THRESHOLD', 20.0)
                )
                
                # Update counters
                if is_high_risk:
                    high_risk_count += 1
                if has_significant_increase:
                    significant_increases += 1
                
                # Create history record
                ChurnRiskHistory.objects.create(
                    customer=customer,
                    churn_probability=probability,
                    previous_probability=previous_prob,
                    risk_change=risk_change,
                    is_high_risk=is_high_risk
                )
                
                # Send alert if needed
                if is_high_risk or has_significant_increase:
                    alert_sent = send_discord_alert(
                        customer=customer,
                        probability=probability,
                        risk_change=risk_change,
                        previous_probability=previous_prob
                    )
                    if not alert_sent:
                        print(f"Failed to send alert for customer {customer.customer_id}")
            
            except Exception as customer_error:
                print(f"Error processing customer {customer.customer_id}: {str(customer_error)}")
                continue
        
        # Send monitoring summary
        summary_sent = send_monitoring_summary(
            total_checked=total_checked,
            high_risk_count=high_risk_count,
            significant_increases=significant_increases
        )
        if not summary_sent:
            print("Failed to send monitoring summary")
            
        result_msg = f"Monitoring completed successfully. Checked: {total_checked}, High Risk: {high_risk_count}, Significant Increases: {significant_increases}"
        print(result_msg)  # Debug log
        return result_msg
        
    except Exception as e:
        error_msg = f"Error in monitoring: {str(e)}"
        print(f"{error_msg}\nTraceback: {traceback.format_exc()}")  # Debug log
        return error_msg
