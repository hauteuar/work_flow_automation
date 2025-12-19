import React, { useState, useCallback, useRef } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  Panel,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

import NodeSidebar from './NodeSidebar';
import CanvasToolbar from './CanvasToolbar';
import NodeConfigModal from '../NodeConfigModal';
import { customNodeTypes } from './NodeTypes';

const WorkflowCanvas = ({ onWorkflowChange, initialNodes = [], initialEdges = [] }) => {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Add edges with arrows
  const onConnect = useCallback(
    (params) => {
      setEdges((eds) => addEdge({
        ...params,
        animated: true,
        style: { stroke: '#3b82f6', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: '#3b82f6',
        },
      }, eds));
    },
    [setEdges]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const nodeData = JSON.parse(
        event.dataTransfer.getData('application/reactflow')
      );

      if (!nodeData || !reactFlowInstance) {
        return;
      }

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode = {
        id: `${nodeData.type}-${Date.now()}`,
        type: nodeData.nodeType || 'default',
        position,
        data: {
          label: nodeData.label,
          type: nodeData.type,
          agent: nodeData.agent,
          config: {},
          hasConfig: false,
        },
        style: {
          background: 'white',
          border: `3px solid ${nodeData.color || '#3b82f6'}`,
          borderRadius: '8px',
          padding: '10px',
          fontSize: '14px',
          fontWeight: '500',
          minWidth: '150px',
        },
      };

      setNodes((nds) => nds.concat(newNode));
      setSelectedNode(newNode);
      
      // Auto-open config modal for new nodes
      setTimeout(() => {
        setShowConfigModal(true);
      }, 100);
    },
    [reactFlowInstance, setNodes]
  );

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);

  const onNodeDoubleClick = useCallback((event, node) => {
    setSelectedNode(node);
    setShowConfigModal(true);
  }, []);

  const onNodesDelete = useCallback(
    (deleted) => {
      setNodes((nds) => nds.filter((node) => !deleted.find((d) => d.id === node.id)));
    },
    [setNodes]
  );

  const handleSave = useCallback(() => {
    if (reactFlowInstance) {
      const flow = reactFlowInstance.toObject();
      onWorkflowChange({
        nodes: flow.nodes,
        edges: flow.edges,
      });
      alert('Workflow saved successfully!');
    }
  }, [reactFlowInstance, onWorkflowChange]);

  const handleClear = useCallback(() => {
    if (window.confirm('Are you sure you want to clear the entire workflow?')) {
      setNodes([]);
      setEdges([]);
      setSelectedNode(null);
    }
  }, [setNodes, setEdges]);

  const handleExecute = useCallback(async () => {
    // Check if all nodes have configuration
    const unconfiguredNodes = nodes.filter(n => !n.data.hasConfig);
    if (unconfiguredNodes.length > 0) {
      alert(`Please configure all nodes first. ${unconfiguredNodes.length} node(s) need configuration.`);
      return;
    }

    if (nodes.length === 0) {
      alert('Please add some nodes to the workflow first.');
      return;
    }

    const workflow = { nodes, edges };
    console.log('Executing workflow:', workflow);
    
    // TODO: Send to backend for execution
    alert('Workflow execution started! Check console for details.');
  }, [nodes, edges]);

  const handleConfigSave = useCallback((config) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode.id) {
          return {
            ...node,
            data: {
              ...node.data,
              config,
              hasConfig: true,
            },
            style: {
              ...node.style,
              border: `3px solid #10b981`, // Green border when configured
            },
          };
        }
        return node;
      })
    );
  }, [selectedNode, setNodes]);

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      {/* Node Palette Sidebar */}
      <NodeSidebar />

      {/* Main Canvas */}
      <div style={{ flex: 1, width: '100%', height: '100%', position: 'relative' }} ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          onNodeDoubleClick={onNodeDoubleClick}
          onNodesDelete={onNodesDelete}
          nodeTypes={customNodeTypes}
          fitView
          attributionPosition="bottom-right"
          style={{ width: '100%', height: '100%' }}
          defaultEdgeOptions={{
            animated: true,
            style: { stroke: '#3b82f6', strokeWidth: 2 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 20,
              height: 20,
              color: '#3b82f6',
            },
          }}
        >
          <Background color="#aaa" gap={16} />
          <Controls />
          <MiniMap 
            nodeColor={(node) => {
              if (node.data.hasConfig) return '#10b981';
              switch (node.data.type) {
                case 'oracle_query': return '#3b82f6';
                case 'unix_command': return '#10b981';
                case 'llm_analysis': return '#8b5cf6';
                case 'condition': return '#f59e0b';
                default: return '#6b7280';
              }
            }}
          />
          
          <Panel position="top-right">
            <CanvasToolbar 
              onSave={handleSave}
              onClear={handleClear}
              onExecute={handleExecute}
              nodeCount={nodes.length}
            />
          </Panel>

          {/* Empty State */}
          {nodes.length === 0 && (
            <Panel position="top-center">
              <div style={{
                background: 'white',
                padding: '30px',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                textAlign: 'center',
                maxWidth: '500px',
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
                <h2 style={{ margin: '0 0 12px 0', fontSize: '20px' }}>Start Building Your Workflow</h2>
                <p style={{ color: '#6b7280', margin: '0 0 16px 0' }}>
                  Drag nodes from the left sidebar or use the <strong>AI Prompt Builder</strong> to generate workflows automatically
                </p>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                  💡 Tip: Double-click any node to configure its credentials
                </div>
              </div>
            </Panel>
          )}
        </ReactFlow>
      </div>

      {/* Node Properties Panel */}
      {selectedNode && !showConfigModal && (
        <div style={{
          width: '300px',
          borderLeft: '1px solid #ddd',
          background: 'white',
          padding: '20px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Node Details</h3>
          
          <div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Type</div>
            <div style={{
              padding: '8px 12px',
              background: '#f3f4f6',
              borderRadius: '6px',
              fontSize: '14px'
            }}>
              {selectedNode.data.type}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Agent</div>
            <div style={{
              padding: '8px 12px',
              background: '#f3f4f6',
              borderRadius: '6px',
              fontSize: '14px'
            }}>
              {selectedNode.data.agent || 'None'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Status</div>
            <div style={{
              padding: '8px 12px',
              background: selectedNode.data.hasConfig ? '#d1fae5' : '#fee2e2',
              borderRadius: '6px',
              fontSize: '14px',
              color: selectedNode.data.hasConfig ? '#065f46' : '#991b1b',
              fontWeight: '500'
            }}>
              {selectedNode.data.hasConfig ? '✓ Configured' : '⚠ Needs Configuration'}
            </div>
          </div>

          <button
            onClick={() => setShowConfigModal(true)}
            style={{
              marginTop: '12px',
              padding: '12px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '14px'
            }}
          >
            🔧 Configure Node
          </button>

          <button
            onClick={() => {
              setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
              setSelectedNode(null);
            }}
            style={{
              padding: '12px',
              background: '#fee2e2',
              color: '#991b1b',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '14px'
            }}
          >
            🗑️ Delete Node
          </button>
        </div>
      )}

      {/* Configuration Modal */}
      {showConfigModal && selectedNode && (
        <NodeConfigModal
          node={selectedNode}
          onClose={() => setShowConfigModal(false)}
          onSave={handleConfigSave}
        />
      )}
    </div>
  );
};

export default function WorkflowCanvasWrapper(props) {
  return (
    <ReactFlowProvider>
      <WorkflowCanvas {...props} />
    </ReactFlowProvider>
  );
}