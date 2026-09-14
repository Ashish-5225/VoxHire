import re
import math
from typing import Dict, List, Any, Tuple

# Comprehensive Technology Taxonomy Dictionary
TAXONOMY_DICTIONARY = {
    "programming_languages": [
        "python", "java", "javascript", "typescript", "c++", "c#", "go", "golang",
        "rust", "ruby", "php", "swift", "kotlin", "scala", "sql", "bash", "shell", "r"
    ],
    "frameworks_and_libraries": [
        "spring boot", "spring", "react", "react.js", "reactjs", "angular", "vue", "vue.js",
        "node.js", "nodejs", "express", "express.js", "fastapi", "django", "flask", "next.js",
        "nextjs", "asp.net", "net core", "pytorch", "tensorflow", "scikit-learn", "sklearn",
        "keras", "pandas", "numpy", "redux", "graphql", "tailwind", "bootstrap"
    ],
    "databases": [
        "sql", "postgresql", "postgres", "mysql", "mongodb", "mongo", "redis", "oracle",
        "sqlite", "dynamodb", "cassandra", "elasticsearch", "neo4j", "mariadb", "snowflake",
        "bigquery", "cockroachdb"
    ],
    "cloud_technologies": [
        "aws", "amazon web services", "azure", "gcp", "google cloud", "docker", "kubernetes",
        "k8s", "terraform", "cloudformation", "serverless", "lambda", "ecs", "eks", "s3",
        "ec2", "cloudfront", "gke"
    ],
    "tools_and_platforms": [
        "git", "github", "gitlab", "jenkins", "jira", "kafka", "rabbitmq", "postman",
        "linux", "unix", "ci/cd", "prometheus", "grafana", "swagger", "openapi",
        "maven", "gradle", "npm", "yarn", "webpack", "vite"
    ],
    "soft_skills": [
        "communication", "leadership", "problem solving", "teamwork", "collaboration",
        "mentorship", "adaptability", "critical thinking", "time management", "agile",
        "scrum", "stakeholder management", "conflict resolution", "ownership"
    ],
    "domain_knowledge": [
        "rest api", "restful", "microservices", "system design", "distributed systems",
        "scalability", "security", "cybersecurity", "authentication", "authorization",
        "jwt", "oauth", "ci/cd", "machine learning", "artificial intelligence", "nlp",
        "deep learning", "devops", "cloud computing", "object oriented programming", "oop",
        "data structures", "algorithms", "fintech", "e-commerce", "healthcare"
    ]
}

# Domain Taxonomy Mapping Rules
TAXONOMY_MAP = {
    "spring boot": "Backend Development",
    "java": "Backend Development",
    "fastapi": "Backend Development",
    "django": "Backend Development",
    "node.js": "Backend Development",
    "express": "Backend Development",
    "react": "Frontend Development",
    "angular": "Frontend Development",
    "vue": "Frontend Development",
    "typescript": "Frontend Development",
    "postgresql": "Databases & Storage",
    "mysql": "Databases & Storage",
    "mongodb": "Databases & Storage",
    "redis": "Databases & Storage",
    "aws": "Cloud & Infrastructure",
    "azure": "Cloud & Infrastructure",
    "gcp": "Cloud & Infrastructure",
    "docker": "DevOps & Containerization",
    "kubernetes": "DevOps & Containerization",
    "terraform": "DevOps & Infrastructure",
    "microservices": "System Design & Architecture",
    "rest api": "API Design & Protocols",
    "system design": "System Design & Architecture",
    "pytorch": "Machine Learning & AI",
    "tensorflow": "Machine Learning & AI",
    "cybersecurity": "Security & Identity",
    "jwt": "Security & Identity"
}

