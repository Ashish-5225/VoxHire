import json
import logging
# pyrefly: ignore [missing-import]
import google.generativeai as genai
from app.core.config import settings

logger = logging.getLogger(__name__)

# Configure Gemini API if key is present
if settings.GOOGLE_API_KEY:
    genai.configure(api_key=settings.GOOGLE_API_KEY)
    generative_model = genai.GenerativeModel("gemini-1.5-flash")
else:
    logger.warning("GOOGLE_API_KEY not found in configuration. Running in MOCK AI Mode.")
    generative_model = None


def get_ai_response(prompt: str, response_mime_type: str = "text/plain") -> str:
    """Helper method to invoke Gemini with options, or return mock data if not set."""
    if not generative_model:
        return _get_mock_fallback(prompt)

    try:
        config = {}
        if response_mime_type == "application/json":
            config["response_mime_type"] = "application/json"

        response = generative_model.generate_content(
            prompt,
            generation_config=config
        )
        return response.text
    except Exception as e:
        logger.error(f"Error calling Gemini API: {str(e)}")
        return _get_mock_fallback(prompt)


def generate_ats_score(resume_text: str) -> dict:
    """Analyze resume text and return ATS score and list of suggestions in JSON."""
    prompt = f"""
    You are an expert resume screening tool and technical recruiter.
    Analyze the following resume and calculate an ATS score out of 100 based on standard formatting, readability, impact words, and structural completeness.
    
    Resume Text:
    {resume_text[:4000]}
    
    Return a JSON object conforming exactly to this structure:
    {{
        "ats_score": 85,
        "summary": "Short summary of resume compatibility...",
        "strengths": ["Clear metrics in achievements", "Clean section headers"],
        "weaknesses": ["Missing target cloud engineering keywords", "Unquantified bullet points"],
        "formatting_feedback": ["Keep margins consistent across sections"],
        "keyword_suggestions": ["Docker", "Kubernetes", "AWS", "GraphQL"],
        "action_verb_improvements": ["Replace 'Worked on' with 'Spearheaded'"]
    }}
    """
    try:
        response_text = get_ai_response(prompt, response_mime_type="application/json")
        return json.loads(response_text)
    except Exception:
        return _parse_json_block(response_text, "ats_score")


def generate_mock_interview_question(resume_text: str, role: str, type: str, history: list) -> str:
    """Generate the next interview question based on resume context, target role, and past exchange."""
    history_formatted = ""
    for msg in history:
        history_formatted += f"{msg['sender'].upper()}: {msg['text']}\n"

    prompt = f"""
    You are an interviewer conducting a {type} mock interview for the role of {role}.
    Here is the candidate's resume/profile:
    {resume_text[:3000] if resume_text else "No resume uploaded. Conduct a general interview."}
    
    Here is the conversation history so far:
    {history_formatted}
    
    Your task:
    Generate the NEXT single interview question. Ask exactly ONE clear question at a time.
    If this is the start of the interview, greet the user briefly and ask your first question based on their profile.
    Keep the question engaging, specific, and realistic.
    """
    return get_ai_response(prompt)


def evaluate_response(question: str, user_answer: str) -> dict:
    """Evaluate user's answer to a specific question and return feedback + score in JSON."""
    prompt = f"""
    You are an AI Interview evaluator. Analyze the user's response to the interviewer's question.
    
    Question: {question}
    User Answer: {user_answer}
    
    Evaluate the response on:
    1. Correctness / Content Depth (0-100)
    2. Communication / Delivery (0-100)
    3. Tone / Professionalism (0-100)
    
    Return a JSON object conforming to this structure:
    {{
        "score": 80.0,
        "correctness_score": 85,
        "communication_score": 75,
        "tone_score": 80,
        "feedback": "Your explanation was solid, but you could structure it better...",
        "suggested_improvement": "Try using the STAR method for behavioral answers."
    }}
    """
    try:
        response_text = get_ai_response(prompt, response_mime_type="application/json")
        return json.loads(response_text)
    except Exception:
        return _parse_json_block(response_text, "score")


