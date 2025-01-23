# churn_project/celery.py
import os
from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "churn_project.settings")
app = Celery("churn_project")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()

app.conf.beat_schedule = {
    'monitor-customer-churn': {
        'task': 'churn_app.tasks.monitor_customer_churn',
        'schedule': 3600.0,  # Run every hour
    },
}
