import React, { useState, useEffect } from 'react';

import { 
  X, Database, Terminal, Brain, Key, GitBranch, Layers, Plus, Trash2, 
  Mail, MessageSquare, Ticket, Clock, Webhook, PlayCircle, Box, Zap, 
  Settings, Code, CheckCircle, Phone, Bell, Printer, Archive, FileText, Send
} from 'lucide-react';

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
    // Existing
    case 'oracle_query': return <Database size={24} color="#3b82f6" />;
    case 'unix_command': return <Terminal size={24} color="#10b981" />;
    case 'llm_analysis': return <Brain size={24} color="#8b5cf6" />;
    case 'condition': return <GitBranch size={24} color="#f59e0b" />;
    case 'parallel': return <Layers size={24} color="#6366f1" />;
    
    // Triggers
    case 'trigger_email': return <Mail size={24} color="#ec4899" />;
    case 'trigger_chat': return <MessageSquare size={24} color="#06b6d4" />;
    case 'trigger_servicenow': return <Ticket size={24} color="#14b8a6" />;
    case 'trigger_schedule': return <Clock size={24} color="#8b5cf6" />;
    case 'trigger_webhook': return <Webhook size={24} color="#f59e0b" />;
    case 'trigger_manual': return <PlayCircle size={24} color="#10b981" />;
    
    // Outputs
    case 'output_email': return <Mail size={24} color="#dc2626" />;
    case 'output_chat': return <MessageSquare size={24} color="#0891b2" />;
    case 'output_servicenow': return <Ticket size={24} color="#0d9488" />;
    case 'output_sms': return <Phone size={24} color="#ea580c" />;
    case 'output_alert': return <Bell size={24} color="#eab308" />;
    case 'output_report': return <FileText size={24} color="#ec4899" />;
    case 'output_print': return <Printer size={24} color="#6b7280" />;
    case 'output_archive': return <Archive size={24} color="#78716c" />;
    
    // Tools
    case 'mcp_server': return <Box size={24} color="#7c3aed" />;
    case 'tool_http': return <Zap size={24} color="#0ea5e9" />;
    case 'tool_transform': return <Settings size={24} color="#64748b" />;
    case 'tool_script': return <Code size={24} color="#6366f1" />;
    case 'tool_validator': return <CheckCircle size={24} color="#059669" />;
    
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
    case 'trigger_email':
      return (
        <>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ 
              padding: '12px', 
              background: '#fce7f3', 
              border: '1px solid #fbcfe8',
              borderRadius: '6px',
              fontSize: '13px',
              color: '#831843'
            }}>
              📧 This workflow will start when an email is received matching the criteria below.
            </div>
          </div>

          <div className="form-group">
            <label>Email Account</label>
            <input
              type="email"
              value={config.emailAccount || ''}
              onChange={(e) => setConfig({...config, emailAccount: e.target.value})}
              placeholder="pricing-alerts@bofa.com"
            />
          </div>

          <div className="form-group">
            <label>IMAP Server</label>
            <input
              type="text"
              value={config.imapServer || ''}
              onChange={(e) => setConfig({...config, imapServer: e.target.value})}
              placeholder="imap.office365.com"
            />
          </div>

          <div className="form-group">
            <label>IMAP Port</label>
            <input
              type="text"
              value={config.imapPort || '993'}
              onChange={(e) => setConfig({...config, imapPort: e.target.value})}
              placeholder="993"
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
            <label>Filter Criteria</label>
            <select
              value={config.filterType || 'subject'}
              onChange={(e) => setConfig({...config, filterType: e.target.value})}
            >
              <option value="subject">Subject contains</option>
              <option value="from">From address</option>
              <option value="to">To address</option>
              <option value="body">Body contains</option>
              <option value="any">Any email</option>
            </select>
          </div>

          {config.filterType !== 'any' && (
            <div className="form-group">
              <label>Filter Value</label>
              <input
                type="text"
                value={config.filterValue || ''}
                onChange={(e) => setConfig({...config, filterValue: e.target.value})}
                placeholder="PRICING ALERT"
              />
            </div>
          )}

          <div className="form-group">
            <label>Check Interval (seconds)</label>
            <input
              type="number"
              min="30"
              value={config.checkInterval || '60'}
              onChange={(e) => setConfig({...config, checkInterval: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>Mark as Read After Processing</label>
            <input
              type="checkbox"
              checked={config.markAsRead !== false}
              onChange={(e) => setConfig({...config, markAsRead: e.target.checked})}
              style={{ width: 'auto', marginRight: '8px' }}
            />
            <span style={{ fontSize: '13px', color: '#6b7280' }}>
              Automatically mark processed emails as read
            </span>
          </div>
        </>
      );

    case 'trigger_chat':
      return (
        <>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ 
              padding: '12px', 
              background: '#cffafe', 
              border: '1px solid #a5f3fc',
              borderRadius: '6px',
              fontSize: '13px',
              color: '#155e75'
            }}>
              💬 This workflow will start when a chat message is received.
            </div>
          </div>

          <div className="form-group">
            <label>Chat Platform</label>
            <select
              value={config.platform || 'slack'}
              onChange={(e) => setConfig({...config, platform: e.target.value})}
            >
              <option value="slack">Slack</option>
              <option value="teams">Microsoft Teams</option>
              <option value="webex">Webex</option>
              <option value="custom">Custom Webhook</option>
            </select>
          </div>

          <div className="form-group">
            <label>Bot Token / API Key</label>
            <input
              type="password"
              value={config.botToken || ''}
              onChange={(e) => setConfig({...config, botToken: e.target.value})}
              placeholder="xoxb-your-bot-token"
            />
          </div>

          <div className="form-group">
            <label>Channel / Room ID</label>
            <input
              type="text"
              value={config.channelId || ''}
              onChange={(e) => setConfig({...config, channelId: e.target.value})}
              placeholder="C01234567 or pricing-alerts"
            />
          </div>

          <div className="form-group">
            <label>Trigger Keyword (optional)</label>
            <input
              type="text"
              value={config.keyword || ''}
              onChange={(e) => setConfig({...config, keyword: e.target.value})}
              placeholder="/pricing-check or !alert"
            />
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
              Leave empty to trigger on all messages
            </div>
          </div>

          <div className="form-group">
            <label>Respond in Thread</label>
            <input
              type="checkbox"
              checked={config.respondInThread !== false}
              onChange={(e) => setConfig({...config, respondInThread: e.target.checked})}
              style={{ width: 'auto', marginRight: '8px' }}
            />
            <span style={{ fontSize: '13px', color: '#6b7280' }}>
              Send responses as thread replies
            </span>
          </div>
        </>
      );

    case 'trigger_servicenow':
      return (
        <>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ 
              padding: '12px', 
              background: '#d1fae5', 
              border: '1px solid #a7f3d0',
              borderRadius: '6px',
              fontSize: '13px',
              color: '#065f46'
            }}>
              🎫 This workflow will start when a ServiceNow ticket is created or updated.
            </div>
          </div>

          <div className="form-group">
            <label>ServiceNow Instance URL</label>
            <input
              type="text"
              value={config.instanceUrl || ''}
              onChange={(e) => setConfig({...config, instanceUrl: e.target.value})}
              placeholder="https://bofa.service-now.com"
            />
          </div>

          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={config.username || ''}
              onChange={(e) => setConfig({...config, username: e.target.value})}
              placeholder="api_user"
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
            <label>Trigger On</label>
            <select
              value={config.triggerEvent || 'created'}
              onChange={(e) => setConfig({...config, triggerEvent: e.target.value})}
            >
              <option value="created">Ticket Created</option>
              <option value="updated">Ticket Updated</option>
              <option value="both">Created or Updated</option>
            </select>
          </div>

          <div className="form-group">
            <label>Assignment Group (filter)</label>
            <input
              type="text"
              value={config.assignmentGroup || ''}
              onChange={(e) => setConfig({...config, assignmentGroup: e.target.value})}
              placeholder="Pricing Operations"
            />
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
              Leave empty to trigger on all tickets
            </div>
          </div>

          <div className="form-group">
            <label>Priority Filter</label>
            <select
              value={config.priorityFilter || 'all'}
              onChange={(e) => setConfig({...config, priorityFilter: e.target.value})}
            >
              <option value="all">All Priorities</option>
              <option value="1">1 - Critical</option>
              <option value="2">2 - High</option>
              <option value="3">3 - Moderate</option>
              <option value="4">4 - Low</option>
            </select>
          </div>

          <div className="form-group">
            <label>Poll Interval (seconds)</label>
            <input
              type="number"
              min="30"
              value={config.pollInterval || '60'}
              onChange={(e) => setConfig({...config, pollInterval: e.target.value})}
            />
          </div>
        </>
      );

    case 'trigger_schedule':
      return (
        <>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ 
              padding: '12px', 
              background: '#ede9fe', 
              border: '1px solid #ddd6fe',
              borderRadius: '6px',
              fontSize: '13px',
              color: '#5b21b6'
            }}>
              ⏰ This workflow will start automatically on the schedule defined below.
            </div>
          </div>

          <div className="form-group">
            <label>Schedule Type</label>
            <select
              value={config.scheduleType || 'cron'}
              onChange={(e) => setConfig({...config, scheduleType: e.target.value})}
            >
              <option value="interval">Fixed Interval</option>
              <option value="cron">Cron Expression</option>
              <option value="daily">Daily at specific time</option>
            </select>
          </div>

          {config.scheduleType === 'interval' && (
            <>
              <div className="form-group">
                <label>Run Every</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '8px' }}>
                  <input
                    type="number"
                    min="1"
                    value={config.intervalValue || '5'}
                    onChange={(e) => setConfig({...config, intervalValue: e.target.value})}
                  />
                  <select
                    value={config.intervalUnit || 'minutes'}
                    onChange={(e) => setConfig({...config, intervalUnit: e.target.value})}
                  >
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {config.scheduleType === 'cron' && (
            <div className="form-group">
              <label>Cron Expression</label>
              <input
                type="text"
                value={config.cronExpression || ''}
                onChange={(e) => setConfig({...config, cronExpression: e.target.value})}
                placeholder="0 */5 * * * (every 5 minutes)"
              />
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                Examples:<br/>
                <code>0 */5 * * *</code> - Every 5 minutes<br/>
                <code>0 9 * * 1-5</code> - 9 AM, weekdays<br/>
                <code>0 0 * * *</code> - Daily at midnight
              </div>
            </div>
          )}

          {config.scheduleType === 'daily' && (
            <div className="form-group">
              <label>Time</label>
              <input
                type="time"
                value={config.dailyTime || '09:00'}
                onChange={(e) => setConfig({...config, dailyTime: e.target.value})}
              />
            </div>
          )}

          <div className="form-group">
            <label>Timezone</label>
            <select
              value={config.timezone || 'America/New_York'}
              onChange={(e) => setConfig({...config, timezone: e.target.value})}
            >
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="UTC">UTC</option>
            </select>
          </div>

          <div className="form-group">
            <label>Active</label>
            <input
              type="checkbox"
              checked={config.active !== false}
              onChange={(e) => setConfig({...config, active: e.target.checked})}
              style={{ width: 'auto', marginRight: '8px' }}
            />
            <span style={{ fontSize: '13px', color: '#6b7280' }}>
              Schedule is currently {config.active !== false ? 'active' : 'paused'}
            </span>
          </div>
        </>
      );

    case 'trigger_webhook':
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
              🔗 This workflow will start when an HTTP POST is received at the webhook URL.
            </div>
          </div>

          <div className="form-group">
            <label>Webhook URL</label>
            <input
              type="text"
              value={`https://api.bofa.com/webhooks/${config.webhookId || 'generate-after-save'}`}
              disabled
              style={{ background: '#f3f4f6', cursor: 'not-allowed' }}
            />
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
              This URL will be generated after saving
            </div>
          </div>

          <div className="form-group">
            <label>Authentication</label>
            <select
              value={config.authType || 'bearer'}
              onChange={(e) => setConfig({...config, authType: e.target.value})}
            >
              <option value="none">None (not recommended)</option>
              <option value="bearer">Bearer Token</option>
              <option value="api_key">API Key</option>
              <option value="hmac">HMAC Signature</option>
            </select>
          </div>

          {config.authType === 'bearer' && (
            <div className="form-group">
              <label>Bearer Token</label>
              <input
                type="password"
                value={config.bearerToken || ''}
                onChange={(e) => setConfig({...config, bearerToken: e.target.value})}
                placeholder="Auto-generated or custom"
              />
            </div>
          )}

          {config.authType === 'api_key' && (
            <div className="form-group">
              <label>API Key Header Name</label>
              <input
                type="text"
                value={config.apiKeyHeader || 'X-API-Key'}
                onChange={(e) => setConfig({...config, apiKeyHeader: e.target.value})}
                placeholder="X-API-Key"
              />
            </div>
          )}

          <div className="form-group">
            <label>Expected Content-Type</label>
            <select
              value={config.contentType || 'application/json'}
              onChange={(e) => setConfig({...config, contentType: e.target.value})}
            >
              <option value="application/json">JSON</option>
              <option value="application/xml">XML</option>
              <option value="application/x-www-form-urlencoded">Form Data</option>
              <option value="text/plain">Plain Text</option>
            </select>
          </div>

          <div className="form-group">
            <label>Payload Validation (JSONPath)</label>
            <input
              type="text"
              value={config.validationPath || ''}
              onChange={(e) => setConfig({...config, validationPath: e.target.value})}
              placeholder="$.event_type (optional)"
            />
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
              Optional: Validate incoming payload structure
            </div>
          </div>
        </>
      );

    case 'trigger_manual':
      return (
        <>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ 
              padding: '12px', 
              background: '#d1fae5', 
              border: '1px solid #a7f3d0',
              borderRadius: '6px',
              fontSize: '13px',
              color: '#065f46'
            }}>
              ▶️ This workflow will only start when manually triggered by a user.
            </div>
          </div>

          <div className="form-group">
            <label>Workflow Name</label>
            <input
              type="text"
              value={config.workflowName || ''}
              onChange={(e) => setConfig({...config, workflowName: e.target.value})}
              placeholder="Pricing Investigation"
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={config.description || ''}
              onChange={(e) => setConfig({...config, description: e.target.value})}
              placeholder="What does this workflow do?"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>Input Parameters</label>
            <textarea
              value={config.inputParams || ''}
              onChange={(e) => setConfig({...config, inputParams: e.target.value})}
              placeholder="cusip, date, threshold (comma-separated)"
              rows={2}
            />
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
              Parameters that users must provide when running this workflow
            </div>
          </div>

          <div className="form-group">
            <label>Require Confirmation</label>
            <input
              type="checkbox"
              checked={config.requireConfirmation !== false}
              onChange={(e) => setConfig({...config, requireConfirmation: e.target.checked})}
              style={{ width: 'auto', marginRight: '8px' }}
            />
            <span style={{ fontSize: '13px', color: '#6b7280' }}>
              Ask for confirmation before running
            </span>
          </div>

          <div className="form-group">
            <label>Allowed Users/Groups</label>
            <input
              type="text"
              value={config.allowedUsers || ''}
              onChange={(e) => setConfig({...config, allowedUsers: e.target.value})}
              placeholder="PricingOps, TradingDesk (comma-separated)"
            />
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
              Leave empty to allow all users
            </div>
          </div>
        </>
      );

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
      
      case 'output_email':
  return (
    <>
      <div style={{ marginBottom: '16px' }}>
        <div style={{ 
          padding: '12px', 
          background: '#fee2e2', 
          border: '1px solid #fca5a5',
          borderRadius: '6px',
          fontSize: '13px',
          color: '#991b1b'
        }}>
          📧 Send email notification with workflow results.
        </div>
      </div>

      <div className="form-group">
        <label>From Address</label>
        <input
          type="email"
          value={config.fromAddress || ''}
          onChange={(e) => setConfig({...config, fromAddress: e.target.value})}
          placeholder="pricing-alerts@bofa.com"
        />
      </div>

      <div className="form-group">
        <label>To (Recipients)</label>
        <input
          type="text"
          value={config.toAddress || ''}
          onChange={(e) => setConfig({...config, toAddress: e.target.value})}
          placeholder="user@bofa.com, team@bofa.com"
        />
        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
          Comma-separated email addresses or use <code>{'{{previous_output.email}}'}</code>
        </div>
      </div>

      <div className="form-group">
        <label>CC (optional)</label>
        <input
          type="text"
          value={config.ccAddress || ''}
          onChange={(e) => setConfig({...config, ccAddress: e.target.value})}
          placeholder="manager@bofa.com"
        />
      </div>

      <div className="form-group">
        <label>Subject</label>
        <input
          type="text"
          value={config.subject || ''}
          onChange={(e) => setConfig({...config, subject: e.target.value})}
          placeholder="Pricing Alert: CUSIP {{cusip}}"
        />
      </div>

      <div className="form-group">
        <label>Email Body</label>
        <textarea
          value={config.body || ''}
          onChange={(e) => setConfig({...config, body: e.target.value})}
          placeholder="Use {{variable}} for dynamic content"
          rows={6}
        />
      </div>

      <div className="form-group">
        <label>Format</label>
        <select
          value={config.format || 'html'}
          onChange={(e) => setConfig({...config, format: e.target.value})}
        >
          <option value="html">HTML</option>
          <option value="plain">Plain Text</option>
        </select>
      </div>

      <div className="form-group">
        <label>Attach Workflow Results</label>
        <input
          type="checkbox"
          checked={config.attachResults !== false}
          onChange={(e) => setConfig({...config, attachResults: e.target.checked})}
          style={{ width: 'auto', marginRight: '8px' }}
        />
        <span style={{ fontSize: '13px', color: '#6b7280' }}>
          Attach results as JSON file
        </span>
      </div>

      <div className="form-group">
        <label>SMTP Server</label>
        <input
          type="text"
          value={config.smtpServer || 'smtp.office365.com'}
          onChange={(e) => setConfig({...config, smtpServer: e.target.value})}
          placeholder="smtp.office365.com"
        />
      </div>
    </>
  );

