import React, { useState, useCallback, useEffect } from 'react';
import WorkflowCanvas from './components/WorkflowCanvas/WorkflowCanvas';
import PromptBuilder from './components/PromptBuilder';
import SkillsEditor from './components/SkillsEditor';
import './App.css';

const App = () => {
  const [workflow, setWorkflow] = useState({ nodes: [], edges: [] });
  const [backendStatus, setBackendStatus] = useState('checking');
  const [showPromptBuilder, setShowPromptBuilder] = useState(false);
  const [showSkillsEditor, setShowSkillsEditor] = useState(false);

  // Check backend status on mount
  useEffect(() => {
    checkBackendStatus();
    const interval = setInterval(checkBackendStatus, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, []);

  const checkBackendStatus = async () => {
    try {
      const response = await fetch('http://localhost:8000/health', {
        signal: AbortSignal.timeout(3000)
      });
      if (response.ok) {
        setBackendStatus('connected');
      } else {
        setBackendStatus('error');
      }
    } catch (error) {
      setBackendStatus('disconnected');
    }
  };

  const handleWorkflowChange = (newWorkflow) => {
    setWorkflow(newWorkflow);
    console.log('Workflow updated:', newWorkflow);
  };

  const getStatusColor = () => {
    switch (backendStatus) {
      case 'connected': return '#10b981';
      case 'disconnected': return '#ef4444';
      case 'checking': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getStatusText = () => {
    switch (backendStatus) {
      case 'connected': return '● Backend Connected';
      case 'disconnected': return '● Backend Offline';
      case 'checking': return '● Checking...';
      default: return '● Unknown';
    }
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <h1>🔄 Pricing Workflow Builder</h1>
        </div>
        <div className="header-actions">
           <button
    onClick={() => setShowSkillsEditor(true)}
    style={{
      padding: '8px 16px',
      background: '#0b5df5ff',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }}
  >
    📚 Skills Editor
  </button>
  

          <button
            onClick={() => setShowPromptBuilder(!showPromptBuilder)}
            style={{
              padding: '8px 16px',
              background: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            
            ✨ AI Prompt Builder
          </button>
          <span 
            className="status"
            style={{ background: getStatusColor() }}
            title={backendStatus === 'disconnected' ? 'Start backend: python app/main.py' : ''}
          >
            {getStatusText()}
          </span>
        </div>
      </header>

      {/* Prompt Builder Modal */}
      {showPromptBuilder && (
        <PromptBuilder
          onClose={() => setShowPromptBuilder(false)}
          onWorkflowGenerated={handleWorkflowChange}
          backendStatus={backendStatus}
        />
      )}

      {showSkillsEditor && (
        <SkillsEditor
          onClose={() => setShowSkillsEditor(false)}
        />
      )}
      
      {/* Main Content */}
      <div className="app-content">
        <WorkflowCanvas 
          onWorkflowChange={handleWorkflowChange}
          initialNodes={workflow.nodes}
          initialEdges={workflow.edges}
          backendStatus={backendStatus}
        />
      </div>
    </div>
  );
};

export default App;