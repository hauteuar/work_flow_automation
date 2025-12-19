import React from 'react';
import { 
  Database, Terminal, Brain, GitBranch, FileText, Layers, Mail, MessageSquare, 
  Ticket, Clock, Webhook, PlayCircle, Settings, Wrench, Code, Box, 
  Send, Bell, Phone, Printer, Archive, Zap, CheckCircle
} from 'lucide-react';

const nodeDefinitions = [
  // ⚡ TRIGGERS SECTION
  {
    type: 'trigger_email',
    label: 'Email Trigger',
    icon: Mail,
    color: '#ec4899',
    bgColor: 'rgba(236, 72, 153, 0.1)',
    agent: null,
    description: 'Start workflow from incoming email',
    category: 'trigger'
  },
  {
    type: 'trigger_chat',
    label: 'Chat Trigger',
    icon: MessageSquare,
    color: '#06b6d4',
    bgColor: 'rgba(6, 182, 212, 0.1)',
    agent: null,
    description: 'Start from Slack/Teams message',
    category: 'trigger'
  },
  {
    type: 'trigger_servicenow',
    label: 'ServiceNow Ticket',
    icon: Ticket,
    color: '#14b8a6',
    bgColor: 'rgba(20, 184, 166, 0.1)',
    agent: null,
    description: 'Start from ServiceNow ticket',
    category: 'trigger'
  },
  {
    type: 'trigger_schedule',
    label: 'Schedule',
    icon: Clock,
    color: '#8b5cf6',
    bgColor: 'rgba(139, 92, 246, 0.1)',
    agent: null,
    description: 'Run on schedule (cron)',
    category: 'trigger'
  },
  {
    type: 'trigger_webhook',
    label: 'Webhook',
    icon: Webhook,
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    agent: null,
    description: 'HTTP webhook endpoint',
    category: 'trigger'
  },
  {
    type: 'trigger_manual',
    label: 'Manual',
    icon: PlayCircle,
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
    agent: null,
    description: 'User-initiated workflow',
    category: 'trigger'
  },
  
  // 🎯 ACTIONS SECTION
  {
    type: 'oracle_query',
    label: 'Oracle Query',
    icon: Database,
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
    agent: 'pricing_agent',
    description: 'Query Oracle database',
    category: 'action'
  },
  {
    type: 'unix_command',
    label: 'Unix Command',
    icon: Terminal,
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
    agent: 'unix_agent',
    description: 'Execute Unix commands',
    category: 'action'
  },
  {
    type: 'llm_analysis',
    label: 'LLM Analysis',
    icon: Brain,
    color: '#8b5cf6',
    bgColor: 'rgba(139, 92, 246, 0.1)',
    agent: 'analysis_agent',
    description: 'AI-powered analysis',
    category: 'action'
  },
  
  // 🔧 MCP & TOOLS SECTION
  {
    type: 'mcp_server',
    label: 'MCP Server',
    icon: Box,
    color: '#7c3aed',
    bgColor: 'rgba(124, 58, 237, 0.1)',
    agent: null,
    description: 'Custom MCP server connection',
    category: 'tool'
  },
  {
    type: 'tool_http',
    label: 'HTTP Request',
    icon: Zap,
    color: '#0ea5e9',
    bgColor: 'rgba(14, 165, 233, 0.1)',
    agent: null,
    description: 'Make HTTP API calls',
    category: 'tool'
  },
  {
    type: 'tool_transform',
    label: 'Data Transform',
    icon: Settings,
    color: '#64748b',
    bgColor: 'rgba(100, 116, 139, 0.1)',
    agent: null,
    description: 'Transform and map data',
    category: 'tool'
  },
  {
    type: 'tool_script',
    label: 'Custom Script',
    icon: Code,
    color: '#6366f1',
    bgColor: 'rgba(99, 102, 241, 0.1)',
    agent: null,
    description: 'Run Python/JavaScript code',
    category: 'tool'
  },
  {
    type: 'tool_validator',
    label: 'Data Validator',
    icon: CheckCircle,
    color: '#059669',
    bgColor: 'rgba(5, 150, 105, 0.1)',
    agent: null,
    description: 'Validate data quality',
    category: 'tool'
  },
  
  // 🔀 CONTROL FLOW SECTION
  {
    type: 'condition',
    label: 'Condition',
    icon: GitBranch,
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    agent: null,
    description: 'Conditional branching',
    category: 'control'
  },
  {
    type: 'parallel',
    label: 'Parallel',
    icon: Layers,
    color: '#6366f1',
    bgColor: 'rgba(99, 102, 241, 0.1)',
    agent: null,
    description: 'Run branches in parallel',
    category: 'control'
  },
  
  // 📤 OUTPUTS SECTION
  {
    type: 'output_email',
    label: 'Send Email',
    icon: Mail,
    color: '#dc2626',
    bgColor: 'rgba(220, 38, 38, 0.1)',
    agent: null,
    description: 'Send email notification',
    category: 'output'
  },
  {
    type: 'output_chat',
    label: 'Chat Reply',
    icon: MessageSquare,
    color: '#0891b2',
    bgColor: 'rgba(8, 145, 178, 0.1)',
    agent: null,
    description: 'Reply in Slack/Teams',
    category: 'output'
  },
  {
    type: 'output_servicenow',
    label: 'Update Ticket',
    icon: Ticket,
    color: '#0d9488',
    bgColor: 'rgba(13, 148, 136, 0.1)',
    agent: null,
    description: 'Update ServiceNow ticket',
    category: 'output'
  },
  {
    type: 'output_sms',
    label: 'Send SMS',
    icon: Phone,
    color: '#ea580c',
    bgColor: 'rgba(234, 88, 12, 0.1)',
    agent: null,
    description: 'Send SMS alert',
    category: 'output'
  },
  {
    type: 'output_alert',
    label: 'Alert/Notification',
    icon: Bell,
    color: '#eab308',
    bgColor: 'rgba(234, 179, 8, 0.1)',
    agent: null,
    description: 'Send alert notification',
    category: 'output'
  },
  {
    type: 'output_report',
    label: 'Generate Report',
    icon: FileText,
    color: '#ec4899',
    bgColor: 'rgba(236, 72, 153, 0.1)',
    agent: 'reporting_agent',
    description: 'Generate Excel/PDF report',
    category: 'output'
  },
  {
    type: 'output_print',
    label: 'Print Document',
    icon: Printer,
    color: '#6b7280',
    bgColor: 'rgba(107, 114, 128, 0.1)',
    agent: null,
    description: 'Print to network printer',
    category: 'output'
  },
  {
    type: 'output_archive',
    label: 'Archive Data',
    icon: Archive,
    color: '#78716c',
    bgColor: 'rgba(120, 113, 108, 0.1)',
    agent: null,
    description: 'Archive to storage',
    category: 'output'
  }
];

