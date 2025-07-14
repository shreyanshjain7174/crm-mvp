"""
Database configuration and models for AI service
"""

from sqlalchemy import create_engine, Column, String, DateTime, Boolean, Float, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import json

from core.config import settings

# Create database engine
engine = create_engine(settings.DATABASE_URL, echo=settings.ENVIRONMENT == "development")
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# AI Service specific models
class WorkflowExecution(Base):
    __tablename__ = "ai_workflow_executions"
    
    id = Column(String, primary_key=True)
    workflow_id = Column(String, nullable=False)
    lead_id = Column(String, nullable=True)
    status = Column(String, default="PENDING")  # PENDING, RUNNING, COMPLETED, FAILED, CANCELLED
    current_node = Column(String, nullable=True)
    context = Column(Text, nullable=True)  # JSON string
    result = Column(Text, nullable=True)   # JSON string
    error = Column(Text, nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

class ExecutionStep(Base):
    __tablename__ = "ai_execution_steps"
    
    id = Column(String, primary_key=True)
    execution_id = Column(String, nullable=False)
    node_id = Column(String, nullable=False)
    node_type = Column(String, nullable=False)
    status = Column(String, default="PENDING")  # PENDING, RUNNING, COMPLETED, FAILED, SKIPPED
    input_data = Column(Text, nullable=True)   # JSON string
    output_data = Column(Text, nullable=True)  # JSON string
    error = Column(Text, nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

class AgentKnowledge(Base):
    __tablename__ = "agent_knowledge"
    
    id = Column(String, primary_key=True)
    content = Column(Text, nullable=False)
    embedding = Column(Text, nullable=True)  # JSON string of vector
    metadata = Column(Text, nullable=True)   # JSON string
    source = Column(String, nullable=True)
    category = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class AgentMemory(Base):
    __tablename__ = "agent_memory"
    
    id = Column(String, primary_key=True)
    lead_id = Column(String, nullable=False)
    agent_type = Column(String, nullable=False)
    memory_type = Column(String, nullable=False)  # short_term, long_term, episodic
    content = Column(Text, nullable=False)
    embedding = Column(Text, nullable=True)
    relevance_score = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)

async def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)

def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Database utilities
class DatabaseHelper:
    @staticmethod
    def serialize_json(data):
        """Convert dict to JSON string"""
        return json.dumps(data) if data else None
    
    @staticmethod
    def deserialize_json(json_str):
        """Convert JSON string to dict"""
        return json.loads(json_str) if json_str else None