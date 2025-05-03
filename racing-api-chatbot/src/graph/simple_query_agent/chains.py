from langchain_openai import ChatOpenAI
from langchain_core.runnables import RunnableSequence
from langchain_core.output_parsers import JsonOutputParser

from src.graph.prompts import (
    PAYLOAD_GENERATOR_PROMPT,
    RESPONSE_FILTER_PROMPT
)

# Initialize output parsers
payload_parser = JsonOutputParser()
filter_parser = JsonOutputParser()

# Initialize LLMs with different temperatures for different tasks
llm_payload_generator = ChatOpenAI(
    model="gpt-4o",
    temperature=0.2,  # Lower temperature for precise API function selection
    verbose=True
)

llm_response_filter = ChatOpenAI(
    model="gpt-4o",
    temperature=0.1,  # Very low temperature for consistent filtering
    verbose=True
)

# Create chains using RunnableSequence with output parsers
PAYLOAD_GENERATOR_CHAIN = RunnableSequence(
    PAYLOAD_GENERATOR_PROMPT | llm_payload_generator | payload_parser
)

RESPONSE_FILTER_CHAIN = RunnableSequence(
    RESPONSE_FILTER_PROMPT | llm_response_filter | filter_parser
)

