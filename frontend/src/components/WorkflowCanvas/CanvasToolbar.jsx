import React from 'react';
import { Play, Save, Trash2, Download } from 'lucide-react';

const CanvasToolbar = ({ onSave, onClear, onExecute, nodeCount }) => {
  return (
    <div style={{
      background: 'white',
      padding: '10px',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      display: 'flex',
      gap: '8px',
      alignItems: 'center'
    }}>
      <button
        onClick={onSave}
        style={buttonStyle}
        title="Save Workflow"
      >
        <Save size={16} />
      </button>
      
      <button
        onClick={onExecute}
        style={{...buttonStyle, background: '#10b981'}}
        title="Execute Workflow"
        disabled={nodeCount === 0}
      >
        <Play size={16} />
      </button>
      
      <button
        onClick={onClear}
        style={{...buttonStyle, background: '#ef4444'}}
        title="Clear Canvas"
        disabled={nodeCount === 0}
      >
        <Trash2 size={16} />
      </button>
      
      <div style={{
        marginLeft: '8px',
        padding: '4px 8px',
        background: '#f3f4f6',
        borderRadius: '4px',
        fontSize: '12px',
        color: '#6b7280'
      }}>
        {nodeCount} nodes
      </div>
    </div>
  );
};

const buttonStyle = {
  padding: '8px',
  border: 'none',
  borderRadius: '6px',
  background: '#3b82f6',
  color: 'white',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s'
};

export default CanvasToolbar;
