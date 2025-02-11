from rest_framework import serializers
from django.contrib.auth.models import User
from .models import CustomerChurn, AlertConfiguration, AlertHistory

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'first_name', 'last_name', 'is_staff')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

    def update(self, instance, validated_data):
        if 'password' in validated_data:
            password = validated_data.pop('password')
            instance.set_password(password)
        return super().update(instance, validated_data)

class CustomerChurnSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerChurn
        fields = '__all__'
        read_only_fields = ('customer_id',)

class CSVImportSerializer(serializers.Serializer):
    csv_file = serializers.FileField()
    update_existing = serializers.BooleanField(default=False)

    def validate_csv_file(self, value):
        if not value.name.endswith('.csv'):
            raise serializers.ValidationError("Only CSV files are allowed.")
        return value

class AlertConfigurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = AlertConfiguration
        fields = ['id', 'webhook_url', 'is_enabled', 'high_risk_threshold', 
                 'risk_increase_threshold', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

class AlertHistorySerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.surname', read_only=True)
    
    class Meta:
        model = AlertHistory
        fields = ['id', 'customer', 'customer_name', 'alert_type', 'message', 
                 'sent_at', 'was_sent', 'error_message']
        read_only_fields = ['sent_at', 'was_sent', 'error_message'] 