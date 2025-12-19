import React from 'react';

const ToolboxPanel = ({ servers }) => {
  const onDragStart = (event, serverType) => {
    event.dataTransfer.setData('application/reactflow', serverType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div style={{
      width: '280px',
      background: '#f9fafb',
      borderRight: '1px solid #e5e7eb',
      overflow: 'auto',
    }}>
      <div style={{
        padding: '20px',
        borderBottom: '1px solid #e5e7eb',
        background: 'white',
      }}>
        <h3 style={{ margin: 0, fontSize: '16px' }}>🛠️ MCP Servers</h3>
        <p style={{ margin: '5px 0 0', fontSize: '12px', color: '#6b7280' }}>
          Drag & drop to canvas
        </p>
      </div>

      <div style={{ padding: '15px' }}>
        {servers.map((server) => (
          <div
            key={server.id}
            draggable
            onDragStart={(e) => onDragStart(e, server.id)}
            style={{
              padding: '15px',
              marginBottom: '10px',
              background: 'white',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              cursor: 'grab',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#3b82f6';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{
              fontSize: '24px',
              marginBottom: '8px',
            }}>
              {server.icon}
            </div>
            <div style={{
              fontWeight: '600',
              fontSize: '14px',
              marginBottom: '5px',
            }}>
              {server.name}
            </div>
            <div style={{
              fontSize: '12px',
              color: '#6b7280',
              lineHeight: '1.4',
            }}>
              {server.description}
            </div>
            <div style={{
              marginTop: '8px',
              fontSize: '11px',
              color: '#9ca3af',
            }}>
              Actions: {server.actions.length}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ToolboxPanel;
