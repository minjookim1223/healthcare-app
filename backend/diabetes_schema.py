from pydantic import BaseModel, Field


class DiabetesInput(BaseModel):
    age: int
    gender:int
    bmi: float
    glucose: float
    a1c: float