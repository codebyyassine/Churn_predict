from django.core.management.base import BaseCommand
from django.conf import settings
import pandas as pd
import numpy as np
import psycopg2
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.linear_model import LogisticRegression
import pickle
import mlflow
import mlflow.sklearn
from sklearn.metrics import classification_report, confusion_matrix

class Command(BaseCommand):
    help = "Train churn model from Postgres data with basic cleaning."

    def handle(self, *args, **options):
        # 1. Connect to DB and load data into DataFrame
        conn = psycopg2.connect(
            host=settings.DATABASES['default']['HOST'],
            database=settings.DATABASES['default']['NAME'],
            user=settings.DATABASES['default']['USER'],
            password=settings.DATABASES['default']['PASSWORD'],
            port=settings.DATABASES['default']['PORT']
        )
        query = "SELECT * FROM customer_churn;"
        df = pd.read_sql(query, conn)
        conn.close()

        # 2. Basic Data Cleaning

        # a) Drop columns that are not predictive or duplicated
        drop_cols = ["id", "row_number", "customer_id", "surname"]
        for col in drop_cols:
            if col in df.columns:
                df.drop(col, axis=1, inplace=True)

        # b) Handle missing values
        df.fillna({
            "credit_score": df["credit_score"].median() if "credit_score" in df.columns else 0,
            "geography": "Unknown",
            "gender": "Unknown",
            "age": df["age"].median() if "age" in df.columns else 0,
            "tenure": df["tenure"].median() if "tenure" in df.columns else 0,
            "balance": df["balance"].median() if "balance" in df.columns else 0,
            "num_of_products": df["num_of_products"].median() if "num_of_products" in df.columns else 0,
            "has_cr_card": False,
            "is_active_member": False,
            "estimated_salary": df["estimated_salary"].median() if "estimated_salary" in df.columns else 0,
            "exited": False
        }, inplace=True)

        # c) Convert boolean-like columns
        if "has_cr_card" in df.columns:
            df["has_cr_card"] = df["has_cr_card"].astype(int)
        if "is_active_member" in df.columns:
            df["is_active_member"] = df["is_active_member"].astype(int)
        if "exited" in df.columns:
            df["exited"] = df["exited"].astype(int)

        # d) Separate numerical and categorical features
        numerical_features = [
            "credit_score", "age", "tenure", "balance", 
            "num_of_products", "has_cr_card", "is_active_member", 
            "estimated_salary"
        ]
        categorical_features = ["geography", "gender"]

        # e) Encode categorical features
        le_geo = LabelEncoder()
        le_gender = LabelEncoder()
        
        if "geography" in df.columns:
            df["geography"] = le_geo.fit_transform(df["geography"])
        if "gender" in df.columns:
            df["gender"] = le_gender.fit_transform(df["gender"])

        # 3. Separate features and target
        if "exited" not in df.columns:
            self.stdout.write(self.style.ERROR("No 'exited' column found in data."))
            return

        X = df.drop("exited", axis=1)
        y = df["exited"]

        # 4. Scale numerical features only
        scaler = StandardScaler()
        X[numerical_features] = scaler.fit_transform(X[numerical_features])

        # 5. Split into train/test
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        # Before model training, set up MLflow
        mlflow.set_experiment("Churn_Prediction")
        
        with mlflow.start_run():
            # Train model with balanced class weights
            model = LogisticRegression(
                random_state=42,
                class_weight='balanced',
                max_iter=1000,
                C=0.1  # Increase regularization
            )
            model.fit(X_train, y_train)

            # Evaluate and log metrics
            train_accuracy = model.score(X_train, y_train)
            test_accuracy = model.score(X_test, y_test)
            
            # Get predictions
            y_pred = model.predict(X_test)
            
            # Calculate and log detailed metrics
            report = classification_report(y_test, y_pred, output_dict=True)
            conf_matrix = confusion_matrix(y_test, y_pred)
            
            # Log metrics
            mlflow.log_metric("train_accuracy", train_accuracy)
            mlflow.log_metric("test_accuracy", test_accuracy)
            mlflow.log_metric("precision_class1", report['1']['precision'])
            mlflow.log_metric("recall_class1", report['1']['recall'])
            mlflow.log_metric("f1_class1", report['1']['f1-score'])
            
            # Calculate and log feature importance
            feature_importance = pd.DataFrame({
                'feature': X.columns,
                'importance': np.abs(model.coef_[0])
            })
            feature_importance = feature_importance.sort_values('importance', ascending=False)
            
            # Log feature importance
            mlflow.log_dict(
                feature_importance.to_dict(orient='records'),
                "feature_importance.json"
            )

            self.stdout.write(self.style.SUCCESS(
                f"\nModel Performance:\n"
                f"Train Accuracy: {train_accuracy:.4f}\n"
                f"Test Accuracy: {test_accuracy:.4f}\n"
                f"Precision (Churn): {report['1']['precision']:.4f}\n"
                f"Recall (Churn): {report['1']['recall']:.4f}\n"
                f"F1-Score (Churn): {report['1']['f1-score']:.4f}\n"
                f"\nTop 5 Important Features:\n"
                f"{feature_importance.head().to_string()}"
            ))

            # Log model to MLflow
            mlflow.sklearn.log_model(model, "churn_model")

            # Log important parameters
            mlflow.log_params({
                "model_type": "LogisticRegression",
                "class_weight": "balanced",
                "max_iter": 1000,
                "C": 0.1,
                "test_size": 0.2,
                "random_state": 42
            })

        # Save the pipeline
        with open("churn_model.pkl", "wb") as f:
            pickle.dump(
                {
                    "model": model,
                    "scaler": scaler,
                    "label_encoder_geo": le_geo,
                    "label_encoder_gender": le_gender,
                    "features": list(X.columns),
                    "numerical_features": numerical_features,
                    "categorical_features": categorical_features,
                    "feature_importance": feature_importance.to_dict(orient='records')
                },
                f
            )

        self.stdout.write(self.style.SUCCESS("Model training completed and saved as churn_model.pkl"))
