from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create a router and register our viewsets with it
router = DefaultRouter()
router.register(r'users', views.UserViewSet, basename='user')
router.register(r'customers', views.CustomerChurnViewSet, basename='customer')

# The API URLs are now determined automatically by the router
urlpatterns = [
    # Include the router URLs
    path('', include(router.urls)),
    
    # Custom endpoints
    path('predict/', views.predict_churn, name='predict_churn'),
    path('train/', views.trigger_training, name='train_model'),
    path('model-metrics/', views.get_model_metrics, name='model_metrics'),
    path('dashboard/stats/', views.get_dashboard_stats, name='dashboard_stats'),
    
    # Bulk operations
    path('customers/bulk/create/', views.bulk_create_customers, name='bulk_create_customers'),
    path('customers/bulk/update/', views.bulk_update_customers, name='bulk_update_customers'),
    path('customers/bulk/delete/', views.bulk_delete_customers, name='bulk_delete_customers'),
]
