import math
import logging
from typing import List, Dict, Any, Tuple
from app.services.rag_service import _get_embedding, _cosine_similarity
from app.ml_copilot.dataset_manager import get_all_questions

logger = logging.getLogger(__name__)

class QuestionRetrievalEngine:
    """Semantic Retrieval Engine over Interview Question Knowledge Base."""
    
    def __init__(self):
        self.indexed_questions: List[Dict[str, Any]] = []
        self._build_index()

    def _build_index(self):
        """Build vector embeddings index for seed questions."""
        questions = get_all_questions()
        self.indexed_questions = []
        
        for q in questions:
            # Combine question + expected topics + context into searchable text representation
            content = f"{q['question']} | Skill: {q['skill']} | Role: {q['job_role']} | Topics: {', '.join(q['expected_topics'])}"
            vec = _get_embedding(content)
            self.indexed_questions.append({
                "raw_data": q,
                "vector": vec,
                "content": content
            })
        logger.info(f"Indexed {len(self.indexed_questions)} questions in Retrieval Engine.")

    def search_relevant_questions(
        self,
        jd_text: str,
        target_role: str = "",
        skills: List[str] = None,
        top_k: int = 5
    ) -> List[Tuple[Dict[str, Any], float]]:
        """Retrieve top-K questions matching JD and candidate context."""
        if not self.indexed_questions:
            self._build_index()
            
        query_text = f"Role: {target_role}. Skills: {', '.join(skills) if skills else ''}. {jd_text[:1000]}"
        query_vector = _get_embedding(query_text)
        
        scored = []
        for item in self.indexed_questions:
            sim = _cosine_similarity(query_vector, item["vector"])
            
            # Boost score if skill explicitly matches
            q_skill = item["raw_data"]["skill"].lower()
            if skills and any(s.lower() == q_skill for s in skills):
                sim += 0.15
            if target_role and target_role.lower() in item["raw_data"]["job_role"].lower():
                sim += 0.10
                
            scored.append((item["raw_data"], round(float(sim), 4)))
            
        scored.sort(key=lambda x: x[1], reverse=True)
        return scored[:top_k]

    def evaluate_retrieval_metrics(
        self,
        query_cases: List[Dict[str, Any]] = None,
        k: int = 3
    ) -> Dict[str, float]:
        """
        Compute retrieval performance metrics:
        - Precision@K
        - Recall@K
        - MRR (Mean Reciprocal Rank)
        - NDCG@K (Normalized Discounted Cumulative Gain)
        """
        if not query_cases:
            # Generate synthetic test query cases based on dataset
            query_cases = [
                {
                    "jd_text": "Looking for Backend Engineer proficient in Java, Spring Boot, REST APIs, and Docker containerization.",
                    "role": "Backend Developer",
                    "relevant_skills": ["Spring Boot", "REST API", "Docker", "Java"]
                },
                {
                    "jd_text": "Experienced PostgreSQL Database Administrator with query performance tuning and index optimization skills.",
                    "role": "Database Engineer",
                    "relevant_skills": ["PostgreSQL", "SQL"]
                },
                {
                    "jd_text": "Machine Learning Engineer experienced in Python, PyTorch, model training, and overfitting mitigation.",
                    "role": "Machine Learning Engineer",
                    "relevant_skills": ["Python", "PyTorch"]
                }
            ]
            
        precisions = []
        recalls = []
        reciprocal_ranks = []
        ndcgs = []

        for case in query_cases:
            retrieved = self.search_relevant_questions(
                jd_text=case["jd_text"],
                target_role=case.get("role", ""),
                skills=case.get("relevant_skills", []),
                top_k=k
            )
            
            relevant_count = 0
            first_rel_rank = 0
            dcg = 0.0
            
            for idx, (item, score) in enumerate(retrieved):
                is_rel = item["skill"].lower() in [s.lower() for s in case["relevant_skills"]] or \
                         case.get("role", "").lower() in item["job_role"].lower()
                if is_rel:
                    relevant_count += 1
                    if first_rel_rank == 0:
                        first_rel_rank = idx + 1
                    dcg += 1.0 / math.log2(idx + 2)
                    
            p_k = relevant_count / k
            r_k = relevant_count / max(1, len(case["relevant_skills"]))
            mrr = (1.0 / first_rel_rank) if first_rel_rank > 0 else 0.0
            
            # Ideal DCG calculation
            idcg = sum(1.0 / math.log2(i + 2) for i in range(min(k, len(case["relevant_skills"]))))
            ndcg = (dcg / idcg) if idcg > 0 else 0.0
            
            precisions.append(p_k)
            recalls.append(r_k)
            reciprocal_ranks.append(mrr)
            ndcgs.append(ndcg)
            
        return {
            f"Precision@{k}": round(sum(precisions) / len(precisions), 4),
            f"Recall@{k}": round(sum(recalls) / len(recalls), 4),
            "MRR": round(sum(reciprocal_ranks) / len(reciprocal_ranks), 4),
            f"NDCG@{k}": round(sum(ndcgs) / len(ndcgs), 4),
            "num_test_queries": len(query_cases)
        }

# Global Retrieval Instance
retrieval_engine = QuestionRetrievalEngine()
