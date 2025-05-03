import json
import inspect
from decimal import Decimal
from typing import Literal, List
from sqlalchemy import func, Float
from datetime import datetime, date, time

from langchain_core.messages import ToolMessage
from langgraph.types import Command, StreamWriter
from langchain_core.runnables import RunnableConfig

from src.db.database import db_manager, init_db
from src.graph.simple_query_agent.models import AgentState
from src.graph.simple_query_agent.chains import PAYLOAD_GENERATOR_CHAIN
from src.db.models import (
    Course, Race, Horse, Trainer, Jockey, Owner,
    Runner, Result, Odds, RunnerMedical, RunnerQuote,
    Base, APICache
)
from src.utils.context import get_database_context

# Get a new database session
def get_db():
    return db_manager.SessionLocal()

# Initialize the database session
db = get_db()

def get_function_params(func) -> List[str]:
    """
    Get the parameter names of a function.
    """
    sig = inspect.signature(func)
    return list(sig.parameters.keys())

def simple_query_handler_node(
    state: AgentState, writer: StreamWriter, config: RunnableConfig
) -> Command[Literal["human_facing_response"]]:
    print("In Simple Query Handler node")
    
    try:
        # Get database context (for the LLM)
        context = get_database_context()
        
        # Generate database query parameters using the LLM
        response = PAYLOAD_GENERATOR_CHAIN.invoke(
            {
                "query": state["input"],
                "context": context,
            }
        )
        
        print("*" * 100)
        print("DATABASE QUERY PARAMETERS")
        print(response)
        
        # Parse the response as dictionary
        query_params = response if isinstance(response, dict) else json.loads(response)
        
        # Fix the Race table fields to use race_class instead of grade
        if "Race" in query_params.get("filters", {}):
            race_fields = query_params["filters"]["Race"].get("fields", [])
            if "grade" in race_fields:
                race_fields.remove("grade")
                race_fields.append("race_class")
        
        # Execute database queries and collect responses 
        query_response = {}
        
        # Get database session without initializing
        db = db_manager.SessionLocal()
        try:
            # First pass: Execute all direct queries
            for table_name, filters in query_params.get('filters', {}).items():
                # Map table name to model class
                model_class = globals().get(table_name)
                if model_class:
                    try:
                        # Build query with joins if needed
                        if table_name == "Result":
                            # Join with Race and Course tables
                            query = db.query(model_class).join(
                                Race, Result.race_id == Race.race_id
                            ).join(
                                Course, Race.course_id == Course.course_id
                            )
                        else:
                            query = db.query(model_class)
                        
                        # Apply filters
                        for field, value in filters.items():
                            if field not in ['sort', 'limit', 'fields']:
                                if hasattr(model_class, field):
                                    if isinstance(value, dict):
                                        # Handle complex filters
                                        if 'range' in value:
                                            min_val, max_val = value['range']
                                            # Special handling for string fields that need numeric comparison
                                            if field in ['sp_dec']:
                                                # Handle None values
                                                if min_val is None or max_val is None:
                                                    continue
                                                try:
                                                    min_float = float(min_val)
                                                    max_float = float(max_val)
                                                    query = query.filter(
                                                        func.cast(getattr(model_class, field), Float) >= min_float,
                                                        func.cast(getattr(model_class, field), Float) <= max_float
                                                    )
                                                except (ValueError, TypeError):
                                                    # Skip invalid numeric values
                                                    continue
                                            elif field == 'position':
                                                # Handle position range comparison
                                                try:
                                                    min_int = int(min_val)
                                                    max_int = int(max_val)
                                                    # Create a list of valid position strings
                                                    valid_positions = [str(i) for i in range(min_int, max_int + 1)]
                                                    query = query.filter(
                                                        getattr(model_class, field).in_(valid_positions)
                                                    )
                                                except (ValueError, TypeError):
                                                    # Skip invalid numeric values
                                                    continue
                                            else:
                                                query = query.filter(
                                                    getattr(model_class, field) >= min_val,
                                                    getattr(model_class, field) <= max_val
                                                )
                                        elif 'contains' in value:
                                            # Special handling for time fields
                                            if field == 'off_time':
                                                try:
                                                    # Convert time string to time object
                                                    time_value = datetime.strptime(value['contains'], '%H:%M').time()
                                                    query = query.filter(
                                                        getattr(model_class, field) == time_value
                                                    )
                                                except ValueError:
                                                    # Skip invalid time format
                                                    continue
                                            else:
                                                query = query.filter(getattr(model_class, field).contains(value['contains']))
                                    else:
                                        # Special handling for position field
                                        if field == 'position':
                                            try:
                                                # Try to convert the value to integer
                                                int_value = int(value)
                                                # Use string comparison with padded number
                                                query = query.filter(
                                                    getattr(model_class, field) == str(int_value)
                                                )
                                            except (ValueError, TypeError):
                                                # If value can't be converted to integer, use string comparison
                                                query = query.filter(
                                                    getattr(model_class, field) == str(value)
                                                )
                                        else:
                                            # Simple equality filter
                                            query = query.filter(getattr(model_class, field) == value)
                        
                        # Apply sorting if specified
                        if 'sort' in filters:
                            sort_field, sort_order = filters['sort']
                            if hasattr(model_class, sort_field):
                                if sort_order.lower() == 'desc':
                                    query = query.order_by(getattr(model_class, sort_field).desc())
                                else:
                                    query = query.order_by(getattr(model_class, sort_field))
                        
                        # Apply limit if specified
                        if 'limit' in filters:
                            query = query.limit(filters['limit'])
                        
                        # Execute query
                        results = query.all()
                        if results:
                            # Convert results to dict with only requested fields
                            requested_fields = filters.get('fields', [])
                            query_response[table_name] = []
                            
                            for r in results:
                                result_dict = {}
                                # Handle joined results
                                if table_name == "Result":
                                    # Add race information
                                    race = r.race
                                    result_dict.update({
                                        'race_name': race.race_name,
                                        'date': race.date.isoformat(),
                                        'course': race.course.course,
                                        'distance': race.distance,
                                        'going': race.going,
                                        'type': race.type,
                                        'race_class': race.race_class
                                    })
                                
                                # Add result fields
                                for field in (requested_fields if requested_fields else r.__table__.columns.keys()):
                                    value = getattr(r, field)
                                    # Handle non-serializable types
                                    if isinstance(value, (datetime, date, time)):
                                        value = value.isoformat()
                                    elif isinstance(value, Decimal):
                                        value = float(value)
                                    result_dict[field] = value
                                
                                query_response[table_name].append(result_dict)
                            print(f"{table_name} -> Data retrieved successfully")
                        else:
                            print(f"{table_name} -> No results returned")
                    except Exception as e:
                        print(f"Error querying {table_name}: {str(e)}")
                        query_response[table_name] = {"error": str(e)}
                        db.rollback()  # Rollback on error
            
            # Second pass: Fetch related data based on relationships
            for table_name, data in query_response.items():
                if isinstance(data, list) and data:
                    # Get table relationships from schema
                    table_relationships = context["tables"][table_name].get("relationships", {})
                    
                    for related_table, relationship in table_relationships.items():
                        if relationship.get("required", False):
                            join_field = relationship["join_field"]
                            
                            # Get all unique IDs for the join field
                            ids = list(set(r[join_field] for r in data if join_field in r))
                            
                            if ids:
                                # Map related table name to model class
                                related_model = globals().get(related_table)
                                if related_model:
                                    try:
                                        # Query related table
                                        related_results = db.query(related_model).filter(
                                            getattr(related_model, join_field).in_(ids)
                                        ).all()
                                        
                                        if related_results:
                                            # Get required fields from schema
                                            required_fields = context["tables"][related_table].get("required_fields", [])
                                            
                                            # Store results
                                            query_response[related_table] = []
                                            for r in related_results:
                                                result_dict = {}
                                                for field in required_fields:
                                                    if hasattr(r, field):
                                                        value = getattr(r, field)
                                                        # Handle non-serializable types
                                                        if isinstance(value, (datetime, date, time)):
                                                            value = value.isoformat()
                                                        elif isinstance(value, Decimal):
                                                            value = float(value)
                                                        result_dict[field] = value
                                                query_response[related_table].append(result_dict)
                                            print(f"{related_table} -> Related data retrieved successfully")
                                    except Exception as e:
                                        print(f"Error querying related table {related_table}: {str(e)}")
                                        query_response[related_table] = {"error": str(e)}
                                        db.rollback()  # Rollback on error
            
            # Third pass: Fetch additional context tables
            for table_name in query_params.get('content', []):
                if table_name not in query_response:
                    model_class = globals().get(table_name)
                    if model_class:
                        try:
                            # Get required fields from schema
                            required_fields = context["tables"][table_name].get("required_fields", [])
                            
                            # Query table
                            results = db.query(model_class).all()
                            if results:
                                query_response[table_name] = []
                                for r in results:
                                    result_dict = {}
                                    for field in required_fields:
                                        if hasattr(r, field):
                                            value = getattr(r, field)
                                            # Handle non-serializable types
                                            if isinstance(value, (datetime, date, time)):
                                                value = value.isoformat()
                                            elif isinstance(value, Decimal):
                                                value = float(value)
                                            result_dict[field] = value
                                    query_response[table_name].append(result_dict)
                                print(f"{table_name} -> Context data retrieved successfully")
                        except Exception as e:
                            print(f"Error querying context table {table_name}: {str(e)}")
                            query_response[table_name] = {"error": str(e)}
                            db.rollback()  # Rollback on error
            
            # Create a serializable response
            serialized_response = {
                "content": query_response,
                "type": "database_response",
                "query": state["input"],
                "timestamp": datetime.now().isoformat()
            }
            
            # Store in chat history
            try:
                db_manager.save_chat_history(
                    db=db,
                    thread_id=state.get("thread_id"),
                    user_key=state.get("user_key"),
                    query=state["input"],
                    response=serialized_response
                )
                db.commit()  # Commit the transaction
            except Exception as e:
                print(f"Error saving chat history: {str(e)}")
                db.rollback()  # Rollback on error
            
            # Return command to move to human facing response
            return Command(
                update={
                    "messages": [
                        ToolMessage(
                            content=json.dumps(query_response),
                            tool_call_id="simple_query_handler_node",
                        )
                    ],
                    "debug_messages": state["debug_messages"],
                },
                goto="human_facing_response",
            )
            
        finally:
            db.close()
        
    except Exception as e:
        print(f"Error in simple_query_handler_node: {str(e)}")
        error_response = {
            "error": str(e),
            "message": "An error occurred while processing your request"
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
                    query=state["input"],
                    response=serialized_error
                )
                db.commit()  # Commit the transaction
            except Exception as e:
                print(f"Error saving chat history: {str(e)}")
                db.rollback()  # Rollback on error
        finally:
            db.close()
        
        return Command(
            update={
                "messages": [
                    ToolMessage(
                        content=json.dumps(error_response),
                        tool_call_id="simple_query_handler_node",
                    )
                ],
                "debug_messages": state["debug_messages"],
            },
            goto="human_facing_response",
        )