case 'output_chat':
  return (
    <>
      <div style={{ marginBottom: '16px' }}>
        <div style={{ 
          padding: '12px', 
          background: '#cffafe', 
          border: '1px solid #a5f3fc',
          borderRadius: '6px',
          fontSize: '13px',
          color: '#155e75'
        }}>
          💬 Send message or reply in chat platform.
        </div>
      </div>

      <div className="form-group">
        <label>Platform</label>
        <select
          value={config.platform || 'slack'}
          onChange={(e) => setConfig({...config, platform: e.target.value})}
        >
          <option value="slack">Slack</option>
          <option value="teams">Microsoft Teams</option>
          <option value="webex">Webex</option>
        </select>
      </div>

      <div className="form-group">
        <label>Bot Token</label>
        <input
          type="password"
          value={config.botToken || ''}
          onChange={(e) => setConfig({...config, botToken: e.target.value})}
          placeholder="xoxb-your-bot-token"
        />
      </div>

      <div className="form-group">
        <label>Reply Mode</label>
        <select
          value={config.replyMode || 'thread'}
          onChange={(e) => setConfig({...config, replyMode: e.target.value})}
        >
          <option value="thread">Reply in thread</option>
          <option value="channel">New message in channel</option>
          <option value="dm">Direct message to user</option>
        </select>
      </div>

      <div className="form-group">
        <label>Channel/User ID</label>
        <input
          type="text"
          value={config.channelId || ''}
          onChange={(e) => setConfig({...config, channelId: e.target.value})}
          placeholder="C01234567 or @username or {{trigger.channel}}"
        />
      </div>

      <div className="form-group">
        <label>Message</label>
        <textarea
          value={config.message || ''}
          onChange={(e) => setConfig({...config, message: e.target.value})}
          placeholder="✅ Workflow completed. Results: {{summary}}"
          rows={5}
        />
      </div>

      <div className="form-group">
        <label>Include Rich Formatting</label>
        <input
          type="checkbox"
          checked={config.richFormatting !== false}
          onChange={(e) => setConfig({...config, richFormatting: e.target.checked})}
          style={{ width: 'auto', marginRight: '8px' }}
        />
        <span style={{ fontSize: '13px', color: '#6b7280' }}>
          Use markdown and formatting
        </span>
      </div>
    </>
  );

