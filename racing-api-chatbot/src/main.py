from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import timedelta
import os
import sys


from langgraph.checkpoint.memory import MemorySaver
from src.graph import initialize_graph
from src.db.database import db_manager
from src.db.models import User, Base
from src.auth.schemas import UserCreate, Token
from src.auth.utils import (
    get_password_hash,
    verify_password,
    create_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    get_current_active_user
)

def _get_interrupt(state):
    if state.tasks and len(state.tasks) > 0 and state.tasks[0].interrupts and len(state.tasks[0].interrupts) > 0:
        return state.tasks[0].interrupts[0]
    return None

app = FastAPI(root_path="/langgraph-race-api")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup."""
    try:
        print("Checking required packages...")
        # Get the root directory of the project
        root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        requirements_path = os.path.join(root_dir, "requirements.txt")
        
        # Auto install packages in Docker, prompt in development
        in_docker = os.environ.get('DOCKER_ENV', 'false').lower() in ('true', '1', 't')
       
        print("Initializing database...")
        db_manager.init_db()
        print("Database initialized successfully")
    except Exception as e:
        print(f"Error during startup: {str(e)}")
        raise

class QueryRequest(BaseModel):
    query: str
    thread_id: str
    user_key: str

@app.post("/chat")
async def chat(
    request: QueryRequest, 
    db: Session = Depends(db_manager.get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Use the authenticated user's token instead of a default token
    # The token is already validated by the get_current_active_user dependency

    print(request)

    thread_config = {
        "configurable": {
            "thread_id": request.thread_id,
            "user_key": request.user_key,
            "user_email": current_user.email,  # Add authenticated user's email
        },
        "recursion_limit": 100,
    }

    checkpointer = MemorySaver()
    graph = initialize_graph(checkpointer=checkpointer)

    # Generate response
    inputs = {"input": request.query, "past_steps": [], "messages": []}
    response = graph.invoke(inputs, thread_config)

    # Save chat history to database
    db_manager.save_chat_history(
        db=db,
        thread_id=request.thread_id,
        user_key=request.user_key,
        query=request.query,
        response=response
    )

    return {"response": response['response']}

@app.get("/chat/history")
async def get_chat_history(
    thread_id: str = None,
    user_key: str = None,
    limit: int = 10,
    db: Session = Depends(db_manager.get_db),
    current_user: User = Depends(get_current_active_user)
):
    # If no user_key is provided, use the current user's email
    if not user_key:
        user_key = current_user.email
        
    # Only allow users to access their own chat history
    # Admin users could bypass this check if needed
    if user_key != current_user.email and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only access your own chat history"
        )
    
    history = db_manager.get_chat_history(
        db=db,
        thread_id=thread_id,
        user_key=user_key,
        limit=limit
    )
    
    return {"history": [{
        "id": item.id,
        "thread_id": item.thread_id,
        "user_key": item.user_key,
        "query": item.query,
        "response": item.response,
        "created_at": item.created_at.isoformat()
    } for item in history]}

@app.post("/signup", response_model=Token)
async def signup(user: UserCreate, db: Session = Depends(db_manager.get_db)):
    # Check if user already exists
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(db_manager.get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me")
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user
