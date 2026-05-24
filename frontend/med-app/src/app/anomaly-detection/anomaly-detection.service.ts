import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface AnomalySubmission {
  imageFile: File | null;
  anomalyType: string;
  bodyLocation: string;
  additionalContext: string;
  fieldValues?: Record<string, string>;
}

export interface AnomalyAnalysisResult {
  riskLevel: 'low' | 'moderate' | 'high';
  riskScore: number;
  primaryFinding: string;
  differentialDiagnoses: string[];
  notes: string;
  recommendation: string;
  followUpTimeframe: string;
  confidenceScore: number;
  featureFlags: { label: string; present: boolean }[];
}

interface BackendResponse { output: string; confidence: number; }

interface BackendCholesterolResponse {
  ldl: { value: number; category: string; risk: string };
  hdl: { value: number; category: string; risk: string };
  total_cholesterol: { value: number; category: string };
  ldl_hdl_ratio: { value: number; risk: string };
  total_hdl_ratio: { value: number; risk: string };
}

interface BackendBPResponse {
  output: string; // "Normal" | "Elevated" | "Hypertension"
  confidence: { Normal: number; Elevated: number; Hypertension: number };
}

const BASE_URL = `http://${window.location.hostname}:8001`;

@Injectable({ providedIn: 'root' })
export class AnomalyDetectionService {
  private http = inject(HttpClient);

  analyze(submission: AnomalySubmission): Observable<AnomalyAnalysisResult> {
    switch (submission.anomalyType) {
      case 'Diabetes':      return this.analyzeDiabetes(submission);
      case 'heartDisease':  return this.analyzeHeart(submission);
      case 'Cholesterol':   return this.analyzeCholesterol(submission);
      case 'BloodPressure': return this.analyzeBloodPressure(submission);
      case 'Anemia':        return this.analyzeAnemia(submission);
      default: return throwError(() => new Error('Unknown anomaly type'));
    }
  }

  // ── Diabetes ──────────────────────────────────────────────────────────────
  private analyzeDiabetes(s: AnomalySubmission): Observable<AnomalyAnalysisResult> {
    const f = s.fieldValues ?? {};
    const payload = {
      age:     this.toInt(f['age']),
      gender:  (f['gender'] ?? '').toLowerCase() === 'female' ? 1 : 0,
      bmi:     this.toFloat(f['bmi']),
      glucose: this.toFloat(f['glucose']),
      a1c:     this.toFloat(f['a1c']),
    };
    return this.http.post<BackendResponse>(`${BASE_URL}/diabetes_detection`, payload).pipe(
      map(res => {
        const detected = this.isDetected(res.output);
        const pct = Math.round((res.confidence ?? 0.5) * 100);
        return {
          riskLevel: detected ? (pct >= 75 ? 'high' : 'moderate') : 'low',
          riskScore: pct, primaryFinding: res.output, confidenceScore: pct,
          differentialDiagnoses: detected
            ? ['Type 2 Diabetes Mellitus', 'Pre-diabetes / Impaired Glucose Tolerance']
            : ['Normal glucose metabolism', 'Possible pre-diabetes — monitor annually'],
          notes: `Age: ${payload.age}, BMI: ${payload.bmi}, Glucose: ${payload.glucose} mg/dL, A1C: ${payload.a1c}%`,
          recommendation: detected
            ? 'Consult your GP or endocrinologist promptly. A confirmatory HbA1c and fasting plasma glucose test is advised.'
            : 'Continue healthy lifestyle habits. Recheck glucose annually or if symptoms develop.',
          followUpTimeframe: detected ? 'Within 2 weeks' : '12 months',
          featureFlags: [
            { label: 'High glucose (≥126 mg/dL)', present: payload.glucose >= 126 },
            { label: 'High A1C (≥6.5%)',          present: payload.a1c >= 6.5 },
            { label: 'Overweight (BMI ≥25)',       present: payload.bmi >= 25 },
            { label: 'Obese (BMI ≥30)',            present: payload.bmi >= 30 },
            { label: 'Age risk (≥45)',             present: payload.age >= 45 },
          ],
        } as AnomalyAnalysisResult;
      }),
      catchError(e => this.handleError(e))
    );
  }

