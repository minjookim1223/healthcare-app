from fastapi import FastAPI, UploadFile, File, Request, Depends
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware

import numpy as np
import pandas as pd

import torch
import torchvision.transforms as transforms

from chatbot import chatbot_main

from PIL import Image
import io
import pickle

from heart_schema import HeartInput, HEART_FEATURE_ORDER
from cholesterol_schema import CholesterolInput
from cholesterol_model import analyze_cholesterol
from diabetes_schema import DiabetesInput
from blood_pressure_schema import BPInput
from login_schema import RegistrationInput, LoginInput
from chatbot_schema import ChatbotInput
from anemia_schema import AnemiaInput

import bcrypt
from sqlalchemy.orm import Session
from database import init_db, get_db, LoginUser
from contextlib import asynccontextmanager


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten this later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.options("/{rest_of_path:path}")
async def preflight_handler(rest_of_path: str, request: Request):
    return JSONResponse(
        content={},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
    )

@app.post("/cancer_detection")
async def cancer_detection_inference(file: UploadFile = File(...)):
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB")

    model = torch.jit.load("./final_models/cancer_model.pt", map_location="cpu")
    model.eval()

    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406],
                             [0.229, 0.224, 0.225])
    ])

    x = transform(image).unsqueeze(0)

    response = None

    with torch.no_grad():
        logits = model(x)
        prob = torch.sigmoid(logits).item()
        if prob > 0.4:
            response = "Cancer Detected"
        else:
            response = "Cancer Not Detected"


    return {"output": response}


@app.post("/diabetes_detection")
def diabetes_detection_inference(data: DiabetesInput):
    
    bmi_category = 0
    if data.bmi < 18.5:
        bmi_category = 0
    elif data.bmi < 25:
        bmi_category = 1
    elif data.bmi < 30:
        bmi_category = 2
    else:
        bmi_category = 3

    high_glucose = 1 if data.glucose >= 126 else 0
    high_a1c = 1 if data.a1c >= 6.5 else 0

    if data.age < 30:
        age_group = 0
    elif data.age < 45:
        age_group = 1
    elif data.age < 60:
        age_group = 2
    else:
        age_group = 3

    features = pd.DataFrame([{
        "age": data.age,
        "gender": data.gender,
        "bmi": data.bmi,
        "glucose": data.glucose,
        "a1c": data.a1c,
        "bmi_category": bmi_category,
        "high_glucose": high_glucose,
        "high_a1c": high_a1c,
        "age_group": age_group
    }])

    with open("./final_models/diabetes_model.pkl", "rb") as f:
        model = pickle.load(f)

    prediction = model.predict(features)[0]
    confidence = model.predict_proba(features)[0][1]

    response = None
    if prediction == 1:
        response = "Diabetes Detected"
    else:
        response = "Diabetes Not Detected"


    return {
        "output": response,
        "confidence": confidence,
    }


@app.post("/heart_condition_detection")
def heart_detection_inference(data: HeartInput):
    with open("./final_models/heart_model.pkl", "rb") as f:
        model = pickle.load(f)

    features = np.array([[getattr(data, f) for f in HEART_FEATURE_ORDER]])

    prediction_value = int(model.predict(features)[0])

    confidence = None
    if hasattr(model, "predict_proba"):
        probas = model.predict_proba(features)[0]
        confidence = round(float(probas[prediction_value]), 4)

    response = None
    if prediction_value == 1:
        response = "Heart Disease Detected"
    else:
        response = "Heart Disease Not Detected"

    return {
        "output": response,
        "confidence": confidence,
    }

