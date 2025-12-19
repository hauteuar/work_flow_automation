from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
import os
import json


from config import settings
from models import *
from cache.redis_cache import cache
from intelligence.compression import compression_engine
from intelligence.prompt_engine import prompt_engine

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    print("🚀 Starting Pricing Workflow POC...")
    print(f"   API: {settings.API_HOST}:{settings.API_PORT}")
    print(f"   Redis: {settings.REDIS_HOST}:{settings.REDIS_PORT}")
    print(f"   LLM: {settings.LLM_API_URL}")
    
    # Test Redis connection
    if cache.available:
        print("   ✓ Redis cache available")
    else:
        print("   ⚠ Redis cache unavailable (using in-memory)")
    
    # Load available agents
    agents = prompt_engine.get_available_agents()
    print(f"   ✓ Loaded {len(agents)} agents: {', '.join(agents)}")
    
    yield
    
    # Shutdown
    print("👋 Shutting down Pricing Workflow POC...")

# Create FastAPI app
app = FastAPI(
    title=settings.API_TITLE,
    version=settings.API_VERSION,
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "service": "Pricing Workflow POC",
        "version": settings.API_VERSION,
        "status": "running"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "redis": cache.available,
        "cache_stats": cache.get_stats() if cache.available else None
    }

@app.get("/api/cache/stats")
async def get_cache_stats():
    return cache.get_stats()

@app.get("/api/intelligence/compression/stats")
async def get_compression_stats():
    return compression_engine.get_stats()

@app.get("/api/agents")
async def list_agents():
    agents = prompt_engine.get_available_agents()
    
    agent_info = []
    for agent_name in agents:
        skills = prompt_engine.load_agent_skills(agent_name)
        config = prompt_engine.load_config(agent_name)
        
        agent_info.append({
            "name": agent_name,
            "display_name": skills.get('name', agent_name),
            "version": skills.get('version', '1.0.0'),
            "capabilities_count": len(skills.get('capabilities', [])),
            "mcp_server": config.get('mcp_server', 'unknown')
        })
    
    return {"agents": agent_info}

@app.get("/api/agents/{agent_name}/skills")
async def get_agent_skills(agent_name: str):
    skills = prompt_engine.load_agent_skills(agent_name)
    
    if not skills or not skills.get('capabilities'):
        raise HTTPException(status_code=404, detail=f"Agent {agent_name} not found")
    
    return skills

@app.post("/api/test/compress")
async def test_compression(text: str, max_tokens: int = 2000):
    compressed, metadata = await compression_engine.compress_context(text, max_tokens)
    
    return {
        "original": text,
        "compressed": compressed,
        "metadata": metadata
    }

# Skills management endpoints
@app.get("/api/agents/{agent_name}/skills/raw")
async def get_agent_skills_raw(agent_name: str):
    """Get raw skills.md content"""
    skills_path = f"./app/skills/{agent_name}/skills.md"
    
    if not os.path.exists(skills_path):
        raise HTTPException(status_code=404, detail=f"Skills file not found for {agent_name}")
    
    with open(skills_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    return {"content": content}

@app.put("/api/agents/{agent_name}/skills")
async def update_agent_skills(agent_name: str, request: dict):
    """Update skills.md content"""
    content = request.get('content', '')
    skills_path = f"./app/skills/{agent_name}/skills.md"
    
    # Create directory if doesn't exist
    os.makedirs(os.path.dirname(skills_path), exist_ok=True)
    
    with open(skills_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    # Reload skills in prompt engine
    prompt_engine.reload_skills(agent_name)
    
    return {"message": "Skills updated successfully"}

@app.put("/api/agents/{agent_name}/config")
async def update_agent_config(agent_name: str, request: dict):
    """Update config.json content"""
    content = request.get('content', '')
    config_path = f"./app/skills/{agent_name}/config.json"
    
    # Create directory if doesn't exist
    os.makedirs(os.path.dirname(config_path), exist_ok=True)
    
    # Parse and validate JSON
    try:
        config_data = json.loads(content)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON content")
    
    with open(config_path, 'w', encoding='utf-8') as f:
        json.dump(config_data, f, indent=2)
    
    return {"message": "Config updated successfully"}

@app.post("/api/agents/{agent_name}")
async def create_agent(agent_name: str, request: dict):
    """Create new agent with skills and config"""
    skills_content = request.get('skills', '')
    config_data = request.get('config', {})
    
    # Create agent directory
    agent_dir = f"./app/skills/{agent_name}"
    os.makedirs(agent_dir, exist_ok=True)
    os.makedirs(f"{agent_dir}/prompts", exist_ok=True)
    
    # Write skills.md
    with open(f"{agent_dir}/skills.md", 'w', encoding='utf-8') as f:
        f.write(skills_content)
    
    # Write config.json
    with open(f"{agent_dir}/config.json", 'w', encoding='utf-8') as f:
        json.dump(config_data, f, indent=2)
    
    # Create default prompt template
    with open(f"{agent_dir}/prompts/default.txt", 'w', encoding='utf-8') as f:
        f.write(f"You are a {agent_name} agent.\n\nTask: {{task}}\n\nContext: {{context}}")
    
    return {"message": "Agent created successfully", "agent_name": agent_name}

@app.delete("/api/agents/{agent_name}")
async def delete_agent(agent_name: str):
    """Delete an agent"""
    import shutil
    agent_dir = f"./app/skills/{agent_name}"
    
    if not os.path.exists(agent_dir):
        raise HTTPException(status_code=404, detail="Agent not found")
    
    shutil.rmtree(agent_dir)
    
    return {"message": "Agent deleted successfully"}


@app.post("/api/test/prompt")
async def test_prompt_building(agent_name: str, task: str):
    prompt = prompt_engine.build_prompt(
        agent_name=agent_name,
        task=task,
        context={"test": True}
    )
    
    return {
        "agent": agent_name,
        "task": task,
        "prompt": prompt
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=True,
        log_level="info"
    )
