import React from 'react';

interface DebugControlsProps {
  physicsDebugVisible: boolean;
  onTogglePhysicsDebug: (visible: boolean) => void;
  physicsEnabled: boolean;
  bodyCount: number;
}

/**
 * Debug Controls Component
 * Provides UI controls for toggling physics visualization
 */
const DebugControls: React.FC<DebugControlsProps> = ({
  physicsDebugVisible,
  onTogglePhysicsDebug,
  physicsEnabled,
  bodyCount
}) => {
  return (
    <div style={{
      position: 'absolute',
      top: 10,
      right: 10,
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
      <div style={{ marginBottom: '15px' }}>
        <strong>🔧 Debug Controls</strong>
      </div>

      {/* Physics Debug Toggle */}
      <div style={{ marginBottom: '10px' }}>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          gap: '8px'
        }}>
          <input
            type="checkbox"
            checked={physicsDebugVisible}
            onChange={(e) => onTogglePhysicsDebug(e.target.checked)}
            style={{
              width: '16px',
              height: '16px',
              cursor: 'pointer'
            }}
          />
          <span>Show Physics Mesh</span>
        </label>
      </div>

      {/* Physics Status */}
      <div style={{ 
        fontSize: '12px', 
        color: '#cbd5e1',
        borderTop: '1px solid #374151',
        paddingTop: '10px'
      }}>
        <div style={{ marginBottom: '5px' }}>
          <strong>Physics Status:</strong>
        </div>
        <div style={{ 
          color: physicsEnabled ? '#4ade80' : '#ef4444',
          marginBottom: '3px'
        }}>
          ● {physicsEnabled ? 'Enabled' : 'Disabled'}
        </div>
        <div>📦 Bodies: {bodyCount}</div>
        
        {physicsDebugVisible && (
          <div style={{ 
            marginTop: '10px',
            fontSize: '11px',
            color: '#9ca3af'
          }}>
            <div><strong>Legend:</strong></div>
            <div style={{ color: '#ef4444' }}>🔴 Dynamic Bodies</div>
            <div style={{ color: '#4ade80' }}>🟢 Static Bodies</div>
            <div style={{ color: '#3b82f6' }}>🔵 Ground Plane</div>
          </div>
        )}
      </div>

      {/* Keyboard Shortcut */}
      <div style={{
        marginTop: '10px',
        fontSize: '11px',
        color: '#64748b',
        borderTop: '1px solid #374151',
        paddingTop: '8px'
      }}>
        <div>💡 Press 'P' to toggle physics debug</div>
      </div>
    </div>
  );
};

export default DebugControls;