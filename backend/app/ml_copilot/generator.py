import json
import logging
from typing import List, Dict, Any, Optional
from app.services import ai_service
from app.ml_copilot.retrieval_engine import retrieval_engine
from app.ml_copilot.relevance_scorer import calculate_question_relevance
from app.ml_copilot.classifier import baseline_classifier

logger = logging.getLogger(__name__)

def generate_personalized_interview_questions(
    jd_info: Dict[str, Any],
    candidate_resume: str = "",
    candidate_skills: List[str] = None,
    candidate_projects: List[str] = None,
    target_role: str = "",
    interview_type: str = "Technical",
    difficulty: str = "Medium",
    interview_round: str = "Technical Round 1",
    num_questions: int = 5
) -> List[Dict[str, Any]]:
    """
    Generate personalized interview questions using Hybrid RAG architecture:
    JD/Resume Information + Semantic Retrieval + LLM Generation + Question Validation & Grounding.
    """
    role = target_role or jd_info.get("job_role", "Software Engineer")
    req_skills = jd_info.get("required_skills", [])
    
    # 1. Hybrid RAG: Retrieve seed questions matching JD & candidate context
    retrieved_pairs = retrieval_engine.search_relevant_questions(
        jd_text=jd_info.get("cleaned_text", ""),
        target_role=role,
        skills=req_skills,
        top_k=4
    )
    
    retrieved_context_str = ""
    for idx, (q_data, sim_score) in enumerate(retrieved_pairs):
        retrieved_context_str += f"- Seed {idx+1}: [{q_data['skill']}] {q_data['question']} (Ideal topics: {', '.join(q_data['expected_topics'])})\n"
        
    prompt = f"""
    You are an expert technical interviewer and hiring manager.
    Generate a set of {num_questions} personalized, highly targeted interview questions based on the following candidate and job profile.

    Job Role: {role}
    Interview Type: {interview_type}
    Interview Round: {interview_round}
    Target Difficulty: {difficulty}
    
    Job Description Context:
    - Required Skills: {', '.join(req_skills)}
    - Seniority Level: {jd_info.get('expected_seniority', 'Mid-Level')}
    - Key Responsibilities: {'; '.join(jd_info.get('responsibilities', []))}
    
    Candidate Profile:
    - Resume Context: {candidate_resume[:1500] if candidate_resume else "No resume uploaded."}
    - Candidate Skills: {', '.join(candidate_skills) if candidate_skills else "Extracted from resume."}
    - Candidate Projects: {', '.join(candidate_projects) if candidate_projects else "N/A"}

    Retrieved RAG Context (Reference question archetypes):
    {retrieved_context_str}

    Instructions:
    1. Do NOT simply copy sentences from the JD or resume.
    2. Generate questions that test conceptual depth, practical implementation, system design trade-offs, debugging, or real-world problem-solving.
    3. Ground each question in a specific technology and responsibility from the JD or candidate resume.
    4. Provide a clear "reason" explaining why this question was chosen.

    Return JSON array of question objects matching this exact structure:
    [
        {{
            "question": "How would you containerize a Spring Boot application using Docker and deploy it to AWS?",
            "category": "Technical",
            "skill": "Docker",
            "difficulty": "{difficulty}",
            "question_type": "Practical",
            "reason": "The JD requires Docker and AWS, and candidate resume mentions Spring Boot REST API deployment.",
            "expected_topics": ["Multi-stage Dockerfile", "Containerization", "ECS/EKS Deployment"],
            "ideal_answer": "Create a multi-stage Docker build...",
            "follow_up_question": "How would you manage container secret keys securely in AWS?"
        }}
    ]
    """

    try:
        response_text = ai_service.get_ai_response(prompt, response_mime_type="application/json")
        raw_questions = json.loads(response_text)
        if not isinstance(raw_questions, list):
            raw_questions = [raw_questions]
    except Exception as e:
        logger.error(f"Error calling LLM generator: {str(e)}")
        # Fallback to retrieved seed questions
        raw_questions = []
        for q_data, sim in retrieved_pairs:
            raw_questions.append({
                "question": q_data["question"],
                "category": q_data.get("category", "Technical"),
                "skill": q_data.get("skill", "Software Engineering"),
                "difficulty": q_data.get("difficulty", difficulty),
                "question_type": q_data.get("question_type", "Conceptual"),
                "reason": f"Retrieved question matching skill {q_data.get('skill')} required in JD.",
                "expected_topics": q_data.get("expected_topics", []),
                "ideal_answer": q_data.get("ideal_answer", ""),
                "follow_up_question": q_data.get("follow_up_questions", ["Can you elaborate on that?"])[0]
            })

    # Validate and Score Relevance for generated questions
    validated_questions = []
    for q in raw_questions:
        relevance_metrics = calculate_question_relevance(
            question_data=q,
            jd_info=jd_info,
            candidate_resume_text=candidate_resume,
            target_role=role,
            target_difficulty=difficulty
        )
        
        q["relevance_score"] = relevance_metrics["quality_score"]
        q["relevance_metrics"] = relevance_metrics
        
        if not q.get("category"):
            cls_res = baseline_classifier.predict(q["question"])
            q["category"] = cls_res["category"]
            
        validated_questions.append(q)

    # Sort by relevance score
    validated_questions.sort(key=lambda x: x["relevance_score"], reverse=True)
    return validated_questions[:num_questions]


