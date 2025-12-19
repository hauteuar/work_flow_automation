import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

const CredentialModal = ({ node, onClose, onSave }) => {
  const serverInfo = node.data.serverInfo;
  const [credentials, setCredentials] = useState({});
  const [config, setConfig] = useState({});
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleInputChange = (fieldName, value) => {
    setCredentials((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleConfigChange = (key, value) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      // First save credentials
      await fetch('/api/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          node_id: node.id,
          node_type: serverInfo.id,
          credentials,
        }),
      });

      // Then test connection
      const response = await fetch(`/api/credentials/test/${node.id}`, {
        method: 'POST',
      });

      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      setTestResult({ success: false, message: error.message });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    // Save credentials
    await fetch('/api/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        node_id: node.id,
        node_type: serverInfo.id,
        credentials,
      }),
    });

    onSave({ credentials, config });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        width: '600px',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px' }}>
              {serverInfo.icon} Configure {serverInfo.name}
            </h2>
            <p style={{ margin: '5px 0 0', color: '#6b7280', fontSize: '14px' }}>
              {serverInfo.description}
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '5px',
          }}>
            <X size={24} />
          </button>
        </div>

        {/* Credentials Form */}
        <div style={{ padding: '20px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px', fontSize: '16px' }}>
            Connection Credentials
          </h3>

          {serverInfo.credential_fields.map((field) => (
            <div key={field.name} style={{ marginBottom: '15px' }}>
              <label style={{
                display: 'block',
                marginBottom: '5px',
                fontSize: '14px',
                fontWeight: '500',
              }}>
                {field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
              </label>

              {field.type === 'select' ? (
                <select
                  value={credentials[field.name] || field.default || ''}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  style={inputStyle}
                >
                  {field.options.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : field.type === 'textarea' ? (
                <textarea
                  value={credentials[field.name] || ''}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                  rows={4}
                  style={{...inputStyle, resize: 'vertical'}}
                />
              ) : (
                <input
                  type={field.type}
                  value={credentials[field.name] || field.default || ''}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                  style={inputStyle}
                />
              )}
            </div>
          ))}

          {/* Configuration Section */}
          <h3 style={{ marginTop: '30px', marginBottom: '15px', fontSize: '16px' }}>
            Node Configuration
          </h3>

          {serverInfo.id === 'oracle' && (
            <>
              <div style={{ marginBottom: '15px' }}>
                <label style={labelStyle}>Action</label>
                <select
                  value={config.action || 'check_pricing_status'}
                  onChange={(e) => handleConfigChange('action', e.target.value)}
                  style={inputStyle}
                >
                  <option value="check_pricing_status">Check Pricing Status</option>
                  <option value="get_failed_pricings">Get Failed Pricings</option>
                  <option value="query">Custom Query</option>
                </select>
              </div>

              {config.action === 'query' && (
                <div style={{ marginBottom: '15px' }}>
                  <label style={labelStyle}>SQL Query</label>
                  <textarea
                    value={config.sql || ''}
                    onChange={(e) => handleConfigChange('sql', e.target.value)}
                    placeholder="SELECT * FROM pricing_master WHERE cusip = :cusip"
                    rows={4}
                    style={{...inputStyle, fontFamily: 'monospace', resize: 'vertical'}}
                  />
                </div>
              )}
            </>
          )}

          {serverInfo.id === 'unix' && (
            <>
              <div style={{ marginBottom: '15px' }}>
                <label style={labelStyle}>Action</label>
                <select
                  value={config.action || 'check_pricing_job_logs'}
                  onChange={(e) => handleConfigChange('action', e.target.value)}
                  style={inputStyle}
                >
                  <option value="check_pricing_job_logs">Check Pricing Logs</option>
                  <option value="restart_pricing_job">Restart Pricing Job</option>
                  <option value="execute_command">Execute Command</option>
                  <option value="tail_logs">Tail Log File</option>
                </select>
              </div>

              {config.action === 'check_pricing_job_logs' && (
                <div style={{ marginBottom: '15px' }}>
                  <label style={labelStyle}>Log Path</label>
                  <input
                    type="text"
                    value={config.log_path || '/app/pricing/logs'}
                    onChange={(e) => handleConfigChange('log_path', e.target.value)}
                    style={inputStyle}
                  />
                </div>
              )}

              {config.action === 'execute_command' && (
                <div style={{ marginBottom: '15px' }}>
                  <label style={labelStyle}>Command</label>
                  <input
                    type="text"
                    value={config.command || ''}
                    onChange={(e) => handleConfigChange('command', e.target.value)}
                    placeholder="ls -la /app/pricing"
                    style={{...inputStyle, fontFamily: 'monospace'}}
                  />
                </div>
              )}
            </>
          )}

          {/* Test Connection */}
          {testResult && (
            <div style={{
              padding: '12px',
              borderRadius: '8px',
              marginTop: '15px',
              background: testResult.success ? '#d1fae5' : '#fee2e2',
              border: `1px solid ${testResult.success ? '#10b981' : '#ef4444'}`,
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                color: testResult.success ? '#065f46' : '#991b1b',
              }}>
                {testResult.success ? <Check size={16} /> : <X size={16} />}
                <span>{testResult.message}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '20px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px',
        }}>
          <button onClick={testConnection} disabled={testing} style={{
            ...buttonStyle,
            background: testing ? '#e5e7eb' : 'white',
            color: testing ? '#9ca3af' : '#374151',
            border: '1px solid #e5e7eb',
          }}>
            {testing ? 'Testing...' : 'Test Connection'}
          </button>
          <button onClick={handleSave} style={{
            ...buttonStyle,
            background: '#3b82f6',
            color: 'white',
          }}>
            Save & Continue
          </button>
        </div>
      </div>
    </div>
  );
};

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '6px',
  border: '1px solid #e5e7eb',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle = {
  display: 'block',
  marginBottom: '5px',
  fontSize: '14px',
  fontWeight: '500',
};

const buttonStyle = {
  padding: '10px 20px',
  borderRadius: '6px',
  border: 'none',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '500',
};

export default CredentialModal;
