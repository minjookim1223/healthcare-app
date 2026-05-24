import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnomalyDetectionService, AnomalyAnalysisResult, AnomalySubmission } from './anomaly-detection.service';
 
interface FieldDef {
  key: string;
  label: string;
  type: 'number' | 'select' | 'text';
  placeholder?: string;
  unit?: string;
  min?: number;
  max?: number;
  options?: { value: string; label: string }[];
}
 
const DIABETES_FIELDS: FieldDef[] = [
  { key: 'age', label: 'Age', type: 'number', placeholder: 'e.g. 45', min: 0, max: 120 },
  { key: 'gender', label: 'Gender', type: 'select', options: [{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' }] },
  { key: 'bmi', label: 'BMI', type: 'number', placeholder: 'e.g. 26.5', min: 10, max: 70 },
  { key: 'glucose', label: 'Glucose', type: 'number', placeholder: 'e.g. 120', unit: 'mg/dL', min: 0 },
  { key: 'a1c', label: 'A1C', type: 'number', placeholder: 'e.g. 5.7', unit: '%', min: 0, max: 20 },
];
 
const HEART_FIELDS: FieldDef[] = [
  { key: 'age', label: 'Age', type: 'number', placeholder: 'e.g. 55', min: 0, max: 120 },
  { key: 'gender', label: 'Gender', type: 'select', options: [{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' }] },
  {
    key: 'chestPain', label: 'Chest Pain Type', type: 'select', options: [
      { value: '0', label: '0 – Typical angina' },
      { value: '1', label: '1 – Atypical angina' },
      { value: '2', label: '2 – Non-anginal pain' },
      { value: '3', label: '3 – Asymptomatic' },
    ]
  },
  { key: 'restingBP', label: 'Resting Blood Pressure', type: 'number', placeholder: 'e.g. 120', unit: 'mmHg', min: 0 },
  { key: 'cholesterol', label: 'Serum Cholesterol', type: 'number', placeholder: 'e.g. 200', unit: 'mg/dL', min: 0 },
  {
    key: 'fastingBS', label: 'Fasting Blood Sugar > 120 mg/dL', type: 'select', options: [
      { value: '0', label: 'No' },
      { value: '1', label: 'Yes' },
    ]
  },
  {
    key: 'restingECG', label: 'Resting ECG Results', type: 'select', options: [
      { value: '0', label: '0 – Normal' },
      { value: '1', label: '1 – ST-T wave abnormality' },
      { value: '2', label: '2 – Left ventricular hypertrophy' },
    ]
  },
  { key: 'maxHR', label: 'Max Heart Rate Achieved', type: 'number', placeholder: 'e.g. 150', unit: 'bpm', min: 0, max: 300 },
  {
    key: 'exerciseAngina', label: 'Exercise-Induced Angina', type: 'select', options: [
      { value: '0', label: 'No' },
      { value: '1', label: 'Yes' },
    ]
  },
  { key: 'stDepression', label: 'ST Depression', type: 'number', placeholder: 'e.g. 1.2', min: 0 },
  {
    key: 'stSlope', label: 'Slope of Peak Exercise ST', type: 'select', options: [
      { value: '0', label: '0 – Upsloping' },
      { value: '1', label: '1 – Flat' },
      { value: '2', label: '2 – Downsloping' },
    ]
  },
  { key: 'majorVessels', label: 'Major Vessels (Fluoroscopy)', type: 'number', placeholder: '0–3', min: 0, max: 3 },
  {
    key: 'thal', label: 'Thalassemia Type', type: 'select', options: [
      { value: '1', label: '1 – Normal' },
      { value: '2', label: '2 – Fixed defect' },
      { value: '3', label: '3 – Reversible defect' },
    ]
  },
];
 
const CHOLESTEROL_FIELDS: FieldDef[] = [
  { key: 'totalChol', label: 'Total Cholesterol', type: 'number', placeholder: 'e.g. 200', unit: 'mg/dL', min: 50, max: 500 },
  { key: 'ldl',       label: 'LDL Cholesterol',   type: 'number', placeholder: 'e.g. 120', unit: 'mg/dL', min: 20, max: 400 },
  { key: 'hdl',       label: 'HDL Cholesterol',   type: 'number', placeholder: 'e.g. 55',  unit: 'mg/dL', min: 10, max: 150 },
];
 
const BLOOD_PRESSURE_FIELDS: FieldDef[] = [
  { key: 'age',    label: 'Age',                    type: 'number', placeholder: 'e.g. 45',  unit: 'years', min: 1, max: 120 },
  { key: 'gender', label: 'Gender',                 type: 'select', placeholder: '', options: [{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }] },
  { key: 'bmi',    label: 'BMI',                    type: 'number', placeholder: 'e.g. 24.5', unit: 'kg/m²', min: 10, max: 60 },
  { key: 'sbp',    label: 'Systolic BP (SBP)',       type: 'number', placeholder: 'e.g. 120', unit: 'mmHg', min: 60, max: 250 },
  { key: 'dbp',    label: 'Diastolic BP (DBP)',      type: 'number', placeholder: 'e.g. 80',  unit: 'mmHg', min: 40, max: 150 },
];
 
const ANEMIA_FIELDS: FieldDef[] = [
  { key: 'age',       label: 'Age',                    type: 'number', placeholder: 'e.g. 35',  unit: 'years',   min: 1, max: 120 },
  { key: 'ferritin',  label: 'Ferritin',               type: 'number', placeholder: 'e.g. 20',  unit: 'ng/mL',   min: 0, max: 1000 },
  { key: 'serumIron', label: 'Serum Iron',             type: 'number', placeholder: 'e.g. 80',  unit: 'µg/dL',   min: 0, max: 400 },
  { key: 'tibc',      label: 'TIBC',                   type: 'number', placeholder: 'e.g. 350', unit: 'µg/dL',   min: 0, max: 700 },
  { key: 'tsat',      label: 'Transferrin Saturation', type: 'number', placeholder: 'e.g. 25',  unit: '%',        min: 0, max: 100 },
  { key: 'mcv',       label: 'MCV',                    type: 'number', placeholder: 'e.g. 85',  unit: 'fL',       min: 50, max: 130 },
];
 
@Component({
  selector: 'app-anomaly-detection',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="anomaly-page">
      <div class="page-header">
        <h1 class="page-title">Medical Anomaly Detection</h1>
        <p class="page-subtitle">Select a risk factor and fill in your health details for AI-assisted analysis.</p>
      </div>
 
      <div class="content-grid">
        <div class="form-card">
          <div class="card-section">
            <label class="field-label" for="anomalyType">Risk factor <span class="required">*</span></label>
            <select id="anomalyType" class="field-select" [(ngModel)]="submission.anomalyType" (ngModelChange)="onRiskFactorChange()">
              <option value="" disabled>Select risk factor you're interested in</option>
              <option value="Diabetes">Diabetes</option>
              <option value="heartDisease">Heart Disease</option>
              <option value="Cholesterol">Cholesterol</option>
              <option value="BloodPressure">Blood Pressure</option>
              <option value="Anemia">Anemia</option>
            </select>
          </div>
 
          @if (activeFields.length > 0) {
            <div class="dynamic-fields">
              <p class="fields-intro">Please provide the following information:</p>
              <div class="fields-grid">
                @for (field of activeFields; track field.key) {
                  <div class="field-item">
                    <label class="field-label-sm" [for]="field.key">
                      {{ field.label }}
                      @if (field.unit) {
                        <span class="field-unit">({{ field.unit }})</span>
                      }
                    </label>
 
                    @if (field.type === 'select') {
                      <select
                        [id]="field.key"
                        class="field-select field-select-sm"
                        [(ngModel)]="fieldValues[field.key]"
                      >
                        <option value="" disabled>Select…</option>
                        @for (opt of field.options; track opt.value) {
                          <option [value]="opt.value">{{ opt.label }}</option>
                        }
                      </select>
                    } @else {
                      <input
                        [id]="field.key"
                        type="number"
                        class="field-input"
                        [(ngModel)]="fieldValues[field.key]"
                        [placeholder]="field.placeholder || ''"
                        [min]="field.min ?? null"
                        [max]="field.max ?? null"
                      />
                    }
                  </div>
                }
              </div>
            </div>
          }
 
          <div class="form-actions">
            <button
              class="submit-btn"
              [class.loading]="isLoading"
              [disabled]="isLoading || !canSubmit"
              (click)="onSubmit()"
            >
              @if (isLoading) {
                <span class="btn-spinner"></span>
                <span>Analyzing&hellip;</span>
              } @else {
                <span>Run Analysis</span>
              }
            </button>
          </div>
        </div>
 
        <div class="results-panel" [class.has-results]="result">
          @if (!result && !isLoading) {
            <div class="results-empty">
              <p class="empty-title">Analysis Results</p>
              <p class="empty-body">Complete the form and run the analysis to view model output here.</p>
            </div>
          }
 
          @if (result && !isLoading) {
            <div class="results-content">
              <div class="result-header">
                <div class="confidence-chip">
                  Model confidence: {{ result.confidenceScore }}%
                </div>
              </div>
 
              <div class="result-section">
                <h3 class="result-section-title">Primary Finding</h3>
                <p class="result-body">{{ result.primaryFinding }}</p>
              </div>
 
              <p class="disclaimer">
                This analysis is generated by an AI model and is intended for preliminary screening only.
                It does not constitute a medical diagnosis. Consult a qualified healthcare professional for clinical evaluation.
              </p>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: [`
    .anomaly-page {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
      font-family: 'DM Sans', sans-serif;
    }
 
    .page-header { margin-bottom: 2rem; }
 
    .page-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 0.35rem;
    }
 
    .page-subtitle {
      font-size: 0.9rem;
      color: var(--text-muted);
    }
 
    .content-grid {
      display: grid;
      grid-template-columns: 460px 1fr;
      gap: 1.5rem;
      align-items: start;
    }
 
    @media (max-width: 860px) {
      .content-grid { grid-template-columns: 1fr; }
    }
 
    .form-card {
      background: var(--surface-1);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      box-shadow: var(--shadow-card);
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
 
    .card-section {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
 
    .field-label {
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--text-secondary);
      letter-spacing: 0.03em;
      text-transform: uppercase;
    }
 
    .required { color: #ef4444; margin-left: 2px; }
 
    .dynamic-fields {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      animation: fadeIn 0.2s ease;
    }
 
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to   { opacity: 1; transform: translateY(0); }
    }
 
    .fields-intro {
      font-size: 0.82rem;
      color: var(--text-muted);
      margin: 0;
    }
 
    .fields-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }
 
    .field-item {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
    }
 
    .field-label-sm {
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--text-secondary);
      letter-spacing: 0.02em;
    }
 
    .field-unit {
      font-weight: 400;
      color: var(--text-muted);
      margin-left: 3px;
    }
 
    .field-select,
    .field-input {
      width: 100%;
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 0.6rem 0.85rem;
      font-size: 0.9rem;
      color: var(--text-primary);
      outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
      appearance: none;
      box-sizing: border-box;
    }
 
    .field-select:focus,
    .field-input:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
    }
 
    .field-select-sm,
    .field-input {
      padding: 0.5rem 0.7rem;
      font-size: 0.85rem;
    }
 
    .form-actions { padding-top: 0.25rem; }
 
    .submit-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: var(--accent);
      color: #fff;
      border: none;
      border-radius: var(--radius-md);
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s, transform 0.1s, opacity 0.2s;
      letter-spacing: 0.01em;
    }
 
    .submit-btn:hover:not(:disabled) { background: var(--accent-dark); }
    .submit-btn:active:not(:disabled) { transform: scale(0.985); }
    .submit-btn:disabled { opacity: 0.55; cursor: not-allowed; }
 
    .results-panel {
      background: var(--surface-1);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-card);
      min-height: 200px;
    }
 
    .results-empty {
      padding: 2.5rem 1.5rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
 
    .empty-title {
      font-weight: 600;
      color: var(--text-secondary);
      font-size: 0.95rem;
    }
 
    .empty-body {
      font-size: 0.85rem;
      color: var(--text-muted);
      line-height: 1.5;
    }
 
    .results-content {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
 
    .result-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
 
    .confidence-chip {
      padding: 0.3rem 0.75rem;
      border-radius: 999px;
      background: var(--surface-2);
      border: 1px solid var(--border);
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-secondary);
    }
 
    .result-section {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding-top: 0.75rem;
      border-top: 1px solid var(--border);
    }
 
    .result-section-title {
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--text-muted);
    }
 
    .result-body {
      font-size: 0.875rem;
      color: var(--text-secondary);
      line-height: 1.65;
    }
 
    .disclaimer {
      font-size: 0.78rem;
      color: var(--text-muted);
      line-height: 1.6;
      padding-top: 0.75rem;
      border-top: 1px solid var(--border);
    }
  `]
})
export class AnomalyDetectionComponent {
  private svc = inject(AnomalyDetectionService);
 
  submission: AnomalySubmission = {
    imageFile: null,
    anomalyType: '',
    bodyLocation: '',
    additionalContext: '',
  };
 
  fieldValues: Record<string, string> = {};
  activeFields: FieldDef[] = [];
 
  isLoading = false;
  isDragging = false;
  result: AnomalyAnalysisResult | null = null;
 
  get canSubmit(): boolean {
    if (!this.submission.anomalyType) return false;
    return this.activeFields.every(f => {
      const v = this.fieldValues[f.key];
      return v !== undefined && v !== '' && v !== null;
    });
  }
 
  onRiskFactorChange(): void {
    this.fieldValues = {};
    this.result = null;
    if (this.submission.anomalyType === 'Diabetes') {
      this.activeFields = DIABETES_FIELDS;
    } else if (this.submission.anomalyType === 'heartDisease') {
      this.activeFields = HEART_FIELDS;
    } else if (this.submission.anomalyType === 'Cholesterol') {
      this.activeFields = CHOLESTEROL_FIELDS;
    } else if (this.submission.anomalyType === 'BloodPressure') {
      this.activeFields = BLOOD_PRESSURE_FIELDS;
    } else if (this.submission.anomalyType === 'Anemia') {
      this.activeFields = ANEMIA_FIELDS;
    } else {
      this.activeFields = [];
    }
  }
 
  private buildContextString(): string {
    if (this.activeFields.length === 0) return '';
    const parts = this.activeFields.map(f => {
      const val = this.fieldValues[f.key] ?? '';
      const unit = f.unit ? ` ${f.unit}` : '';
      if (f.type === 'select' && f.options) {
        const opt = f.options.find(o => o.value === val);
        return `${f.label}: ${opt ? opt.label : val}`;
      }
      return `${f.label}: ${val}${unit}`;
    });
    return parts.join(', ');
  }
 
  onSubmit(): void {
    if (!this.canSubmit || this.isLoading) return;
    
    this.isLoading = true;
    this.result = null;
    this.svc.analyze({ ...this.submission, fieldValues: this.fieldValues }).subscribe({
      next: (res) => {
        this.result = res;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }
}
