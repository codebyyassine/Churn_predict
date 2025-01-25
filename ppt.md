---
marp: true
theme: default
paginate: true
backgroundColor: #fff
style: |
  section {
    font-family: 'Arial', sans-serif;
  }
  h1 {
    color: #2c3e50;
    font-size: 2em;
  }
  h2 {
    color: #34495e;
    border-bottom: 2px solid #3498db;
  }
  h3 {
  color: #3498db;
  /* text-align: center; */
  }
  code {
    background: #f8f9fa;
    border-radius: 4px;
  }
  .columns {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
  }
  .title-page {
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
    padding: 2em;
  }
  .title-content {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 2em;
  }
  .title-main {
    margin-top: 2.3em;
    font-size: 1.6em;
    font-weight: bold;
    margin-bottom: 1em;
    text-align: center;
  }
  .title-info {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-top: 2em;
  }
  .title-left {
    text-align: left;
  }
  .title-right {
    text-align: right;
  }
  .title-year {
    text-align: center;
    margin-top: 2.5em;
    font-size: 1em;
  }
---

<!-- _class: title-page -->

<div class="title-content">
<div class="title-main">

**Module**: Data Science

**Sujet**: Système de Prédiction d'Attrition Client

</div>

<div class="title-info">
<div class="title-left">

**Réalisé par**: Yassine Erritouni

</div>
<div class="title-right">

**Professeur**: Mr EL RHARRAS

</div>
</div>
</div>

<div class="title-year">

**Année Universitaire**:  2024/2025

</div>

---

<!-- _header: Sommaire -->
<style scoped>
section {
  font-size: 2em;
}
h2 {
  font-size: 2em;
}
</style>

## Table des Matières

<div class="columns">

<div>

1) Introduction et Définition du Problème

2) Technologies et Outils

3) Planning du Projet

</div>

<div>

4) Aperçu des Données

5) Implémentation

6) Mise en Production

</div>

</div>

---
<!-- _header: Définition du Problème -->
## 1) Introduction et Définition du Problème

<div class="columns">

<div>

### 1.1 Enjeu Business
- Taux élevé d'attrition client dans le secteur bancaire
- Nécessité d'une intervention proactive
- Impact sur le revenu et la croissance

</div>

<div>

### 1.2 Objectifs du Projet
- Prédire la probabilité d'attrition des clients
- Identifier les facteurs clés d'attrition
- Permettre des stratégies de rétention proactives
- Fournir un système de surveillance en temps réel

</div>

</div>

---
<!-- _header: Technologies - Backend -->
<style scoped>
h2, h3 {
  margin-top: 0;
  margin-bottom: 0.5em;
}
.tech-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.tech-content {
  flex-grow: 1;
}
.tech-image {
  text-align: center;
  margin-top: auto;
  display: flex;
  justify-content: space-around;
  align-items: center;
}
</style>

<div class="tech-container">
<div class="tech-content">

## 2) Technologies et Outils
### 2.1 Stack Backend

### 🐍 Python & Machine Learning
- **Python** - Langage principal
- **Scikit-learn** - Modélisation ML
- **Pandas** - Manipulation des données
- **Matplotlib** - Visualisation

</div>
<div class="tech-image">

