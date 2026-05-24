import asyncio
import json
from autogen_agentchat.base import TaskResult
from autogen_agentchat.agents import AssistantAgent
from autogen_agentchat.conditions import TextMentionTermination, MaxMessageTermination
from autogen_agentchat.teams import RoundRobinGroupChat
from autogen_ext.models.openai import OpenAIChatCompletionClient
from autogen_core.tools import FunctionTool
from database import get_disease_result, get_treatments_result
from autogen_core import FunctionCall
from autogen_core.models import FunctionExecutionResult, FunctionExecutionResultMessage
import os
from dotenv import load_dotenv

user_query = None

load_dotenv()  # FIX: loads variables from .env into environment

api_key = os.getenv("OPENAI_API_KEY")  # FIX: read API key from environment, not code
if not api_key:
    raise ValueError("OPENAI_API_KEY is not set")  # FIX: fail clearly if missing

model_client = OpenAIChatCompletionClient(
    model="gpt-4o",
    api_key=api_key
)

def get_possible_disease():
    disease_name = get_disease_result(user_query)
    return "Possible disease diagnosis: " + disease_name

def get_possible_treatments():
    treatments = get_treatments_result(user_query)
    return "Possible treatments for disease: " + treatments

disease_diagnosis = FunctionTool(get_possible_disease, description='Outputs the possible disease/issue the user is facing')
disease_treatments = FunctionTool(get_possible_treatments, description='Outputs possible treatments for the disease/issue the user is facing')

diagnostic_agent = AssistantAgent(
    name="Diagnoser",
    model_client=model_client,
    description="You are a diagnostic agent. You are the first agent that gets the task from user and you have to figure out what is wrong with user. You can call your tool to get a possible diagnosis of issue but might not be completely accurate.",
    system_message="You are a diagnostic agent that has to figure out what is wrong with the user.",
    tools=[disease_diagnosis]
)

explainer_agent = AssistantAgent(
    name="Explainer",
    model_client=model_client,
    description="You are an explainer agent. You get the diagnosis and give more inforamtion about it.",
    system_message="You are an explainer agent that gives more information about the user's diagnosis."
)

prescriber_agent = AssistantAgent(
    name="Prescriber",
    model_client=model_client,
    description="You are a prescriber agent. You get the diagnosis and provide a solution to the user to resolve issue.",
    system_message="You are a prescriber agent that gives solutions/cures to the user's diagnosis. You can call your tool to get some possible treatments of disease/issue but might not be completely accurate. You are the last agent in the team. You should end your message with TERMINATE to finish chat.",
    tools=[disease_treatments]
)

termination = TextMentionTermination("TERMINATE") | MaxMessageTermination(max_messages = 10)

team = RoundRobinGroupChat([diagnostic_agent, explainer_agent, prescriber_agent], termination_condition=termination)

async def chatbot_main(input_task):
    global user_query
    await team.reset()
    user_query = input_task
    skip_message_types = {
        "ToolCallRequestEvent",
        "ToolCallExecutionEvent",
        "ToolCallSummaryMessage",
    }

    async for message in team.run_stream(task=input_task):
        print(message)
        
        if isinstance(message, TaskResult):
            continue

        if message.__class__.__name__ in skip_message_types:
            continue

        content = getattr(message, "content", "")

        if isinstance(content, list):
            if any(isinstance(item, FunctionCall) for item in content):
                continue
            content = " ".join(str(item) for item in content)

        yield json.dumps({
            "messages": {
                "agent": message.source,
                "content": str(content)
            }
        }) + "\n"
        
        await asyncio.sleep(0)
