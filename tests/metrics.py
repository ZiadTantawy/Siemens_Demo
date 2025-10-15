"""
Evaluation Metrics Module
==========================
Provides functions to calculate various accuracy and quality metrics.
"""
import time
from typing import List, Set, Dict, Any
import re


def calculate_keyword_coverage(text: str, keywords: List[str]) -> float:
    """
    Calculate what percentage of expected keywords appear in the text.
    
    Args:
        text: The text to search in
        keywords: List of keywords to look for
        
    Returns:
        Coverage score between 0.0 and 1.0
    """
    if not keywords:
        return 1.0
    
    text_lower = text.lower()
    found_keywords = sum(1 for keyword in keywords if keyword.lower() in text_lower)
    return found_keywords / len(keywords)


def calculate_semantic_similarity(text1: str, text2: str) -> float:
    """
    Calculate semantic similarity between two texts using simple token overlap.
    For production, consider using sentence transformers or other embedding models.
    
    Args:
        text1: First text
        text2: Second text
        
    Returns:
        Similarity score between 0.0 and 1.0
    """
    # Simple token-based similarity (can be enhanced with embeddings)
    tokens1 = set(re.findall(r'\w+', text1.lower()))
    tokens2 = set(re.findall(r'\w+', text2.lower()))
    
    if not tokens1 or not tokens2:
        return 0.0
    
    intersection = tokens1.intersection(tokens2)
    union = tokens1.union(tokens2)
    
    return len(intersection) / len(union) if union else 0.0


def detect_hallucination(response: str, ground_truth: str, expected_keywords: List[str]) -> float:
    """
    Detect potential hallucination in the response.
    Returns a score from 0 (no hallucination) to 1 (likely hallucination).
    
    Args:
        response: Generated response
        ground_truth: Expected/correct answer
        expected_keywords: Keywords that should be present
        
    Returns:
        Hallucination score (0-1, higher means more likely hallucination)
    """
    # Check semantic similarity with ground truth
    similarity = calculate_semantic_similarity(response, ground_truth)
    
    # Check keyword coverage
    keyword_score = calculate_keyword_coverage(response, expected_keywords)
    
    # Hallucination is inverse of accuracy
    hallucination_score = 1.0 - ((similarity + keyword_score) / 2.0)
    
    return hallucination_score


def calculate_response_time(func, *args, **kwargs) -> tuple:
    """
    Measure response time of a function.
    
    Args:
        func: Function to measure
        *args, **kwargs: Arguments to pass to function
        
    Returns:
        Tuple of (result, time_elapsed)
    """
    start_time = time.time()
    result = func(*args, **kwargs)
    elapsed = time.time() - start_time
    return result, elapsed


def evaluate_source_attribution(response: str) -> Dict[str, Any]:
    """
    Evaluate if the response properly attributes sources.
    
    Args:
        response: The generated response
        
    Returns:
        Dictionary with attribution metrics
    """
    # Look for common citation patterns
    citation_patterns = [
        r'\[.*?\]',  # [Source]
        r'according to',
        r'based on',
        r'from the document',
        r'the source states',
        r'as mentioned in'
    ]
    
    has_citation = any(re.search(pattern, response, re.IGNORECASE) 
                      for pattern in citation_patterns)
    
    # Count number of potential citations
    citation_count = sum(len(re.findall(pattern, response, re.IGNORECASE))
                        for pattern in citation_patterns)
    
    return {
        "has_attribution": has_citation,
        "citation_count": citation_count,
        "confidence": "high" if citation_count > 0 else "low"
    }


def calculate_precision_recall(retrieved_docs: List[Any], relevant_doc_ids: Set[str]) -> Dict[str, float]:
    """
    Calculate precision and recall for retrieval.
    
    Args:
        retrieved_docs: List of retrieved documents
        relevant_doc_ids: Set of IDs of truly relevant documents
        
    Returns:
        Dictionary with precision, recall, and F1 scores
    """
    if not retrieved_docs:
        return {"precision": 0.0, "recall": 0.0, "f1": 0.0}
    
    retrieved_ids = set([doc.metadata.get('id', str(i)) for i, doc in enumerate(retrieved_docs)])
    
    true_positives = len(retrieved_ids.intersection(relevant_doc_ids))
    
    precision = true_positives / len(retrieved_ids) if retrieved_ids else 0.0
    recall = true_positives / len(relevant_doc_ids) if relevant_doc_ids else 0.0
    
    f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0
    
    return {
        "precision": precision,
        "recall": recall,
        "f1": f1
    }


def calculate_relevance_score(retrieved_doc: str, query: str) -> float:
    """
    Calculate relevance of a document to a query.
    
    Args:
        retrieved_doc: Content of retrieved document
        query: User query
        
    Returns:
        Relevance score between 0.0 and 1.0
    """
    # Extract query terms
    query_terms = set(re.findall(r'\w+', query.lower()))
    doc_terms = set(re.findall(r'\w+', retrieved_doc.lower()))
    
    if not query_terms:
        return 0.0
    
    # Calculate term overlap
    matching_terms = query_terms.intersection(doc_terms)
    relevance = len(matching_terms) / len(query_terms)
    
    return relevance


def evaluate_response_quality(response: str) -> Dict[str, Any]:
    """
    Evaluate overall quality of a response.
    
    Args:
        response: The generated response
        
    Returns:
        Dictionary with quality metrics
    """
    metrics = {
        "length": len(response),
        "word_count": len(response.split()),
        "has_content": len(response.strip()) > 0,
        "is_too_short": len(response.split()) < 10,
        "is_too_long": len(response.split()) > 500,
        "has_proper_structure": bool(re.search(r'[.!?]', response)),
    }
    
    # Calculate quality score
    quality_score = 0.0
    if metrics["has_content"]:
        quality_score += 0.3
    if not metrics["is_too_short"] and not metrics["is_too_long"]:
        quality_score += 0.4
    if metrics["has_proper_structure"]:
        quality_score += 0.3
    
    metrics["quality_score"] = quality_score
    
    return metrics
