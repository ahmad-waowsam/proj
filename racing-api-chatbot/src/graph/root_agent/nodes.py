import json
from typing import Literal, Dict, Any

from langgraph.types import Command
from langchain_core.messages import ToolMessage

from src.graph.root_agent.chains import (
    QUERY_VALIDATION_CHAIN,
    HUMAN_FACING_RESPONSE_CHAIN,
    QUERY_CLASSIFER_CHAIN
)

from src.graph.root_agent.models import PlanExecute, Response
from src.db.database import db_manager
from src.db.database import init_db


def qualify_queries_node(
    state: PlanExecute
) -> Command[Literal["human_facing_response"]]:
    print("in qualify queries node")
    
    print("State: ", state)

    print(
        {
            "response": f"user - User has given me a query - {state['input']}",
            "type": "thinking_message",
        }
    )

    qualify_query_response = QUERY_VALIDATION_CHAIN.invoke(
        {
            "query": state["input"],
        }
    )

    print("Response: ", qualify_query_response)

    if str(qualify_query_response).lower() == 'no':
        latest_message = ToolMessage(
                content=json.dumps({"query": qualify_query_response}),
                name="general_queries",
                tool_call_id="qualify_queries_node",
            )
        
        return Command(
                update={
                    "messages": [latest_message],
                    "debug_messages": [latest_message],
                },
                goto="human_facing_response",
            )
        
    elif str(qualify_query_response).lower() == 'yes':
        response = QUERY_CLASSIFER_CHAIN.invoke(
            {
            "query" : state["input"]
            }
        )
        
        print("Classifier Response: ", response)
        
        # Handle dictionary response
        next_node = response.get("next_node", "").lower()
        if next_node == "simple":
            return Command(
                    update={
                        "messages": [],
                        "debug_messages": [],
                        "input": state["input"],
                    },
                    goto="simple_query_handler",
                )
        elif next_node == "complex":
            return Command(
                    update={
                        "messages": [],
                        "debug_messages": [],
                        "input": state["input"],
                    },
                    goto="complex_query_handler",
                )
        else:
            # Default to human facing response if classification is unclear
            latest_message = ToolMessage(
                    content=json.dumps({"query": "Unable to classify query type"}),
                    name="general_queries",
                    tool_call_id="qualify_queries_node",
                )
            
            return Command(
                    update={
                        "messages": [latest_message],
                        "debug_messages": [latest_message],
                    },
                    goto="human_facing_response",
                )



def human_facing_response_node(state: Dict[str, Any]) -> Dict[str, Any]:
    try:
        print("*" * 100)
        print("in human facing response node")
        print("*" * 100)
        print("State:", state)
        print("*" * 100)
        
        # Initialize final_user_facing_response with a default value
        final_user_facing_response = "No data found relevant to that query."
        
        # Get the original query from state
        original_query = state.get("input", "")
        
        # Check for messages in the state
        messages = state.get("messages", [])
        if messages:
            # Get the last message content
            last_message = messages[-1]
            if isinstance(last_message, ToolMessage):
                try:
                    message_content = json.loads(last_message.content)
                    
                    # If there's an error in the message, return it directly
                    if "error" in message_content:
                        return {
                            "response": message_content["error"],
                            "debug_messages": state.get("debug_messages", []) + [last_message],
                        }
                    
                    # Process the response based on the content type
                    if isinstance(message_content, dict):
                        # Check if we have any valid race data
                        has_valid_data = False
                        for table_name, data in message_content.items():
                            if isinstance(data, list) and data:
                                has_valid_data = True
                                break
                        
                        if has_valid_data:
                            # Generate human-readable response for the entire data
                            final_user_facing_response = HUMAN_FACING_RESPONSE_CHAIN.invoke({
                                "query": original_query,
                                "content": json.dumps(message_content)
                            })
                            
                except json.JSONDecodeError:
                    pass
        
        # Create a serializable response object
        serialized_response = {
            "content": final_user_facing_response,
            "type": "user_facing_message",
            "query": original_query
        }
        
        debug_tool_message = ToolMessage(
            content=json.dumps({
                "final_response": final_user_facing_response,
                "original_query": original_query
            }),
            tool_call_id="human_facing_response_node",
        )
        
        print({"response": final_user_facing_response, "type": "user_facing_message"})
        
        # Get database session without initializing
        db = db_manager.SessionLocal()
        try:
            # Store chat history with serialized response
            try:
                db_manager.save_chat_history(
                    db=db,
                    thread_id=state.get("thread_id"),
                    user_key=state.get("user_key"),
                    query=original_query,
                    response=serialized_response
                )
                db.commit()  # Commit the transaction
            except Exception as e:
                print(f"Error saving chat history: {str(e)}")
                db.rollback()  # Rollback on error
        finally:
            db.close()
        
        return {
            "response": final_user_facing_response,
            "debug_messages": state.get("debug_messages", []) + [debug_tool_message],
        }
        
    except Exception as e:
        print(f"Error in human_facing_response_node: {str(e)}")
        error_response = {
            "error": str(e),
            "message": "An error occurred while processing your request",
            "query": original_query
        }
        
        # Create a serializable error response
        serialized_error = {
            "content": error_response,
            "type": "error_message"
        }
        
        # Get database session without initializing
        db = db_manager.SessionLocal()
        try:
            # Store error in chat history
            try:
                db_manager.save_chat_history(
                    db=db,
                    thread_id=state.get("thread_id"),
                    user_key=state.get("user_key"),
                    query=original_query,
                    response=serialized_error
                )
                db.commit()  # Commit the transaction
            except Exception as e:
                print(f"Error saving chat history: {str(e)}")
                db.rollback()  # Rollback on error
        finally:
            db.close()
        
        return {
            "response": error_response,
            "debug_messages": state.get("debug_messages", []) + [
                ToolMessage(
                    content=json.dumps(error_response),
                    tool_call_id="human_facing_response_node",
                )
            ],
        }
