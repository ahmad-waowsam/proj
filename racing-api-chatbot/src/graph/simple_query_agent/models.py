import operator

from typing import Annotated, List, Optional, Sequence, Tuple, TypedDict, Dict, Any

from langchain_core.messages import BaseMessage
from langgraph.graph import MessagesState
from langgraph.graph.message import add_messages
from pydantic import BaseModel, Field, field_validator


#-------------------------------------------------------------------

class State(MessagesState):
    next: str


class AgentState(TypedDict):
    """The state of the agent."""

    messages: Annotated[Sequence[BaseMessage], add_messages]
    debug_messages: Annotated[Sequence[BaseMessage], add_messages]
    atomic_task_summary: str
    past_steps: Annotated[List[Tuple], operator.add]
    plan: List[str]
    token_details: List
    available_wallets: List
    available_group_wallets: List
    available_wallets_and_groups: List
    input: str

class Filter(BaseModel):
    function: str = Field(description="The API function to call")
    name: Optional[str] = Field(None, description="Optional name parameter for the function")

class APICallsNamesResponse(BaseModel):
    filters: Dict[str, Any] = Field(default_factory=dict, description="Dictionary of filters")
    content: List[str] = Field(description="List of content items")

    class Config:
        json_schema_extra = {
            "required": ["filters", "content"],
            "properties": {
                "filters": {
                    "type": "object",
                    "additionalProperties": True
                },
                "content": {
                    "type": "array",
                    "items": {
                        "type": "string"
                    }
                }
            }
        }

    @classmethod
    def model_validate(cls, data):
        return cls(**data)

