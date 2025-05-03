from src.graph.simple_query_agent.nodes import simple_query_handler_node
from src.graph.simple_query_agent.models import AgentState

def test_query(query: str):
    """
    Test the query system with a single query.
    Only the query is provided as input - all context and processing is handled internally.
    """
    print(f"\nProcessing Query: {query}")
    print("=" * 50)
    
    # Create the agent state with just the query
    state = AgentState(
        input=query,
        messages=[],
        debug_messages=[]
    )
    
    try:
        # Process the query through the query handler
        result = simple_query_handler_node(state, None, {})
        print("\nQuery Result:")
        print(result)
    except Exception as e:
        print(f"Error processing query: {str(e)}")

def run_tests():
    """
    Run a series of test queries through the system.
    """
    test_queries = [
        "Show me the last 5 races at Ascot with odds between 2.0 and 5.0",
        "Find all horses that won races in the last month",
        "Show me the top 10 jockeys by number of wins at Cheltenham this year",
        "List all races where Frankie Dettori rode the winner"
    ]
    
    for query in test_queries:
        test_query(query)
        print("\n" + "=" * 50)

if __name__ == "__main__":
    run_tests() 