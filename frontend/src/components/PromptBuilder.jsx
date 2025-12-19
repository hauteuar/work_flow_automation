import React, { useState } from 'react';
import { Sparkles, X, Loader } from 'lucide-react';

const PromptBuilder = ({ onClose, onWorkflowGenerated, backendStatus }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const examples = [
    "Check pricing for CUSIP 912828ZG8 and analyze any failures",
    "Query Oracle for failed pricing jobs today, then check Unix server logs",
    "Get pricing status from database, analyze with LLM, and generate report",
    "Monitor pricing for large price movements and alert if > 10%"
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a workflow description');
      return;
    }

    if (backendStatus !== 'connected') {
      setError('Backend is not connected. Please start the backend server first.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8000/api/workflows/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) {
        throw new Error('Failed to generate workflow');
      }

      const data = await response.json();
      
      // Transform backend response to workflow format
      const workflow = {
        nodes: data.nodes || [],
        edges: data.edges || []
      };

      onWorkflowGenerated(workflow);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to generate workflow. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
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
        width: '90%',
        maxWidth: '600px',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={24} color="#8b5cf6" />
            <h2 style={{ margin: 0, fontSize: '20px' }}>AI Workflow Builder</h2>
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

        {/* Content */}
        <div style={{ padding: '20px' }}>
          <p style={{ color: '#6b7280', marginBottom: '15px' }}>
            Describe your workflow in plain English, and AI will generate the nodes and connections for you.
          </p>

          {/* Prompt Input */}
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Example: Check pricing for CUSIP and analyze failures using LLM..."
            style={{
              width: '100%',
              minHeight: '120px',
              padding: '12px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              fontFamily: 'inherit',
              resize: 'vertical',
              marginBottom: '15px'
            }}
          />

          {/* Examples */}
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: '#6b7280' }}>
              Try these examples:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {examples.map((example, idx) => (
                <button
                  key={idx}
                  onClick={() => setPrompt(example)}
                  style={{
                    padding: '8px 12px',
                    background: '#f3f4f6',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '13px',
                    color: '#374151'
                  }}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              padding: '12px',
              background: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              color: '#dc2626',
              fontSize: '14px',
              marginBottom: '15px'
            }}>
              {error}
            </div>
          )}

          {/* Backend Status Warning */}
          {backendStatus !== 'connected' && (
            <div style={{
              padding: '12px',
              background: '#fef3c7',
              border: '1px solid #fde68a',
              borderRadius: '6px',
              color: '#92400e',
              fontSize: '14px',
              marginBottom: '15px'
            }}>
              ⚠️ Backend is not running. Start with: <code>python app/main.py</code>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px',
                background: '#f3f4f6',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim() || backendStatus !== 'connected'}
              style={{
                padding: '10px 20px',
                background: loading ? '#9ca3af' : '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {loading ? (
                <>
                  <Loader size={16} className="spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Generate Workflow
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptBuilder;