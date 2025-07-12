import React, { useState } from 'react';

type DebugPanelMiniProps = {
  status: string;
  confidence: number;
  token?: string;
};

const getStatusColor = (status: string) => {
  if (/success|verified|valid|ok/i.test(status)) return '#22c55e'; // green
  if (/wait|pending|idle/i.test(status)) return '#eab308'; // yellow
  if (/fail|error|expired|invalid/i.test(status)) return '#ef4444'; // red
  return '#38bdf8'; // blue/info
};

export const DebugPanelMini: React.FC<DebugPanelMiniProps> = ({ status, confidence, token }) => {
  const [copied, setCopied] = useState(false);
  const displayToken = token && token.length > 16
    ? token.slice(0, 8) + '...' + token.slice(-6)
    : token;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 1000,
        background: 'rgba(20,22,30,0.98)',
        color: '#e5e7eb',
        padding: '1rem 1.25rem',
        fontSize: '13px',
        fontFamily: 'Menlo, Monaco, Consolas, monospace',
        borderRadius: '10px',
        boxShadow: '0 4px 24px 0 rgba(0,0,0,0.18)',
        minWidth: 220,
        maxWidth: 340,
        border: '1px solid #222',
        opacity: 1,
        transition: 'opacity 0.3s',
        pointerEvents: 'auto',
        userSelect: 'text',
      }}
    >
      <div style={{ marginBottom: 6 }}>
        <span style={{ fontWeight: 700, color: '#a3a3a3' }}>Status:</span>{' '}
        <span style={{ fontWeight: 700, color: getStatusColor(status) }}>{status}</span>
      </div>
      <div style={{ marginBottom: 6 }}>
        <span style={{ fontWeight: 700, color: '#a3a3a3' }}>Confidence:</span>{' '}
        <span style={{ fontWeight: 700 }}>{confidence.toFixed(2)}</span>
      </div>
      {token && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 700, color: '#a3a3a3' }}>Token:</span>
          <span
            style={{
              fontFamily: 'inherit',
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: 140,
              background: '#23272e',
              borderRadius: 4,
              padding: '2px 6px',
              color: '#e5e7eb',
            }}
            title={token}
          >
            {displayToken}
          </span>
          <button
            style={{
              background: copied ? '#22c55e' : '#23272e',
              color: copied ? '#fff' : '#a3a3a3',
              border: 'none',
              borderRadius: 4,
              padding: '2px 8px',
              fontSize: 12,
              fontFamily: 'inherit',
              cursor: 'pointer',
              marginLeft: 2,
              transition: 'background 0.2s, color 0.2s',
            }}
            onClick={() => {
              navigator.clipboard.writeText(token);
              setCopied(true);
              setTimeout(() => setCopied(false), 1200);
            }}
            title="Copy token"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}
    </div>
  );
}; 