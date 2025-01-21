from celery import shared_task
from django.core.management import call_command

@shared_task
def retrain_churn_model():
    # You can directly call your management command to retrain
    call_command("train_churn")  # from your earlier code
    return "Model retrained!"