case 'output_servicenow':
  return (
    <>
      <div style={{ marginBottom: '16px' }}>
        <div style={{ 
          padding: '12px', 
          background: '#d1fae5', 
          border: '1px solid #a7f3d0',
          borderRadius: '6px',
          fontSize: '13px',
          color: '#065f46'
        }}>
          🎫 Update ServiceNow ticket with workflow results.
        </div>
      </div>

      <div className="form-group">
        <label>Instance URL</label>
        <input
          type="text"
          value={config.instanceUrl || ''}
          onChange={(e) => setConfig({...config, instanceUrl: e.target.value})}
          placeholder="https://bofa.service-now.com"
        />
      </div>

      <div className="form-group">
        <label>Action</label>
        <select
          value={config.action || 'update'}
          onChange={(e) => setConfig({...config, action: e.target.value})}
        >
          <option value="update">Update existing ticket</option>
          <option value="create">Create new ticket</option>
          <option value="resolve">Resolve ticket</option>
          <option value="comment">Add comment</option>
        </select>
      </div>

      <div className="form-group">
        <label>Ticket Number</label>
        <input
          type="text"
          value={config.ticketNumber || ''}
          onChange={(e) => setConfig({...config, ticketNumber: e.target.value})}
          placeholder="INC0012345 or {{trigger.ticket}}"
        />
      </div>

      <div className="form-group">
        <label>Update Field</label>
        <select
          value={config.updateField || 'work_notes'}
          onChange={(e) => setConfig({...config, updateField: e.target.value})}
        >
          <option value="work_notes">Work Notes</option>
          <option value="comments">Comments</option>
          <option value="resolution_notes">Resolution Notes</option>
          <option value="state">State</option>
        </select>
      </div>

      <div className="form-group">
        <label>Update Content</label>
        <textarea
          value={config.updateContent || ''}
          onChange={(e) => setConfig({...config, updateContent: e.target.value})}
          placeholder="Workflow completed. Root cause: {{analysis}}"
          rows={4}
        />
      </div>
    </>
  );

