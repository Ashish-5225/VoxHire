import json
from typing import List, Dict, Any, Optional

# Structured Interview Question Seed Dataset
SEED_INTERVIEW_DATASET: List[Dict[str, Any]] = [
    # --- TECHNICAL / BACKEND / JAVA & SPRING BOOT ---
    {
        "job_role": "Backend Developer",
        "skill": "Spring Boot",
        "category": "Technical",
        "difficulty": "Medium",
        "question_type": "Conceptual",
        "question": "What is dependency injection in Spring Boot and how does Inversion of Control (IoC) container implement it?",
        "expected_topics": ["IoC Container", "Dependency Injection", "Beans", "Autowiring"],
        "jd_context": "Experience with Java, Spring Boot, REST APIs",
        "ideal_answer": "Dependency injection is a design pattern in Spring Boot where object dependencies are provided by the framework rather than created manually. The IoC container manages the lifecycle and instantiation of Spring Beans.",
        "follow_up_questions": [
            "What are the different types of dependency injection (Constructor vs Setter vs Field)?",
            "Why is Constructor injection preferred over Field injection?"
        ]
    },
    {
        "job_role": "Backend Developer",
        "skill": "Spring Boot",
        "category": "Technical",
        "difficulty": "Hard",
        "question_type": "Practical",
        "question": "How would you containerize a Spring Boot application with a PostgreSQL database using Docker and Docker Compose?",
        "expected_topics": ["Dockerfile", "Docker Compose", "Multi-stage Build", "Environment Variables", "Port Forwarding"],
        "jd_context": "Experience with Docker, PostgreSQL, and Spring Boot",
        "ideal_answer": "Create a multi-stage Dockerfile to build the JAR with Maven/Gradle and run it on a lightweight JRE base image. Use Docker Compose to define services for the app and PostgreSQL container with environment variables for database connection details.",
        "follow_up_questions": [
            "How do you configure database connection retry logic if Postgres takes longer to initialize?",
            "What Docker volume strategies would you use for persistent Postgres storage?"
        ]
    },

    # --- REST API & WEB SERVICES ---
    {
        "job_role": "Backend Developer",
        "skill": "REST API",
        "category": "System Design",
        "difficulty": "Hard",
        "question_type": "Scenario-Based",
        "question": "How would you design a scalable REST API to handle peak traffic spikes of 100,000 requests per second?",
        "expected_topics": ["Statelessness", "Load Balancing", "Rate Limiting", "Caching", "Horizontal Scaling"],
        "jd_context": "Designing scalable REST APIs and cloud backends",
        "ideal_answer": "Ensure stateless API design, place a Load Balancer (Nginx/ALB) in front, implement Redis caching for frequent reads, enforce rate limiting (Token Bucket/Leaky Bucket algorithm), and horizontally autoscale application instances behind an Auto Scaling Group.",
        "follow_up_questions": [
            "How would you handle JWT token validation at high throughput without hitting auth server bottleneck?",
            "What HTTP status code and response header structure should be returned upon rate limit violation?"
        ]
    },
    {
        "job_role": "Backend Developer",
        "skill": "REST API",
        "category": "Security",
        "difficulty": "Medium",
        "question_type": "Conceptual",
        "question": "How would you handle authentication and authorization in a REST API using OAuth2 and JWT?",
        "expected_topics": ["JWT Structure", "Signature Verification", "Bearer Tokens", "Expiration & Refresh Tokens", "RBAC"],
        "jd_context": "REST API security, authentication and authorization",
        "ideal_answer": "Authenticate users via identity provider producing a signed JWT containing payload claims and expiration. Clients include the token in Authorization Bearer headers. Middleware verifies signature and enforces Role-Based Access Control (RBAC).",
        "follow_up_questions": [
            "How do you invalidate a compromised JWT before its expiration time?",
            "What is the difference between Access Tokens and Refresh Tokens?"
        ]
    },

    # --- DATABASES & SQL ---
    {
        "job_role": "Database Engineer",
        "skill": "SQL",
        "category": "Technical",
        "difficulty": "Easy",
        "question_type": "Conceptual",
        "question": "What is the difference between INNER JOIN, LEFT JOIN, RIGHT JOIN, and FULL OUTER JOIN in SQL?",
        "expected_topics": ["INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "FULL OUTER JOIN", "Null Handling"],
        "jd_context": "Proficiency in SQL database queries",
        "ideal_answer": "INNER JOIN returns matching rows in both tables. LEFT JOIN returns all rows from the left table and matching rows from the right. RIGHT JOIN returns all rows from right table. FULL OUTER JOIN returns all rows when there is a match in either left or right table.",
        "follow_up_questions": [
            "When would you use a LEFT JOIN with a WHERE IS NULL clause?",
            "How do indexes affect the execution plan of JOIN operations?"
        ]
    },
    {
        "job_role": "Database Engineer",
        "skill": "PostgreSQL",
        "category": "Technical",
        "difficulty": "Hard",
        "question_type": "Debugging",
        "question": "How would you diagnose and optimize a slow-running SQL query in PostgreSQL under high concurrency?",
        "expected_topics": ["EXPLAIN ANALYZE", "B-Tree Indexes", "Query Execution Plan", "Connection Pooling", "VACUUM"],
        "jd_context": "PostgreSQL database performance optimization",
        "ideal_answer": "Use EXPLAIN ANALYZE to inspect query plan for sequential scans. Add target B-Tree or Composite Indexes. Check index selectivity, prevent functions on indexed columns in WHERE clauses, monitor pg_stat_activity, and configure connection poolers like PgBouncer.",
        "follow_up_questions": [
            "What is the difference between a Clustered Index and a Non-Clustered Index?",
            "How does PostgreSQL ACID compliance handle MVCC (Multi-Version Concurrency Control)?"
        ]
    },

    # --- CLOUD & DEVOPS ---
    {
        "job_role": "DevOps Engineer",
        "skill": "AWS",
        "category": "Cloud Computing",
        "difficulty": "Hard",
        "question_type": "System Design",
        "question": "How would you deploy a containerized backend application on AWS with high availability, zero-downtime deployments, and automatic failover?",
        "expected_topics": ["AWS ECS / EKS", "Application Load Balancer", "Multi-AZ Deployment", "Blue/Green Deployment", "Route 53"],
        "jd_context": "AWS cloud deployment, ECS/EKS, and CI/CD",
        "ideal_answer": "Deploy application containers across multiple Availability Zones using AWS ECS (Fargate) or EKS behind an Application Load Balancer. Use Route 53 health checks, Aurora Multi-AZ DB for persistent storage, and CodeDeploy Blue/Green deployment for zero-downtime updates.",
        "follow_up_questions": [
            "How would you automate infrastructure provisioning using Terraform?",
            "How do you monitor application performance using AWS CloudWatch and X-Ray?"
        ]
    },

    # --- PYTHON & DATA SCIENCE / MACHINE LEARNING ---
    {
        "job_role": "Machine Learning Engineer",
        "skill": "Python",
        "category": "Machine Learning",
        "difficulty": "Medium",
        "question_type": "Conceptual",
        "question": "What is the difference between Overfitting and Underfitting in Machine Learning models, and how do you mitigate each?",
        "expected_topics": ["Bias-Variance Tradeoff", "Regularization (L1/L2)", "Cross-Validation", "Data Augmentation", "Early Stopping"],
        "jd_context": "Machine learning model development in Python",
        "ideal_answer": "Overfitting occurs when a model learns training noise (high variance), while Underfitting occurs when a model is too simple to capture patterns (high bias). Fix overfitting with regularization, cross-validation, and dropout; fix underfitting by increasing model complexity or feature engineering.",
        "follow_up_questions": [
            "How does L1 (Lasso) regularization promote feature sparsity compared to L2 (Ridge)?",
            "Why is K-Fold Cross-Validation preferred over a single train-test split?"
        ]
    },
    {
        "job_role": "Machine Learning Engineer",
        "skill": "PyTorch",
        "category": "Machine Learning",
        "difficulty": "Hard",
        "question_type": "Practical",
        "question": "Explain how PyTorch autograd computes gradients during backpropagation and how you optimize GPU memory allocation during LLM fine-tuning.",
        "expected_topics": ["Dynamic Computation Graph", "loss.backward()", "Mixed Precision (AMP)", "Gradient Accumulation", "LoRA / PEFT"],
        "jd_context": "Deep learning, PyTorch, and model training optimization",
        "ideal_answer": "PyTorch autograd constructs a dynamic computation graph during forward pass and computes gradients via reverse-mode automatic differentiation during loss.backward(). Optimize GPU RAM via Automatic Mixed Precision (fp16/bf16), gradient accumulation, and parameter-efficient fine-tuning (LoRA).",
        "follow_up_questions": [
            "What is the difference between torch.no_grad() and model.eval()?",
            "How does FlashAttention optimize Transformer self-attention compute bounds?"
        ]
    },

    # --- FRONTEND / REACT / JAVASCRIPT ---
    {
        "job_role": "Frontend Developer",
        "skill": "React",
        "category": "Technical",
        "difficulty": "Medium",
        "question_type": "Conceptual",
        "question": "How does React Virtual DOM work, and how do useMemo and useCallback prevent unnecessary re-renders?",
        "expected_topics": ["Virtual DOM Reconciliation", "Fiber Architecture", "useMemo", "useCallback", "React.memo"],
        "jd_context": "Frontend web development with React and TypeScript",
        "ideal_answer": "React maintains an in-memory Virtual DOM tree. On state change, it reconciles differences using a diffing algorithm and updates only changed real DOM nodes. useMemo memoizes expensive computation results, and useCallback memoizes function instances across re-renders.",
        "follow_up_questions": [
            "What causes custom hooks to trigger re-renders in consumer components?",
            "How does React 18 Concurrent Rendering improve UI responsiveness?"
        ]
    },

    # --- PROJECT-BASED QUESTIONS ---
    {
        "job_role": "Full Stack Developer",
        "skill": "PostgreSQL",
        "category": "Project-Based",
        "difficulty": "Medium",
        "question_type": "Project-Based",
        "question": "Explain how you designed and optimized the database schema and API endpoints in your REST project using Spring Boot and PostgreSQL.",
        "expected_topics": ["Schema Normalization", "Index Design", "ORM Mapping", "API Optimization"],
        "jd_context": "Full stack project experience with REST APIs and databases",
        "ideal_answer": "Focus on normalized table design (3NF), indexing key query fields, mapping entities cleanly with JPA/Hibernate, implementing DTO pagination, and measuring API response latency improvements.",
        "follow_up_questions": [
            "Why did you choose PostgreSQL over a NoSQL database like MongoDB for that project?",
            "How did you handle database migrations across development and production environments?"
        ]
    },

    # --- BEHAVIORAL & HR QUESTIONS ---
    {
        "job_role": "Software Engineer",
        "skill": "Leadership",
        "category": "Behavioral",
        "difficulty": "Medium",
        "question_type": "Behavioral",
        "question": "Tell me about a time when you disagreed with a senior technical decision or architectural direction. How did you present your case and what was the outcome?",
        "expected_topics": ["STAR Method", "Technical Argumentation", "Data-driven Consensus", "Professional Collaboration"],
        "jd_context": "Collaborative engineering environment with cross-functional communication",
        "ideal_answer": "Use the STAR method: describe the Situation, Task, your Action (gathering benchmark data, building a prototype), and the Result (reaching an informed consensus while respecting team alignment).",
        "follow_up_questions": [
            "If the team decided to move forward with the alternative approach anyway, how did you support the execution?",
            "What did you learn about stakeholder communication from that experience?"
        ]
    },
    {
        "job_role": "Software Engineer",
        "skill": "Communication",
        "category": "HR",
        "difficulty": "Easy",
        "question_type": "HR",
        "question": "Why are you interested in joining our company for this role, and how do your long-term career goals align with our team's vision?",
        "expected_topics": ["Company Mission", "Role Alignment", "Career Growth", "Engineering Impact"],
        "jd_context": "Looking for motivated candidates aligned with team vision",
        "ideal_answer": "Express genuine enthusiasm for the company's product domain, highlight how technical challenges in the JD align with your skills, and discuss how the position supports your trajectory toward senior engineering growth.",
        "follow_up_questions": [
            "What specific engineering practice or culture value at our company appeals to you most?",
            "Where do you see yourself technically in 3 years?"
        ]
    }
]

def get_all_questions() -> List[Dict[str, Any]]:
    """Return all questions in seed dataset."""
    return SEED_INTERVIEW_DATASET

def filter_questions(
    role: Optional[str] = None,
    skill: Optional[str] = None,
    category: Optional[str] = None,
    difficulty: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Filter interview dataset by metadata criteria."""
    results = SEED_INTERVIEW_DATASET
    if role:
        results = [q for q in results if role.lower() in q["job_role"].lower()]
    if skill:
        results = [q for q in results if skill.lower() in q["skill"].lower() or any(skill.lower() in s.lower() for s in q["expected_topics"])]
    if category:
        results = [q for q in results if category.lower() in q["category"].lower()]
    if difficulty:
        results = [q for q in results if difficulty.lower() in q["difficulty"].lower()]
    return results

def add_question_to_dataset(question_data: Dict[str, Any]) -> bool:
    """Validate and append a new structured question to the knowledge base."""
    required_fields = ["job_role", "skill", "category", "difficulty", "question_type", "question", "expected_topics"]
    for field in required_fields:
        if field not in question_data:
            return False
    SEED_INTERVIEW_DATASET.append(question_data)
    return True
