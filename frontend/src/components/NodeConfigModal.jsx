import React, { useState, useEffect } from 'react';
import { X, Database, Terminal, Brain, Key, GitBranch, Layers, Plus, Trash2 } from 'lucide-react';

const NodeConfigModal = ({ node, onClose, onSave }) => {
  const [config, setConfig] = useState(node.data.config || {});

  // Initialize condition/parallel specific state
  useEffect(() => {
    if (node.data.type === 'condition' && !config.conditions) {
      setConfig({
        ...config,
        conditions: [{ field: '', operator: '==', value: '', action: 'continue' }]
      });
    }
    if (node.data.type === 'parallel' && !config.branches) {
      setConfig({
        ...config,
        branches: [{ name: 'Branch 1', enabled: true }]
      });
    }
  }, [node.data.type]);

  const getNodeIcon = () => {
    switch (node.data.type) {
      case 'oracle_query': return <Database size={24} color="#3b82f6" />;
      case 'unix_command': return <Terminal size={24} color="#10b981" />;
      case 'llm_analysis': return <Brain size={24} color="#8b5cf6" />;
      case 'condition': return <GitBranch size={24} color="#f59e0b" />;
      case 'parallel': return <Layers size={24} color="#6366f1" />;
      default: return <Key size={24} color="#6b7280" />;
    }
  };

  // Condition node handlers
  const addCondition = () => {
    setConfig({
      ...config,
      conditions: [
        ...(config.conditions || []),
        { field: '', operator: '==', value: '', action: 'continue' }
      ]
    });
  };

  const updateCondition = (index, field, value) => {
    const newConditions = [...(config.conditions || [])];
    newConditions[index] = { ...newConditions[index], [field]: value };
    setConfig({ ...config, conditions: newConditions });
  };

  const removeCondition = (index) => {
    const newConditions = (config.conditions || []).filter((_, i) => i !== index);
    setConfig({ ...config, conditions: newConditions });
  };

  // Parallel node handlers
  const addBranch = () => {
    const branchNumber = (config.branches || []).length + 1;
    setConfig({
      ...config,
      branches: [
        ...(config.branches || []),
        { name: `Branch ${branchNumber}`, enabled: true }
      ]
    });
  };

  const updateBranch = (index, field, value) => {
    const newBranches = [...(config.branches || [])];
    newBranches[index] = { ...newBranches[index], [field]: value };
    setConfig({ ...config, branches: newBranches });
  };

  const removeBranch = (index) => {
    const newBranches = (config.branches || []).filter((_, i) => i !== index);
    setConfig({ ...config, branches: newBranches });
  };

  const renderConfigFields = () => {
    switch (node.data.type) {
      case 'oracle_query':
        return (
          <>
            <div className="form-group">
              <label>Oracle Host</label>
              <input
                type="text"
                value={config.host || ''}
                onChange={(e) => setConfig({...config, host: e.target.value})}
                placeholder="oracle-server.bofa.com"
              />
            </div>
            <div className="form-group">
              <label>Port</label>
              <input
                type="text"
                value={config.port || '1521'}
                onChange={(e) => setConfig({...config, port: e.target.value})}
                placeholder="1521"
              />
            </div>
            <div className="form-group">
              <label>Service Name</label>
              <input
                type="text"
                value={config.service || ''}
                onChange={(e) => setConfig({...config, service: e.target.value})}
                placeholder="PRICING"
              />
            </div>
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                value={config.username || ''}
                onChange={(e) => setConfig({...config, username: e.target.value})}
                placeholder="pricing_user"
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={config.password || ''}
                onChange={(e) => setConfig({...config, password: e.target.value})}
                placeholder="••••••••"
              />
            </div>
            <div className="form-group">
              <label>SQL Query</label>
              <textarea
                value={config.query || ''}
                onChange={(e) => setConfig({...config, query: e.target.value})}
                placeholder="SELECT * FROM pricing_master WHERE cusip = :cusip"
                rows={4}
              />
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                💡 Use <code>:variable_name</code> for parameters from previous nodes
              </div>
            </div>
          </>
        );

      case 'unix_command':
        return (
          <>
            <div className="form-group">
              <label>Server Host</label>
              <input
                type="text"
                value={config.host || ''}
                onChange={(e) => setConfig({...config, host: e.target.value})}
                placeholder="unix-server-01.bofa.com"
              />
            </div>
            <div className="form-group">
              <label>SSH Port</label>
              <input
                type="text"
                value={config.port || '22'}
                onChange={(e) => setConfig({...config, port: e.target.value})}
                placeholder="22"
              />
            </div>
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                value={config.username || ''}
                onChange={(e) => setConfig({...config, username: e.target.value})}
                placeholder="pricingadmin"
              />
            </div>
            <div className="form-group">
              <label>Authentication Method</label>
              <select
                value={config.authMethod || 'password'}
                onChange={(e) => setConfig({...config, authMethod: e.target.value})}
              >
                <option value="password">Password</option>
                <option value="key">SSH Key</option>
              </select>
            </div>
            {config.authMethod === 'key' ? (
              <div className="form-group">
                <label>SSH Key Path</label>
                <input
                  type="text"
                  value={config.keyPath || ''}
                  onChange={(e) => setConfig({...config, keyPath: e.target.value})}
                  placeholder="/home/user/.ssh/id_rsa"
                />
              </div>
            ) : (
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={config.password || ''}
                  onChange={(e) => setConfig({...config, password: e.target.value})}
                  placeholder="••••••••"
                />
              </div>
            )}
            <div className="form-group">
              <label>Command to Execute</label>
              <textarea
                value={config.command || ''}
                onChange={(e) => setConfig({...config, command: e.target.value})}
                placeholder="tail -1000 /var/log/pricing/app.log | grep ERROR"
                rows={3}
              />
            </div>
            <div className="form-group">
              <label>Working Directory (optional)</label>
              <input
                type="text"
                value={config.workingDir || ''}
                onChange={(e) => setConfig({...config, workingDir: e.target.value})}
                placeholder="/opt/pricing"
              />
            </div>
          </>
        );

      case 'llm_analysis':
        return (
          <>
            <div className="form-group">
              <label>LLM API Endpoint</label>
              <input
                type="text"
                value={config.apiUrl || ''}
                onChange={(e) => setConfig({...config, apiUrl: e.target.value})}
                placeholder="http://your-gpu-server:8080/generate"
              />
            </div>
            <div className="form-group">
              <label>Model</label>
              <select
                value={config.model || 'llama-3-70b'}
                onChange={(e) => setConfig({...config, model: e.target.value})}
              >
                <option value="llama-3-70b">Llama 3 70B</option>
                <option value="llama-3-8b">Llama 3 8B</option>
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="claude-3-sonnet">Claude 3 Sonnet</option>
              </select>
            </div>
            <div className="form-group">
              <label>Max Tokens</label>
              <input
                type="number"
                value={config.maxTokens || '4096'}
                onChange={(e) => setConfig({...config, maxTokens: e.target.value})}
                placeholder="4096"
              />
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                Maximum length of the response (1-32000)
              </div>
            </div>
            <div className="form-group">
              <label>Temperature</label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={config.temperature || '0.7'}
                onChange={(e) => setConfig({...config, temperature: e.target.value})}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280' }}>
                <span>Precise (0.0)</span>
                <span>Current: {config.temperature || '0.7'}</span>
                <span>Creative (2.0)</span>
              </div>
            </div>
            <div className="form-group">
              <label>Analysis Prompt</label>
              <textarea
                value={config.prompt || ''}
                onChange={(e) => setConfig({...config, prompt: e.target.value})}
                placeholder="Analyze the following pricing data and identify any issues or anomalies..."
                rows={5}
              />
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                💡 Use <code>{'{{previous_output}}'}</code> to reference data from previous nodes
              </div>
            </div>
          </>
        );

      case 'condition':
        return (
          <>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ 
                padding: '12px', 
                background: '#fef3c7', 
                border: '1px solid #fde68a',
                borderRadius: '6px',
                fontSize: '13px',
                color: '#78350f'
              }}>
                ℹ️ Define conditions to control workflow execution. If all conditions are true, the workflow continues. Otherwise, it takes the specified action.
              </div>
            </div>

            <div className="form-group">
              <label>Logic Operator</label>
              <select
                value={config.logicOperator || 'AND'}
                onChange={(e) => setConfig({...config, logicOperator: e.target.value})}
              >
                <option value="AND">ALL conditions must be true (AND)</option>
                <option value="OR">ANY condition must be true (OR)</option>
              </select>
            </div>

            {/* Conditions List */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <label style={{ margin: 0, fontWeight: '600' }}>Conditions</label>
                <button
                  onClick={addCondition}
                  style={{
                    padding: '6px 12px',
                    background: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Plus size={14} />
                  Add Condition
                </button>
              </div>

              {(config.conditions || []).map((condition, index) => (
                <div
                  key={index}
                  style={{
                    padding: '12px',
                    background: '#fef3c7',
                    border: '2px solid #fde68a',
                    borderRadius: '8px',
                    marginBottom: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '600', fontSize: '13px', color: '#78350f' }}>
                      Condition {index + 1}
                    </span>
                    {(config.conditions || []).length > 1 && (
                      <button
                        onClick={() => removeCondition(index)}
                        style={{
                          padding: '4px 8px',
                          background: '#fee2e2',
                          color: '#dc2626',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 1fr', gap: '8px' }}>
                    <input
                      type="text"
                      value={condition.field || ''}
                      onChange={(e) => updateCondition(index, 'field', e.target.value)}
                      placeholder="Field name"
                      style={{
                        padding: '8px',
                        border: '1px solid #d97706',
                        borderRadius: '4px',
                        fontSize: '13px'
                      }}
                    />
                    <select
                      value={condition.operator || '=='}
                      onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                      style={{
                        padding: '8px',
                        border: '1px solid #d97706',
                        borderRadius: '4px',
                        fontSize: '13px'
                      }}
                    >
                      <option value="==">equals (==)</option>
                      <option value="!=">not equals (!=)</option>
                      <option value=">">greater than (&gt;)</option>
                      <option value="<">less than (&lt;)</option>
                      <option value=">=">greater or equal (≥)</option>
                      <option value="<=">less or equal (≤)</option>
                      <option value="contains">contains</option>
                      <option value="not_contains">not contains</option>
                      <option value="starts_with">starts with</option>
                      <option value="ends_with">ends with</option>
                      <option value="is_empty">is empty</option>
                      <option value="is_not_empty">is not empty</option>
                    </select>
                    <input
                      type="text"
                      value={condition.value || ''}
                      onChange={(e) => updateCondition(index, 'value', e.target.value)}
                      placeholder="Value to compare"
                      disabled={condition.operator === 'is_empty' || condition.operator === 'is_not_empty'}
                      style={{
                        padding: '8px',
                        border: '1px solid #d97706',
                        borderRadius: '4px',
                        fontSize: '13px',
                        background: (condition.operator === 'is_empty' || condition.operator === 'is_not_empty') ? '#f3f4f6' : 'white'
                      }}
                    />
                  </div>

                  <div style={{ marginTop: '8px', fontSize: '11px', color: '#92400e' }}>
                    Example: <code>status == "FAILED"</code> or <code>price &gt; 100</code> or <code>error_message contains "timeout"</code>
                  </div>
                </div>
              ))}

              {(config.conditions || []).length === 0 && (
                <div style={{
                  padding: '20px',
                  textAlign: 'center',
                  border: '2px dashed #fde68a',
                  borderRadius: '8px',
                  color: '#92400e'
                }}>
                  No conditions defined. Click "Add Condition" to create one.
                </div>
              )}
            </div>

            <div className="form-group">
              <label>If Conditions Match</label>
              <select
                value={config.onMatch || 'continue'}
                onChange={(e) => setConfig({...config, onMatch: e.target.value})}
              >
                <option value="continue">Continue to next node</option>
                <option value="stop">Stop workflow</option>
                <option value="skip_next">Skip next node</option>
              </select>
            </div>

            <div className="form-group">
              <label>If Conditions Don't Match</label>
              <select
                value={config.onNoMatch || 'stop'}
                onChange={(e) => setConfig({...config, onNoMatch: e.target.value})}
              >
                <option value="continue">Continue to next node</option>
                <option value="stop">Stop workflow</option>
                <option value="skip_next">Skip next node</option>
              </select>
            </div>
          </>
        );

      case 'parallel':
        return (
          <>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ 
                padding: '12px', 
                background: '#dbeafe', 
                border: '1px solid #93c5fd',
                borderRadius: '6px',
                fontSize: '13px',
                color: '#1e3a8a'
              }}>
                ℹ️ Execute multiple workflow branches simultaneously. All branches will run in parallel and workflow continues when selected strategy completes.
              </div>
            </div>

            <div className="form-group">
              <label>Execution Strategy</label>
              <select
                value={config.strategy || 'wait_all'}
                onChange={(e) => setConfig({...config, strategy: e.target.value})}
              >
                <option value="wait_all">Wait for ALL branches to complete</option>
                <option value="wait_any">Wait for ANY branch to complete</option>
                <option value="wait_none">Don't wait (fire and forget)</option>
              </select>
            </div>

            <div className="form-group">
              <label>On Branch Failure</label>
              <select
                value={config.onFailure || 'continue'}
                onChange={(e) => setConfig({...config, onFailure: e.target.value})}
              >
                <option value="continue">Continue with other branches</option>
                <option value="stop_all">Stop all branches</option>
                <option value="retry">Retry failed branch</option>
              </select>
            </div>

            {config.onFailure === 'retry' && (
              <div className="form-group">
                <label>Max Retry Attempts</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={config.maxRetries || '3'}
                  onChange={(e) => setConfig({...config, maxRetries: e.target.value})}
                />
              </div>
            )}

            {/* Branches List */}
            <div style={{ marginTop: '20px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <label style={{ margin: 0, fontWeight: '600' }}>Branches</label>
                <button
                  onClick={addBranch}
                  style={{
                    padding: '6px 12px',
                    background: '#6366f1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Plus size={14} />
                  Add Branch
                </button>
              </div>

              {(config.branches || []).map((branch, index) => (
                <div
                  key={index}
                  style={{
                    padding: '12px',
                    background: '#dbeafe',
                    border: '2px solid #93c5fd',
                    borderRadius: '8px',
                    marginBottom: '8px'
                  }}
                >
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={branch.enabled !== false}
                      onChange={(e) => updateBranch(index, 'enabled', e.target.checked)}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <input
                      type="text"
                      value={branch.name || ''}
                      onChange={(e) => updateBranch(index, 'name', e.target.value)}
                      placeholder={`Branch ${index + 1}`}
                      style={{
                        flex: 1,
                        padding: '8px',
                        border: '1px solid #3b82f6',
                        borderRadius: '4px',
                        fontSize: '13px'
                      }}
                    />
                    <input
                      type="number"
                      value={branch.priority || index + 1}
                      onChange={(e) => updateBranch(index, 'priority', e.target.value)}
                      placeholder="Priority"
                      title="Execution priority (1 = highest)"
                      style={{
                        width: '80px',
                        padding: '8px',
                        border: '1px solid #3b82f6',
                        borderRadius: '4px',
                        fontSize: '13px'
                      }}
                    />
                    {(config.branches || []).length > 1 && (
                      <button
                        onClick={() => removeBranch(index)}
                        style={{
                          padding: '6px',
                          background: '#fee2e2',
                          color: '#dc2626',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  
                  <div style={{ marginTop: '8px' }}>
                    <textarea
                      value={branch.description || ''}
                      onChange={(e) => updateBranch(index, 'description', e.target.value)}
                      placeholder="Branch description (optional)"
                      rows={2}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #3b82f6',
                        borderRadius: '4px',
                        fontSize: '12px',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                </div>
              ))}

              {(config.branches || []).length === 0 && (
                <div style={{
                  padding: '20px',
                  textAlign: 'center',
                  border: '2px dashed #93c5fd',
                  borderRadius: '8px',
                  color: '#1e40af'
                }}>
                  No branches defined. Click "Add Branch" to create one.
                </div>
              )}

              <div style={{ 
                marginTop: '12px',
                padding: '8px 12px',
                background: '#f0f9ff',
                border: '1px solid #93c5fd',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#1e40af'
              }}>
                💡 Connect nodes after this Parallel node to define what each branch should execute
              </div>
            </div>
          </>
        );

      default:
        return (
          <div className="form-group">
            <label>Configuration (JSON)</label>
            <textarea
              value={JSON.stringify(config, null, 2)}
              onChange={(e) => {
                try {
                  setConfig(JSON.parse(e.target.value));
                } catch (err) {
                  // Invalid JSON, ignore
                }
              }}
              rows={8}
              placeholder="{}"
              style={{
                fontFamily: '"Monaco", "Menlo", "Consolas", monospace',
                fontSize: '12px'
              }}
            />
          </div>
        );
    }
  };

  const handleSave = () => {
    onSave(config);
    onClose();
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
        maxWidth: '700px',
        maxHeight: '85vh',
        overflow: 'hidden',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {getNodeIcon()}
            <div>
              <h2 style={{ margin: 0, fontSize: '18px' }}>Configure Node</h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                {node.data.label}
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

        {/* Content - Scrollable */}
        <div style={{ 
          flex: 1,
          overflow: 'auto',
          padding: '20px'
        }}>
          {renderConfigFields()}
        </div>

        {/* Footer */}
        <div style={{
          padding: '20px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          gap: '10px',
          justifyContent: 'flex-end',
          flexShrink: 0,
          background: '#f9fafb'
        }}>
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
            onClick={handleSave}
            style={{
              padding: '10px 20px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            💾 Save Configuration
          </button>
        </div>
      </div>

      {/* CSS for form groups */}
      <style>{`
        .form-group {
          margin-bottom: 16px;
        }
        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-weight: 600;
          font-size: 14px;
          color: #374151;
        }
        .form-group input,
        .form-group textarea,
        .form-group select {
          width: 100%;
          padding: 10px 12px;
          border: 2px solid #e5e7eb;
          border-radius: 6px;
          font-size: 14px;
          font-family: inherit;
          transition: border-color 0.2s;
        }
        .form-group input:focus,
        .form-group textarea:focus,
        .form-group select:focus {
          outline: none;
          border-color: #3b82f6;
        }
        .form-group textarea {
          resize: vertical;
          font-family: 'Monaco', 'Menlo', monospace;
        }
        code {
          background: #f3f4f6;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 12px;
        }
      `}</style>
    </div>
  );
};

export default NodeConfigModal;