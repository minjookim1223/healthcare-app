from pydantic import BaseModel, Field


class BPInput(BaseModel):
    age: int
    gender:int
    bmi: float
    sbp: float
    dbp: float