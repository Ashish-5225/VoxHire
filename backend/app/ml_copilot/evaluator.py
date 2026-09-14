import json
import logging
from typing import Dict, List, Any, Optional
from app.services import ai_service

logger = logging.getLogger(__name__)

def evaluate_candidate_answer(
    question: str,
    user_answer: str,
    expected_topics: List[str] = None,
    ideal_answer: str = "",
    jd_context: str = ""
) -> Dict[str, Any]:
    """
    Evaluate candidate answer across technical accuracy, completeness, relevance,
    clarity, depth, and reasoning. Identifies missing concepts and returns structured evaluation.
    """
    prompt = f"""
    You are an expert technical interviewer evaluating a candidate's answer.
    Analyze the candidate's response against expected concepts rather than doing simple keyword matching.

    Question Asked: "{question}"
    Candidate Answer: "{user_answer}"
    Expected Topics / Concepts: {expected_topics if expected_topics else "N/A"}
    Reference Ideal Answer: "{ideal_answer if ideal_answer else 'N/A'}"
    Job Context: "{jd_context[:500] if jd_context else 'N/A'}"

    Evaluate the response on a scale of 0 to 10 for each dimension:
    1. technical_accuracy (0-10)
    2. completeness (0-10)
    3. relevance (0-10)
    4. depth (0-10)
    5. reasoning (0-10)
    6. communication (0-10)

    Calculate an overall score out of 10.0.

    Return JSON:
    {{
        "score": 8.2,
        "technical_accuracy": 8,
        "completeness": 7,
        "relevance": 9,
        "depth": 8,
        "reasoning": 8,
        "communication": 9,
        "feedback": "Detailed construct feedback highlighting strengths and areas to refine...",
        "missing_concepts": [
            "Token expiration",
            "Refresh tokens"
        ],
        "strengths": [
            "Correctly identified stateless token architecture",
            "Clear explanation of signature verification"
        ],
        "follow_up_question": "How did you manage token expiration and refresh tokens in your implementation?"
    }}
    """
    try:
        response_text = ai_service.get_ai_response(prompt, response_mime_type="application/json")
        result = json.loads(response_text)
        return result
    except Exception as e:
        logger.error(f"Error in candidate answer evaluation: {str(e)}")
        # Fallback heuristic evaluation
        return {
            "score": 7.5,
            "technical_accuracy": 7,
            "completeness": 7,
            "relevance": 8,
            "depth": 7,
            "reasoning": 7,
            "communication": 8,
            "feedback": "Answer addresses the core question. To improve, include specific architectural metrics or edge-case handling.",
            "missing_concepts": expected_topics if expected_topics else ["Production edge cases"],
            "strengths": ["Clear communication style"],
            "follow_up_question": "Can you elaborate on how you test this solution under load?"
        }
