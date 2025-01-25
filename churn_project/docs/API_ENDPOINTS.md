# API Documentation

## Alert Management Endpoints

### Alert Configuration
- **URL**: `/api/alerts/config/`
- **Methods**: `GET`, `POST`
- **Authentication**: Admin only
- **Description**: Manage Discord webhook configuration for alerts

#### GET Response
```json
{
    "id": 1,
    "webhook_url": "https://discord.com/api/webhooks/xxx",
    "is_enabled": true,
    "high_risk_threshold": 0.7,
    "risk_increase_threshold": 20.0,
    "created_at": "2024-01-22T18:50:00Z",
    "updated_at": "2024-01-22T18:50:00Z"
}
```

#### POST Request
```json
{
    "webhook_url": "https://discord.com/api/webhooks/xxx",
    "is_enabled": true,
    "high_risk_threshold": 0.7,
    "risk_increase_threshold": 20.0
}
```

### Alert History
- **URL**: `/api/alerts/history/`
- **Method**: `GET`
- **Authentication**: Admin only
- **Description**: Retrieve alert history with filtering options

#### Query Parameters
- `alert_type`: Filter by alert type (HIGH_RISK, RISK_INCREASE, SUMMARY)
- `customer_id`: Filter by customer ID
- `date_from`: Filter from date (YYYY-MM-DD)
- `date_to`: Filter to date (YYYY-MM-DD)
- `success_only`: Filter only successful alerts (true/false)

#### Response
```json
{
    "count": 10,
    "next": "http://api/alerts/history/?page=2",
    "previous": null,
    "results": [
        {
            "id": 1,
            "customer": 1,
            "customer_name": "John Doe",
            "alert_type": "HIGH_RISK",
            "message": {"text": "Alert content"},
            "sent_at": "2024-01-22T18:50:00Z",
            "was_sent": true,
            "error_message": null
        }
    ]
}
```

### Alert Statistics
- **URL**: `/api/alerts/stats/`
- **Method**: `GET`
- **Authentication**: Admin only
- **Description**: Get alert system statistics

#### Response
```json
{
    "total_alerts": 100,
    "successful_alerts": 95,
    "success_rate": 95.0,
    "alerts_by_type": [
        {
            "alert_type": "HIGH_RISK",
            "total": 50,
            "successful": 48
        }
    ],
    "recent_failures": []
}
```

## Risk Monitoring Endpoints

### Risk Dashboard
- **URL**: `/api/risk/dashboard/`
- **Method**: `GET`
- **Authentication**: Admin only
- **Description**: Get comprehensive risk monitoring dashboard data

#### Response
```json
{
    "high_risk_customers": [
        {
            "customer_id": 1,
            "customer_name": "John Doe",
            "probability": 0.85,
            "risk_change": 15.0,
            "last_updated": "2024-01-22T18:50:00Z"
        }
    ],
    "significant_increases": [
        {
            "customer_id": 2,
            "customer_name": "Jane Smith",
            "probability": 0.75,
            "risk_change": 25.0,
            "previous_probability": 0.60,
            "changed_at": "2024-01-22T18:50:00Z"
        }
    ],
    "risk_distribution": {
        "very_high": 10,
        "high": 20,
        "medium": 30,
        "low": 25,
        "very_low": 15
    },
    "risk_trend": [
        {
            "date": "2024-01-22",
            "avg_risk": 0.45,
            "high_risk_count": 5
        }
    ],
    "thresholds": {
        "high_risk": 0.7,
        "risk_increase": 20.0
    }
}
``` 