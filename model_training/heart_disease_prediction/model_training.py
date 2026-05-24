"""

Models tested:
    1. Logistic Regression
    2. Random Forest
    3. Support Vector Machine (SVM)
    4. K-Nearest Neighbors (KNN)
    5. Gradient Boosting
    6. Neural Network (MLPClassifier)

Evaluation:
    - Stratified 5-fold cross-validation
    - Metrics: Accuracy, Precision, Recall, F1, ROC-AUC
    - Final holdout test set evaluation for the best model
    - Exports best model to backend/final_models/heart_model.pkl
"""

import pickle
import warnings
import numpy as np
import pandas as pd
import matplotlib
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.model_selection import (
    train_test_split, StratifiedKFold, cross_validate
)
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, classification_report, confusion_matrix, roc_curve
)

from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.neural_network import MLPClassifier

from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent
REPO_ROOT = BASE_DIR.parent.parent  # IHI-Group-21/
OUT_DIR = str(BASE_DIR / "outputs")
MODEL_DIR = str(REPO_ROOT / "backend" / "final_models")


# 1. DATA PREPARATION
print("=" * 70)
print("HEART DISEASE MODEL COMPARISON")
print("=" * 70)

df = pd.read_csv(str(BASE_DIR / "heart.csv"))
df = df.drop_duplicates()
print(f"\nDataset after dropping duplicates: {df.shape[0]} rows x {df.shape[1]} columns")

