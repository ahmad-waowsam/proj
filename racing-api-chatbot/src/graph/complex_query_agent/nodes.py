import json
import time
from typing import Dict, List, Any

from langchain_core.messages import ToolMessage
from langchain_core.runnables import RunnableConfig
from langgraph.types import Command, StreamWriter

from src.graph.complex_query_agent.chains import (
    COMPLEX_QUERY_ANALYSIS_CHAIN,
    COMPLEX_QUERY_EXECUTION_CHAIN
)
from src.utils.cached_api_client import CachedRaceAPIClient
from src.db.database import db_manager

# Rate limiting constants
RATE_LIMIT_DELAY = 1.0  # 1 second delay between API calls
MAX_RETRIES = 3
CHUNK_SIZE = 5  # Process data in chunks of 5 items

def chunk_data(data: List[Any], chunk_size: int) -> List[List[Any]]:
    """Split data into chunks of specified size."""
    return [data[i:i + chunk_size] for i in range(0, len(data), chunk_size)]

def complex_query_handler_node(
    state: Dict[str, Any], writer: StreamWriter, config: RunnableConfig
) -> Command:
    """Handle complex analytical queries by breaking them down into steps and executing them."""
    print("In Complex Query Handler node")
    
    try:
        # Initialize API client
        api_client = CachedRaceAPIClient(cache_ttl_hours=24)
        
        # Read API client context
        with open("src/utils/api_client.py", "r") as file:
            context = file.read()
        
        # Step 1: Analyze the query and create an analysis plan
        analysis_response = COMPLEX_QUERY_ANALYSIS_CHAIN.invoke({
            "query": state["input"],
            "context": context
        })
        
        print("*" * 100)
        print("ANALYSIS PLAN")
        print(analysis_response)
        
        # Parse the analysis plan
        analysis_plan = json.loads(analysis_response.content)
        
        # Step 2: Execute each step of the analysis plan with rate limiting
        collected_data = {}
        
        for step in analysis_plan["analysis_steps"]:
            step_data = {}
            
            # Collect required data for this step
            for data_req in step["required_data"]:
                func_name = data_req["function"]
                params = data_req.get("parameters", {})
                filters = data_req.get("filters", {})
                
                # Get the method from the API client
                func = getattr(api_client, func_name, None)
                if callable(func):
                    retries = 0
                    while retries < MAX_RETRIES:
                        try:
                            # Execute the API call with filters
                            result = func(**params, filters=filters)
                            
                            # If result is a list, process in chunks
                            if isinstance(result, list):
                                chunks = chunk_data(result, CHUNK_SIZE)
                                processed_chunks = []
                                for chunk in chunks:
                                    # Add rate limiting delay between chunks
                                    time.sleep(RATE_LIMIT_DELAY)
                                    processed_chunks.extend(chunk)
                                result = processed_chunks
                            
                            step_data[func_name] = result
                            break
                        except Exception as e:
                            retries += 1
                            if retries == MAX_RETRIES:
                                print(f"Error executing {func_name} after {MAX_RETRIES} retries: {str(e)}")
                                step_data[func_name] = {"error": str(e)}
                            else:
                                # Exponential backoff
                                time.sleep(RATE_LIMIT_DELAY * (2 ** retries))
                                continue
            
            collected_data[f"step_{step['step']}"] = step_data
        
        # Step 3: Execute the analysis and generate insights with rate limiting
        execution_response = None
        retries = 0
        while retries < MAX_RETRIES:
            try:
                execution_response = COMPLEX_QUERY_EXECUTION_CHAIN.invoke({
                    "query": state["input"],
                    "analysis_plan": analysis_plan,
                    "data": collected_data
                })
                break
            except Exception as e:
                retries += 1
                if retries == MAX_RETRIES:
                    raise e
                time.sleep(RATE_LIMIT_DELAY * (2 ** retries))
        
        print("*" * 100)
        print("EXECUTION RESULTS")
        print(execution_response)
        
        # Parse the execution results
        execution_results = json.loads(execution_response.content)
        
        # Step 4: Create a serializable response
        serialized_response = {
            "content": execution_results,
            "type": "complex_analysis_response",
            "analysis_plan": analysis_plan,
            "collected_data": collected_data
        }
        
        # Step 5: Store in chat history
        db = db_manager.SessionLocal()
        try:
            db_manager.save_chat_history(
                db=db,
                thread_id=state.get("thread_id"),
                user_key=state.get("user_key"),
                query=state["input"],
                response=serialized_response
            )
        finally:
            db.close()
        
        # Step 6: Return command to move to human facing response
        return Command(
            update={
                "messages": [
                    ToolMessage(
                        content=json.dumps(execution_results),
                        tool_call_id="complex_query_handler_node",
                    )
                ],
                "debug_messages": state["debug_messages"],
            },
            goto="human_facing_response",
        )
        
    except Exception as e:
        print(f"Error in complex_query_handler_node: {str(e)}")
        error_response = {
            "error": str(e),
            "message": "An error occurred while processing your complex query"
        }
        
        # Create a serializable error response
        serialized_error = {
            "content": error_response,
            "type": "error_message"
        }
        
        # Store error in chat history
        db = db_manager.SessionLocal()
        try:
            db_manager.save_chat_history(
                db=db,
                thread_id=state.get("thread_id"),
                user_key=state.get("user_key"),
                query=state["input"],
                response=serialized_error
            )
        finally:
            db.close()

        return Command(
            update={
                "messages": [
                    ToolMessage(
                        content=json.dumps(error_response),
                        tool_call_id="complex_query_handler_node",
                    )
                ],
                "debug_messages": state["debug_messages"],
            },
            goto="human_facing_response",
        )
