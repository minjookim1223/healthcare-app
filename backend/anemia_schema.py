from pydantic import BaseModel, Field


class AnemiaInput(BaseModel):
    age: int
    ferritin: float
    serum_iron: float
    tibc: float
    transferrin_saturation: float
    mcv: float
