import io
import json
import logging
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from pypdf import PdfReader
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import Base, engine, get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models import User, Resume, InterviewSession, InterviewMessage, LearningRoadmap
from app.schemas import (
    UserCreate, UserResponse, Token,
    ResumeResponse, InterviewSessionCreate, InterviewSessionResponse,
    InterviewMessageCreate, InterviewMessageResponse, InterviewSessionListItem,
    CodeEvaluationRequest, RoadmapResponse
)
from app.services import ai_service, rag_service
from app.routes import copilot_routes

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Interview Copilot API", version="1.0.0")

app.include_router(copilot_routes.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/token")

# --- AUTH DEPENDENCY ---
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user


# --- AUTH ENDPOINTS ---
@app.post("/api/v1/auth/register", response_model=UserResponse)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user_data.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
        
    db_email = db.query(User).filter(User.email == user_data.email).first()
    if db_email:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@app.post("/api/v1/auth/token", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token = create_access_token(subject=user.username)
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/api/v1/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


# --- RESUME ENDPOINTS ---
def extract_text_from_pdf(file_bytes: bytes) -> str:
    try:
        pdf_file = io.BytesIO(file_bytes)
        reader = PdfReader(pdf_file)
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text
    except Exception as e:
        logger.error(f"Error parsing PDF: {str(e)}")
        raise HTTPException(status_code=400, detail="Failed to parse PDF document.")


@app.post("/api/v1/resume/upload", response_model=ResumeResponse)
def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF resumes are supported.")
        
    content = file.file.read()
    raw_text = extract_text_from_pdf(content)
    
    # Generate ATS Score and Suggestions
    analysis = ai_service.generate_ats_score(raw_text)
    ats_score = analysis.get("ats_score", 70)
    
    # Save or update resume record
    db_resume = db.query(Resume).filter(Resume.user_id == current_user.id).first()
    if db_resume:
        db_resume.filename = file.filename
        db_resume.raw_text = raw_text
        db_resume.ats_score = ats_score
        db_resume.analysis_json = json.dumps(analysis)
        db_resume.created_at = datetime.utcnow()
    else:
        db_resume = Resume(
            user_id=current_user.id,
            filename=file.filename,
            raw_text=raw_text,
            ats_score=ats_score,
            analysis_json=json.dumps(analysis)
        )
        db.add(db_resume)
        
    db.commit()
    db.refresh(db_resume)
    
    # Index resume chunks in RAG Vector Store
    rag_service.index_resume(current_user.id, raw_text)
    
    return db_resume


@app.get("/api/v1/resume/latest", response_model=Optional[ResumeResponse])
def get_latest_resume(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    resume = db.query(Resume).filter(Resume.user_id == current_user.id).first()
    return resume


# --- INTERVIEW ENDPOINTS ---
@app.post("/api/v1/interview/start", response_model=InterviewSessionResponse)
def start_interview(
    session_data: InterviewSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Initialize a new session
    session = InterviewSession(
        user_id=current_user.id,
        type=session_data.type,
        role=session_data.role,
        status="active"
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    
    # Load resume if exists for RAG/Context
    resume = db.query(Resume).filter(Resume.user_id == current_user.id).first()
    resume_text = resume.raw_text if resume else ""
    
    # Trigger first question
    first_question = ai_service.generate_mock_interview_question(
        resume_text=resume_text,
        role=session.role,
        type=session.type,
        history=[]
    )
    
    # Save first AI question
    ai_msg = InterviewMessage(
        session_id=session.id,
        sender="ai",
        text=first_question
    )
    db.add(ai_msg)
    db.commit()
    
    db.refresh(session)
    return session


@app.post("/api/v1/interview/{session_id}/message", response_model=InterviewMessageResponse)
def send_interview_message(
    session_id: int,
    message_data: InterviewMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")
    if session.status != "active":
        raise HTTPException(status_code=400, detail="This interview session is already completed")
        
    # Get last AI question to evaluate against
    last_ai_msg = db.query(InterviewMessage).filter(
        InterviewMessage.session_id == session_id,
        InterviewMessage.sender == "ai"
    ).order_by(InterviewMessage.id.desc()).first()
    
    # Evaluate user's answer
    evaluation = {}
    if last_ai_msg:
        evaluation = ai_service.evaluate_response(
            question=last_ai_msg.text,
            user_answer=message_data.text
        )
        
    # Save user response
    user_msg = InterviewMessage(
        session_id=session_id,
        sender="user",
        text=message_data.text,
        feedback_json=json.dumps(evaluation)
    )
    db.add(user_msg)
    db.commit()
    
    # Get total messages history
    messages = db.query(InterviewMessage).filter(
        InterviewMessage.session_id == session_id
    ).order_by(InterviewMessage.id.asc()).all()
    
    history = [{"sender": m.sender, "text": m.text} for m in messages]
    
    # Limit number of questions to 6 rounds (12 messages)
    if len(messages) >= 12:
        # Prompt final review from user and stop
        ai_msg = InterviewMessage(
            session_id=session_id,
            sender="ai",
            text="Thank you. That completes our mock session. Please click 'Complete Session' to view your detailed analytics review."
        )
        db.add(ai_msg)
        db.commit()
    else:
        # Load resume if exists
        resume = db.query(Resume).filter(Resume.user_id == current_user.id).first()
        resume_text = resume.raw_text if resume else ""
        
        # Incorporate RAG context from resume based on question topic
        rag_context = ""
        if resume_text:
            rag_context = rag_service.query_resume_context(current_user.id, message_data.text)
            
        next_question_prompt_context = resume_text
        if rag_context:
            next_question_prompt_context += f"\n\nHighly relevant Resume context to probe: {rag_context}"
            
        next_question = ai_service.generate_mock_interview_question(
            resume_text=next_question_prompt_context,
            role=session.role,
            type=session.type,
            history=history
        )
        
        ai_msg = InterviewMessage(
            session_id=session_id,
            sender="ai",
            text=next_question
        )
        db.add(ai_msg)
        db.commit()
        
    db.refresh(user_msg)
    return user_msg


@app.post("/api/v1/interview/{session_id}/end", response_model=InterviewSessionResponse)
def end_interview(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")
        
    # Get all user responses evaluation
    user_msgs = db.query(InterviewMessage).filter(
        InterviewMessage.session_id == session_id,
        InterviewMessage.sender == "user"
    ).all()
    
    total_score = 0.0
    valid_scores_count = 0
    feedback_summaries = []
    
    for msg in user_msgs:
        if msg.feedback_json:
            try:
                eval_data = json.loads(msg.feedback_json)
                score = eval_data.get("score", 70.0)
                total_score += float(score)
                valid_scores_count += 1
                feedback_summaries.append(eval_data.get("feedback", ""))
            except Exception:
                pass
                
    avg_score = (total_score / valid_scores_count) if valid_scores_count > 0 else 70.0
    
    session.status = "completed"
    session.score = round(avg_score, 1)
    
    # Generate aggregate summary of performance
    summary_text = f"Candidate completed a {session.type} mock interview for the role of {session.role}. "
    summary_text += f"Average score was {session.score}%. Key highlights: "
    summary_text += " ".join(feedback_summaries[:3])
    session.feedback_summary = summary_text
    
    db.commit()
    db.refresh(session)
    return session


@app.get("/api/v1/interview/history", response_model=List[InterviewSessionListItem])
def get_interview_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sessions = db.query(InterviewSession).filter(
        InterviewSession.user_id == current_user.id
    ).order_by(InterviewSession.created_at.desc()).all()
    return sessions


@app.get("/api/v1/interview/{session_id}", response_model=InterviewSessionResponse)
def get_interview_details(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")
    return session


# --- CODING EVALUATION ---
@app.post("/api/v1/coding/evaluate")
def evaluate_coding_session(
    payload: CodeEvaluationRequest,
    current_user: User = Depends(get_current_user)
):
    feedback = ai_service.evaluate_code(
        language=payload.language,
        problem_statement=payload.problem_statement,
        code=payload.code
    )
    return feedback


# --- ROADMAP ENDPOINTS ---
@app.get("/api/v1/roadmap", response_model=Optional[RoadmapResponse])
def get_or_generate_roadmap(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    roadmap = db.query(LearningRoadmap).filter(LearningRoadmap.user_id == current_user.id).first()
    
    if roadmap:
        return roadmap
        
    # Generate new one
    resume = db.query(Resume).filter(Resume.user_id == current_user.id).first()
    resume_text = resume.raw_text if resume else ""
    
    # Compile historical feedback for gaps
    past_interviews = db.query(InterviewSession).filter(
        InterviewSession.user_id == current_user.id,
        InterviewSession.status == "completed"
    ).limit(3).all()
    
    history_summary = ""
    for idx, session in enumerate(past_interviews):
        history_summary += f"Session {idx+1} ({session.type} - {session.role}): Score {session.score}%. Feedback: {session.feedback_summary}\n"
        
    if not history_summary:
        history_summary = "No mock interviews completed yet."
        
    roadmap_data = ai_service.generate_roadmap(resume_text, history_summary)
    
    new_roadmap = LearningRoadmap(
        user_id=current_user.id,
        roadmap_json=json.dumps(roadmap_data)
    )
    db.add(new_roadmap)
    db.commit()
    db.refresh(new_roadmap)
    return new_roadmap


# --- ANALYTICS ENDPOINTS ---
@app.get("/api/v1/analytics")
def get_analytics_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sessions = db.query(InterviewSession).filter(
        InterviewSession.user_id == current_user.id,
        InterviewSession.status == "completed"
    ).all()
    
    resume = db.query(Resume).filter(Resume.user_id == current_user.id).first()
    ats_score = resume.ats_score if resume else None
    
    total_interviews = len(sessions)
    average_interview_score = 0.0
    
    # Category score averages
    communication_avg = 0.0
    correctness_avg = 0.0
    tone_avg = 0.0
    
    categories_count = 0
    
    score_timeline = []
    
    for s in sessions:
        average_interview_score += s.score
        score_timeline.append({
            "date": s.created_at.strftime("%Y-%m-%d"),
            "score": s.score,
            "type": s.type
        })
        
        # Calculate sub-criteria averages for session
        user_msgs = db.query(InterviewMessage).filter(
            InterviewMessage.session_id == s.id,
            InterviewMessage.sender == "user"
        ).all()
        
        for msg in user_msgs:
            if msg.feedback_json:
                try:
                    eval_data = json.loads(msg.feedback_json)
                    communication_avg += eval_data.get("communication_score", 80)
                    correctness_avg += eval_data.get("correctness_score", 80)
                    tone_avg += eval_data.get("tone_score", 80)
                    categories_count += 1
                except Exception:
                    pass
                    
    if total_interviews > 0:
        average_interview_score = round(average_interview_score / total_interviews, 1)
        
    if categories_count > 0:
        communication_avg = round(communication_avg / categories_count, 1)
        correctness_avg = round(correctness_avg / categories_count, 1)
        tone_avg = round(tone_avg / categories_count, 1)
    else:
        communication_avg = 0.0
        correctness_avg = 0.0
        tone_avg = 0.0
        
    return {
        "ats_score": ats_score,
        "total_interviews": total_interviews,
        "average_interview_score": average_interview_score,
        "skills_breakdown": {
            "Communication": communication_avg,
            "Technical Depth": correctness_avg,
            "Tone & Presence": tone_avg
        },
        "score_timeline": score_timeline
    }
