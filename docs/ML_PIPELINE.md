# ML Pipeline Documentation

## Overview

The ML pipeline is designed to predict customer churn risk using historical customer data. The pipeline includes data preprocessing, feature engineering, model training, evaluation, and deployment stages.

## Data Pipeline

### Data Sources
- Customer demographic data
- Transaction history
- Product usage metrics
- Customer service interactions
- Account status and history

### Data Preprocessing

1. **Data Cleaning**
   ```python
   def clean_data(df):
       # Handle missing values
       df['age'].fillna(df['age'].median(), inplace=True)
       df['tenure'].fillna(0, inplace=True)
       df['balance'].fillna(0.0, inplace=True)
       
       # Remove duplicates
       df.drop_duplicates(subset=['customer_id'], keep='last', inplace=True)
       
       # Handle outliers using IQR method
       for col in ['age', 'balance', 'salary']:
           Q1 = df[col].quantile(0.25)
           Q3 = df[col].quantile(0.75)
           IQR = Q3 - Q1
           df[col] = df[col].clip(lower=Q1 - 1.5*IQR, upper=Q3 + 1.5*IQR)
       
       return df
   ```

2. **Feature Engineering**
   ```python
   def engineer_features(df):
       # Create derived features
       df['account_age_days'] = (pd.Timestamp.now() - df['created_at']).dt.days
       df['balance_per_product'] = df['balance'] / df['products']
       df['transactions_per_month'] = df['total_transactions'] / df['tenure']
       
       # Encode categorical variables
       categorical_features = ['geography', 'gender', 'card_type']
       df = pd.get_dummies(df, columns=categorical_features)
       
       # Scale numerical features
       numerical_features = ['age', 'tenure', 'balance', 'salary']
       scaler = StandardScaler()
       df[numerical_features] = scaler.fit_transform(df[numerical_features])
       
       return df
   ```

3. **Feature Selection**
   ```python
   def select_features(df):
       # Remove highly correlated features
       correlation_matrix = df.corr().abs()
       upper = correlation_matrix.where(np.triu(np.ones(correlation_matrix.shape), k=1).astype(bool))
       to_drop = [column for column in upper.columns if any(upper[column] > 0.95)]
       df.drop(columns=to_drop, inplace=True)
       
       # Select features using importance scores
       feature_importance = pd.DataFrame({
           'feature': df.columns,
           'importance': model.feature_importances_
       }).sort_values('importance', ascending=False)
       
       top_features = feature_importance['feature'].head(20).tolist()
       return df[top_features]
   ```

## Model Pipeline

### Model Training

1. **Data Split**
   ```python
   def split_data(X, y, test_size=0.2, random_state=42):
       # Split data into train and test sets
       X_train, X_test, y_train, y_test = train_test_split(
           X, y, test_size=test_size, random_state=random_state, stratify=y
       )
       
       # Create validation set from training data
       X_train, X_val, y_train, y_val = train_test_split(
           X_train, y_train, test_size=0.2, random_state=random_state, stratify=y_train
       )
       
       return X_train, X_val, X_test, y_train, y_val, y_test
   ```

2. **Model Configuration**
   ```python
   def configure_model():
       # Define model parameters
       model_params = {
           'n_estimators': 100,
           'max_depth': 10,
           'min_samples_split': 5,
           'min_samples_leaf': 2,
           'random_state': 42
       }
       
       # Initialize model
       model = RandomForestClassifier(**model_params)
       
       return model
   ```

3. **Training Process**
   ```python
   def train_model(model, X_train, y_train, X_val, y_val):
       # Train the model
       model.fit(X_train, y_train)
       
       # Make predictions on validation set
       y_val_pred = model.predict_proba(X_val)[:, 1]
       
       # Calculate validation metrics
       metrics = {
           'accuracy': accuracy_score(y_val, y_val_pred > 0.5),
           'precision': precision_score(y_val, y_val_pred > 0.5),
           'recall': recall_score(y_val, y_val_pred > 0.5),
           'f1': f1_score(y_val, y_val_pred > 0.5),
           'auc_roc': roc_auc_score(y_val, y_val_pred)
       }
       
       return model, metrics
   ```

### Model Evaluation

1. **Performance Metrics**
   ```python
   def evaluate_model(model, X_test, y_test):
       # Make predictions on test set
       y_pred = model.predict_proba(X_test)[:, 1]
       
       # Calculate metrics
       metrics = {
           'accuracy': accuracy_score(y_test, y_pred > 0.5),
           'precision': precision_score(y_test, y_pred > 0.5),
           'recall': recall_score(y_test, y_pred > 0.5),
           'f1': f1_score(y_test, y_pred > 0.5),
           'auc_roc': roc_auc_score(y_test, y_pred)
       }
       
       # Generate confusion matrix
       cm = confusion_matrix(y_test, y_pred > 0.5)
       
       # Calculate feature importance
       feature_importance = pd.DataFrame({
           'feature': X_test.columns,
           'importance': model.feature_importances_
       }).sort_values('importance', ascending=False)
       
       return metrics, cm, feature_importance
   ```

