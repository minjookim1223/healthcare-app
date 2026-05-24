import streamlit as st
from PIL import Image
import requests

# streamlit run cancer_model_ui.py

url = f"http://localhost:8001/cancer_detection"

st.title("Cancer Detection Service")

uploaded_file = st.file_uploader("Upload an image", type=["png", "jpg", "jpeg", "tif"])

if uploaded_file is not None:
    image = Image.open(uploaded_file)
    st.image(image, use_container_width=True)

    files = {
        "file": (uploaded_file.name, uploaded_file.getvalue(), uploaded_file.type)
    }

    response = requests.post(
        url,
        files=files,
        timeout = 35
    )

    st.subheader("Inference Output: ")
    st.write(response.json()['output'])
    