@app.post("/blood_pressure_detection")
def blood_pressure_detection_inference(data: BPInput):
    bmi_category = 0
    if data.bmi < 18.5:
        bmi_category = 0
    elif data.bmi < 25:
        bmi_category = 1
    elif data.bmi < 30:
        bmi_category = 2
    else:
        bmi_category = 3

    high_sbp = 1 if data.sbp >= 130 else 0
    high_dbp = 1 if data.dbp >= 80 else 0
    pulse_pressure = data.sbp - data.dbp


    if data.age < 30:
        age_group = 0
    elif data.age < 45:
        age_group = 1
    elif data.age < 60:
        age_group = 2
    else:
        age_group = 3

    

    features = pd.DataFrame([{
        "age": data.age,
        "age_group": age_group,
        "gender": data.gender,
        "bmi": data.bmi,
        "bmi_category": bmi_category,
        "sbp": data.sbp,
        "dbp": data.dbp,
        "high_sbp": high_sbp,
        "high_dbp": high_dbp,
        "pulse_pressure": pulse_pressure
    }])

    with open("./final_models/bp_model.pkl", "rb") as f:
        bp_package = pickle.load(f)

    # predict
    prediction = bp_package['model'].predict(features)[0]
    probability = bp_package['model'].predict_proba(features)[0]


    class_map = {
        0: "Normal",
        1: "Elevated",
        2: "Hypertension"
    }

    return {
        "output": class_map[prediction],
        "confidence": {
            "Normal": probability[0],
            "Elevated": probability[1],
            "Hypertension": probability[2]
        }
    }



@app.post("/cholesterol_detection")
def cholesterol_detection_inference(data: CholesterolInput):
    return analyze_cholesterol(data)


@app.post("/anemia_detection")
def anemia_detection_inference(data: AnemiaInput):
    iron_deficient = 1 if data.ferritin < 15 else 0
    low_tsat = 1 if data.transferrin_saturation < 20 else 0
    microcytic = 1 if data.mcv < 80 else 0


    if data.age < 30:
        age_group = 0
    elif data.age < 45:
        age_group = 1
    elif data.age < 60:
        age_group = 2
    else:
        age_group = 3
    

    features = pd.DataFrame([{
        "age": data.age,
        "age_group": age_group,
        "ferritin": data.ferritin,
        "serum_iron": data.serum_iron,
        "tibc": data.tibc,
        "transferrin_saturation": data.transferrin_saturation,
        "mcv": data.mcv,
        "iron_deficient": iron_deficient,
        "low_tsat": low_tsat,
        "microcytic": microcytic
    }])


    with open("./final_models/anemia_model.pkl", "rb") as f:
        anemia_package = pickle.load(f)

    # predict
    prediction = anemia_package['model'].predict(features)[0]
    probability = anemia_package['model'].predict_proba(features)[0][1]


    class_map = {
        0: "Not Anemic",
        1: "Anemic (High Risk)"
    }

    return {
        "output": class_map[prediction],
        "confidence": round(probability, 3)
    }


@app.post("/medical_chatbot")
async def medical_chatbot(chatbot_input: ChatbotInput):
    # JSON output: {"messages":{"agent": message.source, "content": message.content}}
    return StreamingResponse(chatbot_main(chatbot_input.input_task), media_type="application/json")


@app.post("/register")
def register_user(data: RegistrationInput, db: Session = Depends(get_db)):
    # Check if username  exists
    exists = db.query(LoginUser).filter(LoginUser.username == data.username).first()
    if exists:
        return JSONResponse(
            status_code=409,
            content={"detail": "Username already exists"},
        )

    # Hash the password before storing
    hashed = bcrypt.hashpw(data.password.encode("utf-8"), bcrypt.gensalt())

    user = LoginUser(
        username=data.username,
        password=hashed.decode("utf-8"),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return {"message": "User registered successfully",
            "username": user.username
            }


@app.post("/login")
def login_user(data: LoginInput, db: Session = Depends(get_db)):
    user = db.query(LoginUser).filter(LoginUser.username == data.username).first()

    if not user:
        return JSONResponse(
            status_code=401,
            content={"detail": "Invalid credentials"},
        )

    # Verify the password against hash
    password = bcrypt.checkpw(data.password.encode("utf-8"), user.password.encode("utf-8"))
    if not password:
        return JSONResponse(
            status_code=401,
            content={"detail": "Invalid credentials"},
        )

    return {"message": "Login successful",
            "username": user.username
            }