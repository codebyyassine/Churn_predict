from django.urls import path, include

urlpatterns = [
    path('api/', include('churn_app.urls')),
]