X = df.drop("target", axis=1)
y = df["target"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
print(f"Train set: {X_train.shape[0]} samples")
print(f"Test set:  {X_test.shape[0]} samples")
print(f"Train target distribution: {dict(y_train.value_counts())}")
print(f"Test  target distribution: {dict(y_test.value_counts())}")


# 2. MODEL DEFINITIONS
models = {
    "Logistic Regression": Pipeline([
        ("scaler", StandardScaler()),
        ("clf", LogisticRegression(max_iter=1000, random_state=42)),
    ]),
    "Random Forest": Pipeline([
        ("scaler", StandardScaler()),
        ("clf", RandomForestClassifier(
            n_estimators=200, max_depth=10, random_state=42
        )),
    ]),
    "SVM (RBF)": Pipeline([
        ("scaler", StandardScaler()),
        ("clf", SVC(kernel="rbf", probability=True, random_state=42)),
    ]),
    "KNN (k=7)": Pipeline([
        ("scaler", StandardScaler()),
        ("clf", KNeighborsClassifier(n_neighbors=7)),
    ]),
    "Gradient Boosting": Pipeline([
        ("scaler", StandardScaler()),
        ("clf", GradientBoostingClassifier(
            n_estimators=200, learning_rate=0.1, max_depth=4, random_state=42
        )),
    ]),
    "Neural Network (MLP)": Pipeline([
        ("scaler", StandardScaler()),
        ("clf", MLPClassifier(
            hidden_layer_sizes=(64, 32, 16),
            activation="relu",
            solver="adam",
            max_iter=500,
            early_stopping=True,
            validation_fraction=0.15,
            random_state=42,
        )),
    ]),
}

# 3. CROSS-VALIDATION COMPARISON
print("\n" + "=" * 70)
print("STRATIFIED 5-FOLD CROSS-VALIDATION RESULTS")
print("=" * 70)

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
scoring = ["accuracy", "precision", "recall", "f1", "roc_auc"]

results = {}
for name, pipeline in models.items():
    cv_results = cross_validate(
        pipeline, X_train, y_train, cv=cv,
        scoring=scoring, return_train_score=False
    )
    results[name] = {
        "Accuracy":  cv_results["test_accuracy"],
        "Precision": cv_results["test_precision"],
        "Recall":    cv_results["test_recall"],
        "F1":        cv_results["test_f1"],
        "ROC-AUC":   cv_results["test_roc_auc"],
    }

print(f"\n{'Model':<25s} {'Accuracy':>10s} {'Precision':>10s} {'Recall':>10s} {'F1':>10s} {'ROC-AUC':>10s}")
print("-" * 75)

best_model_name = None
best_f1 = 0

for name, metrics in results.items():
    acc  = np.mean(metrics["Accuracy"])
    prec = np.mean(metrics["Precision"])
    rec  = np.mean(metrics["Recall"])
    f1   = np.mean(metrics["F1"])
    auc  = np.mean(metrics["ROC-AUC"])

    print(f"{name:<25s} {acc:>9.3f}  {prec:>9.3f}  {rec:>9.3f}  {f1:>9.3f}  {auc:>9.3f}")

    if f1 > best_f1:
        best_f1 = f1
        best_model_name = name

print("-" * 75)
print(f"\nBest model by mean CV F1: {best_model_name} (F1 = {best_f1:.3f})")

print(f"\n{'Model':<25s} {'Acc std':>10s} {'Prec std':>10s} {'Rec std':>10s} {'F1 std':>10s} {'AUC std':>10s}")
print("-" * 75)
for name, metrics in results.items():
    print(f"{name:<25s} "
          f"{np.std(metrics['Accuracy']):>9.3f}  "
          f"{np.std(metrics['Precision']):>9.3f}  "
          f"{np.std(metrics['Recall']):>9.3f}  "
          f"{np.std(metrics['F1']):>9.3f}  "
          f"{np.std(metrics['ROC-AUC']):>9.3f}")


# 4. HOLDOUT TEST SET - BEST MODEL
print("\n" + "=" * 70)
print(f"HOLDOUT TEST SET EVALUATION: {best_model_name}")
print("=" * 70)

best_pipeline = models[best_model_name]
best_pipeline.fit(X_train, y_train)
y_pred = best_pipeline.predict(X_test)
y_proba = best_pipeline.predict_proba(X_test)[:, 1]

print(f"\nAccuracy:  {accuracy_score(y_test, y_pred):.3f}")
print(f"Precision: {precision_score(y_test, y_pred):.3f}")
print(f"Recall:    {recall_score(y_test, y_pred):.3f}")
print(f"F1 Score:  {f1_score(y_test, y_pred):.3f}")
print(f"ROC-AUC:   {roc_auc_score(y_test, y_proba):.3f}")

print(f"\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=["No Disease", "Disease"]))


# 5. ALL MODELS - HOLDOUT
print("=" * 70)
print("ALL MODELS - HOLDOUT TEST SET RESULTS")
print("=" * 70)
print(f"\n{'Model':<25s} {'Accuracy':>10s} {'F1':>10s} {'ROC-AUC':>10s}")
print("-" * 55)

holdout_results = {}
for name, pipeline in models.items():
    pipeline.fit(X_train, y_train)
    yp = pipeline.predict(X_test)
    ypr = pipeline.predict_proba(X_test)[:, 1]
    holdout_results[name] = {
        "accuracy": accuracy_score(y_test, yp),
        "f1": f1_score(y_test, yp),
        "roc_auc": roc_auc_score(y_test, ypr),
        "y_pred": yp,
        "y_proba": ypr,
    }
    print(f"{name:<25s} {holdout_results[name]['accuracy']:>9.3f}  "
          f"{holdout_results[name]['f1']:>9.3f}  "
          f"{holdout_results[name]['roc_auc']:>9.3f}")


# 6. PLOTS
colors = ["#3498db", "#2ecc71", "#e74c3c", "#f39c12", "#9b59b6", "#1abc9c"]

# 6a. CV F1 boxplot
fig, ax = plt.subplots(figsize=(10, 5))
f1_data = [results[name]["F1"] for name in results]
bp = ax.boxplot(f1_data, labels=list(results.keys()), patch_artist=True)
for patch, color in zip(bp["boxes"], colors):
    patch.set_facecolor(color)
    patch.set_alpha(0.7)
ax.set_title("5-Fold Cross-Validation F1 Scores by Model")
ax.set_ylabel("F1 Score")
ax.tick_params(axis="x", rotation=15)
plt.tight_layout()
fig.savefig(f"{OUT_DIR}/cv_f1_boxplot.png", dpi=150)
plt.close()

# 6b. ROC curves
fig, ax = plt.subplots(figsize=(8, 6))
for i, (name, res) in enumerate(holdout_results.items()):
    fpr, tpr, _ = roc_curve(y_test, res["y_proba"])
    ax.plot(fpr, tpr, label=f"{name} (AUC={res['roc_auc']:.3f})", color=colors[i])
ax.plot([0, 1], [0, 1], "k--", alpha=0.4, label="Random")
ax.set_xlabel("False Positive Rate")
ax.set_ylabel("True Positive Rate")
ax.set_title("ROC Curves - Holdout Test Set")
ax.legend(loc="lower right", fontsize=8)
plt.tight_layout()
fig.savefig(f"{OUT_DIR}/roc_curves.png", dpi=150)
plt.close()

# 6c. Confusion matrix for best model
fig, ax = plt.subplots(figsize=(6, 5))
cm = confusion_matrix(y_test, holdout_results[best_model_name]["y_pred"])
sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
            xticklabels=["No Disease", "Disease"],
            yticklabels=["No Disease", "Disease"], ax=ax)
ax.set_xlabel("Predicted")
ax.set_ylabel("Actual")
ax.set_title(f"Confusion Matrix - {best_model_name}")
plt.tight_layout()
fig.savefig(f"{OUT_DIR}/confusion_matrix_best.png", dpi=150)
plt.close()

# 6d. Metric comparison bar chart
fig, ax = plt.subplots(figsize=(12, 5))
metric_names = ["accuracy", "f1", "roc_auc"]
x = np.arange(len(holdout_results))
width = 0.25
for i, metric in enumerate(metric_names):
    vals = [holdout_results[name][metric] for name in holdout_results]
    ax.bar(x + i * width, vals, width, label=metric.upper(), alpha=0.8)
ax.set_xticks(x + width)
ax.set_xticklabels(list(holdout_results.keys()), rotation=15, ha="right")
ax.set_ylabel("Score")
ax.set_title("Holdout Test Set - Model Comparison")
ax.legend()
ax.set_ylim(0.5, 1.0)
plt.tight_layout()
fig.savefig(f"{OUT_DIR}/model_comparison_bar.png", dpi=150)
plt.close()

print(f"\nPlots saved to {OUT_DIR}/")

# 7. EXPORT BEST MODEL
best_pipeline.fit(X_train, y_train)
model_path = f"{MODEL_DIR}/heart_model.pkl"
with open(model_path, "wb") as f:
    pickle.dump(best_pipeline, f)
print(f"\nBest model ({best_model_name}) exported to: {model_path}")
print("This model is ready to be loaded by the FastAPI prediction endpoint.")
