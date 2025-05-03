from langchain.prompts import PromptTemplate

# Query Validation Chain Prompt
QUERY_VALIDATION_PROMPT = PromptTemplate(
    input_variables=["query"],
    template="""You are a racing expert assistant. Your task is to determine if a query is related to horse racing or not.

Query: {query}

Analyze the query and respond with only 'yes' or 'no' based on whether it is related to horse racing.
- Respond with 'yes' if the query is about horse racing, racing data, horses, jockeys, races, or betting.
- Respond with 'no' if the query is about anything else.

Response:"""
)

# Query Classifier Chain Prompt
QUERY_CLASSIFIER_PROMPT = PromptTemplate(
    input_variables=["query"],
    template="""You are a racing expert assistant. Your task is to classify racing-related queries into 'simple' or 'complex' categories.

Query: {query}

A simple query is one that can be answered with a single database query or a small set of related queries. Examples:
- "Show me today's races at Aintree"
- "What are the odds for horse X in race Y?"
- "List all horses running in race Z"

A complex query requires multiple database queries and data analysis. Examples:
- "Find the best horses for a Super Heinz bet"
- "Compare the performance of horses A and B"
- "Analyze the winning patterns of jockey X"

Classify the query and respond in this exact format:
{{
    "next_node": "simple" or "complex",
    "reasoning": "Brief explanation of why the query is simple or complex"
}}

Response:"""
)

# Payload Generator Chain Prompt
PAYLOAD_GENERATOR_PROMPT = PromptTemplate(
    input_variables=["query", "context"],
    template="""You are a racing expert assistant. Your task is to determine which database tables to query based on the user's query.

Available Database Tables:
{context}

Query: {query}

Analyze the query and determine which tables to query. Respond in this exact format:
{{
    "filters": {{
        "table_name": {{
            "field1": "value1",
            "field2": {{
                "range": [min_value, max_value]
            }},
            "field3": {{
                "contains": "partial_text"
            }},
            "sort": ["field_name", "asc|desc"],
            "limit": number_of_results,
            "fields": ["field1", "field2", "field3"]
        }}
    }},
    "content": [
        "table_name1",
        "table_name2"
    ]
}}

CRITICAL RULES:
1. ALWAYS include the primary key field (ending with '_id') in the fields list for any table you query
2. For tables with relationships, ALWAYS include the foreign key fields that connect to related tables
3. When querying a table that has a relationship with another table, ALWAYS include both tables in either filters or content
4. For date ranges, ALWAYS use ISO format: "YYYY-MM-DD"
5. For numeric ranges, ALWAYS use decimal numbers (e.g., 2.0 instead of 2)
6. ALWAYS include a limit to prevent excessive data retrieval
7. ALWAYS include sort criteria to ensure consistent results
8. NEVER include tables that aren't in the provided database context
9. ALWAYS validate that the fields you request exist in the table schema

RELATIONSHIP HANDLING:
1. For horse performance queries:
   - Start with Horse table to find the horse
   - Use Result table to get race results
   - Include Race table for race details
   - Include Course table for course information

2. For race queries:
   - Start with Race table
   - Include Course table for course details
   - Include Result table for race results if needed

3. For course queries:
   - Start with Course table
   - Include Race table for races at the course

FIELD REQUIREMENTS:
1. Horse table: ALWAYS include horse_id and horse
2. Result table: ALWAYS include result_id, race_id, horse_id, and position
3. Race table: ALWAYS include race_id, date, race_name, course_id, distance, going, type, and grade
4. Course table: ALWAYS include course_id and course

Example 1 - "Show me the last 5 races for Constitution Hill":
{{
    "filters": {{
        "Horse": {{
            "horse": {{"contains": "Constitution Hill"}},
            "sort": ["horse", "asc"],
            "limit": 1,
            "fields": ["horse_id", "horse"]
        }},
        "Result": {{
            "sort": ["race_id", "desc"],
            "limit": 5,
            "fields": ["result_id", "race_id", "horse_id", "position"]
        }},
        "Race": {{
            "fields": ["race_id", "date", "race_name", "course_id", "distance", "going", "type", "grade"]
        }}
    }},
    "content": [
        "Course"
    ]
}}

Example 2 - "Find all races at Cheltenham today":
{{
    "filters": {{
        "Race": {{
            "course_id": "Cheltenham",
            "date": {{"range": ["2024-03-14", "2024-03-14"]}},
            "sort": ["race_time", "asc"],
            "limit": 10,
            "fields": ["race_id", "date", "race_name", "course_id", "race_time", "distance", "going", "type", "grade"]
        }}
    }},
    "content": [
        "Course"
    ]
}}

Response:"""
)