case 'output_sms':
  return (
    <>
      <div className="form-group">
        <label>SMS Provider</label>
        <select
          value={config.provider || 'twilio'}
          onChange={(e) => setConfig({...config, provider: e.target.value})}
        >
          <option value="twilio">Twilio</option>
          <option value="aws_sns">AWS SNS</option>
          <option value="messagebird">MessageBird</option>
        </select>
      </div>

      <div className="form-group">
        <label>From Number</label>
        <input
          type="tel"
          value={config.fromNumber || ''}
          onChange={(e) => setConfig({...config, fromNumber: e.target.value})}
          placeholder="+12125551234"
        />
      </div>

      <div className="form-group">
        <label>To Number(s)</label>
        <input
          type="text"
          value={config.toNumber || ''}
          onChange={(e) => setConfig({...config, toNumber: e.target.value})}
          placeholder="+12125555678 or {{user.phone}}"
        />
      </div>

      <div className="form-group">
        <label>Message (max 160 chars)</label>
        <textarea
          value={config.message || ''}
          onChange={(e) => setConfig({...config, message: e.target.value})}
          placeholder="ALERT: Pricing failed for {{cusip}}"
          rows={3}
          maxLength={160}
        />
        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
          {(config.message || '').length}/160 characters
        </div>
      </div>
    </>
  );

