from pydantic import BaseModel, Field


class CholesterolInput(BaseModel):
    total: int = Field(..., ge=50, le=500, description="Total cholesterol (mg/dl)")
    ldl: int = Field(..., ge=20, le=400, description="LDL cholesterol (mg/dl)")
    hdl: int = Field(..., ge=10, le=150, description="HDL cholesterol (mg/dl)")
