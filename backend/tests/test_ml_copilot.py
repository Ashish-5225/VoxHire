import pytest
from app.ml_copilot.jd_processor import process_job_description, clean_jd_text
from app.ml_copilot.dataset_manager import get_all_questions, filter_questions
from app.ml_copilot.classifier import baseline_classifier
from app.ml_copilot.retrieval_engine import retrieval_engine
from app.ml_copilot.relevance_scorer import calculate_question_relevance
from app.ml_copilot.evaluator import evaluate_candidate_answer
from app.ml_copilot.benchmark import run_ml_system_benchmark

def test_jd_processor():
    sample_jd = """
    Looking for a Backend Developer with 5+ years of experience in Java, Spring Boot, REST APIs, SQL, PostgreSQL, Docker, and AWS.
    Responsibilities:
    - Build and scale high throughput REST APIs
    - Optimize PostgreSQL queries and indexes
    - Deploy containerized applications to AWS ECS
    """
    result = process_job_description(sample_jd)
    
    assert result["job_role"] == "Backend Developer"
    assert result["years_of_experience"] == 5.0
    assert result["expected_seniority"] == "Senior"
    assert "Spring Boot" in result["required_skills"] or "Java" in result["required_skills"]
    assert "Postgresql" in result["databases"] or "PostgreSQL" in result["databases"]
    assert "Docker" in result["cloud_technologies"] or "Docker" in result["required_skills"]

def test_dataset_manager():
    questions = get_all_questions()
    assert len(questions) >= 10
    
    filtered = filter_questions(role="Backend", skill="Spring Boot")
    assert len(filtered) > 0
    assert any("Spring Boot" in q["skill"] for q in filtered)

def test_classifier():
    res = baseline_classifier.predict("How would you design a scalable microservices architecture?")
    assert "category" in res
    assert "difficulty" in res
    assert res["category"] in ["Technical", "System Design", "Conceptual", "Practical"]


def test_retrieval_engine():
    results = retrieval_engine.search_relevant_questions(
        jd_text="Looking for a Java developer experienced in Spring Boot dependency injection and REST APIs.",
        target_role="Backend Developer",
        skills=["Spring Boot", "Java"],
        top_k=3
    )
    assert len(results) > 0
    top_q, score = results[0]
    assert "question" in top_q
    assert score > 0.0

def test_relevance_scorer():
    sample_jd = process_job_description("Java, Spring Boot, REST API, AWS")
    q_data = {
        "question": "How do you configure dependency injection in Spring Boot?",
        "skill": "Spring Boot",
        "job_role": "Backend Developer",
        "difficulty": "Medium"
    }
    metrics = calculate_question_relevance(
        question_data=q_data,
        jd_info=sample_jd,
        target_role="Backend Developer",
        target_difficulty="Medium"
    )
    assert metrics["quality_score"] >= 0.60
    assert metrics["relevance_score"] >= 0.0

def test_evaluator():
    res = evaluate_candidate_answer(
        question="What is dependency injection?",
        user_answer="Dependency injection is a pattern where the framework injects objects automatically.",
        expected_topics=["IoC", "Dependency Injection", "Spring Container"]
    )
    assert "score" in res
    assert "feedback" in res
    assert "missing_concepts" in res

def test_benchmark():
    report = run_ml_system_benchmark()
    assert "classification_metrics" in report
    assert "retrieval_metrics" in report
    assert "generation_and_relevance_metrics" in report
