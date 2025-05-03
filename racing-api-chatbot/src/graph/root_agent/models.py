import operator

from typing import Annotated, List, Literal, Sequence, Tuple, TypedDict, Union


from langchain_core.messages import BaseMessage
from langgraph.graph import MessagesState
from langgraph.graph.message import add_messages
from pydantic import BaseModel, Field


top_level_router_members = [
    "qualify_swap",
    "replan",
    "general_queries",
    "wallet_operation",
]


class TopLevelRouter(TypedDict):
    """Worker to route to next. If no workers needed, route to FINISH."""

    next: Literal[*top_level_router_members]
    reason: str


qualify_query_members = ["general_queries", "human_facing_response"]


class QualifyQueryRouter(TypedDict):
    """Worker to route to next."""

    next: Literal[*qualify_query_members]
    reason: str


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


class PlanExecute(TypedDict):
    input: str
    plan: List[str]
    original_plan: List[str]
    past_steps: Annotated[List[Tuple], operator.add]
    response: str
    messages: Annotated[Sequence[BaseMessage], add_messages]
    debug_messages: Annotated[Sequence[BaseMessage], add_messages]
    token_details: List
    available_wallets: List
    available_group_wallets: List
    available_wallets_and_groups: List


class Plan(BaseModel):
    """Plan to follow in future"""

    steps: List[str] = Field(description="different steps to follow, should be in sorted order")


class Response(BaseModel):
    """Response to user."""

    response: str


class Act(BaseModel):
    """Action to perform."""

    action: Union[Response, Plan] = Field(
        description="Action to perform. If you want to respond to user, use Response. "
        "If you need to further use tools to get the answer, use Plan."
    )


class ListTokensInput(BaseModel):
    list_tokens: list[str] = Field(description="List all tokens in the human query")


class GroupExtractInput(BaseModel):
    group_name: str = Field(description="Name of the group. This should be infered from the query provided by the user")



#----------------------------------------------------------

class QueryClassifierResponse(BaseModel):
    next_node: str = Field(description="Simple or complex node to move to")