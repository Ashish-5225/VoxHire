from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from app.ml_copilot.jd_processor import process_job_description
from app.ml_copilot.generator import generate_personalized_interview_questions, generate_adaptive_followup_question
from app.ml_copilot.classifier import classify_question_llm, baseline_classifier
from app.ml_copilot.relevance_scorer import calculate_question_relevance
from app.ml_copilot.evaluator import evaluate_candidate_answer
from app.ml_copilot.benchmark import run_ml_system_benchmark

router = APIRouter(prefix="/api/v1/copilot", tags=["ML Interview Copilot"])

# --- Request/Response Schemas ---
class ProcessJDRequest(BaseModel):
    jd_text: str = Field(..., description="Job Description text to analyze")

class GenerateQuestionsRequest(BaseModel):
    jd_text: str
    candidate_resume: Optional[str] = ""
    candidate_skills: Optional[List[str]] = []
    candidate_projects: Optional[List[str]] = []
    target_role: Optional[str] = ""
    interview_type: Optional[str] = "Technical"
    difficulty: Optional[str] = "Medium"
    interview_round: Optional[str] = "Technical Round 1"
    num_questions: Optional[int] = 5

class ClassifyQuestionRequest(BaseModel):
    question_text: str
    expected_topics: Optional[List[str]] = []

class ScoreRelevanceRequest(BaseModel):
    question: str
    jd_text: str
    target_role: Optional[str] = ""
    target_difficulty: Optional[str] = "Medium"
    candidate_resume: Optional[str] = ""

class EvaluateAnswerRequest(BaseModel):
    question: str
    user_answer: str
    expected_topics: Optional[List[str]] = []
    ideal_answer: Optional[str] = ""
    jd_context: Optional[str] = ""

class AdaptiveFollowupRequest(BaseModel):
    previous_question: str
    candidate_answer: str
    jd_text: str
    candidate_resume: Optional[str] = ""
    score: Optional[float] = 7.0
    missing_concepts: Optional[List[str]] = []


# --- Endpoints ---

@router.post("/process-jd")
def process_jd_endpoint(payload: ProcessJDRequest):
    if not payload.jd_text.strip():
        raise HTTPException(status_code=400, detail="Job Description text cannot be empty.")
    result = process_job_description(payload.jd_text)
    return result


@router.post("/generate-questions")
def generate_questions_endpoint(payload: GenerateQuestionsRequest):
    jd_info = process_job_description(payload.jd_text)
    questions = generate_personalized_interview_questions(
        jd_info=jd_info,
        candidate_resume=payload.candidate_resume,
        candidate_skills=payload.candidate_skills,
        candidate_projects=payload.candidate_projects,
        target_role=payload.target_role,
        interview_type=payload.interview_type,
        difficulty=payload.difficulty,
        interview_round=payload.interview_round,
        num_questions=payload.num_questions
    )
    return {"questions": questions, "jd_metadata": jd_info}


@router.post("/classify-question")
def classify_question_endpoint(payload: ClassifyQuestionRequest):
    if not payload.question_text.strip():
        raise HTTPException(status_code=400, detail="Question text cannot be empty.")
    llm_res = classify_question_llm(payload.question_text, payload.expected_topics)
    baseline_res = baseline_classifier.predict(payload.question_text)
    return {
        "llm_classifier": llm_res,
        "baseline_classifier": baseline_res
    }


@router.post("/score-relevance")
def score_relevance_endpoint(payload: ScoreRelevanceRequest):
    jd_info = process_job_description(payload.jd_text)
    res = calculate_question_relevance(
        question_data={"question": payload.question},
        jd_info=jd_info,
        candidate_resume_text=payload.candidate_resume,
        target_role=payload.target_role,
        target_difficulty=payload.target_difficulty
    )
    return res


@router.post("/evaluate-answer")
def evaluate_answer_endpoint(payload: EvaluateAnswerRequest):
    if not payload.user_answer.strip():
        raise HTTPException(status_code=400, detail="User answer cannot be empty.")
    res = evaluate_candidate_answer(
        question=payload.question,
        user_answer=payload.user_answer,
        expected_topics=payload.expected_topics,
        ideal_answer=payload.ideal_answer,
        jd_context=payload.jd_context
    )
    return res


@router.post("/adaptive-followup")
def adaptive_followup_endpoint(payload: AdaptiveFollowupRequest):
    jd_info = process_job_description(payload.jd_text)
    eval_dict = {"score": payload.score, "missing_concepts": payload.missing_concepts}
    res = generate_adaptive_followup_question(
        previous_question=payload.previous_question,
        candidate_answer=payload.candidate_answer,
        jd_info=jd_info,
        candidate_resume=payload.candidate_resume,
        answer_evaluation=eval_dict
    )
    return res


@router.get("/benchmark")
def get_benchmark_metrics():
    return run_ml_system_benchmark()
