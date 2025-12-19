import React from 'react';
import { Database, Terminal, Brain, GitBranch, FileText, Layers } from 'lucide-react';

const nodeDefinitions = [
  {
    type: 'oracle_query',
    label: 'Oracle Query',
    icon: Database,
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
    agent: 'pricing_agent',
    description: 'Query Oracle database for pricing data',
    config: {}
  },
  {
    type: 'unix_command',
    label: 'Unix Command',
    icon: Terminal,
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
    agent: 'unix_agent',
    description: 'Execute commands on Unix servers',
    config: {}
  },
  {
    type: 'llm_analysis',
    label: 'LLM Analysis',
    icon: Brain,
    color: '#8b5cf6',
    bgColor: 'rgba(139, 92, 246, 0.1)',
    agent: 'analysis_agent',
    description: 'AI-powered analysis and reasoning',
    config: {}
  },
  {
    type: 'condition',
    label: 'Condition',
    icon: GitBranch,
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    agent: null,
    description: 'Conditional branching logic',
    config: {}
  },
  {
    type: 'parallel',
    label: 'Parallel',
    icon: Layers,
    color: '#6366f1',
    bgColor: 'rgba(99, 102, 241, 0.1)',
    agent: null,
    description: 'Execute multiple branches in parallel',
    config: {}
  },
  {
    type: 'report',
    label: 'Generate Report',
    icon: FileText,
    color: '#ec4899',
    bgColor: 'rgba(236, 72, 153, 0.1)',
    agent: 'reporting_agent',
    description: 'Generate Excel/PDF reports',
    config: {}
  }
];

const NodeSidebar = () => {
  const onDragStart = (event, nodeData) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeData));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div style={{
      width: '280px',
      borderRight: '1px solid #e5e7eb',
      background: '#f9fafb',
      padding: '16px',
      overflowY: 'auto'
    }}>
      <div style={{
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: '2px solid #e5e7eb'
      }}>
        <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600' }}>
          🧩 MCP Nodes
        </h3>
        <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
          Drag nodes to canvas
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {nodeDefinitions.map((node) => {
          const IconComponent = node.icon;
          return (
            <div
              key={node.type}
              className="node-card"
              draggable
              onDragStart={(e) => onDragStart(e, node)}
              style={{
                background: 'white',
                border: `2px solid ${node.color}`,
                borderRadius: '8px',
                padding: '12px',
                cursor: 'grab',
                transition: 'all 0.2s',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: node.color
              }} />
              
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <div style={{
                  background: node.bgColor,
                  padding: '8px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <IconComponent size={20} color={node.color} />
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: '600',
                    fontSize: '14px',
                    color: '#111827',
                    marginBottom: '4px'
                  }}>
                    {node.label}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    lineHeight: '1.4'
                  }}>
                    {node.description}
                  </div>
                  {node.agent && (
                    <div style={{
                      marginTop: '6px',
                      fontSize: '11px',
                      color: node.color,
                      fontWeight: '500'
                    }}>
                      Agent: {node.agent}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        marginTop: '20px',
        padding: '12px',
        background: '#dbeafe',
        border: '1px solid #93c5fd',
        borderRadius: '8px',
        fontSize: '12px',
        color: '#1e40af'
      }}>
        <strong>💡 Tips:</strong>
        <ul style={{ margin: '8px 0 0 0', paddingLeft: '16px' }}>
          <li>Drag nodes onto canvas</li>
          <li>Connect nodes by dragging</li>
          <li>Double-click to configure</li>
        </ul>
      </div>

      <style>{`
        .node-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .node-card:active {
          cursor: grabbing;
          transform: scale(0.98);
        }
      `}</style>
    </div>
  );
};

export default NodeSidebar;