const NodeSidebar = () => {
  const onDragStart = (event, nodeData) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeData));
    event.dataTransfer.effectAllowed = 'move';
  };

  // Group nodes by category
  const triggers = nodeDefinitions.filter(n => n.category === 'trigger');
  const actions = nodeDefinitions.filter(n => n.category === 'action');
  const tools = nodeDefinitions.filter(n => n.category === 'tool');
  const controls = nodeDefinitions.filter(n => n.category === 'control');
  const outputs = nodeDefinitions.filter(n => n.category === 'output');

  const renderNodeCard = (node) => {
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
          padding: '10px',
          cursor: 'grab',
          transition: 'all 0.2s',
          position: 'relative'
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
        
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{
            background: node.bgColor,
            padding: '6px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <IconComponent size={18} color={node.color} />
          </div>
          
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontWeight: '600',
              fontSize: '13px',
              color: '#111827',
              marginBottom: '2px'
            }}>
              {node.label}
            </div>
            <div style={{
              fontSize: '11px',
              color: '#6b7280',
              lineHeight: '1.3'
            }}>
              {node.description}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSection = (title, emoji, nodes, collapsed = false) => {
    const [isCollapsed, setIsCollapsed] = React.useState(collapsed);
    
    return (
      <div style={{ marginBottom: '16px' }}>
        <div 
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            fontSize: '12px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '4px 0'
          }}
        >
          <span>{emoji} {title}</span>
          <span style={{ fontSize: '10px' }}>
            {isCollapsed ? '▼' : '▲'}
          </span>
        </div>
        {!isCollapsed && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {nodes.map(renderNodeCard)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{
      width: '280px',
      borderRight: '1px solid #e5e7eb',
      background: '#f9fafb',
      padding: '16px',
      overflowY: 'auto',
      height: '100%'
    }}>
      <div style={{
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: '2px solid #e5e7eb'
      }}>
        <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600' }}>
          🧩 Workflow Nodes
        </h3>
        <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
          Drag to canvas • Click section to collapse
        </p>
      </div>

      {renderSection('Triggers', '⚡', triggers)}
      {renderSection('Actions', '🎯', actions)}
      {renderSection('MCP & Tools', '🔧', tools)}
      {renderSection('Control Flow', '🔀', controls)}
      {renderSection('Outputs', '📤', outputs)}

      <div style={{
        marginTop: '20px',
        padding: '12px',
        background: '#dbeafe',
        border: '1px solid #93c5fd',
        borderRadius: '8px',
        fontSize: '11px',
        color: '#1e40af'
      }}>
        <strong>💡 Workflow Pattern:</strong>
        <div style={{ marginTop: '6px', lineHeight: '1.6' }}>
          <div>1️⃣ Start with Trigger</div>
          <div>2️⃣ Add Actions/Tools</div>
          <div>3️⃣ Use Control Flow</div>
          <div>4️⃣ End with Output</div>
        </div>
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