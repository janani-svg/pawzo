from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    fullname: str
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str