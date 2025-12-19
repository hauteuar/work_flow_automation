"""
Cache Manager - Redis integration for workflow and execution data
"""

import redis
import json
from typing import Optional, Dict, Any, List
from datetime import datetime


class CacheManager:
    def __init__(self, host='localhost', port=6379, db=0):
        """Initialize Redis connection with fallback to in-memory"""
        self.memory_cache = {}
        self.use_redis = False
        
        try:
            self.redis = redis.Redis(
                host=host,
                port=port,
                db=db,
                decode_responses=True,
                socket_timeout=5
            )
            self.redis.ping()
            self.use_redis = True
            print("✓ Redis connected - using Redis cache")
        except Exception as e:
            print(f"✗ Redis not available - using in-memory cache: {e}")
            self.redis = None
            self.memory_cache = {
                "workflows": {},
                "executions": {},
                "cache": {}
            }
    
    def ping(self) -> bool:
        """Check if Redis is available"""
        if not self.use_redis:
            return False
        try:
            self.redis.ping()
            return True
        except:
            return False
    
    # ========================================================================
    # GENERIC CACHE OPERATIONS
    # ========================================================================
    
    def get(self, key: str) -> Optional[str]:
        """Get value from cache"""
        if self.use_redis:
            try:
                return self.redis.get(key)
            except:
                return None
        return self.memory_cache["cache"].get(key)
    
    def set(self, key: str, value: str, ttl: int = 300):
        """Set value in cache with TTL"""
        if self.use_redis:
            try:
                self.redis.setex(key, ttl, value)
            except:
                pass
        else:
            self.memory_cache["cache"][key] = value
    
    def delete(self, key: str):
        """Delete key from cache"""
        if self.use_redis:
            try:
                self.redis.delete(key)
            except:
                pass
        else:
            self.memory_cache["cache"].pop(key, None)
    
    def exists(self, key: str) -> bool:
        """Check if key exists"""
        if self.use_redis:
            try:
                return self.redis.exists(key) > 0
            except:
                return False
        return key in self.memory_cache["cache"]
    
    # ========================================================================
    # WORKFLOW OPERATIONS
    # ========================================================================
    
    def set_workflow(self, workflow_id: str, workflow_data: Dict[str, Any]):
        """Store workflow definition"""
        key = f"workflow:{workflow_id}"
        if self.use_redis:
            try:
                self.redis.setex(key, 86400 * 7, json.dumps(workflow_data))  # 7 days TTL
                # Add to workflow list
                self.redis.sadd("workflows:list", workflow_id)
            except Exception as e:
                print(f"Error storing workflow: {e}")
        else:
            self.memory_cache["workflows"][workflow_id] = workflow_data
    
    def get_workflow(self, workflow_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve workflow definition"""
        key = f"workflow:{workflow_id}"
        if self.use_redis:
            try:
                data = self.redis.get(key)
                return json.loads(data) if data else None
            except:
                return None
        return self.memory_cache["workflows"].get(workflow_id)
    
    def list_workflows(self) -> List[Dict[str, Any]]:
        """List all workflows"""
        workflows = []
        if self.use_redis:
            try:
                workflow_ids = self.redis.smembers("workflows:list")
                for wf_id in workflow_ids:
                    wf_data = self.get_workflow(wf_id)
                    if wf_data:
                        workflows.append(wf_data)
            except:
                pass
        else:
            workflows = list(self.memory_cache["workflows"].values())
        
        # Sort by created_at descending
        workflows.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return workflows
    
    def delete_workflow(self, workflow_id: str):
        """Delete workflow"""
        key = f"workflow:{workflow_id}"
        if self.use_redis:
            try:
                self.redis.delete(key)
                self.redis.srem("workflows:list", workflow_id)
            except:
                pass
        else:
            self.memory_cache["workflows"].pop(workflow_id, None)
    
    # ========================================================================
    # EXECUTION OPERATIONS
    # ========================================================================
    
    def set_execution(self, execution_id: str, execution_data: Dict[str, Any]):
        """Store execution data"""
        key = f"execution:{execution_id}"
        execution_data["last_updated"] = datetime.now().isoformat()
        
        if self.use_redis:
            try:
                self.redis.setex(key, 86400, json.dumps(execution_data))  # 24 hours TTL
                # Add to execution list
                self.redis.zadd(
                    "executions:list",
                    {execution_id: datetime.now().timestamp()}
                )
            except Exception as e:
                print(f"Error storing execution: {e}")
        else:
            self.memory_cache["executions"][execution_id] = execution_data
    
    def get_execution(self, execution_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve execution data"""
        key = f"execution:{execution_id}"
        if self.use_redis:
            try:
                data = self.redis.get(key)
                return json.loads(data) if data else None
            except:
                return None
        return self.memory_cache["executions"].get(execution_id)
    
    def update_execution_status(
        self,
        execution_id: str,
        status: str,
        current_step: Optional[str] = None,
        result: Optional[Dict[str, Any]] = None,
        error: Optional[str] = None
    ):
        """Update execution status"""
        execution_data = self.get_execution(execution_id)
        if not execution_data:
            execution_data = {
                "execution_id": execution_id,
                "status": status,
                "started_at": datetime.now().isoformat(),
                "steps": []
            }
        
        execution_data["status"] = status
        execution_data["last_updated"] = datetime.now().isoformat()
        
        if current_step:
            execution_data["current_step"] = current_step
            execution_data["steps"].append({
                "step": current_step,
                "status": status,
                "timestamp": datetime.now().isoformat(),
                "result": result,
                "error": error
            })
        
        if status in ["completed", "failed"]:
            execution_data["completed_at"] = datetime.now().isoformat()
        
        if error:
            execution_data["error"] = error
        
        if result:
            execution_data["result"] = result
        
        self.set_execution(execution_id, execution_data)
    
    def list_executions(self, limit: int = 20) -> List[Dict[str, Any]]:
        """List recent executions"""
        executions = []
        if self.use_redis:
            try:
                # Get execution IDs sorted by timestamp (newest first)
                execution_ids = self.redis.zrevrange("executions:list", 0, limit - 1)
                for exec_id in execution_ids:
                    exec_data = self.get_execution(exec_id)
                    if exec_data:
                        executions.append(exec_data)
            except:
                pass
        else:
            executions = list(self.memory_cache["executions"].values())
            executions.sort(
                key=lambda x: x.get("started_at", ""),
                reverse=True
            )
            executions = executions[:limit]
        
        return executions
    
    # ========================================================================
    # LLM RESPONSE CACHING
    # ========================================================================
    
    def cache_llm_response(self, prompt_hash: str, response: str, ttl: int = 3600):
        """Cache LLM response to save costs"""
        key = f"llm:{prompt_hash}"
        self.set(key, response, ttl)
    
    def get_cached_llm_response(self, prompt_hash: str) -> Optional[str]:
        """Get cached LLM response"""
        key = f"llm:{prompt_hash}"
        return self.get(key)
    
    # ========================================================================
    # STATISTICS
    # ========================================================================
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        stats = {
            "redis_available": self.use_redis,
            "timestamp": datetime.now().isoformat()
        }
        
        if self.use_redis:
            try:
                stats["workflows_count"] = self.redis.scard("workflows:list")
                stats["executions_count"] = self.redis.zcard("executions:list")
                stats["cache_keys"] = self.redis.dbsize()
            except:
                stats["error"] = "Could not fetch Redis stats"
        else:
            stats["workflows_count"] = len(self.memory_cache["workflows"])
            stats["executions_count"] = len(self.memory_cache["executions"])
            stats["cache_keys"] = len(self.memory_cache["cache"])
        
        return stats
    
    def clear_all(self):
        """Clear all cache (use with caution!)"""
        if self.use_redis:
            try:
                self.redis.flushdb()
            except:
                pass
        else:
            self.memory_cache = {
                "workflows": {},
                "executions": {},
                "cache": {}
            }
