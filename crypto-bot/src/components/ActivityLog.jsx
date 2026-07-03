import React, { useEffect, useRef } from 'react';
import { Terminal, Trash2 } from 'lucide-react';

export default function ActivityLog({ logs, onClear }) {
  const terminalEndRef = useRef(null);

  useEffect(() => {
    // Scroll to bottom whenever logs change
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  return (
    <div className="glass-card glow-cyan-hover" style={{ gridColumn: 'span 2' }}>
      <div className="card-title-container" style={{ marginBottom: '0.8rem' }}>
        <h3 className="card-title font-orbitron">
          <Terminal size={18} className="text-cyan" />
          Bot Action Terminal
        </h3>
        <button 
          onClick={onClear}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
          title="Clear Terminal Logs"
        >
          <Trash2 size={14} />
          Clear Logs
        </button>
      </div>

      <div className="terminal-container">
        <div className="terminal-header">
          <div className="terminal-dots">
            <span className="terminal-dot"></span>
            <span className="terminal-dot"></span>
            <span className="terminal-dot"></span>
          </div>
          <span className="terminal-title font-mono">BARRON_BOT_V1.0.3_STABLE</span>
          <span style={{ width: '30px' }}></span> {/* Spacer */}
        </div>
        <div className="terminal-body font-mono">
          {logs.length === 0 ? (
            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              System idle. Configure triggers and press Start to initialize.
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="terminal-line">
                <span className="terminal-timestamp">[{log.time}]</span>
                <span className={`terminal-text ${log.type}`}>
                  {log.type === 'action' && <span className="tag tag-sell" style={{ marginRight: '6px', fontSize: '0.65rem', padding: '1px 4px' }}>EXEC</span>}
                  {log.type === 'success' && <span className="tag tag-buy" style={{ marginRight: '6px', fontSize: '0.65rem', padding: '1px 4px' }}>OK</span>}
                  {log.text}
                </span>
              </div>
            ))
          )}
          <div ref={terminalEndRef} />
        </div>
      </div>
    </div>
  );
}
