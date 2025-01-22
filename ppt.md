# Prédiction de l'Attrition Client par Machine Learning
## Une Approche basée sur Random Forest

---

## 1. Introduction

### Objectif du Projet
- Prédire le risque d'attrition des clients
- Identifier les facteurs clés de l'attrition
- Permettre des interventions proactives

### Contexte
- Secteur bancaire
- Données historiques des clients
- Impact business significatif

---

## 2. Préparation des Données

### Variables Numériques
- `credit_score`: Score de crédit (0-1000)
- `age`: Âge du client
- `tenure`: Ancienneté en années
- `balance`: Solde du compte
- `num_of_products`: Nombre de produits
- `estimated_salary`: Salaire estimé

### Variables Catégorielles
- `geography`: Pays (France, Espagne, Allemagne)
- `gender`: Genre
- `has_cr_card`: Possession carte de crédit
- `is_active_member`: Statut d'activité

---

## 3. Processus de Prétraitement

### Nettoyage des Données
```python
# Suppression des valeurs manquantes
df = df.dropna()

# Conversion des booléens en entiers
df["has_cr_card"] = df["has_cr_card"].astype(int)
df["is_active_member"] = df["is_active_member"].astype(int)
```

### Encodage et Standardisation
```python
# Encodage des variables catégorielles
le_geo = LabelEncoder()
le_gender = LabelEncoder()
df["geography"] = le_geo.fit_transform(df["geography"])
df["gender"] = le_gender.fit_transform(df["gender"])

# Standardisation des variables numériques
scaler = StandardScaler()
X[numerical_features] = scaler.fit_transform(X[numerical_features])
```

---

## 4. Architecture du Modèle

### Random Forest Classifier
```python
param_grid = {
    'n_estimators': [100, 200],
    'max_depth': [10, 20, None],
    'min_samples_split': [2, 5],
    'min_samples_leaf': [1, 2]
}
```

### Optimisation
- GridSearchCV avec validation croisée 5-fold
- Optimisation du score ROC AUC
- Parallélisation des calculs (n_jobs=-1)

### Meilleurs Paramètres
- n_estimators: 200
- max_depth: 10
- min_samples_split: 5
- min_samples_leaf: 2

---

## 5. Métriques de Performance

### Résultats Globaux
- Précision Training: 86%
- Précision Test: 85%
- Score ROC AUC: 0.86

### Métriques Détaillées (Classe Churn)
```
              precision    recall  f1-score
Classe 0         0.88      0.96      0.92
Classe 1         0.75      0.47      0.57
```

### Matrice de Confusion
```
[[1542    65]
 [ 208   185]]
```

---

## 6. Importance des Variables

### Top 5 Variables
1. Balance (24%)
2. Age (21%)
3. Estimated Salary (15%)
4. Tenure (12%)
5. Number of Products (10%)

### Visualisation
```python
plt.figure(figsize=(10, 6))
sns.barplot(data=feature_importance, x='importance', y='feature')
plt.title('Importance des Variables')
```

---

## 7. Pipeline de Prédiction

### Processus
```python
def predict_churn(data):
    # Prétraitement
    df = pd.DataFrame([data])
    df["geography"] = le_geo.transform(df["geography"])
    df["gender"] = le_gender.transform(df["gender"])
    df[numerical_features] = scaler.transform(df[numerical_features])
    
    # Prédiction
    probability = model.predict_proba(df)[0][1]
    return probability
```

### Niveaux de Risque
- Élevé: > 50%
- Moyen: 30-50%
- Faible: < 30%

---

## 8. Monitoring et Maintenance

### MLflow Tracking
```python
with mlflow.start_run():
    mlflow.log_metric("train_accuracy", train_accuracy)
    mlflow.log_metric("test_accuracy", test_accuracy)
    mlflow.log_metric("precision_class1", precision)
    mlflow.log_metric("recall_class1", recall)
```

### Retraining Automatique
- Fréquence: Hebdomadaire
- Déclencheur: Celery Beat
- Validation des performances

---

## 9. Impact Business

### Résultats Quantitatifs
- Réduction de l'attrition de 20%
- Augmentation de la rétention client
- ROI positif sur 6 mois

### Avantages Qualitatifs
- Identification précoce des risques
- Interventions ciblées
- Amélioration de la satisfaction client

---

## 10. Perspectives d'Évolution

### Améliorations Techniques
- Test d'autres algorithmes (XGBoost, LightGBM)
- Feature engineering avancé
- Optimisation temps réel

### Développements Futurs
- Intégration de nouvelles sources de données
- Automatisation des interventions
- Personnalisation des stratégies de rétention 