case 'output_alert':
  return (
    <>
      <div className="form-group">
        <label>Alert Type</label>
        <select
          value={config.alertType || 'notification'}
          onChange={(e) => setConfig({...config, alertType: e.target.value})}
        >
          <option value="notification">Push Notification</option>
          <option value="pagerduty">PagerDuty</option>
          <option value="opsgenie">OpsGenie</option>
          <option value="dashboard">Dashboard Alert</option>
        </select>
      </div>

      <div className="form-group">
        <label>Severity</label>
        <select
          value={config.severity || 'medium'}
          onChange={(e) => setConfig({...config, severity: e.target.value})}
        >
          <option value="critical">🔴 Critical</option>
          <option value="high">🟠 High</option>
          <option value="medium">🟡 Medium</option>
          <option value="low">🟢 Low</option>
          <option value="info">ℹ️ Info</option>
        </select>
      </div>

      <div className="form-group">
        <label>Alert Title</label>
        <input
          type="text"
          value={config.title || ''}
          onChange={(e) => setConfig({...config, title: e.target.value})}
          placeholder="Pricing System Alert"
        />
      </div>

      <div className="form-group">
        <label>Alert Message</label>
        <textarea
          value={config.message || ''}
          onChange={(e) => setConfig({...config, message: e.target.value})}
          placeholder="Describe the alert..."
          rows={4}
        />
      </div>

      <div className="form-group">
        <label>Escalation Policy (if critical)</label>
        <input
          type="text"
          value={config.escalation || ''}
          onChange={(e) => setConfig({...config, escalation: e.target.value})}
          placeholder="pricing-oncall"
        />
      </div>
    </>
  );

