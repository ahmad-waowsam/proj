from langchain_openai import ChatOpenAI
from langchain_core.runnables import RunnableSequence
from langchain_core.output_parsers import StrOutputParser, JsonOutputParser

from src.graph.root_agent.models import QueryClassifierResponse
from src.graph.prompts import (
    QUERY_VALIDATION_PROMPT,
    QUERY_CLASSIFIER_PROMPT,
    HUMAN_FACING_RESPONSE_PROMPT
)

import os


PROMPT_VERSION = os.getenv("PROMPT_VERSION")

# Initialize output parsers
validation_parser = StrOutputParser()
classifier_parser = JsonOutputParser(pydantic_object=QueryClassifierResponse)
response_parser = StrOutputParser()

# Initialize LLMs with different temperatures for different tasks
llm_query_validation = ChatOpenAI(
    model="gpt-4o",
    temperature=0.1,  # Very low temperature for binary classification
    verbose=True
)

llm_query_classifier = ChatOpenAI(
    model="gpt-4o",
    temperature=0.3,  # Moderate temperature for classification
    verbose=True
)

llm_human_facing_response = ChatOpenAI(
    model="gpt-4o",
    temperature=0.7,  # Higher temperature for creative responses
    verbose=True
)

# Create chains using RunnableSequence with output parsers
QUERY_VALIDATION_CHAIN = RunnableSequence(
    QUERY_VALIDATION_PROMPT | llm_query_validation | validation_parser
)

QUERY_CLASSIFER_CHAIN = RunnableSequence(
    QUERY_CLASSIFIER_PROMPT | llm_query_classifier | classifier_parser
)

HUMAN_FACING_RESPONSE_CHAIN = RunnableSequence(
    HUMAN_FACING_RESPONSE_PROMPT | llm_human_facing_response | response_parser
)