from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime
from enum import Enum

# Enums
class NodeType(str, Enum):
    ORACLE_QUERY = "oracle_query"
    UNIX_COMMAND = "unix_command"
    LLM_ANALYSIS = "llm_analysis"
    CONDITION = "condition"
    PARALLEL = "parallel"
    REPORT = "report"

class WorkflowStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class AgentType(str, Enum):
    PRICING = "pricing_agent"
    UNIX = "unix_agent"
    ANALYSIS = "analysis_agent"

# Node Models
class NodePosition(BaseModel):
    x: float
    y: float

class NodeData(BaseModel):
    label: str
    type: NodeType
    config: Dict[str, Any] = {}
    agent: Optional[AgentType] = None

class WorkflowNode(BaseModel):
    id: str
    type: str  # For React Flow compatibility
    position: NodePosition
    data: NodeData

class WorkflowEdge(BaseModel):
    id: str
    source: str
    target: str
    label: Optional[str] = None
    animated: bool = False

# Workflow Models
class WorkflowDefinition(BaseModel):
    id: Optional[str] = None
    name: str
    description: Optional[str] = None
    nodes: List[WorkflowNode]
    edges: List[WorkflowEdge]
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    version: str = "1.0.0"
    tags: List[str] = []

class WorkflowExecution(BaseModel):
    id: str
    workflow_id: str
    status: WorkflowStatus
    started_at: datetime
    completed_at: Optional[datetime] = None
    current_node: Optional[str] = None
    context: Dict[str, Any] = {}
    results: Dict[str, Any] = {}
    error: Optional[str] = None

# Chat Models
class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str
    timestamp: datetime = Field(default_factory=datetime.now)
    metadata: Dict[str, Any] = {}

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    context: Dict[str, Any] = {}

class ChatResponse(BaseModel):
    response: str
    conversation_id: str
    workflow_id: Optional[str] = None
    suggested_workflow: Optional[WorkflowDefinition] = None
    metadata: Dict[str, Any] = {}

# Agent Models
class AgentSkill(BaseModel):
    name: str
    description: str
    capabilities: List[str]
    examples: List[str]

class AgentInfo(BaseModel):
    name: str
    type: AgentType
    description: str
    skills: AgentSkill
    version: str
    mcp_server: str

# MCP Models
class MCPRequest(BaseModel):
    action: str
    parameters: Dict[str, Any]
    timeout: int = 30

class MCPResponse(BaseModel):
    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None
    execution_time: float
    cached: bool = False

# Oracle Query Models
class OracleQuery(BaseModel):
    sql: str
    parameters: Dict[str, Any] = {}
    fetch_size: int = 100

class OracleQueryResult(BaseModel):
    columns: List[str]
    rows: List[List[Any]]
    row_count: int
    execution_time: float

# Unix Command Models
class UnixCommand(BaseModel):
    command: str
    server: str
    timeout: int = 30
    sudo: bool = False

class UnixCommandResult(BaseModel):
    stdout: str
    stderr: str
    exit_code: int
    execution_time: float

# LLM Request Models
class LLMRequest(BaseModel):
    prompt: str
    max_tokens: int = 2048
    temperature: float = 0.7
    stop_sequences: List[str] = []
    context: Dict[str, Any] = {}

class LLMResponse(BaseModel):
    text: str
    tokens_used: int
    cached: bool = False
    compression_ratio: Optional[float] = None

# Workflow Builder Models
class WorkflowBuildRequest(BaseModel):
    user_intent: str
    context: Dict[str, Any] = {}

class WorkflowBuildResponse(BaseModel):
    workflow: WorkflowDefinition
    explanation: str
    confidence: float
    estimated_duration: int  # seconds

# Execution Control
class ExecutionControl(BaseModel):
    action: Literal["start", "pause", "resume", "cancel"]
    workflow_execution_id: str

# Compression Stats
class CompressionStats(BaseModel):
    original_tokens: int
    compressed_tokens: int
    ratio: float
    technique: str
    time_saved: float

# Cache Stats
class CacheStats(BaseModel):
    hits: int
    misses: int
    hit_rate: float
    total_size: int
    evictions: int
