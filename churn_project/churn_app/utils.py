import requests
from django.conf import settings
import json
from datetime import datetime, timedelta
import time
from churn_app.models import AlertHistory

def validate_webhook_url(url):
    """
    Validate Discord webhook URL format and accessibility.
    """
    if not url or not isinstance(url, str):
        return False, "Invalid webhook URL"
        
    if not url.startswith('https://discord.com/api/webhooks/'):
        return False, "Invalid webhook URL format"
        
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 404:
            return False, "Webhook URL not found"
        return True, None
    except Exception as e:
        return False, f"Error validating webhook: {str(e)}"

def check_rate_limit():
    """
    Check if we've exceeded Discord's rate limit (30 messages per minute).
    """
    one_minute_ago = datetime.now() - timedelta(minutes=1)
    recent_messages = AlertHistory.objects.filter(
        sent_at__gte=one_minute_ago,
        was_sent=True
    ).count()
    return recent_messages >= 30

def send_discord_message(url, message, max_retries=3, retry_delay=1):
    """
    Send message to Discord with retry logic.
    """
    # Check message size (Discord limit is 2000 characters)
    message_json = json.dumps(message)
    if len(message_json) > 2000:
        return False, "Message exceeds Discord size limit"
    
    for attempt in range(max_retries):
        try:
            response = requests.post(
                url,
                json=message,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 204:
                return True, None
            elif response.status_code == 429:  # Rate limit hit
                retry_after = int(response.headers.get('Retry-After', retry_delay))
                time.sleep(retry_after)
                continue
            else:
                error_msg = f"Discord API returned status code: {response.status_code}"
                if attempt < max_retries - 1:
                    time.sleep(retry_delay)
                    continue
                return False, error_msg
                
        except Exception as e:
            error_msg = f"Error sending Discord message: {str(e)}"
            if attempt < max_retries - 1:
                time.sleep(retry_delay)
                continue
            return False, error_msg
    
    return False, "Max retries exceeded"

def send_discord_alert(customer, probability, risk_change=None, previous_probability=None):
    """
    Send an alert to Discord about a high-risk customer.
    """
    # Check if alerts are enabled
    if not settings.DISCORD_ALERTS['ENABLED']:
        return False

    # Validate webhook URL
    is_valid, error_msg = validate_webhook_url(settings.DISCORD_WEBHOOK_URL)
    if not is_valid:
        print(f"Webhook validation failed: {error_msg}")
        return False

    # Check rate limit
    if check_rate_limit():
        error_msg = "Rate limit exceeded (30 messages/minute)"
        print(error_msg)
        AlertHistory.objects.create(
            customer=customer,
            alert_type='HIGH_RISK',
            message={"error": error_msg},
            was_sent=False,
            error_message=error_msg
        )
        return False

    # Format the message
    message = {
        "embeds": [{
            "title": "🚨 High Risk Customer Alert",
            "color": 15158332,  # Red color
            "fields": [
                {
                    "name": "Customer ID",
                    "value": str(customer.customer_id),
                    "inline": True
                },
                {
                    "name": "Customer Name",
                    "value": customer.surname,
                    "inline": True
                },
                {
                    "name": "Churn Probability",
                    "value": f"{probability:.2%}",
                    "inline": True
                },
                {
                    "name": "Geography",
                    "value": customer.geography,
                    "inline": True
                }
            ],
            "timestamp": datetime.utcnow().isoformat()
        }]
    }

    # Add risk change information if available
    if risk_change is not None and previous_probability is not None:
        message["embeds"][0]["fields"].extend([
            {
                "name": "Previous Probability",
                "value": f"{previous_probability:.2%}",
                "inline": True
            },
            {
                "name": "Risk Change",
                "value": f"{risk_change:+.2f}%",
                "inline": True
            }
        ])
        
        # Add description based on risk type
        if probability > settings.DISCORD_ALERTS['HIGH_RISK_THRESHOLD']:
            message["embeds"][0]["description"] = "⚠️ Customer has exceeded the high-risk threshold!"
        if risk_change > settings.DISCORD_ALERTS['RISK_INCREASE_THRESHOLD']:
            message["embeds"][0]["description"] = "📈 Significant increase in churn risk!"

    # Add customer details
    details = [
        f"Age: {customer.age}",
        f"Tenure: {customer.tenure} months",
        f"Balance: ${float(customer.balance):.2f}",
        f"Products: {customer.num_of_products}",
        f"Active Member: {'Yes' if customer.is_active_member else 'No'}"
    ]
    message["embeds"][0]["fields"].append({
        "name": "Customer Details",
        "value": "\n".join(details),
        "inline": False
    })

    # Determine alert type based on conditions
    alert_type = 'HIGH_RISK' if probability > settings.DISCORD_ALERTS['HIGH_RISK_THRESHOLD'] else 'RISK_INCREASE'

    # Send message with retry logic
    success, error_msg = send_discord_message(settings.DISCORD_WEBHOOK_URL, message)
    
    # Create alert history record
    AlertHistory.objects.create(
        customer=customer,
        alert_type=alert_type,
        message=message,
        was_sent=success,
        error_message=error_msg
    )
    
    return success

def send_monitoring_summary(total_checked, high_risk_count, significant_increases):
    """
    Send a summary of the monitoring run to Discord.
    """
    # Check if alerts are enabled
    if not settings.DISCORD_ALERTS['ENABLED']:
        return False

    # Validate webhook URL
    is_valid, error_msg = validate_webhook_url(settings.DISCORD_WEBHOOK_URL)
    if not is_valid:
        print(f"Webhook validation failed: {error_msg}")
        return False

    # Check rate limit
    if check_rate_limit():
        error_msg = "Rate limit exceeded (30 messages/minute)"
        print(error_msg)
        AlertHistory.objects.create(
            customer=None,
            alert_type='SUMMARY',
            message={"error": error_msg},
            was_sent=False,
            error_message=error_msg
        )
        return False

    message = {
        "embeds": [{
            "title": "📊 Churn Risk Monitoring Summary",
            "color": 3447003,  # Blue color
            "fields": [
                {
                    "name": "Total Customers Checked",
                    "value": str(total_checked),
                    "inline": True
                },
                {
                    "name": "High Risk Customers",
                    "value": str(high_risk_count),
                    "inline": True
                },
                {
                    "name": "Significant Risk Increases",
                    "value": str(significant_increases),
                    "inline": True
                }
            ],
            "timestamp": datetime.utcnow().isoformat()
        }]
    }

    # Send message with retry logic
    success, error_msg = send_discord_message(settings.DISCORD_WEBHOOK_URL, message)
    
    # Create alert history record
    AlertHistory.objects.create(
        customer=None,
        alert_type='SUMMARY',
        message=message,
        was_sent=success,
        error_message=error_msg
    )
    
    return success 