case 'mcp_server':
  return (
    <>
      <div style={{ marginBottom: '16px' }}>
        <div style={{ 
          padding: '12px', 
          background: '#f5f3ff', 
          border: '1px solid #e9d5ff',
          borderRadius: '6px',
          fontSize: '13px',
          color: '#6b21a8'
        }}>
          🔌 Connect to a custom MCP server for specialized operations.
        </div>
      </div>

      <div className="form-group">
        <label>MCP Server Name</label>
        <input
          type="text"
          value={config.serverName || ''}
          onChange={(e) => setConfig({...config, serverName: e.target.value})}
          placeholder="my_custom_mcp"
        />
      </div>

      <div className="form-group">
        <label>Connection Type</label>
        <select
          value={config.connectionType || 'stdio'}
          onChange={(e) => setConfig({...config, connectionType: e.target.value})}
        >
          <option value="stdio">STDIO</option>
          <option value="http">HTTP/REST</option>
          <option value="grpc">gRPC</option>
          <option value="websocket">WebSocket</option>
        </select>
      </div>

      {config.connectionType === 'stdio' ? (
        <>
          <div className="form-group">
            <label>Command</label>
            <input
              type="text"
              value={config.command || ''}
              onChange={(e) => setConfig({...config, command: e.target.value})}
              placeholder="python"
            />
          </div>
          <div className="form-group">
            <label>Arguments</label>
            <input
              type="text"
              value={config.args || ''}
              onChange={(e) => setConfig({...config, args: e.target.value})}
              placeholder="-m my_mcp_server"
            />
          </div>
        </>
      ) : (
        <div className="form-group">
          <label>Endpoint URL</label>
          <input
            type="text"
            value={config.endpoint || ''}
            onChange={(e) => setConfig({...config, endpoint: e.target.value})}
            placeholder="http://localhost:3000/mcp"
          />
        </div>
      )}

      <div className="form-group">
        <label>Available Tools (JSON array)</label>
        <textarea
          value={config.tools || ''}
          onChange={(e) => setConfig({...config, tools: e.target.value})}
          placeholder='["tool1", "tool2", "tool3"]'
          rows={3}
        />
      </div>

      <div className="form-group">
        <label>Tool to Execute</label>
        <input
          type="text"
          value={config.toolName || ''}
          onChange={(e) => setConfig({...config, toolName: e.target.value})}
          placeholder="get_data"
        />
      </div>

      <div className="form-group">
        <label>Tool Parameters (JSON)</label>
        <textarea
          value={config.toolParams || ''}
          onChange={(e) => setConfig({...config, toolParams: e.target.value})}
          placeholder='{"param1": "value1", "param2": "{{previous_output}}"}'
          rows={4}
        />
      </div>
    </>
  );

