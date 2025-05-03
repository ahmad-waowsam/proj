from typing import Annotated, Any, Dict, List, Literal, Sequence, TypedDict, Union
from langgraph.graph import Graph, StateGraph
from langgraph.checkpoint.base import BaseCheckpointSaver
from langchain_core.messages import BaseMessage

from src.graph.root_agent.nodes import qualify_queries_node, human_facing_response_node
from src.graph.simple_query_agent.nodes import simple_query_handler_node, cached_query_handler_node
from src.graph.root_agent.models import PlanExecute, AgentState

def initialize_graph(checkpointer: BaseCheckpointSaver = None) -> Graph:
    # Define the graph
    workflow = StateGraph(PlanExecute)

    # Add nodes
    workflow.add_node("qualify_queries", qualify_queries_node)
    workflow.add_node("human_facing_response", human_facing_response_node)
    workflow.add_node("simple_query_handler", simple_query_handler_node)
    workflow.add_node("cached_query_handler", cached_query_handler_node)

    # Add edges
    workflow.add_edge("qualify_queries", "human_facing_response")
    workflow.add_edge("qualify_queries", "simple_query_handler")
    workflow.add_edge("simple_query_handler", "human_facing_response")
    workflow.add_edge("cached_query_handler", "human_facing_response")

    # Set entry point
    workflow.set_entry_point("qualify_queries")

    # Compile
    app = workflow.compile(checkpointer=checkpointer)

    return app