  // ── Heart Disease ─────────────────────────────────────────────────────────
  private analyzeHeart(s: AnomalySubmission): Observable<AnomalyAnalysisResult> {
    const f = s.fieldValues ?? {};
    const payload = {
      age: this.toInt(f['age']), sex: (f['gender'] ?? '').toLowerCase() === 'female' ? 0 : 1,
      cp: this.toInt(f['chestPain']), trestbps: this.toInt(f['restingBP']),
      chol: this.toInt(f['cholesterol']), fbs: this.toInt(f['fastingBS']),
      restecg: this.toInt(f['restingECG']), thalach: this.toInt(f['maxHR']),
      exang: this.toInt(f['exerciseAngina']), oldpeak: this.toFloat(f['stDepression']),
      slope: this.toInt(f['stSlope']), ca: this.toInt(f['majorVessels']),
      thal: this.toInt(f['thal']),
    };
    return this.http.post<BackendResponse>(`${BASE_URL}/heart_condition_detection`, payload).pipe(
      map(res => {
        const detected = this.isDetected(res.output);
        const pct = Math.round((res.confidence ?? 0.5) * 100);
        return {
          riskLevel: detected ? (pct >= 75 ? 'high' : 'moderate') : 'low',
          riskScore: pct, primaryFinding: res.output, confidenceScore: pct,
          differentialDiagnoses: detected
            ? ['Coronary Artery Disease', 'Stable / Unstable Angina', 'Myocardial Ischaemia']
            : ['No significant cardiac risk identified', 'Consider routine cardiovascular screening'],
          notes: `Age: ${payload.age}, BP: ${payload.trestbps} mmHg, Cholesterol: ${payload.chol} mg/dL, Max HR: ${payload.thalach} bpm`,
          recommendation: detected
            ? 'Urgent referral to a cardiologist is recommended. An ECG, stress test, and lipid panel should be arranged promptly.'
            : 'Maintain cardiovascular health through diet, exercise, and regular check-ups.',
          followUpTimeframe: detected ? 'Within 1 week' : '12 months',
          featureFlags: [
            { label: 'High resting BP (≥140)',        present: payload.trestbps >= 140 },
            { label: 'High cholesterol (≥240 mg/dL)', present: payload.chol >= 240 },
            { label: 'Exercise-induced angina',        present: payload.exang === 1 },
            { label: 'Fasting blood sugar elevated',  present: payload.fbs === 1 },
            { label: 'ECG abnormality',               present: payload.restecg > 0 },
          ],
        } as AnomalyAnalysisResult;
      }),
      catchError(e => this.handleError(e))
    );
  }

