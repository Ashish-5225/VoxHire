from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Float
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    resumes = relationship("Resume", back_populates="user", cascade="all, delete-orphan")
    interviews = relationship("InterviewSession", back_populates="user", cascade="all, delete-orphan")
    roadmaps = relationship("LearningRoadmap", back_populates="user", cascade="all, delete-orphan")


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String, nullable=False)
    ats_score = Column(Integer, default=0)
    raw_text = Column(Text, nullable=True)
    analysis_json = Column(Text, nullable=True)  # Store feedback suggestions
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="resumes")


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(String, nullable=False)  # HR, Technical, Behavioral
    role = Column(String, nullable=False)  # e.g., Frontend Engineer
    status = Column(String, default="active")  # active, completed
    score = Column(Float, default=0.0) # overall score out of 100
    feedback_summary = Column(Text, nullable=True) # text summary of session
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="interviews")
    messages = relationship("InterviewMessage", back_populates="session", cascade="all, delete-orphan")


class InterviewMessage(Base):
    __tablename__ = "interview_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"), nullable=False)
    sender = Column(String, nullable=False)  # ai, user
    text = Column(Text, nullable=False)
    feedback_json = Column(Text, nullable=True)  # Detailed AI review of user response
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("InterviewSession", back_populates="messages")


class LearningRoadmap(Base):
    __tablename__ = "learning_roadmaps"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    roadmap_json = Column(Text, nullable=False)  # Personalized nodes and items
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="roadmaps")