2. **Model Validation**
   ```python
   def validate_model(model, metrics, threshold=0.7):
       # Check if model meets minimum performance requirements
       if (metrics['accuracy'] < threshold or 
           metrics['precision'] < threshold or 
           metrics['recall'] < threshold):
           return False, "Model performance below threshold"
       
       # Check for overfitting
       train_score = model.score(X_train, y_train)
       val_score = model.score(X_val, y_val)
       if train_score - val_score > 0.1:
           return False, "Model shows signs of overfitting"
       
       return True, "Model validation successful"
   ```

### Model Deployment

1. **Model Serialization**
   ```python
   def save_model(model, metrics, version):
       # Create model artifacts directory
       artifacts_dir = f"models/version_{version}"
       os.makedirs(artifacts_dir, exist_ok=True)
       
       # Save model
       model_path = f"{artifacts_dir}/model.pkl"
       with open(model_path, 'wb') as f:
           pickle.dump(model, f)
       
       # Save metrics
       metrics_path = f"{artifacts_dir}/metrics.json"
       with open(metrics_path, 'w') as f:
           json.dump(metrics, f)
       
       # Save feature names
       feature_names_path = f"{artifacts_dir}/feature_names.json"
       with open(feature_names_path, 'w') as f:
           json.dump(list(X_train.columns), f)
       
       return model_path
   ```

2. **Model Loading**
   ```python
   def load_model(version='latest'):
       if version == 'latest':
           # Get latest version
           versions = os.listdir('models')
           version = max(versions)
       
       # Load model
       model_path = f"models/{version}/model.pkl"
       with open(model_path, 'rb') as f:
           model = pickle.load(f)
       
       # Load feature names
       feature_names_path = f"models/{version}/feature_names.json"
       with open(feature_names_path, 'r') as f:
           feature_names = json.load(f)
       
       return model, feature_names
   ```

## Monitoring and Maintenance

### Model Monitoring

1. **Performance Tracking**
   ```python
   def track_model_performance(predictions, actuals):
       # Calculate daily performance metrics
       daily_metrics = {
           'accuracy': accuracy_score(actuals, predictions > 0.5),
           'precision': precision_score(actuals, predictions > 0.5),
           'recall': recall_score(actuals, predictions > 0.5),
           'f1': f1_score(actuals, predictions > 0.5),
           'auc_roc': roc_auc_score(actuals, predictions)
       }
       
       # Log metrics to MLflow
       mlflow.log_metrics(daily_metrics)
       
       return daily_metrics
   ```

2. **Drift Detection**
   ```python
   def detect_drift(reference_data, current_data, threshold=0.1):
       # Calculate distribution statistics
       for feature in reference_data.columns:
           ref_dist = reference_data[feature].describe()
           curr_dist = current_data[feature].describe()
           
           # Calculate KS statistic
           ks_stat = ks_2samp(reference_data[feature], current_data[feature]).statistic
           
           if ks_stat > threshold:
               log_drift_alert(feature, ks_stat)
       
       # Check for feature correlation changes
       ref_corr = reference_data.corr()
       curr_corr = current_data.corr()
       corr_diff = np.abs(ref_corr - curr_corr)
       
       if corr_diff.max().max() > threshold:
           log_drift_alert('correlation', corr_diff.max().max())
   ```

### Model Retraining

1. **Retraining Trigger**
   ```python
   def check_retraining_needed(metrics_history, threshold=0.05):
       # Calculate performance degradation
       recent_metrics = metrics_history[-30:]  # Last 30 days
       performance_slope = np.polyfit(range(30), recent_metrics['f1'], 1)[0]
       
       if performance_slope < -threshold:
           return True, "Performance degradation detected"
       
       # Check data drift
       if detect_drift(reference_data, current_data):
           return True, "Significant data drift detected"
       
       return False, "No retraining needed"
   ```

2. **Automated Retraining**
   ```python
   def retrain_model():
       # Load new training data
       new_data = load_new_data()
       
       # Preprocess data
       processed_data = clean_data(new_data)
       features = engineer_features(processed_data)
       
       # Train new model
       model = configure_model()
       model, metrics = train_model(model, X_train, y_train, X_val, y_val)
       
       # Validate model
       is_valid, message = validate_model(model, metrics)
       
       if is_valid:
           # Save new model
           version = get_next_version()
           save_model(model, metrics, version)
           update_production_model(version)
       
       return is_valid, message
   ```

## MLflow Integration

### Experiment Tracking

1. **Logging Parameters**
   ```python
   def log_experiment(model, params, metrics, artifacts):
       with mlflow.start_run():
           # Log parameters
           mlflow.log_params(params)
           
           # Log metrics
           mlflow.log_metrics(metrics)
           
           # Log model
           mlflow.sklearn.log_model(model, "model")
           
           # Log artifacts
           for name, artifact in artifacts.items():
               mlflow.log_artifact(artifact, name)
   ```

2. **Model Registry**
   ```python
   def register_model(run_id, model_name="churn_predictor"):
       # Register model in MLflow
       result = mlflow.register_model(
           f"runs:/{run_id}/model",
           model_name
       )
       
       # Transition to production if validation passes
       client = mlflow.tracking.MlflowClient()
       client.transition_model_version_stage(
           name=model_name,
           version=result.version,
           stage="Production"
       )
   ``` 