  // ── Cholesterol ────────────────────────────────────────────────────────────
  private analyzeCholesterol(s: AnomalySubmission): Observable<AnomalyAnalysisResult> {
    const f = s.fieldValues ?? {};
    const payload = { total: this.toInt(f['totalChol']), ldl: this.toInt(f['ldl']), hdl: this.toInt(f['hdl']) };
    return this.http.post<BackendCholesterolResponse>(`${BASE_URL}/cholesterol_detection`, payload).pipe(
      map(res => {
        const highRisk = res.ldl.risk === 'Dangerous' || res.ldl.risk === 'High Risk' || res.hdl.risk === 'Dangerous' || res.ldl_hdl_ratio.risk === 'High Risk' || res.total_hdl_ratio.risk === 'High Risk';
        const moderate = !highRisk && (res.ldl.risk === 'Moderate Risk' || res.ldl_hdl_ratio.risk === 'Moderate Risk' || res.total_hdl_ratio.risk === 'Moderate Risk');
        const riskLevel: 'low' | 'moderate' | 'high' = highRisk ? 'high' : moderate ? 'moderate' : 'low';
        return {
          riskLevel, riskScore: highRisk ? 80 : moderate ? 55 : 20, confidenceScore: 100,
          primaryFinding: `Total: ${res.total_cholesterol.value} mg/dL (${res.total_cholesterol.category}). LDL: ${res.ldl.value} (${res.ldl.risk}). HDL: ${res.hdl.value} (${res.hdl.risk}).`,
          differentialDiagnoses: highRisk ? ['Hypercholesterolaemia', 'Dyslipidaemia', 'Elevated cardiovascular risk'] : moderate ? ['Borderline dyslipidaemia', 'Lifestyle-related lipid elevation'] : ['Healthy lipid profile'],
          notes: `LDL: ${payload.ldl} mg/dL | HDL: ${payload.hdl} mg/dL | Total: ${payload.total} mg/dL`,
          recommendation: highRisk ? 'Consult your physician promptly. Dietary changes and possible pharmacotherapy (e.g., statins) may be warranted.' : moderate ? 'Lifestyle modifications recommended: reduce saturated fat, increase aerobic exercise, recheck in 3–6 months.' : 'Maintain healthy habits and recheck lipid panel annually.',
          followUpTimeframe: highRisk ? 'Within 2 weeks' : moderate ? '3–6 months' : '12 months',
          featureFlags: [
            { label: 'LDL optimal (<100 mg/dL)',     present: payload.ldl < 100 },
            { label: 'LDL high (≥160 mg/dL)',        present: payload.ldl >= 160 },
            { label: 'HDL protective (≥60 mg/dL)',   present: payload.hdl >= 60 },
            { label: 'HDL low (<40 mg/dL)',           present: payload.hdl < 40 },
            { label: 'Total cholesterol high (≥240)', present: payload.total >= 240 },
            { label: 'LDL/HDL ratio high (>3.5)',    present: res.ldl_hdl_ratio.value > 3.5 },
          ],
        } as AnomalyAnalysisResult;
      }),
      catchError(e => this.handleError(e))
    );
  }

  // ── Blood Pressure ─────────────────────────────────────────────────────────
  private analyzeBloodPressure(s: AnomalySubmission): Observable<AnomalyAnalysisResult> {
    const f = s.fieldValues ?? {};
    const payload = {
      age:    this.toInt(f['age']),
      gender: (f['gender'] ?? '').toLowerCase() === 'female' ? 1 : 0,
      bmi:    this.toFloat(f['bmi']),
      sbp:    this.toFloat(f['sbp']),
      dbp:    this.toFloat(f['dbp']),
    };
    return this.http.post<BackendBPResponse>(`${BASE_URL}/blood_pressure_detection`, payload).pipe(
      map(res => {
        const isHypertension = res.output === 'Hypertension';
        const isElevated = res.output === 'Elevated';
        const riskLevel: 'low' | 'moderate' | 'high' = isHypertension ? 'high' : isElevated ? 'moderate' : 'low';
        const topConf = Math.round((res.confidence[res.output as keyof typeof res.confidence] ?? 0.5) * 100);
        return {
          riskLevel, riskScore: isHypertension ? 80 : isElevated ? 50 : 15,
          primaryFinding: `Blood pressure classification: ${res.output}. SBP: ${payload.sbp} mmHg, DBP: ${payload.dbp} mmHg.`,
          confidenceScore: topConf,
          differentialDiagnoses: isHypertension
            ? ['Stage 1 Hypertension', 'Stage 2 Hypertension', 'Secondary hypertension (renal/endocrine)']
            : isElevated
              ? ['Elevated blood pressure', 'White coat hypertension', 'Prehypertension']
              : ['Normal blood pressure', 'Routine monitoring recommended'],
          notes: `Age: ${payload.age}, BMI: ${payload.bmi}, SBP: ${payload.sbp} mmHg, DBP: ${payload.dbp} mmHg`,
          recommendation: isHypertension
            ? 'Consult your physician. Lifestyle modifications and possibly antihypertensive medication are recommended.'
            : isElevated
              ? 'Reduce sodium intake, increase physical activity, and recheck BP within 3 months.'
              : 'Maintain healthy lifestyle. Recheck annually.',
          followUpTimeframe: isHypertension ? 'Within 1 week' : isElevated ? '3 months' : '12 months',
          featureFlags: [
            { label: 'SBP elevated (≥130 mmHg)',     present: payload.sbp >= 130 },
            { label: 'SBP hypertensive (≥140 mmHg)', present: payload.sbp >= 140 },
            { label: 'DBP elevated (≥80 mmHg)',      present: payload.dbp >= 80 },
            { label: 'DBP hypertensive (≥90 mmHg)',  present: payload.dbp >= 90 },
            { label: 'BMI overweight (≥25)',          present: payload.bmi >= 25 },
            { label: 'Age risk (≥45)',                present: payload.age >= 45 },
          ],
        } as AnomalyAnalysisResult;
      }),
      catchError(e => this.handleError(e))
    );
  }

