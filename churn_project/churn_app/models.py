from django.db import models

class CustomerChurn(models.Model):
    customer_id = models.IntegerField(primary_key=True)
    row_number = models.IntegerField(null=True, blank=True)
    surname = models.CharField(max_length=50, null=True, blank=True)
    credit_score = models.IntegerField(null=True, blank=True)
    geography = models.CharField(max_length=50, null=True, blank=True)
    gender = models.CharField(max_length=10, null=True, blank=True)
    age = models.IntegerField(null=True, blank=True)
    tenure = models.IntegerField(null=True, blank=True)
    balance = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    num_of_products = models.IntegerField(null=True, blank=True)
    has_cr_card = models.BooleanField(default=False)
    is_active_member = models.BooleanField(default=False)
    estimated_salary = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    exited = models.BooleanField(default=False)

    class Meta:
        db_table = 'customer_churn'

class ChurnRiskHistory(models.Model):
    customer = models.ForeignKey(CustomerChurn, on_delete=models.CASCADE, related_name='risk_history')
    timestamp = models.DateTimeField(auto_now_add=True)
    churn_probability = models.FloatField()
    previous_probability = models.FloatField(null=True)
    risk_change = models.FloatField(null=True)  # Percentage change
    is_high_risk = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-timestamp']
        
    def __str__(self):
        return f"{self.customer} - {self.timestamp.strftime('%Y-%m-%d %H:%M')} - {self.churn_probability:.2f}"

class AlertConfiguration(models.Model):
    webhook_url = models.URLField(max_length=500)
    is_enabled = models.BooleanField(default=True)
    high_risk_threshold = models.FloatField(default=0.7)
    risk_increase_threshold = models.FloatField(default=20.0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-updated_at']
        
    def __str__(self):
        return f"Alert Config (Updated: {self.updated_at.strftime('%Y-%m-%d %H:%M')})"

class AlertHistory(models.Model):
    ALERT_TYPES = [
        ('HIGH_RISK', 'High Risk'),
        ('RISK_INCREASE', 'Risk Increase'),
        ('SUMMARY', 'Monitoring Summary')
    ]
    
    customer = models.ForeignKey(CustomerChurn, on_delete=models.CASCADE, null=True, blank=True)
    alert_type = models.CharField(max_length=20, choices=ALERT_TYPES)
    message = models.JSONField()  # Store the exact message sent to Discord
    sent_at = models.DateTimeField(auto_now_add=True)
    was_sent = models.BooleanField(default=False)  # Track if alert was successfully sent
    error_message = models.TextField(null=True, blank=True)  # Store error if sending failed
    
    class Meta:
        ordering = ['-sent_at']
        
    def __str__(self):
        if self.customer:
            return f"{self.alert_type} - {self.customer} - {self.sent_at.strftime('%Y-%m-%d %H:%M')}"
        return f"{self.alert_type} - {self.sent_at.strftime('%Y-%m-%d %H:%M')}"
