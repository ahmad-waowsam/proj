import operator

from typing import Annotated, List, Literal, Optional, Sequence, Tuple, TypedDict

from pydantic import BaseModel, Field
from langgraph.graph import MessagesState
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages


class SwapTransactionResult(BaseModel):
    transaction_human_readable_message: str = Field(description="The user-facing message for the transaction")
    is_transaction_successful: bool = Field(description="Whether the transaction is successful or not")


class SimpleSwapQuoteInput(BaseModel):
    id: str = Field(
        description="Name of the wallet.First check previous messages for any mentioned wallet name - if found, use that. Only ask user to specify wallet if none found in message history."
    )
    input_token_symbol: str = Field(
        description="Symbol of token to sell (e.g. in 'swap 10 SOL with WIF', SOL is the input_token_symbol). This is Required. if not provided by user take SOL as default value SOL Address : So11111111111111111111111111111111111111112"
    )
    output_token_symbol: str = Field(
        description="Symbol of token to buy (e.g. in 'swap 10 SOL with WIF', WIF is the output_token_symbol). If not provided by user use Wrapped SOL as default value Symbol : SOL Address : So11111111111111111111111111111111111111112"
    )
    input_token_address: str = Field(
        description="Address of token to sell (e.g. in 'swap 10 SOL with WIF', here address of SOL is the input_token_address). This is infered from the query.if not provided by user use SOL Address : So11111111111111111111111111111111111111112"
    )
    output_token_address: str = Field(
        description="Address of token to buy (e.g. in 'swap 10 SOL with WIF', here address of WIF is the output_token_address). This is infered from the query. If not provided by user use Wrapped SOL as default value Symbol : SOL Address : So11111111111111111111111111111111111111112"
    )
    input_amount: float = Field(
        description="Amount of input token/output token (e.g. in 'swap 10 SOL with WIF', 10 is the input_amount, 'Buy 10 WIF with SOl',here 10 is the input_amount) or percentage of input token to sell (e.g. in 'swap 50% SOL with WIF', 50 is the input_amount). This is Required. Never ever assume this value from previous messages or context"
    )
    original_query: str = Field(description="Original query. Just return the query as it is")


class ValidQueryInput(BaseModel):
    is_valid: bool = Field(description="Whether the query is valid or not")
    original_query: str = Field(description="Original query. Just return the query as it is")
    invalid_query_reason: Optional[str] = Field(default=None, description="Reason for the invalidity of the query")


class SwapQuoteInput(BaseModel):
    wallet_or_groupname: str = Field(description="Name of the wallet or wallet group mentioned in query.")
    input_token_symbol: str = Field(
        description="Symbol of token to sell (e.g. in 'swap 10 SOL with WIF', SOL is the input_token_symbol). This is Required. if not provided by user take SOL as default value SOL Address : So11111111111111111111111111111111111111112"
    )
    output_token_symbol: str = Field(
        description="Symbol of token to buy (e.g. in 'swap 10 SOL with WIF', WIF is the output_token_symbol). If not provided by user use Wrapped SOL as default value Symbol : SOL Address : So11111111111111111111111111111111111111112"
    )
    input_token_address: str = Field(
        description="Address of token to sell (e.g. in 'swap 10 SOL with WIF', here address of SOL is the input_token_address). This is infered from the query.if not provided by user use SOL Address : So11111111111111111111111111111111111111112"
    )
    output_token_address: str = Field(
        description="Address of token to buy (e.g. in 'swap 10 SOL with WIF', here address of WIF is the output_token_address). This is infered from the query. If not provided by user use Wrapped SOL as default value Symbol : SOL Address : So11111111111111111111111111111111111111112"
    )
    input_amount: float = Field(
        description="Amount of input token/output token (e.g. in 'swap 10 SOL with WIF', 10 is the input_amount, 'Buy 10 WIF with SOl',here 10 is the input_amount) or percentage of input token to sell (e.g. in 'swap 50% SOL with WIF', 50 is the input_amount). This is Required. Never ever assume this value from previous messages or context"
    )
    is_input_amount_in_percentage: bool = Field(
        desciption="Whether input amount is a percentage. This should be infered from the query provided by the user"
    )
    slippage_percentage: Optional[float] = Field(
        default=None,
        description="Slippage percentage. This should be inferred from the query provided by the user otherwise default to None",
    )
    original_query: str = Field(description="Original query. Just return the query as it is")


class ListSwapQuoteInput(BaseModel):
    swap_quote_inputs: List[SwapQuoteInput] = Field(description="List of swap quote inputs")


class ConfirmQuoteInput(BaseModel):
    proceed: bool = Field(
        description="False if human has denied. True if human has agreed to perform transaction. Infer consent from query"
    )


class SwapResponseSchema(BaseModel):
    input_token_symbol: str = Field(description="The symbol of the input token")
    output_token_symbol: str = Field(description="The symbol of the output token")
    input_amount: float = Field(description="The amount of the input token")
    output_amount: float = Field(description="The amount of the output token")
    total_fee: str = Field(description="The total fee for the transaction")
    transaction_id: str = Field(description="The unique identifier for the transaction")
    transaction_error: Optional[str] = Field(
        default=None,
        description="If transaction is not successful, the error message for the transaction. None if transaction id is generated successfully",
    )


class ListSwapResponseSchema(BaseModel):
    human_readable_output: str = Field(
        description="A human-readable string output of the swap details including the input token symbol, output token symbol, input amount, output amount and total fee. Do not include transaction id in the output"
    )
    swap_responses: List[SwapResponseSchema] = Field(description="List of swap responses")


class GroupSwapMappingSchema(BaseModel):
    swap_operations: List[str] = Field(description="List of swap operations with wallet names")


group_check_router_members = ["swap_agent_router", "group_mapper"]


class GroupCheckRouter(TypedDict):
    """Worker to route to next. If no workers needed, route to FINISH."""

    next: Literal[*group_check_router_members]


members = ["simple_swap", "percentage_swap", "complex_swap", "reverse_swap"]
# options = members + ["FINISH"]
options = members + ["swap_agent_ending"]


class Router(TypedDict):
    """Worker to route to next. If no workers needed, route to FINISH."""

    next: Literal[*options]
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


class SwapQuoteSuccessResponse(BaseModel):
    is_swap_quote_successful: bool = Field(description="Whether the swap quote is successful or not")
    human_readable_error_message: Optional[str] = Field(
        default=None, description="A human-readable error message for the user"
    )


class ListTokensInput(BaseModel):
    list_tokens: list[str] = Field(description="List all tokens in the human query")


class TakePercentageOfInput(BaseModel):
    take_percentage_of: Optional[float] = Field(
        default=None, description="The amount whise percentage is needed to be taken"
    )
