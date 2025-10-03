import React from 'react';
import { getInputControls } from '../hooks/useInput';

interface ConnectionStatus {
  status: 'connecting' | 'connected' | 'disconnected';
  ping: number;
  playerId: string | null;
  playerCount: number;
}

interface UIOverlayProps {
  connectionStats: ConnectionStatus;
}

/**
 * UI Overlay component for displaying game information
 * Shows connection status, player count, ping, controls, and game info
 */
const UIOverlay: React.FC<UIOverlayProps> = ({ connectionStats }) => {
  const { status, ping, playerId, playerCount } = connectionStats;
  const inputControls = getInputControls();

  const getStatusColor = () => {
    switch (status) {
      case 'connected': return '#4ade80';
      case 'connecting': return '#fbbf24';
      case 'disconnected': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'connected': return '🟢';
      case 'connecting': return '🟡';
      case 'disconnected': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <div style={{
      position: 'absolute',
      top: 10,
      left: 10,
      zIndex: 100,
      color: 'white',
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      background: 'rgba(0,0,0,0.8)',
      padding: '15px',
      borderRadius: '8px',
      border: '1px solid #333',
      minWidth: '200px'
    }}>
      {/* Connection Status */}
      <div style={{ 
        color: getStatusColor(), 
        marginBottom: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span>{getStatusIcon()}</span>
        <span><strong>Status:</strong> {status}</span>
      </div>

      {/* Game Stats */}
      <div style={{ marginBottom: '8px' }}>
        <div>👥 <strong>Players:</strong> {playerCount}</div>
        <div>🆔 <strong>Your ID:</strong> {playerId?.slice(0, 8) || 'N/A'}</div>
        {status === 'connected' && (
          <div>📡 <strong>Ping:</strong> {ping}ms</div>
        )}
      </div>

      {/* Controls */}
      <div style={{ 
        marginTop: '15px', 
        fontSize: '12px', 
        color: '#cbd5e1',
        borderTop: '1px solid #374151',
        paddingTop: '10px'
      }}>
        <div style={{ marginBottom: '8px' }}>
          <strong>🎮 Controls:</strong>
        </div>
        {inputControls.map((control, index) => (
          <div key={index} style={{ marginBottom: '2px' }}>
            <span style={{ color: '#9ca3af' }}>{control.key}</span> - {control.action}
          </div>
        ))}
      </div>

      {/* Technical Info */}
      <div style={{ 
        marginTop: '10px', 
        fontSize: '11px', 
        color: '#64748b',
        borderTop: '1px solid #374151',
        paddingTop: '8px'
      }}>
        <div>🔬 Server-side physics enabled</div>
        <div>🌐 Authoritative server simulation</div>
        <div>⚡ Real-time multiplayer</div>
      </div>
    </div>
  );
};

export default UIOverlay;