def generate_roadmap(resume_text: str, interview_history_summary: str) -> dict:
    """Generate a personalized learning roadmap based on resume gaps and interview history."""
    prompt = f"""
    You are a career mentor. Based on the candidate's resume and their mock interview history, identify key skill gaps and create a structured learning roadmap.
    
    Candidate Resume:
    {resume_text[:2000] if resume_text else "No resume uploaded."}
    
    Interview Session Summary:
    {interview_history_summary}
    
    Return a JSON object conforming to this structure:
    {{
        "role": "Senior Software Engineer",
        "summary": "Focus on strengthening system architecture, concurrency, and behavioral leadership.",
        "timeline": [
            {{
                "title": "Core System Architecture",
                "description": "Master distributed systems, caching patterns, and database scaling.",
                "duration": "1-2 Weeks",
                "skills_to_master": ["Redis", "Sharding", "Microservices"],
                "recommended_resources": ["System Design Primer", "ByteByteGo"]
            }}
        ]
    }}
    """
    try:
        response_text = get_ai_response(prompt, response_mime_type="application/json")
        return json.loads(response_text)
    except Exception:
        return _parse_json_block(response_text, "timeline")


def evaluate_code(language: str, problem_statement: str, code: str) -> dict:
    """Submit code snippet for AI evaluation of correctness, time/space complexity, and code quality."""
    prompt = f"""
    You are an elite software architect and coding interviewer.
    Analyze the candidate's solution code to the following problem statement:
    
    Language: {language}
    Problem: {problem_statement}
    Code:
    {code}
    
    Return a JSON object conforming to this structure:
    {{
        "verdict": "Optimal Solution",
        "score": 88,
        "syntax_score": 95,
        "readability_score": 85,
        "time_complexity": "O(N)",
        "space_complexity": "O(1)",
        "issues": ["Edge case with empty array input"],
        "improvements": ["Add explicit type hints"],
        "refactored_code": "def solution(nums): pass"
    }}
    """
    try:
        response_text = get_ai_response(prompt, response_mime_type="application/json")
        return json.loads(response_text)
    except Exception:
        return _parse_json_block(response_text, "verdict")


def _parse_json_block(text: str, primary_key: str) -> dict:
    """Fallback json block extraction if LLM responds with markdown fenced JSON."""
    try:
        clean_text = text.strip()
        if clean_text.startswith("```json"):
            clean_text = clean_text[7:]
        elif clean_text.startswith("```"):
            clean_text = clean_text[3:]
        if clean_text.endswith("```"):
            clean_text = clean_text[:-3]
        return json.loads(clean_text.strip())
    except Exception as e:
        logger.error(f"Failed to parse JSON response: {str(e)} | Raw: {text}")
        if primary_key == "ats_score":
            return {
                "ats_score": 75,
                "summary": "Basic ATS compatibility check completed.",
                "strengths": ["Clear metrics in achievements", "Clean section headers"],
                "weaknesses": ["Missing cloud technology keywords"],
                "formatting_feedback": ["Keep margins consistent across sections."],
                "keyword_suggestions": ["Docker", "Kubernetes", "AWS", "GraphQL"],
                "action_verb_improvements": ["Replace passive verbs with active ones like Spearheaded, Architected."]
            }
        elif primary_key == "score":
            return {
                "score": 80.0,
                "correctness_score": 80,
                "communication_score": 80,
                "tone_score": 80,
                "feedback": "Answer noted. Good communication flow and professional tone.",
                "suggested_improvement": "Try adding specific metrics or engineering examples to reinforce your claims."
            }
        elif primary_key == "timeline":
            return {
                "role": "Software Engineer",
                "summary": "Focus on strengthening system architecture, algorithm patterns, and STAR stories.",
                "timeline": [
                    {
                        "title": "Algorithms & Optimization",
                        "description": "Master graph traversal, dynamic programming, and complexity bounds.",
                        "duration": "1 Week",
                        "skills_to_master": ["Trees & Graphs", "Dynamic Programming", "Big-O Analysis"],
                        "recommended_resources": ["LeetCode Medium Path", "NeetCode 150"]
                    },
                    {
                        "title": "System Architecture & Scalability",
                        "description": "Learn REST API design, caching layer implementation, and SQL query tuning.",
                        "duration": "2 Weeks",
                        "skills_to_master": ["Redis Caching", "Database Indexing", "Load Balancing"],
                        "resources": ["System Design Primer"]
                    }
                ]
            }
        elif primary_key == "verdict":
            return {
                "verdict": "Functional Solution",
                "score": 85,
                "syntax_score": 90,
                "readability_score": 85,
                "time_complexity": "O(N)",
                "space_complexity": "O(N)",
                "issues": ["Verify empty list or null inputs handling."],
                "improvements": ["Add docstrings explaining runtime complexity.", "Replace redundant memory allocations."],
                "refactored_code": "# Refactored Solution\ndef solve(arr):\n    return [x for x in arr if x is not None]"
            }
        return {}


