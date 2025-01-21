from django.core.management.base import BaseCommand
from django.conf import settings
import pandas as pd
import numpy as np
import psycopg2
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.ensemble import RandomForestClassifier
import joblib
import mlflow
import mlflow.sklearn
from sklearn.metrics import classification_report, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns

class Command(BaseCommand):
    help = "Train churn model from Postgres data with advanced preprocessing and RandomForest."

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

        # 2. Check for missing values
        missing_values = df.isnull().sum()
        self.stdout.write("\nMissing Values:")
        self.stdout.write(str(missing_values))

        # Drop rows with missing values
        df = df.dropna()
        self.stdout.write(f"\nRows after dropping missing values: {len(df)}")

        # 3. Remove unnecessary columns
        drop_cols = ["id", "row_number", "customer_id", "surname"]
        for col in drop_cols:
            if col in df.columns:
                df.drop(col, axis=1, inplace=True)

        # 4. Convert boolean-like columns to integers
        if "has_cr_card" in df.columns:
            df["has_cr_card"] = df["has_cr_card"].astype(int)
        if "is_active_member" in df.columns:
            df["is_active_member"] = df["is_active_member"].astype(int)
        if "exited" in df.columns:
            df["exited"] = df["exited"].astype(int)

        # 5. Separate numerical and categorical features
        numerical_features = [
            "credit_score", "age", "tenure", "balance", 
            "num_of_products", "has_cr_card", "is_active_member", 
            "estimated_salary"
        ]
        categorical_features = ["geography", "gender"]

        # 6. Encode categorical features
        le_geo = LabelEncoder()
        le_gender = LabelEncoder()
        
        if "geography" in df.columns:
            df["geography"] = le_geo.fit_transform(df["geography"])
        if "gender" in df.columns:
            df["gender"] = le_gender.fit_transform(df["gender"])

        # 7. Separate features and target
        if "exited" not in df.columns:
            self.stdout.write(self.style.ERROR("No 'exited' column found in data."))
            return

        X = df.drop("exited", axis=1)
        y = df["exited"]

        # 8. Scale numerical features
        scaler = StandardScaler()
        X[numerical_features] = scaler.fit_transform(X[numerical_features])

        # 9. Split into train/test
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        # Set up MLflow
        mlflow.set_experiment("Churn_Prediction")
        
        with mlflow.start_run():
            # 10. Define parameter grid for RandomForest
            param_grid = {
                'n_estimators': [100, 200],
                'max_depth': [10, 20, None],
                'min_samples_split': [2, 5],
                'min_samples_leaf': [1, 2]
            }

            # 11. Perform GridSearch
            grid_search = GridSearchCV(
                RandomForestClassifier(random_state=42),
                param_grid,
                cv=5,
                scoring='roc_auc',
                n_jobs=-1
            )

            grid_search.fit(X_train, y_train)
            
            # Get best model
            best_rf = grid_search.best_estimator_
            
            # Make predictions
            y_pred = best_rf.predict(X_test)
            
            # Calculate metrics
            train_accuracy = best_rf.score(X_train, y_train)
            test_accuracy = best_rf.score(X_test, y_test)
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
                'importance': best_rf.feature_importances_
            }).sort_values('importance', ascending=False)
            
            # Create feature importance plot
            plt.figure(figsize=(10, 6))
            sns.barplot(data=feature_importance, x='importance', y='feature')
            plt.title('Feature Importance')
            plt.tight_layout()
            plt.savefig('feature_importance.png')
            mlflow.log_artifact('feature_importance.png')
            
            # Log feature importance
            mlflow.log_dict(
                feature_importance.to_dict(orient='records'),
                "feature_importance.json"
            )

            self.stdout.write(self.style.SUCCESS(
                f"\nBest Parameters: {grid_search.best_params_}\n"
                f"Best Cross-validation Score: {grid_search.best_score_:.4f}\n"
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
            mlflow.sklearn.log_model(best_rf, "churn_model")

            # Log parameters
            mlflow.log_params({
                "model_type": "RandomForestClassifier",
                **grid_search.best_params_,
                "test_size": 0.2,
                "random_state": 42
            })

        # Save the model and preprocessing objects
        model_data = {
            'model': best_rf,
            'scaler': scaler,
            'label_encoder_geo': le_geo,
            'label_encoder_gender': le_gender,
            'features': list(X.columns),
            'numerical_features': numerical_features,
            'categorical_features': categorical_features,
            'feature_importance': feature_importance.to_dict(orient='records'),
            'best_params': grid_search.best_params_
        }
        
        joblib.dump(model_data, 'final_model.joblib')
        self.stdout.write(self.style.SUCCESS("Model training completed and saved as final_model.joblib"))
