import React, { useState } from 'react';
import { Send } from 'lucide-react';

const ChatWidget = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi! I can help you build pricing workflows. Try asking me to check pricing for a CUSIP or investigate failed jobs.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.response },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      background: '#f9fafb',
    }}>
      <div style={{
        padding: '15px',
        borderBottom: '1px solid #e5e7eb',
        background: 'white',
      }}>
        <h3 style={{ margin: 0, fontSize: '16px' }}>💬 AI Assistant</h3>
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
      }}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
            }}
          >
            <div style={{
              padding: '12px 16px',
              borderRadius: '12px',
              background: msg.role === 'user' ? '#3b82f6' : 'white',
              color: msg.role === 'user' ? 'white' : '#1f2937',
              border: msg.role === 'user' ? 'none' : '1px solid #e5e7eb',
              fontSize: '14px',
              lineHeight: '1.5',
            }}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{
            alignSelf: 'flex-start',
            padding: '12px 16px',
            borderRadius: '12px',
            background: 'white',
            border: '1px solid #e5e7eb',
          }}>
            <span>Thinking...</span>
          </div>
        )}
      </div>

      <div style={{
        padding: '15px',
        borderTop: '1px solid #e5e7eb',
        background: 'white',
      }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about pricing workflows..."
            style={{
              flex: 1,
              padding: '10px 15px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              fontSize: '14px',
              outline: 'none',
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            style={{
              padding: '10px 15px',
              borderRadius: '8px',
              border: 'none',
              background: input.trim() && !loading ? '#3b82f6' : '#e5e7eb',
              color: 'white',
              cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWidget;