def clean_jd_text(raw_text: str) -> str:
    """Clean and normalize Job Description text."""
    if not raw_text:
        return ""
    # Strip HTML tags
    text = re.sub(r'<[^>]*>', ' ', raw_text)
    # Replace non-standard bullets & spaces
    text = re.sub(r'[\r\n\t]+', ' ', text)
    text = re.sub(r'[•\-*]\s*', '. ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def extract_years_of_experience(text: str) -> Tuple[float, str]:
    """Extract required years of experience and determine expected seniority."""
    text_lower = text.lower()
    
    # Matching patterns like "5+ years", "3-5 years", "minimum 7 years of experience"
    patterns = [
        r'(\d+)\s*\+\s*years',
        r'(\d+)\s*to\s*(\d+)\s*years',
        r'(\d+)\s*-\s*(\d+)\s*years',
        r'(\d+)\s*years\s*of\s*experience',
        r'minimum\s*(\d+)\s*years'
    ]
    
    yoe = 0.0
    for p in patterns:
        match = re.search(p, text_lower)
        if match:
            groups = match.groups()
            if len(groups) == 1:
                yoe = float(groups[0])
            elif len(groups) == 2:
                yoe = (float(groups[0]) + float(groups[1])) / 2.0
            break
            
    # Determine seniority based on YOE or keywords
    if "principal" in text_lower or "staff" in text_lower or yoe >= 8:
        seniority = "Principal / Staff"
    elif "lead" in text_lower or "manager" in text_lower or yoe >= 6:
        seniority = "Lead / Senior Manager"
    elif "senior" in text_lower or yoe >= 4:
        seniority = "Senior"
    elif "mid" in text_lower or yoe >= 2:
        seniority = "Mid-Level"
    elif "junior" in text_lower or "entry" in text_lower or "intern" in text_lower:
        seniority = "Junior / Entry Level"
    else:
        seniority = "Mid-Level"  # Default assumption
        
    return yoe, seniority

def extract_job_role(text: str) -> str:
    """Identify job title / role from JD text."""
    text_lower = text.lower()
    role_titles = [
        "backend developer", "backend engineer", "frontend developer", "frontend engineer",
        "full stack developer", "full stack engineer", "software engineer", "software developer",
        "data scientist", "machine learning engineer", "devops engineer", "cloud architect",
        "site reliability engineer", "system architect", "mobile developer", "qa engineer",
        "product manager"
    ]
    
    for r in role_titles:
        if r in text_lower:
            return r.title()
            
    # Fallback heuristic: check first 100 characters for title cues
    first_part = text[:150]
    match = re.search(r'looking for a\s+([A-Za-z\s]+?)(?:with|to|in|\.|\,)', first_part, re.IGNORECASE)
    if match:
        extracted = match.group(1).strip()
        if len(extracted) < 40:
            return extracted.title()
            
    return "Software Engineer"

def extract_responsibilities(text: str) -> List[str]:
    """Extract key responsibilities and duties from the JD."""
    responsibilities = []
    # Look for bullet points or sections following "responsibilities", "what you will do", etc.
    sentences = re.split(r'\.|\n|;', text)
    action_verbs = ["build", "design", "develop", "implement", "create", "manage", "lead", "deploy", "architect", "maintain", "optimize"]
    
    for s in sentences:
        s_clean = s.strip()
        if len(s_clean) > 15:
            first_word = s_clean.split()[0].lower()
            if first_word in action_verbs or any(s_clean.lower().startswith(v) for v in action_verbs):
                responsibilities.append(s_clean)
                if len(responsibilities) >= 6:
                    break
                    
    if not responsibilities:
        responsibilities = [
            "Build, design, and maintain scalable applications.",
            "Collaborate with cross-functional teams to deploy features.",
            "Optimize system performance and resolve engineering bottlenecks."
        ]
    return responsibilities

def extract_keywords_tfidf(text: str, top_n: int = 12) -> List[str]:
    """Extract important keywords from text using term frequency heuristics."""
    stopwords = set([
        "the", "a", "an", "and", "or", "in", "of", "to", "for", "with", "on", "at", "by", "from",
        "up", "about", "into", "over", "after", "is", "are", "was", "were", "be", "been", "being",
        "have", "has", "had", "do", "does", "did", "but", "at", "by", "this", "that", "these", "those",
        "looking", "experience", "candidate", "role", "team", "work", "working", "strong", "good",
        "knowledge", "skills", "ability", "years", "required", "preferred"
    ])
    
    words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
    tf = {}
    for w in words:
        if w not in stopwords:
            tf[w] = tf.get(w, 0) + 1
            
    sorted_tf = sorted(tf.items(), key=lambda x: x[1], reverse=True)
    return [k.title() for k, v in sorted_tf[:top_n]]

def process_job_description(raw_jd_text: str) -> Dict[str, Any]:
    """
    Main NLP Pipeline function to process Job Description and return structured information:
    - cleaned_text
    - job_role
    - expected_seniority
    - years_of_experience
    - required_skills
    - preferred_skills
    - programming_languages
    - frameworks_and_libraries
    - databases
    - cloud_technologies
    - tools_and_platforms
    - soft_skills
    - domain_knowledge
    - responsibilities
    - important_keywords
    - taxonomy_mapping
    """
    cleaned_text = clean_jd_text(raw_jd_text)
    text_lower = cleaned_text.lower()
    
    yoe, seniority = extract_years_of_experience(cleaned_text)
    job_role = extract_job_role(cleaned_text)
    responsibilities = extract_responsibilities(cleaned_text)
    keywords = extract_keywords_tfidf(cleaned_text)
    
    extracted_entities: Dict[str, List[str]] = {
        "programming_languages": [],
        "frameworks_and_libraries": [],
        "databases": [],
        "cloud_technologies": [],
        "tools_and_platforms": [],
        "soft_skills": [],
        "domain_knowledge": []
    }
    
    taxonomy_mapping: Dict[str, str] = {}
    all_extracted_skills = set()
    
    # Identify entities using taxonomy dictionary + semantic rules
    for category, term_list in TAXONOMY_DICTIONARY.items():
        for term in term_list:
            # Word boundary regex search to prevent false partial matches
            pattern = r'\b' + re.escape(term) + r'\b'
            if re.search(pattern, text_lower):
                formatted_term = term.title() if len(term) > 3 else term.upper()
                if formatted_term not in extracted_entities[category]:
                    extracted_entities[category].append(formatted_term)
                    all_extracted_skills.add(formatted_term)
                    
                    # Taxonomy mapping
                    if term in TAXONOMY_MAP:
                        taxonomy_mapping[formatted_term] = TAXONOMY_MAP[term]
                    else:
                        taxonomy_mapping[formatted_term] = category.replace("_", " ").title()

    # Split skills into required vs preferred
    all_skills_list = list(all_extracted_skills)
    required_skills = []
    preferred_skills = []
    
    # Check if text explicitly marks preferred skills
    preferred_split = re.split(r'preferred|nice to have|plus|optional', text_lower, maxsplit=1)
    if len(preferred_split) > 1:
        req_part = preferred_split[0]
        pref_part = preferred_split[1]
        
        for skill in all_skills_list:
            if skill.lower() in req_part:
                required_skills.append(skill)
            elif skill.lower() in pref_part:
                preferred_skills.append(skill)
            else:
                required_skills.append(skill)
    else:
        required_skills = all_skills_list
        preferred_skills = []

    return {
        "cleaned_text": cleaned_text,
        "job_role": job_role,
        "expected_seniority": seniority,
        "years_of_experience": yoe,
        "required_skills": required_skills,
        "preferred_skills": preferred_skills,
        "programming_languages": extracted_entities["programming_languages"],
        "frameworks_and_libraries": extracted_entities["frameworks_and_libraries"],
        "databases": extracted_entities["databases"],
        "cloud_technologies": extracted_entities["cloud_technologies"],
        "tools_and_platforms": extracted_entities["tools_and_platforms"],
        "soft_skills": extracted_entities["soft_skills"],
        "domain_knowledge": extracted_entities["domain_knowledge"],
        "responsibilities": responsibilities,
        "important_keywords": keywords,
        "taxonomy_mapping": taxonomy_mapping
    }
