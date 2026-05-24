import streamlit as st
from urllib.parse import quote
import json
import requests

#runs outside of container
#pip install streamlit
#Run streamlit run sample_chatbot_ui.py in command line

if 'messages' not in st.session_state:
    st.session_state['messages'] = []
if 'agent_colors' not in st.session_state:
    st.session_state['agent_colors'] = {'user': 'violet','Diagnoser': 'red', 'Explainer': 'orange', 'Prescriber': 'green'}


def display_message(specefic_message=None):
    message_arr = st.session_state["messages"]

    if specefic_message:
        message_arr = [specefic_message]

    for message in message_arr:
        role  = "assistant"
        if message["agent"] == "user":
            role = "user"
        
        color = st.session_state["agent_colors"][message["agent"]]
        title = f":{color}[**{message["agent"]}**]"
        
        with st.chat_message(role):
            format_string = title + " :\n" + str(message["content"])
            st.write(format_string)
        

def run_query(query):
    url = f"Http://localhost:8001/medical_chatbot"

    payload = {
        "input_task": query
    }


    with requests.post(url, json=payload, stream=True) as response:
        for line in response.iter_lines():
            if line.strip():
                try:
                    for item in line.decode("utf-8").split("\n"):
                        message = json.loads(item.strip())

                        if "messages" in message:
                            st.session_state["messages"].append(message["messages"])
                            display_message(message["messages"])
                except json.JSONDecodeError as e:
                    print(f"JSON decoding failed: {e}")



st.title("Medical Chatbot Demo")

if st.sidebar.button(':red[Reset Chat]'):
    st.session_state['messages'].clear()

display_message()


query = st.chat_input("Enter medical issues/symptoms here...")

if query:
    run_query(query)