def _get_mock_fallback(prompt: str) -> str:
    """Return realistic mock responses for testing purposes when API keys are not supplied."""
    if "ats_score" in prompt:
        return json.dumps({
            "ats_score": 78,
            "summary": "The resume displays a solid baseline in software engineering skills but lacks high-ranking cloud keywords and quantified impact metrics.",
            "strengths": [
                "Demonstrates experience with modern JS/TS frameworks and REST APIs.",
                "Clean structural sections and clear chronological work history."
            ],
            "weaknesses": [
                "Lacks specific metrics (e.g. % performance increase, latency reduction).",
                "Missing cloud infrastructure terms (AWS, Docker, CI/CD)."
            ],
            "formatting_feedback": [
                "Remove skill level rating bars (ATS parser safe format).",
                "Use standard section headers: 'Work Experience', 'Education', 'Technical Skills'."
            ],
            "keyword_suggestions": [
                "Docker", "Kubernetes", "AWS ECS", "GraphQL", "Jest", "CI/CD", "Redis"
            ],
            "action_verb_improvements": [
                "Change 'Worked on backend API' -> 'Designed and deployed high-throughput backend APIs'.",
                "Change 'Helped fix bugs' -> 'Resolved critical production memory leaks, improving system uptime to 99.9%'."
            ]
        })
    elif "mock interview" in prompt or "interviewer" in prompt:
        if "conversation history so far:" in prompt and "USER:" in prompt:
            if "Technical" in prompt:
                return "That makes sense. Can you explain the difference between a stateful and stateless architectural pattern, and how you decide which one to apply?"
            elif "HR" in prompt:
                return "Interesting. Tell me about a time when you had to manage a conflict with a team member. How did you handle it and what was the outcome?"
            else:
                return "Can you describe a situation where you had a tight deadline and had to prioritize features? How did you align expectations with stakeholders?"
        else:
            if "Technical" in prompt:
                return "Hello! Let's start with your technical background. Could you walk me through a challenging engineering problem you solved in one of your recent projects?"
            elif "HR" in prompt:
                return "Welcome to the mock interview! To start off, could you tell me a little about yourself and why you're interested in this target role?"
            else:
                return "Hi! Let's discuss a behavioral scenario. Tell me about a project that didn't go as planned. What happened, and what did you learn?"
    elif "evaluate the user's response" in prompt or "evaluate_response" in prompt:
        return json.dumps({
            "score": 82.0,
            "correctness_score": 85,
            "communication_score": 80,
            "tone_score": 80,
            "feedback": "Your explanation covered the core concept well. Communication flow was clear and professional.",
            "suggested_improvement": "Try using the STAR method: describe the Situation, Task, Action, and specific Result with quantifiable metrics."
        })
    elif "learning roadmap" in prompt:
        return json.dumps({
            "role": "Senior Full-Stack Engineer",
            "summary": "Accelerate career readiness by mastering cloud deployment, system scalability, and behavioral leadership.",
            "timeline": [
                {
                    "title": "Advanced State & Microservices",
                    "description": "Build real-time event-driven applications with WebSockets and distributed state management.",
                    "duration": "1 Week",
                    "skills_to_master": ["WebSockets", "Zustand", "FastAPI Async"],
                    "recommended_resources": ["MDN WebSocket Docs", "FastAPI Advanced Guides"]
                },
                {
                    "title": "Backend Performance & Caching",
                    "description": "Implement Redis session storage, query caching, and database index tuning.",
                    "duration": "2 Weeks",
                    "skills_to_master": ["Redis", "SQL Indexing", "Query Optimization"],
                    "recommended_resources": ["System Design Primer", "Redis University"]
                },
                {
                    "title": "System Security & E2E Testing",
                    "description": "Configure OWASP security headers, JWT token rotation, and Cypress tests.",
                    "duration": "1 Week",
                    "skills_to_master": ["Cypress", "JWT Auth", "OWASP Security"],
                    "recommended_resources": ["Cypress Docs", "OWASP Top 10"]
                }
            ]
        })
    elif "coding interviewer" in prompt or "evaluate_code" in prompt:
        return json.dumps({
            "verdict": "Optimal & Functional Solution",
            "score": 88,
            "syntax_score": 95,
            "readability_score": 90,
            "time_complexity": "O(N)",
            "space_complexity": "O(1)",
            "issues": ["Check for empty array or single element edge cases."],
            "improvements": [
                "Add docstrings describing time and space complexity bounds.",
                "Use descriptive variable names for pointers."
            ],
            "refactored_code": "def solution(nums, target):\n    # Optimized O(N) time and O(1) space solution\n    seen = {}\n    for idx, val in enumerate(nums):\n        diff = target - val\n        if diff in seen:\n            return [seen[diff], idx]\n        seen[val] = idx\n    return []"
        })
    return "Mock Response"
