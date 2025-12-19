import React from 'react';
import { PlayCircle, CheckCircle, XCircle, Clock } from 'lucide-react';

const ExecutionPanel = ({ status }) => {
  if (!status) {
    return (
      <div style={{
        padding: '20px',
        borderBottom: '1px solid #e5e7eb',
        background: 'white',
      }}>
        <h3 style={{ margin: 0, fontSize: '16px', color: '#9ca3af' }}>
          ⏸️ No Active Execution
        </h3>
        <p style={{ margin: '5px 0 0', fontSize: '12px', color: '#9ca3af' }}>
          Execute a workflow to see status here
        </p>
      </div>
    );
  }

  const getStatusIcon = () => {
    switch (status.status) {
      case 'running':
        return <Clock size={20} className="spin" />;
      case 'completed':
        return <CheckCircle size={20} color="#10b981" />;
      case 'failed':
        return <XCircle size={20} color="#ef4444" />;
      default:
        return <PlayCircle size={20} />;
    }
  };

  const getStatusColor = () => {
    switch (status.status) {
      case 'running':
        return '#3b82f6';
      case 'completed':
        return '#10b981';
      case 'failed':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  return (
    <div style={{
      padding: '20px',
      borderBottom: '1px solid #e5e7eb',
      background: 'white',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '15px',
      }}>
        {getStatusIcon()}
        <div>
          <h3 style={{
            margin: 0,
            fontSize: '16px',
            color: getStatusColor(),
            textTransform: 'capitalize',
          }}>
            {status.status}
          </h3>
          <p style={{
            margin: '2px 0 0',
            fontSize: '12px',
            color: '#6b7280',
          }}>
            Execution ID: {status.execution_id?.substring(0, 8)}...
          </p>
        </div>
      </div>

      {status.type === 'node_completed' && (
        <div style={{
          padding: '12px',
          background: '#f3f4f6',
          borderRadius: '6px',
          fontSize: '13px',
        }}>
          <div style={{ fontWeight: '600', marginBottom: '5px' }}>
            Node: {status.node_id}
          </div>
          <div style={{ color: '#6b7280' }}>
            {status.result?.success ? '✓ Completed successfully' : '✗ Failed'}
          </div>
        </div>
      )}

      {status.type === 'execution_completed' && (
        <div style={{
          padding: '12px',
          background: '#d1fae5',
          borderRadius: '6px',
          fontSize: '13px',
          color: '#065f46',
        }}>
          ✓ Workflow execution completed successfully
        </div>
      )}

      {status.type === 'execution_failed' && (
        <div style={{
          padding: '12px',
          background: '#fee2e2',
          borderRadius: '6px',
          fontSize: '13px',
          color: '#991b1b',
        }}>
          ✗ Workflow execution failed: {status.error}
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 2s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default ExecutionPanel;
