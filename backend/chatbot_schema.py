from pydantic import BaseModel, Field


class ChatbotInput(BaseModel):
    input_task: str