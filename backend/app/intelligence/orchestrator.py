"""
Intelligent Orchestrator
Coordinates multiple AI agents with compression and prompt engineering
"""

import asyncio
import json
from typing import Dict, List, Optional, Any
from datetime import datetime
import httpx

from intelligence.compression import BloatingCompressionEngine, ResponseCompressor
from intelligence.prompt_engine import PromptEngineeringEngine


class IntelligentOrchestrator:
    """
    Master orchestrator that:
    1. Understands user intent
    2. Decomposes tasks
    3. Routes to appropriate agents
    4. Compresses context to save tokens
    5. Synthesizes responses
    """
    
    def __init__(self, redis_client, llm_endpoint: str, skills_dir: str):
        self.redis = redis_client
        self.llm_endpoint = llm_endpoint
        
        # Initialize intelligent components
        self.compressor = BloatingCompressionEngine(redis_client)
        self.prompt_engine = PromptEngineeringEngine(skills_dir, redis_client)
        self.response_compressor = ResponseCompressor()
        
        # Agent registry
        self.agents = {
            "pricing_agent": {
                "name": "Pricing Agent",
                "skills": "pricing_agent",
                "mcp_server": "oracle_mcp",
                "triggers": ["price", "pricing", "cusip", "oracle", "database", "validation", "error code"]
            },
            "unix_agent": {
                "name": "Unix Agent",
                "skills": "unix_agent",
                "mcp_server": "unix_mcp",
                "triggers": ["log", "job", "server", "unix", "ssh", "file", "process", "restart"]
            },
            "analysis_agent": {
                "name": "Analysis Agent",
                "skills": "analysis_agent",
                "mcp_server": None,  # Orchestrator, doesn't use MCP directly
                "triggers": ["analyze", "root cause", "why", "investigate", "recommend", "summary"]
            }
        }
        
        print("🤖 Intelligent Orchestrator initialized")
        print(f"   LLM endpoint: {llm_endpoint}")
        print(f"   Agents available: {', '.join(self.agents.keys())}")
    
    async def process_request(self, user_query: str, context: Optional[Dict] = None) -> Dict:
        """
        Main entry point - process user query through intelligent workflow
        
        Returns:
        {
            "response": "Final response to user",
            "workflow": [list of steps executed],
            "agents_used": [list of agents],
            "compression_stats": {...},
            "execution_time": seconds
        }
        """
        start_time = datetime.now()
        
        print(f"\n{'='*60}")
        print(f"🎯 Processing Query: {user_query[:100]}...")
        print(f"{'='*60}")
        
        # Step 1: Understand intent and plan workflow
        workflow = await self._plan_workflow(user_query, context or {})
        
        # Step 2: Execute workflow
        results = await self._execute_workflow(workflow, user_query, context or {})
        
        # Step 3: Synthesize final response
        final_response = await self._synthesize_response(results, user_query)
        
        execution_time = (datetime.now() - start_time).total_seconds()
        
        return {
            "response": final_response,
            "workflow": workflow,
            "agents_used": [step["agent"] for step in workflow],
            "compression_stats": self.compressor.get_stats(),
            "execution_time": execution_time,
            "timestamp": datetime.now().isoformat()
        }
    
    async def _plan_workflow(self, query: str, context: Dict) -> List[Dict]:
        """
        Determine which agents to use and in what order
        Uses keyword matching and LLM for complex queries
        """
        print("\n📋 Planning Workflow...")
        
        query_lower = query.lower()
        
        # Simple rule-based routing for common patterns
        workflow = []
        
        # Pattern 1: Direct pricing query
        if any(trigger in query_lower for trigger in ["price for cusip", "pricing for", "check price"]):
            workflow.append({
                "agent": "pricing_agent",
                "action": "query_price",
                "template": "default"
            })
        
        # Pattern 2: Pricing failure investigation
        elif any(trigger in query_lower for trigger in ["why did pricing fail", "pricing failed", "investigate"]):
            workflow.extend([
                {
                    "agent": "pricing_agent",
                    "action": "get_error_details",
                    "template": "analysis"
                },
                {
                    "agent": "unix_agent",
                    "action": "analyze_logs",
                    "template": "log_analysis"
                },
                {
                    "agent": "analysis_agent",
                    "action": "root_cause_analysis",
                    "template": "root_cause"
                }
            ])
        
        # Pattern 3: Job status check
        elif any(trigger in query_lower for trigger in ["job running", "job status", "check job"]):
            workflow.append({
                "agent": "unix_agent",
                "action": "check_job_status",
                "template": "default"
            })
        
        # Pattern 4: Log analysis
        elif any(trigger in query_lower for trigger in ["show logs", "analyze logs", "check logs"]):
            workflow.append({
                "agent": "unix_agent",
                "action": "analyze_logs",
                "template": "log_analysis"
            })
        
        # Pattern 5: Complex analysis (use LLM to plan)
        else:
            workflow = await self._llm_plan_workflow(query, context)
        
        print(f"   ✅ Workflow planned: {len(workflow)} steps")
        for i, step in enumerate(workflow, 1):
            print(f"      {i}. {step['agent']} → {step['action']}")
        
        return workflow
    
    async def _llm_plan_workflow(self, query: str, context: Dict) -> List[Dict]:
        """
        Use LLM to plan complex workflows
        """
        planning_prompt = f"""
Given this user query: "{query}"

Available agents:
- pricing_agent: Oracle database queries, price validation, error analysis
- unix_agent: Server logs, job control, file operations
- analysis_agent: Root cause analysis, recommendations, synthesis

Plan a workflow to answer this query. Return JSON array of steps:
[
    {{"agent": "agent_name", "action": "what_to_do", "template": "prompt_template"}},
    ...
]

Keep it simple - usually 1-3 steps maximum.
"""
        
        # Compress prompt
        compressed_prompt = await self.compressor.compress_context(planning_prompt, max_tokens=500)
        
        # Call LLM
        response = await self._call_llm(compressed_prompt)
        
        # Parse workflow (simplified for demo)
        try:
            # Extract JSON from response
            workflow = json.loads(response)
            return workflow
        except:
            # Fallback to pricing agent
            return [{
                "agent": "pricing_agent",
                "action": "general_query",
                "template": "default"
            }]
    
    async def _execute_workflow(self, workflow: List[Dict], query: str, context: Dict) -> List[Dict]:
        """
        Execute each step in the workflow
        """
        print("\n⚙️  Executing Workflow...")
        
        results = []
        accumulated_context = context.copy()
        
        for i, step in enumerate(workflow, 1):
            print(f"\n   Step {i}/{len(workflow)}: {step['agent']} - {step['action']}")
            
            # Execute step
            result = await self._execute_agent_step(
                agent_name=step["agent"],
                action=step["action"],
                query=query,
                context=accumulated_context,
                template=step.get("template", "default")
            )
            
            # Add result to accumulated context for next step
            accumulated_context[f"step_{i}_result"] = result["response"]
            
            results.append({
                "step": i,
                "agent": step["agent"],
                "action": step["action"],
                "response": result["response"],
                "tokens_used": result.get("tokens_used", 0),
                "execution_time": result.get("execution_time", 0)
            })
            
            print(f"      ✅ Completed in {result.get('execution_time', 0):.2f}s")
        
        return results
    
    async def _execute_agent_step(self, agent_name: str, action: str, query: str, 
                                  context: Dict, template: str) -> Dict:
        """
        Execute a single agent step with compression and prompt engineering
        """
        start_time = datetime.now()
        
        # Build optimized prompt using skills
        prompt = self.prompt_engine.build_prompt(
            agent_name=agent_name,
            task=f"{action}: {query}",
            context=context,
            template_name=template,
            compression_enabled=True
        )
        
        # Compress context if large
        if len(str(context)) > 2000:
            compressed_context = await self.compressor.compress_context(
                str(context), 
                max_tokens=1000
            )
            # Rebuild prompt with compressed context
            prompt = self.prompt_engine.build_prompt(
                agent_name=agent_name,
                task=f"{action}: {query}",
                context={"compressed": compressed_context},
                template_name=template,
                compression_enabled=False  # Already compressed
            )
        
        # Call LLM
        response = await self._call_llm(prompt)
        
        # Compress response if verbose
        compressed_response = self.response_compressor.compress_llm_response(response)
        
        execution_time = (datetime.now() - start_time).total_seconds()
        
        return {
            "agent": agent_name,
            "action": action,
            "response": compressed_response,
            "tokens_used": len(prompt) // 4 + len(response) // 4,  # Estimate
            "execution_time": execution_time
        }
    
    async def _synthesize_response(self, results: List[Dict], original_query: str) -> str:
        """
        Synthesize all agent responses into final answer
        """
        print("\n🎨 Synthesizing Final Response...")
        
        if len(results) == 1:
            # Single agent - return directly
            return results[0]["response"]
        
        # Multiple agents - synthesize
        synthesis_context = {
            "original_query": original_query,
            "agent_responses": [
                {
                    "agent": r["agent"],
                    "response": r["response"]
                }
                for r in results
            ]
        }
        
        synthesis_prompt = f"""
Original question: {original_query}

Multiple agents provided these responses:

{json.dumps(synthesis_context['agent_responses'], indent=2)}

Synthesize these into a single, coherent answer that:
1. Directly answers the user's question
2. Combines insights from all agents
3. Removes redundancy
4. Prioritizes actionable information
5. Is concise but complete

Final answer:
"""
        
        # Compress synthesis prompt
        compressed_prompt = await self.compressor.compress_context(
            synthesis_prompt, 
            max_tokens=2000
        )
        
        # Get synthesis from LLM
        synthesized = await self._call_llm(compressed_prompt)
        
        # Final compression pass
        final_response = self.response_compressor.compress_llm_response(synthesized)
        
        print(f"   ✅ Response synthesized ({len(final_response)} chars)")
        
        return final_response
    
    async def _call_llm(self, prompt: str) -> str:
        """
        Call the LLM API with caching
        """
        # Check cache first
        cache_key = f"llm:{self.compressor._hash_text(prompt)}"
        cached = self.redis.get(cache_key)
        
        if cached:
            print(f"      💾 LLM cache hit")
            return cached
        
        # Call LLM API
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.llm_endpoint,
                    json={
                        "prompt": prompt,
                        "max_tokens": 1000,
                        "temperature": 0.7
                    },
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    llm_response = result.get("response", "")
                    
                    # Cache for 1 hour
                    self.redis.setex(cache_key, 3600, llm_response)
                    
                    print(f"      🤖 LLM call successful ({len(llm_response)} chars)")
                    
                    return llm_response
                else:
                    print(f"      ❌ LLM call failed: {response.status_code}")
                    return f"Error calling LLM: {response.status_code}"
                    
        except Exception as e:
            print(f"      ❌ LLM call exception: {e}")
            # Return mock response for demo
            return self._mock_llm_response(prompt)
    
    def _mock_llm_response(self, prompt: str) -> str:
        """
        Mock LLM response for demo/testing
        """
        if "pricing" in prompt.lower() and "failed" in prompt.lower():
            return """
PRICING FAILURE ANALYSIS

The pricing job failed for CUSIP 037833100 due to a vendor timeout (Error E001).

Root Cause: Bloomberg API experienced degraded performance between 2:10-2:30 PM, 
resulting in timeout after 10 seconds.

Impact: Single CUSIP affected, used T-1 closing price as fallback.

Recommendation:
1. Immediate: Retry with Reuters backup source
2. Short-term: Implement automatic failover to secondary vendor
3. Long-term: Add vendor API health monitoring
"""
        elif "job" in prompt.lower() and "running" in prompt.lower():
            return """
JOB STATUS CHECK

Pricing job is currently RUNNING
- PID: 12345
- Started: 5 minutes ago
- Progress: 8,432 / 15,000 securities processed
- Status: HEALTHY
- Recent activity: Processing equities batch
"""
        elif "log" in prompt.lower():
            return """
LOG ANALYSIS SUMMARY

Analyzed: /app/pricing/logs/pricing_job_20251217.log
Time Range: 14:00 - 15:00
Total Errors: 12

Error Breakdown:
- E001 (Timeout): 8 occurrences
- E002 (Validation): 3 occurrences  
- E004 (Missing data): 1 occurrence

Pattern: Timeouts clustered around 2:15 PM, correlating with known 
Bloomberg service degradation.
"""
        else:
            return f"Analysis of query: {prompt[:100]}..."
    
    async def get_available_agents(self) -> List[Dict]:
        """
        Return list of available agents with their capabilities
        """
        agent_info = []
        
        for agent_name, agent_config in self.agents.items():
            info = self.prompt_engine.get_agent_info(agent_name)
            info.update({
                "mcp_server": agent_config["mcp_server"],
                "triggers": agent_config["triggers"]
            })
            agent_info.append(info)
        
        return agent_info
    
    def get_orchestrator_stats(self) -> Dict:
        """
        Get orchestrator performance statistics
        """
        return {
            "compression_stats": self.compressor.get_stats(),
            "agents_available": len(self.agents),
            "skills_loaded": len(self.prompt_engine.list_available_agents()),
            "cache_enabled": True,
            "timestamp": datetime.now().isoformat()
        }