case 'tool_http':
  return (
    <>
      <div className="form-group">
        <label>HTTP Method</label>
        <select
          value={config.method || 'GET'}
          onChange={(e) => setConfig({...config, method: e.target.value})}
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="PATCH">PATCH</option>
          <option value="DELETE">DELETE</option>
        </select>
      </div>

      <div className="form-group">
        <label>URL</label>
        <input
          type="text"
          value={config.url || ''}
          onChange={(e) => setConfig({...config, url: e.target.value})}
          placeholder="https://api.example.com/endpoint"
        />
      </div>

      <div className="form-group">
        <label>Headers (JSON)</label>
        <textarea
          value={config.headers || ''}
          onChange={(e) => setConfig({...config, headers: e.target.value})}
          placeholder='{"Authorization": "Bearer {{token}}", "Content-Type": "application/json"}'
          rows={3}
        />
      </div>

      {['POST', 'PUT', 'PATCH'].includes(config.method) && (
        <div className="form-group">
          <label>Request Body (JSON)</label>
          <textarea
            value={config.body || ''}
            onChange={(e) => setConfig({...config, body: e.target.value})}
            placeholder='{"key": "value", "data": "{{previous_output}}"}'
            rows={4}
          />
        </div>
      )}

      <div className="form-group">
        <label>Timeout (seconds)</label>
        <input
          type="number"
          value={config.timeout || '30'}
          onChange={(e) => setConfig({...config, timeout: e.target.value})}
        />
      </div>
    </>
  );

