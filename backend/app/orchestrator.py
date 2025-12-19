"""
Workflow Orchestrator - Coordinates workflow execution
"""

import asyncio
import hashlib
import json
from typing import Dict, Any, List
from datetime import datetime
import aiohttp

from mcp_servers.oracle_mcp import OracleMCPServer
from mcp_servers.unix_mcp import UnixMCPServer


class WorkflowOrchestrator:
    def __init__(self, cache_manager, credential_store, llm_endpoint: str = "http://localhost:8001/generate"):
        self.cache_manager = cache_manager
        self.credential_store = credential_store
        self.llm_endpoint = llm_endpoint
        print("✓ Workflow Orchestrator initialized")
    
    async def test_connection(self, node_id: str, credentials: Dict[str, str]) -> Dict[str, Any]:
        """Test connection for a node"""
        cred_data = self.credential_store.get(node_id)
        if not cred_data:
            return {"success": False, "message": "No credentials found"}
        
        node_type = cred_data["node_type"]
        creds = cred_data["credentials"]
        
        try:
            if node_type == "oracle":
                mcp = OracleMCPServer()
                success, message = mcp.connect(creds)
                if success:
                    result = mcp.test_connection()
                    mcp.disconnect()
                    return result
                return {"success": False, "message": message}
            
            elif node_type == "unix":
                mcp = UnixMCPServer()
                success, message = mcp.connect(creds)
                if success:
                    result = mcp.test_connection()
                    mcp.disconnect()
                    return result
                return {"success": False, "message": message}
            
            else:
                return {"success": True, "message": "Test not implemented"}
        
        except Exception as e:
            return {"success": False, "message": str(e)}
    
    async def execute_workflow(self, workflow_id: str, input_data: Dict[str, Any], execution_id: str, connection_manager):
        """Execute workflow"""
        try:
            self.cache_manager.update_execution_status(execution_id, status="running", current_step="Starting")
            
            await connection_manager.broadcast({
                "type": "execution_status",
                "execution_id": execution_id,
                "status": "running"
            })
            
            workflow = self.cache_manager.get_workflow(workflow_id)
            if not workflow:
                raise Exception("Workflow not found")
            
            # Execute nodes (simplified)
            results = {}
            for node in workflow["nodes"]:
                result = await self._execute_node(node, input_data, results)
                results[node["id"]] = result
                
                await connection_manager.broadcast({
                    "type": "node_completed",
                    "execution_id": execution_id,
                    "node_id": node["id"],
                    "result": result
                })
            
            self.cache_manager.update_execution_status(execution_id, status="completed", result=results)
            
            await connection_manager.broadcast({
                "type": "execution_completed",
                "execution_id": execution_id,
                "results": results
            })
        
        except Exception as e:
            self.cache_manager.update_execution_status(execution_id, status="failed", error=str(e))
            
            await connection_manager.broadcast({
                "type": "execution_failed",
                "execution_id": execution_id,
                "error": str(e)
            })
    
    async def _execute_node(self, node: Dict, input_data: Dict, previous_results: Dict) -> Dict:
        """Execute a node"""
        node_type = node["type"]
        config = node.get("config", {})
        
        if node_type == "oracle":
            return await self._execute_oracle_node(node["id"], config, input_data)
        elif node_type == "unix":
            return await self._execute_unix_node(node["id"], config, input_data)
        elif node_type == "llm":
            return await self._execute_llm_node(config, input_data, previous_results)
        
        return {"success": False, "error": "Unknown node type"}
    
    async def _execute_oracle_node(self, node_id: str, config: Dict, input_data: Dict) -> Dict:
        """Execute Oracle node"""
        cred_data = self.credential_store.get(node_id)
        if not cred_data:
            return {"success": False, "error": "No credentials"}
        
        mcp = OracleMCPServer()
        try:
            success, msg = mcp.connect(cred_data["credentials"])
            if not success:
                return {"success": False, "error": msg}
            
            action = config.get("action", "query")
            if action == "check_pricing_status":
                cusip = input_data.get("cusip") or config.get("cusip")
                return mcp.check_pricing_status(cusip)
            elif action == "query":
                return mcp.execute_query(config.get("sql", "SELECT 1 FROM DUAL"))
            
            return {"success": True, "message": "Action completed"}
        finally:
            mcp.disconnect()
    
    async def _execute_unix_node(self, node_id: str, config: Dict, input_data: Dict) -> Dict:
        """Execute Unix node"""
        cred_data = self.credential_store.get(node_id)
        if not cred_data:
            return {"success": False, "error": "No credentials"}
        
        mcp = UnixMCPServer()
        try:
            success, msg = mcp.connect(cred_data["credentials"])
            if not success:
                return {"success": False, "error": msg}
            
            action = config.get("action", "execute_command")
            if action == "check_pricing_job_logs":
                cusip = input_data.get("cusip") or config.get("cusip")
                return mcp.check_pricing_job_logs(cusip)
            elif action == "execute_command":
                return mcp.execute_command(config.get("command", "echo 'test'"))
            
            return {"success": True, "message": "Action completed"}
        finally:
            mcp.disconnect()
    
    async def _execute_llm_node(self, config: Dict, input_data: Dict, previous_results: Dict) -> Dict:
        """Execute LLM node"""
        prompt = config.get("prompt", "Analyze the data")
        
        # Check cache
        prompt_hash = hashlib.md5(prompt.encode()).hexdigest()
        cached = self.cache_manager.get_cached_llm_response(prompt_hash)
        
        if cached:
            return {"success": True, "response": cached, "cached": True}
        
        # Call LLM (mock for now)
        return {"success": True, "response": "LLM analysis result", "cached": False}
    
    async def process_chat_message(self, message: str, context: Dict) -> Dict:
        """Process chat message"""
        return {
            "response": "I can help you build pricing workflows",
            "suggested_action": "create_workflow"
        }