# Example usage
if __name__ == "__main__":
    import asyncio
    
    # Mock Redis
    class MockRedis:
        def __init__(self):
            self.store = {}
        def get(self, key):
            return self.store.get(key)
        def setex(self, key, ttl, value):
            self.store[key] = value
        def delete(self, key):
            if key in self.store:
                del self.store[key]
    
    async def test_orchestrator():
        redis = MockRedis()
        orchestrator = IntelligentOrchestrator(
            redis_client=redis,
            llm_endpoint="http://localhost:8080/generate",
            skills_dir="/home/claude/pricing-workflow-poc/backend/app/skills"
        )
        
        # Test query 1: Simple pricing query
        print("\n" + "="*80)
        print("TEST 1: Simple Pricing Query")
        print("="*80)
        result = await orchestrator.process_request(
            "What's the current price for CUSIP 912828ZG8?"
        )
        print(f"\nResponse: {result['response']}")
        print(f"Execution time: {result['execution_time']:.2f}s")
        
        # Test query 2: Complex investigation
        print("\n" + "="*80)
        print("TEST 2: Pricing Failure Investigation")
        print("="*80)
        result = await orchestrator.process_request(
            "Why did pricing fail for CUSIP 037833100 today? Investigate and recommend fix."
        )
        print(f"\nResponse: {result['response']}")
        print(f"Agents used: {', '.join(result['agents_used'])}")
        print(f"Execution time: {result['execution_time']:.2f}s")
        
        # Show stats
        print("\n" + "="*80)
        print("ORCHESTRATOR STATISTICS")
        print("="*80)
        stats = orchestrator.get_orchestrator_stats()
        print(json.dumps(stats, indent=2))
    
    # Run tests
    asyncio.run(test_orchestrator())
