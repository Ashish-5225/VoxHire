from typing import List, Dict, Any, Optional
from app.services.rag_service import _get_embedding, _cosine_similarity

def calculate_question_relevance(
    question_data: Dict[str, Any],
    jd_info: Dict[str, Any],
    candidate_resume_text: str = "",
    target_role: str = "",
    target_difficulty: str = "Medium",
    history_questions: List[str] = None
) -> Dict[str, Any]:
    """
    Calculate multi-dimensional relevance scores for a candidate question:
    1. Relevance Score (semantic similarity with JD)
    2. Skill Match Score (overlap of skills in question vs JD required skills)
    3. Role Match Score (alignment with target job role)
    4. Difficulty Score (alignment with requested seniority/difficulty)
    5. Resume Match Score (alignment with candidate resume/projects)
    6. Novelty Score (uniqueness vs session question history)
    """
    question_text = question_data.get("question", "")
    q_skill = question_data.get("skill", "").lower()
    q_role = question_data.get("job_role", "").lower()
    q_diff = question_data.get("difficulty", "Medium").lower()
    
    jd_text = jd_info.get("cleaned_text", "")
    jd_role = (target_role or jd_info.get("job_role", "")).lower()
    required_skills = [s.lower() for s in jd_info.get("required_skills", [])]
    
    # 1. Semantic Relevance Score (Cosine Similarity)
    q_vec = _get_embedding(question_text)
    jd_vec = _get_embedding(jd_text[:1000])
    relevance_score = max(0.0, min(1.0, _cosine_similarity(q_vec, jd_vec)))
    
    # 2. Skill Match Score
    if required_skills:
        skill_match_score = 1.0 if any(q_skill in s or s in q_skill for s in required_skills) else 0.4
    else:
        skill_match_score = 0.7
        
    # 3. Role Match Score
    if jd_role and q_role:
        if jd_role in q_role or q_role in jd_role:
            role_match_score = 1.0
        elif any(w in q_role for w in jd_role.split()):
            role_match_score = 0.8
        else:
            role_match_score = 0.5
    else:
        role_match_score = 0.75

    # 4. Difficulty Match Score
    target_diff_clean = target_difficulty.lower()
    if q_diff == target_diff_clean:
        difficulty_score = 1.0
    elif (q_diff == "medium" and target_diff_clean in ["easy", "hard"]) or \
         (q_diff in ["easy", "hard"] and target_diff_clean == "medium"):
        difficulty_score = 0.75
    else:
        difficulty_score = 0.5

    # 5. Resume Match Score
    if candidate_resume_text:
        res_vec = _get_embedding(candidate_resume_text[:800])
        resume_match_score = max(0.0, min(1.0, _cosine_similarity(q_vec, res_vec)))
    else:
        resume_match_score = 0.70

    # 6. Novelty Score (Uniqueness vs history)
    if history_questions and len(history_questions) > 0:
        max_sim = 0.0
        for past_q in history_questions:
            past_vec = _get_embedding(past_q)
            sim = _cosine_similarity(q_vec, past_vec)
            if sim > max_sim:
                max_sim = sim
        novelty_score = max(0.0, 1.0 - max_sim)
    else:
        novelty_score = 1.0

    # Composite Question Quality Score
    quality_score = (
        0.30 * relevance_score +
        0.20 * skill_match_score +
        0.15 * role_match_score +
        0.15 * difficulty_score +
        0.10 * resume_match_score +
        0.10 * novelty_score
    )

    quality_score = round(float(quality_score), 4)

    return {
        "question": question_text,
        "quality_score": quality_score,
        "relevance_score": round(float(relevance_score), 4),
        "skill_match_score": round(float(skill_match_score), 4),
        "role_match_score": round(float(role_match_score), 4),
        "difficulty_score": round(float(difficulty_score), 4),
        "resume_match_score": round(float(resume_match_score), 4),
        "novelty_score": round(float(novelty_score), 4),
        "is_relevant": quality_score >= 0.65
    }

def filter_relevant_questions(
    questions: List[Dict[str, Any]],
    jd_info: Dict[str, Any],
    candidate_resume_text: str = "",
    target_role: str = "",
    target_difficulty: str = "Medium",
    min_threshold: float = 0.65
) -> List[Dict[str, Any]]:
    """Filter out questions failing relevance threshold and return sorted by quality score."""
    scored_list = []
    for q in questions:
        res = calculate_question_relevance(
            question_data=q,
            jd_info=jd_info,
            candidate_resume_text=candidate_resume_text,
            target_role=target_role,
            target_difficulty=target_difficulty
        )
        if res["quality_score"] >= min_threshold:
            q_copy = dict(q)
            q_copy["scoring_metrics"] = res
            q_copy["relevance_score"] = res["quality_score"]
            scored_list.append(q_copy)

    scored_list.sort(key=lambda x: x["relevance_score"], reverse=True)
    return scored_list
