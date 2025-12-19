import os
import json
import yaml
from typing import Dict, Optional, List
from pathlib import Path
from config import settings
from cache.redis_cache import cache

class PromptEngineeringEngine:
    """
    Prompt engineering engine that loads agent skills and builds optimized prompts
    
    Features:
    - Loads skills.md for each agent
    - Manages prompt templates
    - Builds context-aware prompts
    - Caches compiled prompts
    """
    
    def __init__(self, skills_dir: str = None):
        self.skills_dir = Path(skills_dir or settings.SKILLS_DIR)
        self.skills_cache = {}
        self.templates_cache = {}
        
        # Ensure skills directory exists
        self.skills_dir.mkdir(parents=True, exist_ok=True)
        
        print(f"✓ Prompt Engine initialized with skills dir: {self.skills_dir}")
    
    def load_agent_skills(self, agent_name: str) -> Dict:
        """
        Load and parse skills.md for an agent
        
        Returns structured skills data:
        {
            'name': 'pricing_agent',
            'version': '1.0.0',
            'capabilities': [...],
            'queries': [...],
            'rules': [...],
            'examples': [...],
            'raw_content': '...'
        }
        """
        # Check cache first
        cache_key = f"skills:{agent_name}"
        cached = cache.get(cache_key)
        if cached:
            return cached
        
        # Check memory cache
        if agent_name in self.skills_cache:
            return self.skills_cache[agent_name]
        
        # Load from file
        skills_path = self.skills_dir / agent_name / "skills.md"
        
        if not skills_path.exists():
            print(f"⚠ Skills file not found: {skills_path}")
            return self._get_default_skills(agent_name)
        
        try:
            with open(skills_path, 'r', encoding='utf-8') as f:
                skills_md = f.read()
            
            # Parse markdown
            skills = self._parse_skills_md(skills_md)
            skills['agent_name'] = agent_name
            skills['raw_content'] = skills_md
            
            # Cache results
            self.skills_cache[agent_name] = skills
            cache.set(cache_key, skills, ttl=3600)
            
            print(f"✓ Loaded skills for {agent_name} ({len(skills.get('capabilities', []))} capabilities)")
            
            return skills
            
        except Exception as e:
            print(f"✗ Error loading skills for {agent_name}: {e}")
            return self._get_default_skills(agent_name)
    
    def _parse_skills_md(self, markdown: str) -> Dict:
        """
        Parse skills.md markdown into structured format
        
        Extracts:
        - Metadata (name, version, purpose)
        - Core capabilities
        - Queries/commands
        - Business rules
        - Examples
        """
        skills = {
            'name': '',
            'version': '1.0.0',
            'purpose': '',
            'capabilities': [],
            'queries': [],
            'rules': [],
            'examples': [],
            'context': {}
        }
        
        lines = markdown.split('\n')
        current_section = None
        current_subsection = None
        code_block = []
        in_code_block = False
        
        for line in lines:
            stripped = line.strip()
            
            # Handle code blocks
            if stripped.startswith('```'):
                if in_code_block:
                    # End of code block
                    if current_section == 'queries':
                        skills['queries'].append({
                            'type': 'code',
                            'content': '\n'.join(code_block)
                        })
                    code_block = []
                    in_code_block = False
                else:
                    # Start of code block
                    in_code_block = True
                continue
            
            if in_code_block:
                code_block.append(line)
                continue
            
            # Parse metadata
            if stripped.startswith('# ') and not skills['name']:
                skills['name'] = stripped[2:].strip()
            
            elif stripped.startswith('## Agent Identity'):
                current_section = 'identity'
            
            elif stripped.startswith('## Core Capabilities'):
                current_section = 'capabilities'
            
            elif stripped.startswith('## Oracle Schema Knowledge') or \
                 stripped.startswith('## Oracle Queries') or \
                 stripped.startswith('## Common Queries'):
                current_section = 'queries'
            
            elif stripped.startswith('## Business') or \
                 stripped.startswith('## Validation Rules'):
                current_section = 'rules'
            
            elif stripped.startswith('## Example'):
                current_section = 'examples'
            
            elif stripped.startswith('###'):
                current_subsection = stripped[3:].strip()
            
            # Extract bullet points
            elif stripped.startswith('- **') and current_section:
                # Extract capability/rule
                match = stripped[4:].split(':**')
                if len(match) == 2:
                    key = match[0].strip()
                    value = match[1].strip()
                    
                    if current_section == 'capabilities':
                        skills['capabilities'].append({
                            'name': key,
                            'description': value
                        })
                    elif current_section == 'rules':
                        skills['rules'].append({
                            'rule': key,
                            'description': value
                        })
                    elif current_section == 'identity':
                        skills['context'][key.lower()] = value
            
            elif stripped.startswith('- ') and current_section:
                item = stripped[2:].strip()
                if current_section == 'capabilities':
                    skills['capabilities'].append({
                        'name': item,
                        'description': item
                    })
                elif current_section == 'rules':
                    skills['rules'].append({
                        'rule': item,
                        'description': item
                    })
        
        return skills
    
    def _get_default_skills(self, agent_name: str) -> Dict:
        """Return default/empty skills structure"""
        return {
            'agent_name': agent_name,
            'name': agent_name.replace('_', ' ').title(),
            'version': '1.0.0',
            'purpose': f'General purpose {agent_name}',
            'capabilities': [],
            'queries': [],
            'rules': [],
            'examples': [],
            'context': {},
            'raw_content': ''
        }
    
    def load_config(self, agent_name: str) -> Dict:
        """Load agent config.json"""
        config_path = self.skills_dir / agent_name / "config.json"
        
        if not config_path.exists():
            return {
                'mcp_server': f'{agent_name}_mcp',
                'timeout': 30,
                'retry': 3
            }
        
        try:
            with open(config_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading config for {agent_name}: {e}")
            return {}
    
    def load_template(self, agent_name: str, template_name: str = "default") -> str:
        """
        Load prompt template for agent
        
        Template location: skills/{agent_name}/prompts/{template_name}.txt
        """
        cache_key = f"template:{agent_name}:{template_name}"
        cached = cache.get(cache_key)
        if cached:
            return cached
        
        template_path = self.skills_dir / agent_name / "prompts" / f"{template_name}.txt"
        
        if not template_path.exists():
            # Return default template
            return self._get_default_template(agent_name)
        
        try:
            with open(template_path, 'r', encoding='utf-8') as f:
                template = f.read()
            
            cache.set(cache_key, template, ttl=3600)
            return template
            
        except Exception as e:
            print(f"Error loading template: {e}")
            return self._get_default_template(agent_name)
    
    def _get_default_template(self, agent_name: str) -> str:
        """Default prompt template if none exists"""
        return """You are a specialized {agent_name} assistant.

**Your Capabilities:**
{capabilities}

**Business Rules:**
{rules}

**Task:**
{task}

**Context:**
{context}

Please provide a detailed, accurate response following all business rules and leveraging your capabilities.
"""
    
    def build_prompt(self,
                     agent_name: str,
                     task: str,
                     context: Dict = None,
                     template_name: str = "default",
                     include_examples: bool = False) -> str:
        """
        Build optimized prompt using skills and template
        
        Args:
            agent_name: Name of the agent
            task: The specific task to perform
            context: Additional context data
            template_name: Which template to use
            include_examples: Whether to include example interactions
            
        Returns:
            Fully composed prompt string
        """
        context = context or {}
        
        # Load skills
        skills = self.load_agent_skills(agent_name)
        
        # Load template
        template = self.load_template(agent_name, template_name)
        
        # Format capabilities
        capabilities_text = self._format_capabilities(skills.get('capabilities', []))
        
        # Format rules
        rules_text = self._format_rules(skills.get('rules', []))
        
        # Format context
        context_text = json.dumps(context, indent=2) if context else "No additional context provided."
        
        # Format examples if requested
        examples_text = ""
        if include_examples and skills.get('examples'):
            examples_text = "\n**Examples:**\n" + \
                          self._format_examples(skills['examples'])
        
        # Build prompt
        prompt = template.format(
            agent_name=skills['name'],
            capabilities=capabilities_text,
            rules=rules_text,
            task=task,
            context=context_text,
            examples=examples_text,
            version=skills.get('version', '1.0.0'),
            purpose=skills.get('purpose', '')
        )
        
        return prompt
    
    def _format_capabilities(self, capabilities: List) -> str:
        """Format capabilities for prompt"""
        if not capabilities:
            return "Standard agent capabilities"
        
        formatted = []
        for cap in capabilities[:10]:  # Limit to top 10
            if isinstance(cap, dict):
                name = cap.get('name', '')
                desc = cap.get('description', '')
                formatted.append(f"- {name}: {desc}")
            else:
                formatted.append(f"- {cap}")
        
        return '\n'.join(formatted)
    
    def _format_rules(self, rules: List) -> str:
        """Format business rules for prompt"""
        if not rules:
            return "Follow standard operating procedures"
        
        formatted = []
        for rule in rules[:10]:  # Limit to top 10
            if isinstance(rule, dict):
                rule_text = rule.get('rule', '')
                desc = rule.get('description', '')
                formatted.append(f"- {rule_text}: {desc}")
            else:
                formatted.append(f"- {rule}")
        
        return '\n'.join(formatted)
    
    def _format_examples(self, examples: List) -> str:
        """Format examples for prompt"""
        formatted = []
        for i, example in enumerate(examples[:3], 1):  # Top 3 examples
            if isinstance(example, dict):
                formatted.append(f"{i}. {example.get('description', '')}")
            else:
                formatted.append(f"{i}. {example}")
        
        return '\n'.join(formatted)
    
    def get_available_agents(self) -> List[str]:
        """List all available agents with skills"""
        agents = []
        
        if not self.skills_dir.exists():
            return agents
        
        for item in self.skills_dir.iterdir():
            if item.is_dir() and (item / "skills.md").exists():
                agents.append(item.name)
        
        return agents
    
    def reload_skills(self, agent_name: str):
        """Force reload skills from disk"""
        # Clear caches
        if agent_name in self.skills_cache:
            del self.skills_cache[agent_name]
        
        cache.delete(f"skills:{agent_name}")
        
        # Reload
        return self.load_agent_skills(agent_name)

# Global prompt engine instance
prompt_engine = PromptEngineeringEngine()