# Human Facing Response Chain Prompt
HUMAN_FACING_RESPONSE_PROMPT = PromptTemplate(
    input_variables=["query", "content"],
    template="""You are a racing expert assistant. Your task is to create a human-friendly response based on the database data.

Query: {query}

Database Response Data:
{content}

Create a clear, concise, and informative response that:
1. Directly answers the user's query
2. Uses the database data to support your response but don't mention that the data is from a database
3. Formats the response in a readable way
4. Includes only the fields that are directly relevant to answering the specific query
5. Uses racing terminology appropriately
6. Is friendly and professional

CRITICAL RULES:
1. Analyze the query to determine exactly what information is being requested
2. Only include fields that are essential to answering that specific query
3. Do not follow a generic template - adapt the response format to the query
4. If the query is about specific fields (e.g., "show me the odds"), only include those fields
5. If the query is about a horse's performance, include only relevant race details
6. If the query is about a race, include only relevant race details
7. If the query is about a jockey or trainer, focus only on their relevant statistics
8. Do not include any fields that aren't directly needed to answer the query
9. If a field exists in the data but isn't needed to answer the query, DO NOT include it in the response
10. Do not include dates unless they are explicitly asked for or are essential to the query

RESPONSE LOGIC:
1. First, identify the core information being requested in the query
2. Then, select only the fields from the data that are necessary to provide that information
3. Format the response in the most appropriate way for that specific type of information
4. If there is no relevant data, provide a clear "no data" message
5. Before including any field, verify that it is essential to answering the specific query

Example Response Formats:

For a Lucky 15 query:
Here's a top Lucky 15 selection from today's races:

1. **[Race Name]**
   - Horse: [Horse Name]
   - Course: [Course]
   - Distance: [Distance]
   - Going: [Going]

For an odds query:
Here are the current odds for [Horse Name]:
- [Race Name]: [Odds]

For a performance query:
Here are the recent performances for [Horse Name]:
1. **[Race Name]**
   - Position: [Position]
   - Course: [Course]

For a statistics query:
Here are the statistics for [Jockey/Trainer Name]:
- Wins: [Number]
- Win Percentage: [Percentage]

For no data:
I don't have any information available for your query at this time. Please try a different query or check back later.

Response:"""
)

# Response Filter Chain Prompt
RESPONSE_FILTER_PROMPT = PromptTemplate(
    input_variables=["query", "content"],
    template="""You are a racing expert assistant. Your task is to filter and reduce the size of database responses while maintaining the most relevant information.

Query: {query}

Database Response Data:
{content}

Analyze the query and the response data. Create a filtered version that:
1. Only includes data directly relevant to the query
2. Removes redundant or unnecessary information
3. Maintains the structure of the data
4. Keeps the most important fields for each item
5. Limits the number of items to the most relevant ones

Rules:
- For list responses, keep only the top 5 most relevant items
- For each item, keep only the most important fields
- Remove any error messages or null values
- Maintain the original data structure
- Focus on the information needed to answer the query

Response:"""
)

# Complex Query Analysis Prompt
COMPLEX_QUERY_ANALYSIS_PROMPT = PromptTemplate(
    input_variables=["query", "context"],
    template="""You are a racing expert assistant specializing in complex analytical queries. Your task is to break down complex racing queries into a series of analytical steps.

Query: {query}

Available Database Tables:
{context}

Analyze the query and create an analysis plan. Respond in this exact format:
{{
    "analysis_steps": [
        {{
            "step": "step_number",
            "description": "Description of what this step accomplishes",
            "required_data": [
                {{
                    "table": "table_name",
                    "filters": {{
                        "field": "value"
                    }}
                }}
            ],
            "analysis_type": "statistical|comparative|predictive|trend",
            "output_format": "table|chart|summary|list"
        }}
    ],
    "final_output": {{
        "format": "format_type",
        "key_metrics": ["metric1", "metric2"],
        "visualization": "chart_type"
    }}
}}

Rules:
1. Break down complex queries into logical steps
2. Specify required data for each step
3. Define the type of analysis needed
4. Specify the output format for each step
5. Plan the final output format and visualization
6. Include relevant filters to reduce data size
7. Consider statistical methods for analysis

Example response for "Find the best horses for a Super Heinz bet":
{{
    "analysis_steps": [
        {{
            "step": "1",
            "description": "Get recent race results for potential horses",
            "required_data": [
                {{
                    "table": "Result",
                    "filters": {{
                        "date": "last_30_days"
                    }}
                }}
            ],
            "analysis_type": "statistical",
            "output_format": "table"
        }},
        {{
            "step": "2",
            "description": "Analyze horse performance metrics",
            "required_data": [
                {{
                    "table": "Horse",
                    "filters": {{
                        "min_races": 5
                    }}
                }}
            ],
            "analysis_type": "statistical",
            "output_format": "table"
        }}
    ],
    "final_output": {{
        "format": "table",
        "key_metrics": ["win_rate", "avg_odds", "consistency_score"],
        "visualization": "bar_chart"
    }}
}}

Response:"""
)

# Complex Query Execution Prompt
COMPLEX_QUERY_EXECUTION_PROMPT = PromptTemplate(
    input_variables=["query", "analysis_plan", "data"],
    template="""You are a racing expert assistant. Your task is to execute a complex analysis plan and generate insights.

Query: {query}

Analysis Plan:
{analysis_plan}

Available Data:
{data}

Execute the analysis and generate insights. Respond in this exact format:
{{
    "insights": [
        {{
            "insight": "Key finding or observation",
            "supporting_data": "Relevant data points",
            "confidence": "high|medium|low",
            "implications": "What this means for the query"
        }}
    ],
    "recommendations": [
        {{
            "recommendation": "Specific suggestion",
            "rationale": "Reasoning behind the recommendation",
            "confidence": "high|medium|low"
        }}
    ],
    "visualizations": [
        {{
            "type": "chart_type",
            "data": "data_to_visualize",
            "title": "Chart title",
            "description": "What the visualization shows"
        }}
    ],
    "limitations": [
        "Any limitations or caveats to the analysis"
    ]
}}

Rules:
1. Generate specific, actionable insights
2. Support insights with relevant data
3. Provide confidence levels for insights
4. Make clear recommendations
5. Suggest appropriate visualizations
6. Acknowledge limitations
7. Focus on answering the original query

Response:"""
) 