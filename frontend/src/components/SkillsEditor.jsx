import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Book, Edit2, Trash2, Eye, Code, RefreshCw } from 'lucide-react';

const SkillsEditor = ({ onClose }) => {
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [skillsContent, setSkillsContent] = useState('');
  const [configContent, setConfigContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState('list'); // 'list', 'edit', 'preview'
  const [newAgentName, setNewAgentName] = useState('');
  const [showNewAgent, setShowNewAgent] = useState(false);

  // Load agents on mount
  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/agents');
      const data = await response.json();
      setAgents(data.agents || []);
    } catch (err) {
      setError('Failed to load agents. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const loadAgentSkills = async (agentName) => {
    setLoading(true);
    setError('');
    try {
      // Load skills.md
      const skillsResponse = await fetch(`http://localhost:8000/api/agents/${agentName}/skills`);
      const skillsData = await skillsResponse.json();
      setSkillsContent(skillsData.raw_content || generateDefaultSkills(agentName));

      // Load config.json
      const configResponse = await fetch(`http://localhost:8000/api/agents/${agentName}/config`);
      const configData = await configResponse.json();
      setConfigContent(JSON.stringify(configData, null, 2));

      setSelectedAgent(agentName);
      setView('edit');
    } catch (err) {
      setError('Failed to load agent skills');
    } finally {
      setLoading(false);
    }
  };

  const saveAgentSkills = async () => {
    if (!selectedAgent) return;

    setSaving(true);
    setError('');
    try {
      // Save skills.md
      await fetch(`http://localhost:8000/api/agents/${selectedAgent}/skills`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: skillsContent })
      });

      // Save config.json
      await fetch(`http://localhost:8000/api/agents/${selectedAgent}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: configContent })
      });

      alert('Skills saved successfully!');
      loadAgents(); // Reload agents list
    } catch (err) {
      setError('Failed to save skills: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const createNewAgent = async () => {
    if (!newAgentName.trim()) {
      setError('Please enter an agent name');
      return;
    }

    const agentName = newAgentName.toLowerCase().replace(/\s+/g, '_');
    setSaving(true);
    setError('');

    try {
      const defaultSkills = generateDefaultSkills(agentName);
      const defaultConfig = generateDefaultConfig(agentName);

      // Create new agent
      await fetch(`http://localhost:8000/api/agents/${agentName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skills: defaultSkills,
          config: defaultConfig
        })
      });

      setSkillsContent(defaultSkills);
      setConfigContent(JSON.stringify(defaultConfig, null, 2));
      setSelectedAgent(agentName);
      setShowNewAgent(false);
      setNewAgentName('');
      setView('edit');
      loadAgents();
    } catch (err) {
      setError('Failed to create agent: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteAgent = async (agentName) => {
    if (!window.confirm(`Are you sure you want to delete ${agentName}? This cannot be undone.`)) {
      return;
    }

    try {
      await fetch(`http://localhost:8000/api/agents/${agentName}`, {
        method: 'DELETE'
      });
      loadAgents();
      if (selectedAgent === agentName) {
        setSelectedAgent(null);
        setView('list');
      }
      alert('Agent deleted successfully');
    } catch (err) {
      setError('Failed to delete agent: ' + err.message);
    }
  };

  const generateDefaultSkills = (agentName) => {
    const displayName = agentName.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    
    return `# ${displayName} Skills

## Agent Identity
- **Name:** ${displayName}
- **Version:** 1.0.0
- **Purpose:** ${displayName} operations for BofA Wealth Management
- **MCP Server:** ${agentName}_mcp
- **Owner:** Operations Team

## Core Capabilities

### Data Operations
- Query and retrieve data from systems
- Process and validate information
- Transform data formats
- Generate reports and summaries

### Integration Points
- Connect with upstream systems
- Interface with downstream consumers
- Handle data synchronization
- Manage error conditions

## Business Rules

### Validation Rules
- Validate input data formats
- Check business rule compliance
- Verify authorization levels
- Ensure data quality standards

### Error Handling
- Retry logic for transient failures
- Fallback strategies for outages
- Alert mechanisms for critical errors
- Logging and audit trail

## Example Queries

### Query 1: Basic Data Retrieval
\`\`\`
Action: Retrieve data for ID: 12345
Expected: Return structured data with all fields
\`\`\`

### Query 2: Data Processing
\`\`\`
Action: Process batch of records
Expected: Transform and validate each record
\`\`\`

## Configuration

### Connection Settings
- Host: Configured via environment
- Port: Standard ports per system
- Credentials: Secure credential storage
- Timeout: 30 seconds default

### Performance Settings
- Batch size: 100 records
- Concurrency: 5 parallel operations
- Cache TTL: 5 minutes
- Retry attempts: 3

## Security & Compliance

### Authentication
- API key authentication
- OAuth 2.0 support
- Certificate-based auth
- MFA where required

### Audit Trail
- Log all operations
- Track user actions
- Monitor data access
- Report compliance metrics

## Known Limitations

- Maximum batch size: 1000 records
- Rate limit: 100 requests per minute
- Data retention: 90 days
- Concurrent connections: 10

## Future Enhancements

- Real-time streaming support
- Advanced analytics integration
- Machine learning predictions
- Enhanced error recovery
`;
  };

  const generateDefaultConfig = (agentName) => {
    return {
      agent_name: agentName,
      version: "1.0.0",
      mcp_server: `${agentName}_mcp`,
      timeout: 30,
      retry_attempts: 3,
      cache_enabled: true,
      cache_ttl: 300
    };
  };

  // Render agent list view
  const renderAgentList = () => (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px' }}>Available Agents</h3>
          <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
            Edit existing agents or create new ones
          </p>
        </div>
        <button
          onClick={() => setShowNewAgent(true)}
          style={{
            padding: '8px 16px',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Plus size={16} />
          New Agent
        </button>
      </div>

      {/* New Agent Form */}
      {showNewAgent && (
        <div style={{
          padding: '16px',
          background: '#f0fdf4',
          border: '2px solid #10b981',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h4 style={{ margin: '0 0 12px 0' }}>Create New Agent</h4>
          <input
            type="text"
            value={newAgentName}
            onChange={(e) => setNewAgentName(e.target.value)}
            placeholder="Agent name (e.g., reporting_agent)"
            style={{
              width: '100%',
              padding: '10px',
              border: '2px solid #10b981',
              borderRadius: '6px',
              marginBottom: '12px'
            }}
            onKeyPress={(e) => e.key === 'Enter' && createNewAgent()}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={createNewAgent}
              disabled={!newAgentName.trim() || saving}
              style={{
                padding: '8px 16px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: newAgentName.trim() ? 'pointer' : 'not-allowed',
                fontWeight: '500'
              }}
            >
              {saving ? 'Creating...' : 'Create Agent'}
            </button>
            <button
              onClick={() => {
                setShowNewAgent(false);
                setNewAgentName('');
              }}
              style={{
                padding: '8px 16px',
                background: '#f3f4f6',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Agent Cards */}
      <div style={{ display: 'grid', gap: '12px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            <RefreshCw size={24} className="spin" />
            <p>Loading agents...</p>
          </div>
        ) : agents.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            background: '#f9fafb',
            borderRadius: '8px',
            border: '2px dashed #d1d5db'
          }}>
            <Book size={48} color="#9ca3af" style={{ marginBottom: '16px' }} />
            <p style={{ color: '#6b7280', margin: 0 }}>No agents found. Create your first agent!</p>
          </div>
        ) : (
          agents.map((agent) => (
            <div
              key={agent.name}
              style={{
                padding: '16px',
                background: 'white',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.2s'
              }}
              className="agent-card"
            >
              <div>
                <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '4px' }}>
                  {agent.display_name || agent.name}
                </div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>
                  {agent.capabilities_count} capabilities • {agent.mcp_server}
                </div>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                  Version: {agent.version}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => loadAgentSkills(agent.name)}
                  style={{
                    padding: '8px 12px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  title="Edit skills"
                >
                  <Edit2 size={14} />
                  Edit
                </button>
                <button
                  onClick={() => deleteAgent(agent.name)}
                  style={{
                    padding: '8px 12px',
                    background: '#fee2e2',
                    color: '#dc2626',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  title="Delete agent"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  // Render editor view
  const renderEditor = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Editor Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#f9fafb'
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px' }}>
            Editing: {selectedAgent}
          </h3>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setView('preview')}
            style={{
              padding: '8px 12px',
              background: '#f3f4f6',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Eye size={14} />
            Preview
          </button>
          <button
            onClick={saveAgentSkills}
            disabled={saving}
            style={{
              padding: '8px 16px',
              background: saving ? '#9ca3af' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Save size={14} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            onClick={() => {
              setView('list');
              setSelectedAgent(null);
            }}
            style={{
              padding: '8px 12px',
              background: '#f3f4f6',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Back
          </button>
        </div>
      </div>

      {/* Editor Tabs */}
      <div style={{
        display: 'flex',
        gap: '4px',
        padding: '12px 20px',
        background: '#f9fafb',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <button
          onClick={() => setView('edit')}
          style={{
            padding: '8px 16px',
            background: view === 'edit' ? 'white' : 'transparent',
            border: view === 'edit' ? '1px solid #e5e7eb' : 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: view === 'edit' ? '600' : '400'
          }}
        >
          📝 skills.md
        </button>
        <button
          onClick={() => setView('config')}
          style={{
            padding: '8px 16px',
            background: view === 'config' ? 'white' : 'transparent',
            border: view === 'config' ? '1px solid #e5e7eb' : 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: view === 'config' ? '600' : '400'
          }}
        >
          ⚙️ config.json
        </button>
      </div>

      {/* Editor Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
        {view === 'edit' && (
          <textarea
            value={skillsContent}
            onChange={(e) => setSkillsContent(e.target.value)}
            style={{
              width: '100%',
              height: '100%',
              padding: '16px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontFamily: '"Monaco", "Menlo", "Consolas", monospace',
              fontSize: '13px',
              lineHeight: '1.6',
              resize: 'none'
            }}
            placeholder="Enter skills.md content in Markdown format..."
          />
        )}
        {view === 'config' && (
          <textarea
            value={configContent}
            onChange={(e) => setConfigContent(e.target.value)}
            style={{
              width: '100%',
              height: '100%',
              padding: '16px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontFamily: '"Monaco", "Menlo", "Consolas", monospace',
              fontSize: '13px',
              lineHeight: '1.6',
              resize: 'none'
            }}
            placeholder="Enter config.json content..."
          />
        )}
        {view === 'preview' && (
          <div style={{
            padding: '20px',
            background: 'white',
            border: '2px solid #e5e7eb',
            borderRadius: '8px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            lineHeight: '1.6'
          }}>
            <div dangerouslySetInnerHTML={{ __html: markdownToHTML(skillsContent) }} />
          </div>
        )}
      </div>
    </div>
  );

  // Simple markdown to HTML converter
  const markdownToHTML = (markdown) => {
    return markdown
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>')
      .replace(/`([^`]+)`/gim, '<code>$1</code>')
      .replace(/^\- (.*$)/gim, '<li>$1</li>')
      .replace(/\n/gim, '<br/>');
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        width: '95%',
        height: '90vh',
        maxWidth: '1200px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        {/* Main Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Book size={24} color="#3b82f6" />
            <div>
              <h2 style={{ margin: 0, fontSize: '20px' }}>Skills Editor</h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                Create and edit agent skills.md files
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            margin: '20px',
            padding: '12px',
            background: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            color: '#dc2626',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {view === 'list' ? renderAgentList() : renderEditor()}
        </div>
      </div>

      <style>{`
        .agent-card:hover {
          border-color: #3b82f6;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
        }
      `}</style>
    </div>
  );
};

export default SkillsEditor;