![Python & ML Stack height:150px](https://python.org/static/community_logos/python-logo-generic.svg)

</div>
</div>

---

<!-- _header: Technologies - Backend -->
<style scoped>
.tech-image {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-around;
  gap: 1rem;
}
.tech-image img {
  height: 100px;
  width: 100px;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
}

</style>

<div class="tech-container">
<div class="tech-content">

<div class="columns">

<div>

### 🔧 Infrastructure
- **Django** - API Backend
- **PostgreSQL** - Base de données
- **Docker** - Conteneurisation

</div>

<div>

### 🛠️ Outils de Développement
- **Git** - Contrôle de version
- **VS Code** - IDE
- **Jupyter** - Notebooks

</div>

</div>

</div>
<div class="tech-image">

![Django height:80px](https://static.djangoproject.com/img/logos/django-logo-negative.png)
![PostgreSQL height:80px](https://www.postgresql.org/media/img/about/press/elephant.png)
![Docker height:80px](https://www.docker.com/wp-content/uploads/2022/03/vertical-logo-monochromatic.png)

</div>
</div>

---

<!-- _header: Technologies - Frontend -->
### 2.2 Stack Frontend

<style scoped>
h2, h3 {
  margin-top: 0;
  margin-bottom: 0.5em;
}
.tech-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.tech-content {
  flex-grow: 1;
}
.tech-image {
  text-align: center;
  margin-top: auto;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
}
</style>

<div class="tech-container">
<div class="tech-content">

<div class="columns">

<div>

### 🎨 Interface Utilisateur
- **Next.js** - Framework UI
- **Tailwind CSS** - Composants design
- **Chart.js** - Visualisations

</div>

<div>

### 🧰 Outils de Développement
- **npm** - Gestionnaire de paquets
- **ESLint** - Linting

</div>

</div>

</div>
<div class="tech-image">

![Next.js height:80px](https://seeklogo.com/images/N/next-js-logo-8FCFF51DD2-seeklogo.com.png)
![Tailwind height:80px](https://cdnblog.webkul.com/blog/wp-content/uploads/2024/05/tailwindcss-1633184775.webp)
![Chart.js height:80px](https://www.chartjs.org/img/chartjs-logo.svg)

</div>
</div>

---

<!-- _header: Chronologie du Projet -->
## 3) Planning du project
1) Phase d'Initiation
   - Definir le sujet
   - Recherche sur le sujet et trouver des sources de données
   - Analyse des besoins

2) Phase de Développement
   - Collecte et préparation des données
   - Développement du modèle ML
   - Création de l'API

3) Phase de Production
   - Tests et Déploiement
---


<!-- _header: Aperçu des Données  -->
## 4) Aperçu des Données
### 4.1 Structure et Variables Clés
### 4.1.1 Source des Données
- Dataset d'Attrition Clients Bancaires
- 10 000 enregistrements clients
- Données historiques comportementales et démographiques

### 4.1.2 Variables Clés
- Données démographiques (âge, genre, localisation)
- Informations bancaires (solde, produits, ancienneté)
- Comportement client (activité, carte de crédit)
- Variable cible : Attrition (0/1)

---

<!-- _header: Aperçu des Données -->
### 4.1.3 Structure du Dataset

<style scoped>
table {
  font-size: 0.7em;
  margin-left: auto;
  margin-right: auto;
  /* width: 90%; */
}
</style>

| CustomerId | Surname | CreditScore | Geography | Gender | Age | Tenure | Balance | NProducts | NCard | isActive | EstimatedSalary | Exited |
|------------|---------|-------------|-----------|--------|-----|---------|----------|-----------|-----------|----------------|-----------------|--------|
| 15634602 | Hargrave | 619 | France | Female | 42 | 2 | 0.00 | 1 | 1 | 1 | 101348.88 | 1 |
| 15647311 | Hill | 608 | Spain | Female | 41 | 1 | 83807.86 | 1 | 0 | 1 | 112542.58 | 0 |
| 15619304 | Onio | 502 | France | Female | 42 | 8 | 159660.80 | 3 | 1 | 0 | 113931.57 | 1 |
| 15701354 | Boni | 699 | France | Female | 39 | 1 | 0.00 | 2 | 0 | 0 | 93826.63 | 0 |
| 15737888 | Mitchell | 850 | Spain | Female | 43 | 2 | 125510.82 | 1 | 1 | 1 | 79084.10 | 0 |

### 4.1.4 Statistiques Clés
- Âge moyen : 38.9 ans
- Solde moyen : 76,485 €
- Taux d'attrition : 20.4%

---

<!-- _header: Aperçu des Données -->
<style scoped>
table {
  margin-left: auto;
  margin-right: auto;
  width: 90%;
  
}
</style>

### 4.1.5 Variables du Dataset

| Données Démographiques | Informations Bancaires |
|:----------------------|:----------------------|
| - `customer_id`: Identifiant unique | - `tenure`: Années d'ancienneté |
| - `credit_score`: Score de crédit | - `balance`: Solde du compte |
| - `age`: Âge du client | - `num_of_products`: Nombre de produits |
| - `gender`: Genre du client | - `has_cr_card`: Carte de crédit (0/1) |
| - `geography`: Localisation du client | - `is_active_member`: Statut d'activité |

---

<!-- _header: Analyse Exploratoire - Insights -->
### 4.2 Analyse Exploratoire
### 4.2.1 Insights Clés
- **Profil d'Âge**
  - Range: 18-92 ans
  - Moyenne: 38 ans
  - Plus haut risque: >45 ans

- **Comportement Financier**
  - Solde moyen: 76,485 €
  - 60% ont une carte de crédit
  - 51% sont membres actifs

---

<!-- _header: Analyse Exploratoire - Patterns -->
### 4.2.3 Facteurs de Risque et Patterns d'Attrition
- Clients plus âgés
- Comptes à solde élevé
- Membres inactifs
- Faible nombre de produits

 Distribution
```python
plt.figure(figsize=(10, 6))
sns.histplot(data=df, x='age', hue='exited')
plt.title('Distribution de l\'Âge par Statut d\'Attrition')
```

---

<!-- _header: Prétraitement - Pipeline -->
## 5) Implémentation
### 5.1 Pipeline et Prétraitement
1. Suppression des colonnes non nécessaires
2. Gestion des valeurs manquantes
3. Conversion des types de données
4. Encodage des variables catégorielles
5. Normalisation des variables numériques

---

<!-- _header: Prétraitement - Implémentation -->
### 5.1.1 Nettoyage des Données
```python
def prepare_data(df):
    # Suppression des colonnes non nécessaires
    drop_cols = ["id", "row_number", "customer_id", "surname"]
    df = df.drop(columns=drop_cols)
    
    # Gestion des valeurs manquantes
    df = df.dropna()
    return df
```
---
<!-- _header: Prétraitement - Implémentation -->

### 5.1.2 Features Engineering
```python
numerical_features = [
    "credit_score", "age", "tenure", "balance", 
    "num_of_products", "has_cr_card"
]
categorical_features = ["geography", "gender"]
```

---

<!-- _header: Développement du Modèle - Configuration -->
## 5.2 Développement du Modèle

### 5.2.1 Configuration de la Recherche
```python
# Configuration de la grille de paramètres
param_grid = {
    'n_estimators': [100, 200],
    'max_depth': [10, 20, None],
    'min_samples_split': [2, 5],
    'min_samples_leaf': [1, 2]
}
```
---
<!-- _header: Développement du Modèle - Configuration -->

### 5.2.2 Initialisation de la Recherche
```python
# Recherche par grille avec validation croisée
grid_search = GridSearchCV(
    RandomForestClassifier(random_state=42),
    param_grid,
    cv=5,
    scoring='roc_auc',
    n_jobs=-1
)
```

---

<!-- _header: Développement du Modèle - Entraînement -->

### 5.2.3 Entraînement du Modèle
```python
# Entraînement avec la meilleure configuration
grid_search.fit(X_train, y_train)
best_model = grid_search.best_estimator_

# Validation croisée
cv_scores = cross_val_score(best_model, X, y, cv=5)
```

### 5.2.4 Prédictions
```python
# Génération des prédictions
y_pred = best_model.predict(X_test)
y_proba = best_model.predict_proba(X_test)
```

---

<!-- _header: Évaluation du Modèle - Métriques -->
## 5.3 Analyse des Résultats

### 5.3.1 Calcul des Métriques
```python
# Calcul des scores de base
train_accuracy = best_model.score(X_train, y_train)
test_accuracy = best_model.score(X_test, y_test)

# Rapport détaillé
report = classification_report(y_test, y_pred)
conf_matrix = confusion_matrix(y_test, y_pred)
```

---

<!-- _header: Évaluation du Modèle - Résultats -->

### 5.3.2 Affichage des Métriques
```python
metrics_data = {
    'train_accuracy': float(train_accuracy),
    'test_accuracy': float(test_accuracy),
    'precision_class1': float(report['1']['precision']),
    'recall_class1': float(report['1']['recall']),
    'f1_class1': float(report['1']['f1-score'])
}

print(f"Précision Entraînement : {train_accuracy:.4f}")
print(f"Précision Test : {test_accuracy:.4f}")
print(f"Score CV moyen : {cv_scores.mean():.4f}")
```

---

<!-- _header: Analyse des Variables -->
### 5.3.3 Importance des Features
```python
feature_importance = pd.DataFrame({
    'feature': X.columns,
    'importance': best_model.feature_importances_
}).sort_values('importance', ascending=False)

plt.figure(figsize=(10, 6))
sns.barplot(data=feature_importance, x='importance', y='feature')
plt.title('Importance des Variables')
```

---

<!-- _header: Système de Sauvegarde - Structure -->
## 6) Mise en Production

### 6.1 Structure des Composants
```python
model_components = {
    'model': model,
    'scaler': scaler,
    'label_encoders': {
        'geography': le_geo,
        'gender': le_gender
    },
    'features': list(X.columns),
    'numerical_features': numerical_features,
    'categorical_features': categorical_features
}
```

---

<!-- _header: Système de Sauvegarde - Implémentation -->

### 6.2 Fonction de Sauvegarde
```python
def save_model(model, is_best=False):
    # Sauvegarde du dernier modèle
    joblib.dump(model_components, 'latest_model.joblib')
    
    # Si meilleur modèle, mise à jour
    if is_best:
        joblib.dump(model_components, 'best_model.joblib')
```

---

<!-- _header: Production - Surveillance -->
## 6.2 Système de Production

### 6.2.1 Configuration Celery
```python
# Configuration des tâches périodiques
app.conf.beat_schedule = {
    'monitor-customer-churn': {
        'task': 'churn_app.tasks.monitor_customer_churn',
        'schedule': 3600.0,  # Horaire
    },
}
```
---
<!-- _header: Production - Surveillance -->

### 6.2.2 Tâche de Surveillance
```python
@app.task
def monitor_customer_churn():
    # Chargement du modèle
    model_components = load_model('best_model.joblib')
    # Analyse des clients
    high_risk_customers = identify_high_risk_customers()
```

---

<!-- _header: Production - Alertes -->
## 6.3 Configuration des Alertes

### 6.3.1 Paramètres Discord
```python
DISCORD_ALERTS = {
    'HIGH_RISK_THRESHOLD': 0.7,
    'RISK_INCREASE_THRESHOLD': 20.0,
    'ENABLED': True,
    'WEBHOOK_URL': os.getenv('DISCORD_WEBHOOK_URL')
}
```

---

<!-- _header: Production - Alertes -->
### 6.3.2 Fonction d'Alerte
```python
def send_discord_alert(customer, probability):
    message = {
        "embeds": [{
            "title": "🚨 Alerte Client",
            "color": 15158332,
            "fields": [
                {"name": "ID Client", "value": str(customer.id)},
                {"name": "Probabilité d'Attrition", 
                 "value": f"{probability:.2%}"},
                {"name": "Facteurs de Risque", 
                 "value": get_risk_factors(customer)}
            ]
        }]
    }
    send_webhook(DISCORD_ALERTS['WEBHOOK_URL'], message)
```

---

<!-- _class: lead -->
<!-- _footer: "Projet Data Science - 2024" -->
## Merci de votre attention !

Questions & Discussion