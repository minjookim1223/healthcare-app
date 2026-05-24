import streamlit as st
import requests

# -----------------------------
# Config
# -----------------------------

st.set_page_config(
    page_title="Medical Anomaly Dashboard",
    page_icon="🩺",
    layout="wide",
)

st.title("🩺 Medical Anomaly Dashboard")
st.write("Run inference for Diabetes Detection and Heart Disease Detection.")

backend_url = "http://localhost:8001"
# -----------------------------
# Helpers
# -----------------------------
def post_inference(endpoint: str, payload: dict):
    url = f"{backend_url}{endpoint}"
    try:
        response = requests.post(url, json=payload, timeout=30)
        response.raise_for_status()
        return response.json(), None
    except requests.exceptions.RequestException as e:
        return None, str(e)
    except ValueError:
        return None, "Backend returned a non-JSON response."


def render_result(result: dict):
    if not result:
        st.error("No response received.")
        return

    output = result.get("output")
    confidence = result.get("confidence")

    if output:
        st.success(f"Prediction: {output}")
    else:
        st.warning("Prediction output missing from response.")

    if confidence is not None:
        try:
            st.info(f"Confidence: {float(confidence):.4f}")
        except (TypeError, ValueError):
            st.info(f"Confidence: {confidence}")


# -----------------------------
# Layout
# -----------------------------
tab1, tab2 = st.tabs(["Diabetes Inference", "Heart Disease Inference"])

# -----------------------------
# Diabetes Section
# Backend expects:
# age: int
# gender: int
# bmi: float
# glucose: float
# a1c: float
# Endpoint: /diabetes_detection
# -----------------------------
with tab1:
    st.subheader("Diabetes Inference")

    with st.form("diabetes_form"):
        col1, col2 = st.columns(2)

        with col1:
            age = st.number_input("Age", min_value=1, max_value=120, value=35, step=1)
            gender = st.selectbox(
                "Gender",
                options=[0, 1],
                format_func=lambda x: "Male (0)" if x == 0 else "Female (1)"
            )
            bmi = st.number_input("BMI", min_value=5.0, max_value=80.0, value=24.5, step=0.1)

        with col2:
            glucose = st.number_input("Glucose", min_value=0.0, max_value=500.0, value=110.0, step=0.1)
            a1c = st.number_input("A1C", min_value=0.0, max_value=20.0, value=5.8, step=0.1)

        diabetes_submit = st.form_submit_button("Run Diabetes Inference")

    if diabetes_submit:
        payload = {
            "age": int(age),
            "gender": int(gender),
            "bmi": float(bmi),
            "glucose": float(glucose),
            "a1c": float(a1c),
        }

        #st.code(payload, language="json")

        result, error = post_inference("/diabetes_detection", payload)
        if error:
            st.error(f"Request failed: {error}")
        else:
            render_result(result)


# -----------------------------
# Heart Disease Section
# Backend expects:
# age, sex, cp, trestbps, chol, fbs, restecg,
# thalach, exang, oldpeak, slope, ca, thal
# Endpoint: /heart_condition_detection
# -----------------------------
with tab2:
    st.subheader("Heart Disease Inference")

    with st.form("heart_form"):
        col1, col2 = st.columns(2)

        with col1:
            h_age = st.number_input("Age", min_value=1, max_value=120, value=45, step=1)
            sex = st.selectbox(
                "Sex",
                options=[0, 1],
                format_func=lambda x: "Female (0)" if x == 0 else "Male (1)"
            )
            cp = st.selectbox(
                "Chest Pain Type (cp)",
                options=[0, 1, 2, 3],
                help="Chest pain type"
            )
            trestbps = st.number_input(
                "Resting Blood Pressure (trestbps)",
                min_value=50,
                max_value=300,
                value=120,
                step=1
            )
            chol = st.number_input(
                "Cholesterol (chol)",
                min_value=50,
                max_value=700,
                value=200,
                step=1
            )
            fbs = st.selectbox(
                "Fasting Blood Sugar > 120 mg/dl (fbs)",
                options=[0, 1]
            )
            restecg = st.selectbox(
                "Resting ECG Result (restecg)",
                options=[0, 1, 2]
            )

        with col2:
            thalach = st.number_input(
                "Max Heart Rate Achieved (thalach)",
                min_value=50,
                max_value=250,
                value=150,
                step=1
            )
            exang = st.selectbox(
                "Exercise-Induced Angina (exang)",
                options=[0, 1]
            )
            oldpeak = st.number_input(
                "ST Depression (oldpeak)",
                min_value=0.0,
                max_value=10.0,
                value=1.0,
                step=0.1
            )
            slope = st.selectbox(
                "Slope of Peak Exercise ST Segment (slope)",
                options=[0, 1, 2]
            )
            ca = st.selectbox(
                "Major Vessels Colored by Fluoroscopy (ca)",
                options=[0, 1, 2, 3, 4]
            )
            thal = st.selectbox(
                "Thalassemia Type (thal)",
                options=[0, 1, 2, 3]
            )

        heart_submit = st.form_submit_button("Run Heart Disease Inference")

    if heart_submit:
        payload = {
            "age": int(h_age),
            "sex": int(sex),
            "cp": int(cp),
            "trestbps": int(trestbps),
            "chol": int(chol),
            "fbs": int(fbs),
            "restecg": int(restecg),
            "thalach": int(thalach),
            "exang": int(exang),
            "oldpeak": float(oldpeak),
            "slope": int(slope),
            "ca": int(ca),
            "thal": int(thal),
        }

        #st.code(payload, language="json")

        result, error = post_inference("/heart_condition_detection", payload)
        if error:
            st.error(f"Request failed: {error}")
        else:
            render_result(result)