case 'tool_transform':
  return (
    <>
      <div className="form-group">
        <label>Transform Type</label>
        <select
          value={config.transformType || 'jmespath'}
          onChange={(e) => setConfig({...config, transformType: e.target.value})}
        >
          <option value="jmespath">JMESPath Query</option>
          <option value="jsonpath">JSONPath Query</option>
          <option value="map">Map Fields</option>
          <option value="filter">Filter Data</option>
          <option value="aggregate">Aggregate/Group</option>
        </select>
      </div>

      <div className="form-group">
        <label>Transform Expression</label>
        <textarea
          value={config.expression || ''}
          onChange={(e) => setConfig({...config, expression: e.target.value})}
          placeholder="data[?price > 100].{cusip: cusip, price: price}"
          rows={4}
        />
      </div>

      <div className="form-group">
        <label>Output Format</label>
        <select
          value={config.outputFormat || 'json'}
          onChange={(e) => setConfig({...config, outputFormat: e.target.value})}
        >
          <option value="json">JSON</option>
          <option value="csv">CSV</option>
          <option value="xml">XML</option>
        </select>
      </div>
    </>
  );

case 'tool_script':
  return (
    <>
      <div className="form-group">
        <label>Script Language</label>
        <select
          value={config.language || 'python'}
          onChange={(e) => setConfig({...config, language: e.target.value})}
        >
          <option value="python">Python</option>
          <option value="javascript">JavaScript</option>
          <option value="bash">Bash</option>
        </select>
      </div>

      <div className="form-group">
        <label>Script Code</label>
        <textarea
          value={config.code || ''}
          onChange={(e) => setConfig({...config, code: e.target.value})}
          placeholder="# Python example\ndef process(data):\n    return data['price'] * 1.1"
          rows={10}
          style={{ fontFamily: 'monospace', fontSize: '12px' }}
        />
      </div>

      <div className="form-group">
        <label>Input Variable Name</label>
        <input
          type="text"
          value={config.inputVar || 'data'}
          onChange={(e) => setConfig({...config, inputVar: e.target.value})}
          placeholder="data"
        />
      </div>
    </>
  );

case 'tool_validator':
  return (
    <>
      <div className="form-group">
        <label>Validation Type</label>
        <select
          value={config.validationType || 'schema'}
          onChange={(e) => setConfig({...config, validationType: e.target.value})}
        >
          <option value="schema">JSON Schema</option>
          <option value="rules">Business Rules</option>
          <option value="range">Range Check</option>
          <option value="format">Format Validation</option>
        </select>
      </div>

      <div className="form-group">
        <label>Validation Rules</label>
        <textarea
          value={config.rules || ''}
          onChange={(e) => setConfig({...config, rules: e.target.value})}
          placeholder='{"price": {"type": "number", "minimum": 0}}'
          rows={6}
        />
      </div>

      <div className="form-group">
        <label>On Validation Failure</label>
        <select
          value={config.onFailure || 'stop'}
          onChange={(e) => setConfig({...config, onFailure: e.target.value})}
        >
          <option value="stop">Stop workflow</option>
          <option value="continue">Continue with warning</option>
          <option value="retry">Retry previous step</option>
        </select>
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