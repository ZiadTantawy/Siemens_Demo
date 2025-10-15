"""
Test Configuration and Ground Truth Dataset
============================================
Contains test cases with expected outcomes for accuracy evaluation.
"""
from typing import List, Dict, Any
from enum import Enum

class QueryType(Enum):
    """Classification of query types for testing."""
    INTERNAL_FACTUAL = "internal_factual"  # Should be answered from RAG
    INTERNAL_CONCEPTUAL = "internal_conceptual"  # Complex internal knowledge
    EXTERNAL_CURRENT = "external_current"  # Requires web search (current events)
    EXTERNAL_GENERAL = "external_general"  # General knowledge not in docs
    AMBIGUOUS = "ambiguous"  # Could be either internal or external


class TestCase:
    """Represents a single test case with expected behavior."""
    
    def __init__(
        self,
        query: str,
        query_type: QueryType,
        expected_source: str,  # "internal", "external", "both"
        expected_keywords: List[str],  # Keywords that should appear in response
        evaluation_criteria: Dict[str, Any],
        ground_truth_answer: str = None,
        category: str = None
    ):
        self.query = query
        self.query_type = query_type
        self.expected_source = expected_source
        self.expected_keywords = expected_keywords
        self.evaluation_criteria = evaluation_criteria
        self.ground_truth_answer = ground_truth_answer
        self.category = category


# Ground Truth Test Dataset
INTERNAL_RAG_TEST_CASES = [
    TestCase(
        query="What is the Transformer architecture?",
        query_type=QueryType.INTERNAL_FACTUAL,
        expected_source="internal",
        expected_keywords=["transformer", "attention", "encoder", "decoder"],
        evaluation_criteria={
            "must_retrieve_docs": True,
            "min_relevance_score": 0.7,
            "must_cite_source": True,
            "max_response_time": 5.0
        },
        ground_truth_answer="The Transformer is a neural network architecture based on self-attention mechanisms.",
        category="architecture"
    ),
    TestCase(
        query="Explain the self-attention mechanism",
        query_type=QueryType.INTERNAL_CONCEPTUAL,
        expected_source="internal",
        expected_keywords=["attention", "query", "key", "value", "weights"],
        evaluation_criteria={
            "must_retrieve_docs": True,
            "min_relevance_score": 0.65,
            "must_cite_source": True,
            "max_response_time": 5.0
        },
        ground_truth_answer="Self-attention allows the model to weigh the importance of different parts of the input sequence.",
        category="mechanism"
    ),
    TestCase(
        query="What are the key components of the encoder?",
        query_type=QueryType.INTERNAL_FACTUAL,
        expected_source="internal",
        expected_keywords=["encoder", "layers", "multi-head attention", "feed-forward"],
        evaluation_criteria={
            "must_retrieve_docs": True,
            "min_relevance_score": 0.7,
            "must_cite_source": True,
            "max_response_time": 5.0
        },
        category="architecture"
    ),
    TestCase(
        query="How does positional encoding work?",
        query_type=QueryType.INTERNAL_CONCEPTUAL,
        expected_source="internal",
        expected_keywords=["positional", "encoding", "sine", "cosine", "position"],
        evaluation_criteria={
            "must_retrieve_docs": True,
            "min_relevance_score": 0.65,
            "must_cite_source": True,
            "max_response_time": 5.0
        },
        category="mechanism"
    ),
]

EXTERNAL_WEB_TEST_CASES = [
    TestCase(
        query="What are the latest AI developments in 2025?",
        query_type=QueryType.EXTERNAL_CURRENT,
        expected_source="external",
        expected_keywords=["2025", "AI", "latest", "recent"],
        evaluation_criteria={
            "must_use_web": True,
            "must_cite_source": True,
            "max_response_time": 10.0,
            "requires_current_info": True
        },
        category="current_events"
    ),
    TestCase(
        query="Who won the Nobel Prize in Physics last year?",
        query_type=QueryType.EXTERNAL_CURRENT,
        expected_source="external",
        expected_keywords=["nobel", "physics", "prize"],
        evaluation_criteria={
            "must_use_web": True,
            "must_cite_source": True,
            "max_response_time": 10.0,
            "requires_current_info": True
        },
        category="current_events"
    ),
    TestCase(
        query="What is the capital of France?",
        query_type=QueryType.EXTERNAL_GENERAL,
        expected_source="external",
        expected_keywords=["Paris", "France", "capital"],
        evaluation_criteria={
            "must_use_web": False,  # May answer from general knowledge
            "max_response_time": 8.0
        },
        category="general_knowledge"
    ),
]

AMBIGUOUS_TEST_CASES = [
    TestCase(
        query="How does attention work?",
        query_type=QueryType.AMBIGUOUS,
        expected_source="both",
        expected_keywords=["attention"],
        evaluation_criteria={
            "should_clarify": True,
            "max_response_time": 6.0
        },
        category="ambiguous"
    ),
]

# Edge cases and adversarial tests
EDGE_CASE_TEST_CASES = [
    TestCase(
        query="",
        query_type=QueryType.AMBIGUOUS,
        expected_source="internal",
        expected_keywords=["help", "assist"],
        evaluation_criteria={
            "should_handle_gracefully": True,
            "should_prompt_user": True
        },
        category="edge_case"
    ),
    TestCase(
        query="a" * 1000,  # Very long query
        query_type=QueryType.AMBIGUOUS,
        expected_source="internal",
        expected_keywords=[],
        evaluation_criteria={
            "should_handle_gracefully": True,
            "max_response_time": 10.0
        },
        category="edge_case"
    ),
    TestCase(
        query="What is the meaning of life, the universe, and everything related to transformers and attention mechanisms and deep learning?",
        query_type=QueryType.AMBIGUOUS,
        expected_source="both",
        expected_keywords=["transformer", "attention"],
        evaluation_criteria={
            "should_focus_on_relevant": True,
            "max_response_time": 8.0
        },
        category="edge_case"
    ),
]

# Combine all test cases
ALL_TEST_CASES = (
    INTERNAL_RAG_TEST_CASES +
    EXTERNAL_WEB_TEST_CASES +
    AMBIGUOUS_TEST_CASES +
    EDGE_CASE_TEST_CASES
)


def get_test_cases_by_type(query_type: QueryType) -> List[TestCase]:
    """Get test cases filtered by query type."""
    return [tc for tc in ALL_TEST_CASES if tc.query_type == query_type]


def get_test_cases_by_source(source: str) -> List[TestCase]:
    """Get test cases filtered by expected source."""
    return [tc for tc in ALL_TEST_CASES if tc.expected_source == source]


def get_test_cases_by_category(category: str) -> List[TestCase]:
    """Get test cases filtered by category."""
    return [tc for tc in ALL_TEST_CASES if tc.category == category]
