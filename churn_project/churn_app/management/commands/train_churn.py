from django.core.management.base import BaseCommand
from django.conf import settings
import pandas as pd
import numpy as np
import psycopg2
from sklearn.model_selection import train_test_split, GridSearchCV, cross_val_score
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.ensemble import RandomForestClassifier
import joblib
import mlflow
import mlflow.sklearn
from sklearn.metrics import classification_report, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns
import time
import json

class Command(BaseCommand):
    help = "Train churn model from Postgres data with advanced preprocessing and RandomForest."

    def handle(self, *args, **options):
        start_time = time.time()
        
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

        # Store total samples
        total_samples = len(df)

        # 2. Check for missing values and class distribution
        missing_values = df.isnull().sum()
        class_distribution = df['exited'].value_counts().to_dict()
        
        self.stdout.write("\nClass Distribution:")
        self.stdout.write(str(class_distribution))
        
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

        training_samples = len(X_train)
        test_samples = len(X_test)

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
            conf_matrix = confusion_matrix(y_test, y_pred).tolist()
            
            # Perform cross-validation
            cv_scores = cross_val_score(best_rf, X, y, cv=5)
            
            # Calculate feature importance
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
            
            # Calculate training time
            training_time = time.time() - start_time

            # Save all metrics and model data
            model_data = {
                'model': best_rf,
                'scaler': scaler,
                'label_encoder_geo': le_geo,
                'label_encoder_gender': le_gender,
                'features': list(X.columns),
                'numerical_features': numerical_features,
                'categorical_features': categorical_features,
                'feature_importance': feature_importance.to_dict(orient='records'),
                'best_params': grid_search.best_params_,
                
                # Additional metrics
                'train_accuracy': train_accuracy,
                'test_accuracy': test_accuracy,
                'precision_class1': report['1']['precision'],
                'recall_class1': report['1']['recall'],
                'f1_score_class1': report['1']['f1-score'],
                'confusion_matrix': conf_matrix,
                'cross_val_scores': cv_scores.tolist(),
                'total_samples': total_samples,
                'training_samples': training_samples,
                'test_samples': test_samples,
                'training_time': training_time,
                'class_distribution': class_distribution,
                'missing_values': missing_values.to_dict(),
            }
            
            # Log metrics to MLflow
            mlflow.log_metric("train_accuracy", train_accuracy)
            mlflow.log_metric("test_accuracy", test_accuracy)
            mlflow.log_metric("precision_class1", report['1']['precision'])
            mlflow.log_metric("recall_class1", report['1']['recall'])
            mlflow.log_metric("f1_class1", report['1']['f1-score'])
            mlflow.log_metric("training_time", training_time)
            
            # Log artifacts
            mlflow.log_artifact('feature_importance.png')
            mlflow.log_dict(feature_importance.to_dict(orient='records'), "feature_importance.json")
            
            # Log parameters
            mlflow.log_params({
                "model_type": "RandomForestClassifier",
                **grid_search.best_params_,
                "test_size": 0.2,
                "random_state": 42
            })

            # Print detailed report
            self.stdout.write(self.style.SUCCESS(
                f"\nTraining Summary:"
                f"\n----------------"
                f"\nTotal Samples: {total_samples}"
                f"\nTraining Samples: {training_samples}"
                f"\nTest Samples: {test_samples}"
                f"\nTraining Time: {training_time:.2f} seconds"
                f"\n\nClass Distribution:"
                f"\n{json.dumps(class_distribution, indent=2)}"
                f"\n\nBest Parameters:"
                f"\n{json.dumps(grid_search.best_params_, indent=2)}"
                f"\n\nModel Performance:"
                f"\nTrain Accuracy: {train_accuracy:.4f}"
                f"\nTest Accuracy: {test_accuracy:.4f}"
                f"\nPrecision (Churn): {report['1']['precision']:.4f}"
                f"\nRecall (Churn): {report['1']['recall']:.4f}"
                f"\nF1-Score (Churn): {report['1']['f1-score']:.4f}"
                f"\n\nCross-Validation Scores:"
                f"\nMean: {cv_scores.mean():.4f} (+/- {cv_scores.std() * 2:.4f})"
                f"\n\nTop 5 Important Features:"
                f"\n{feature_importance.head().to_string()}"
                f"\n\nConfusion Matrix:"
                f"\n{np.array2string(np.array(conf_matrix))}"
            ))
            
            # Save the model and all data
            joblib.dump(model_data, 'final_model.joblib')
            self.stdout.write(self.style.SUCCESS("\nModel training completed and saved as final_model.joblib"))