  // ── Anemia ────────────────────────────────────────────────────────────────
  private analyzeAnemia(s: AnomalySubmission): Observable<AnomalyAnalysisResult> {
    const f = s.fieldValues ?? {};
    const payload = {
      age:                    this.toInt(f['age']),
      ferritin:               this.toFloat(f['ferritin']),
      serum_iron:             this.toFloat(f['serumIron']),
      tibc:                   this.toFloat(f['tibc']),
      transferrin_saturation: this.toFloat(f['tsat']),
      mcv:                    this.toFloat(f['mcv']),
    };
    return this.http.post<BackendResponse>(`${BASE_URL}/anemia_detection`, payload).pipe(
      map(res => {
        const detected = res.output === 'Anemic (High Risk)';
        const pct = Math.round((res.confidence ?? 0.5) * 100);
        return {
          riskLevel: detected ? (pct >= 75 ? 'high' : 'moderate') : 'low',
          riskScore: pct, primaryFinding: res.output, confidenceScore: pct,
          differentialDiagnoses: detected
            ? ['Iron Deficiency Anaemia', 'Anaemia of Chronic Disease', 'Microcytic Anaemia']
            : ['No anaemia detected', 'Routine iron panel monitoring recommended'],
          notes: `Ferritin: ${payload.ferritin} ng/mL | Serum Iron: ${payload.serum_iron} µg/dL | TIBC: ${payload.tibc} µg/dL | TSAT: ${payload.transferrin_saturation}% | MCV: ${payload.mcv} fL`,
          recommendation: detected
            ? 'Consult a haematologist or GP. Iron supplementation and further investigation into the underlying cause are advised.'
            : 'Iron indices appear within range. Maintain a balanced diet with adequate iron intake and recheck annually.',
          followUpTimeframe: detected ? 'Within 2 weeks' : '12 months',
          featureFlags: [
            { label: 'Low ferritin (<15 ng/mL)',    present: payload.ferritin < 15 },
            { label: 'Low TSAT (<20%)',             present: payload.transferrin_saturation < 20 },
            { label: 'Microcytic RBC (MCV <80 fL)', present: payload.mcv < 80 },
            { label: 'Low serum iron (<60 µg/dL)',  present: payload.serum_iron < 60 },
            { label: 'High TIBC (>450 µg/dL)',      present: payload.tibc > 450 },
          ],
        } as AnomalyAnalysisResult;
      }),
      catchError(e => this.handleError(e))
    );
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  private isDetected(output: string): boolean {
    return output.toLowerCase().includes('detected') && !output.toLowerCase().includes('not detected');
  }

  private toInt(val: string | undefined): number {
    const n = parseInt(val ?? '0', 10); return isNaN(n) ? 0 : n;
  }

  private toFloat(val: string | undefined): number {
    const n = parseFloat(val ?? '0'); return isNaN(n) ? 0 : n;
  }

  private handleError(err: HttpErrorResponse): Observable<never> {
    const message = err.status === 0
      ? 'Cannot reach the backend server. Please ensure it is running on port 8001.'
      : `Backend error ${err.status}: ${err.statusText}`;
    return throwError(() => new Error(message));
  }
}
