from django.urls import path
from .views import predict_churn, trigger_training

urlpatterns = [
    path('predict', predict_churn, name='predict_churn'),
    path('train', trigger_training, name='trigger_training'),
]
