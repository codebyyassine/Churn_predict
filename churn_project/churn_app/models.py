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
