from decouple import config
from langchain_openai import ChatOpenAI
from langchain_core.runnables import RunnableSequence
from langchain_core.output_parsers import JsonOutputParser

from src.graph.prompts import (
    COMPLEX_QUERY_ANALYSIS_PROMPT,
    COMPLEX_QUERY_EXECUTION_PROMPT
)

PROMPT_VERSION = config("PROMPT_VERSION")

# Initialize output parsers
analysis_parser = JsonOutputParser()
execution_parser = JsonOutputParser()

# Initialize LLMs with different temperatures for different tasks
llm_analysis_planner = ChatOpenAI(
    model="gpt-4o",
    temperature=0.2,  # Lower temperature for precise planning
    verbose=True
)

llm_analysis_executor = ChatOpenAI(
    model="gpt-4o",
    temperature=0.3,  # Slightly higher temperature for creative insights
    verbose=True
)

# Create chains using RunnableSequence with output parsers
COMPLEX_QUERY_ANALYSIS_CHAIN = RunnableSequence(
    COMPLEX_QUERY_ANALYSIS_PROMPT | llm_analysis_planner | analysis_parser
)

COMPLEX_QUERY_EXECUTION_CHAIN = RunnableSequence(
    COMPLEX_QUERY_EXECUTION_PROMPT | llm_analysis_executor | execution_parser
)