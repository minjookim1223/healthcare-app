from pydantic import BaseModel, Field

class RegistrationInput(BaseModel):
    username: str = Field(..., min_length=5, max_length=25)
    password: str = Field(..., min_length=6, max_length=64)


class LoginInput(BaseModel):
    username: str = Field(..., min_length=1, description="username")
    password: str = Field(..., min_length=1, description="password")