def generate_adaptive_followup_question(
    previous_question: str,
    candidate_answer: str,
    jd_info: Dict[str, Any],
    candidate_resume: str = "",
    answer_evaluation: Dict[str, Any] = None
) -> Dict[str, Any]:
    """
    Generate dynamic adaptive follow-up question based on candidate performance.
    If answer is weak -> ask simpler probing question.
    If answer is strong -> ask deeper technical challenge.
    """
    score = answer_evaluation.get("score", 7.0) if answer_evaluation else 7.0
    missing_concepts = answer_evaluation.get("missing_concepts", []) if answer_evaluation else []
    
    if score >= 8.0:
        adaptation_strategy = "Candidate gave a strong answer. Ask a deeper, advanced technical or architectural trade-off follow-up question."
    elif score <= 5.5:
        adaptation_strategy = "Candidate gave a weak or incomplete answer. Ask a simpler, foundational probing question to help them clarify basic concepts."
    else:
        adaptation_strategy = "Candidate gave a moderate answer. Ask a targeted follow-up focusing on missing concepts."

    prompt = f"""
    You are an adaptive technical interviewer.
    Formulate the next follow-up question based on the candidate's previous response.

    Previous Question: "{previous_question}"
    Candidate Answer: "{candidate_answer}"
    Candidate Performance Score: {score} / 10
    Missing Concepts Identified: {', '.join(missing_concepts) if missing_concepts else 'None'}
    Adaptation Strategy: {adaptation_strategy}

    Job Description Context:
    {jd_info.get('cleaned_text', '')[:600]}

    Return JSON:
    {{
        "follow_up_question": "How did you handle token expiration and refresh tokens in your JWT implementation?",
        "strategy": "Probing deeper into security trade-offs",
        "difficulty": "Hard",
        "rationale": "Candidate mentioned JWT but omitted refresh token rotation details."
    }}
    """
    try:
        response_text = ai_service.get_ai_response(prompt, response_mime_type="application/json")
        return json.loads(response_text)
    except Exception:
        return {
            "follow_up_question": f"Could you elaborate more on how you handled {missing_concepts[0] if missing_concepts else 'edge cases'} in your implementation?",
            "strategy": "Standard follow-up",
            "difficulty": "Medium",
            "rationale": "Fallback probing follow-up question."
        }


def generate_question_hint_and_ideal_answer(
    question: str,
    user_draft: str = "",
    jd_info: Dict[str, Any] = None,
    candidate_resume: str = ""
) -> Dict[str, Any]:
    """
    Generate live AI hints, key target concepts, and model answer outline for a candidate during an active interview.
    """
    jd_context = jd_info.get('cleaned_text', '')[:500] if jd_info else ""
    prompt = f"""
    You are an expert tech lead and interview mentor.
    Provide actionable hints and structured target response guidance for the following interview question.

    Interview Question: "{question}"
    Candidate Draft Response (Optional): "{user_draft}"
    Job Description Context: {jd_context}

    Return JSON:
    {{
        "hint": "Focus on explaining the core trade-off between consistency and availability (CAP Theorem). Mention how index design affects write latency.",
        "key_concepts": ["CAP Theorem", "DB Indexing", "Write Bottlenecks", "Partitioning"],
        "ideal_answer_structure": "1. Define the problem & high-level architecture.\\n2. Detail data persistence & indexing trade-offs.\\n3. Address edge cases like replication lag and failover handling."
    }}
    """
    try:
        response_text = ai_service.get_ai_response(prompt, response_mime_type="application/json")
        return json.loads(response_text)
    except Exception as e:
        logger.error(f"Error generating hint: {str(e)}")
        return {
            "hint": "Break your answer into: 1. Core concept definition, 2. Practical trade-offs, 3. Real-world example from your projects.",
            "key_concepts": ["Core Concept", "Practical Implementation", "Trade-offs"],
            "ideal_answer_structure": "Outline the main principle first, explain architectural considerations, and conclude with monitoring or performance optimization."
        }