def cached_query_handler_node(
    state: dict, writer: StreamWriter, config: dict
) -> Command[Literal["human_facing_response"]]:
    """
    Node that handles queries with database caching.
    
    This node:
    1. Initializes the database if needed
    2. Uses the LLM to determine which tables to query
    3. Executes the queries and returns the results
    4. Passes the data to the next node
    """
    print("In Cached Query Handler node")
    
    try:
        # Initialize database
        init_db(db_manager.engine)
        
        # Read database context (for the LLM)
        with open("src/db/models.py", "r") as file:
            context = file.read()
        
        # Generate database query parameters using the LLM
        response = PAYLOAD_GENERATOR_CHAIN.invoke(
            {
                "query": state["input"],
                "context": context,
            }
        )
        
        print("*" * 100)
        print("DATABASE QUERY PARAMETERS")
        print(response)
        
        # Parse the response as dictionary
        query_params = response if isinstance(response, dict) else json.loads(response)
        
        # Ensure we get horse names for odds queries
        if "Result" in query_params.get("filters", {}) and "sp_dec" in str(query_params["filters"]["Result"]):
            if "Horse" not in query_params.get("filters", {}):
                query_params["filters"]["Horse"] = {}
            if "fields" not in query_params["filters"]["Horse"]:
                query_params["filters"]["Horse"]["fields"] = ["horse_id", "horse"]
            elif "horse" not in query_params["filters"]["Horse"]["fields"]:
                query_params["filters"]["Horse"]["fields"].append("horse")
        
        # Execute database queries and collect responses
        query_response = {}
        
        # Get database session
        db = db_manager.SessionLocal()
        try:
            for table_info in query_params.get('content', []):
                if isinstance(table_info, dict):
                    table_name = table_info.get('name')
                    filters = table_info.get('filters', {})
                else:
                    table_name = table_info
                    filters = {}
                
                try:
                    # Map table name to model class
                    model_class = globals().get(table_name)
                    if model_class:
                        # Build query
                        query = db.query(model_class)
                        for field, value in filters.items():
                            if hasattr(model_class, field):
                                query = query.filter(getattr(model_class, field) == value)
                        
                        # Execute query
                        results = query.all()
                        if results:
                            # Convert results to dict
                            query_response[table_name] = [
                                {c.name: getattr(r, c.name) for c in r.__table__.columns}
                                for r in results
                            ]
                            print(f"{table_name} -> Data retrieved successfully")
                        else:
                            print(f"{table_name} -> No results returned")
                except Exception as e:
                    print(f"Error querying {table_name}: {str(e)}")
                    query_response[table_name] = {"error": str(e)}
            
            # Create response messages
            debug_tool_message = ToolMessage(
                content=json.dumps(query_response),
                tool_call_id="cached_query_handler_node",
            )
            
            response_message = ToolMessage(
                content=json.dumps(query_response),
                tool_call_id="cached_query_handler_node",
            )
            
            return Command(
                update={"messages": [response_message], "debug_messages": [debug_tool_message]},
                goto="human_facing_response",
            )
            
        finally:
            db.close()
        
    except Exception as e:
        print(f"Error in cached_query_handler_node: {str(e)}")
        error_message = ToolMessage(
            content=json.dumps({"error": str(e)}),
            tool_call_id="cached_query_handler_node",
        )
        return Command(
            update={"messages": [error_message]},
            goto="human_facing_response",
        )


