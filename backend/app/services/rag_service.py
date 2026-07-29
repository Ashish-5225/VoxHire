import logging
import math
import re
from typing import List, Dict, Any
import google.generativeai as genai
from app.core.config import settings

logger = logging.getLogger(__name__)

# Simple in-memory storage for resume chunks and vectors
# Structure: { user_id: [ {"text": chunk_text, "vector": [float, ...]} ] }
_vector_store: Dict[int, List[Dict[str, Any]]] = {}


def split_text_into_chunks(text: str, chunk_size: int = 600, overlap: int = 100) -> List[str]:
    """Split text into overlapping chunks of rough character lengths."""
    # Normalize whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    if len(text) <= chunk_size:
        return [text]

    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        # Try to find a sentence boundary nearby if possible
        if end < len(text):
            # look back up to 80 chars for a period or newline
            limit = max(start, end - 80)
            boundary = -1
            for i in range(end, limit, -1):
                if text[i] in ('.', '?', '!'):
                    boundary = i + 1
                    break
            if boundary != -1:
                end = boundary

        chunks.append(text[start:end].strip())
        start = end - overlap
        if start >= len(text) - 50:
            break
    return chunks


def _get_embedding(text: str) -> List[float]:
    """Generate vector embedding for a piece of text using Gemini or mock fallback."""
    if not settings.GOOGLE_API_KEY:
        # Mock embedding: generate a simple keyword/char-frequency mock vector
        return _generate_mock_embedding(text)

    try:
        response = genai.embed_content(
            model="models/text-embedding-004",
            content=text,
            task_type="retrieval_document"
        )
        return response["embedding"]
    except Exception as e:
        logger.error(f"Error generating embedding: {str(e)}")
        return _generate_mock_embedding(text)


def _generate_mock_embedding(text: str) -> List[float]:
    """Generate a simple deterministically hashed vector from text strings."""
    vector = [0.0] * 128
    words = text.lower().split()
    for w in words:
        h = hash(w) % 128
        vector[h] += 1.0
    # Normalize vector
    magnitude = math.sqrt(sum(v*v for v in vector))
    if magnitude > 0:
        vector = [v / magnitude for v in vector]
    return vector


def index_resume(user_id: int, resume_text: str) -> bool:
    """Split and index resume text chunks into the vector store."""
    try:
        chunks = split_text_into_chunks(resume_text)
        indexed_items = []
        
        for idx, chunk in enumerate(chunks):
            vector = _get_embedding(chunk)
            indexed_items.append({
                "id": idx,
                "text": chunk,
                "vector": vector
            })
            
        _vector_store[user_id] = indexed_items
        logger.info(f"Indexed {len(chunks)} chunks for user {user_id}")
        return True
    except Exception as e:
        logger.error(f"Failed to index resume: {str(e)}")
        return False


def query_resume_context(user_id: int, query: str, top_k: int = 3) -> str:
    """Retrieve top-K most relevant chunks of resume text for the query."""
    user_chunks = _vector_store.get(user_id, [])
    if not user_chunks:
        return ""

    # Generate query vector
    query_vector = _get_embedding(query)
    
    # Calculate cosine similarity for each chunk
    scored_chunks = []
    for chunk in user_chunks:
        similarity = _cosine_similarity(query_vector, chunk["vector"])
        scored_chunks.append((similarity, chunk["text"]))
        
    # Sort by similarity descending
    scored_chunks.sort(key=lambda x: x[0], reverse=True)
    
    # Retrieve top K text chunks
    top_chunks = [text for score, text in scored_chunks[:top_k]]
    return "\n\n---\n\n".join(top_chunks)


def _cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """Calculate the cosine similarity between two lists of floats."""
    if len(vec1) != len(vec2):
        return 0.0
    dot_product = sum(a*b for a, b in zip(vec1, vec2))
    mag1 = math.sqrt(sum(a*a for a in vec1))
    mag2 = math.sqrt(sum(b*b for b in vec2))
    if mag1 == 0 or mag2 == 0:
        return 0.0
    return dot_product / (mag1 * mag2)
