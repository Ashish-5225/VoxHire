from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import List, Optional, Any

# User schemas
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# Resume schemas
class ResumeResponse(BaseModel):
    id: int
    user_id: int
    filename: str
    ats_score: int
    analysis_json: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Interview schemas
class InterviewSessionCreate(BaseModel):
    type: str  # HR, Technical, Behavioral
    role: str

class InterviewMessageCreate(BaseModel):
    text: str

class InterviewMessageResponse(BaseModel):
    id: int
    session_id: int
    sender: str
    text: str
    feedback_json: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class InterviewSessionResponse(BaseModel):
    id: int
    user_id: int
    type: str
    role: str
    status: str
    score: float
    feedback_summary: Optional[str] = None
    created_at: datetime
    messages: List[InterviewMessageResponse] = []

    class Config:
        from_attributes = True

class InterviewSessionListItem(BaseModel):
    id: int
    type: str
    role: str
    status: str
    score: float
    created_at: datetime

    class Config:
        from_attributes = True

# Code evaluation schema
class CodeEvaluationRequest(BaseModel):
    language: str
    problem_statement: str
    code: str

# Roadmap schemas
class RoadmapResponse(BaseModel):
    id: int
    user_id: int
    roadmap_json: str
    created_at: datetime

    class Config:
        from_attributes = True
