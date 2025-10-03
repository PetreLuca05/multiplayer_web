import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import Scene from './components/Scene';
import UIOverlay from './components/UIOverlay';
import DebugControls from './components/DebugControls';
import { useSocket } from './hooks/useSocket';
import { useInput } from './hooks/useInput';

/**
 * Main Multiplayer Game Component
 * Orchestrates the entire game: networking, input, rendering, and UI
 * Uses server-side authoritative physics with client-side rendering
 */
const MultiplayerGame: React.FC = () => {
  // Initialize socket connection and game state
  const {
    gameState,
    localPlayerId,
    connectionStatus,
    sendInput,
    getConnectionStats
  } = useSocket();

  // Physics debug state
  const [physicsDebugVisible, setPhysicsDebugVisible] = useState(false);

  // Handle keyboard input and send to server
  useInput({
    onInputChange: sendInput,
    onTogglePhysicsDebug: () => setPhysicsDebugVisible(prev => !prev)
  });

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      background: '#0a0a0a',
      overflow: 'hidden'
    }}>
      {/* Game Information Overlay */}
      <UIOverlay connectionStats={getConnectionStats()} />

      {/* Debug Controls */}
      <DebugControls
        physicsDebugVisible={physicsDebugVisible}
        onTogglePhysicsDebug={setPhysicsDebugVisible}
        physicsEnabled={gameState?.physics?.enabled || false}
        bodyCount={gameState?.physics?.debugData?.length || 0}
      />

      {/* 3D Game World */}
      <Canvas
        camera={{
          position: [10, 10, 10],
          fov: 75,
          near: 0.1,
          far: 1000
        }}
        style={{ 
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          cursor: 'grab'
        }}
        onMouseDown={(e) => {
          if (e.target) {
            (e.target as HTMLCanvasElement).style.cursor = 'grabbing';
          }
        }}
        onMouseUp={(e) => {
          if (e.target) {
            (e.target as HTMLCanvasElement).style.cursor = 'grab';
          }
        }}
      >
        <Scene 
          gameState={gameState} 
          localPlayerId={localPlayerId} 
          physicsDebugVisible={physicsDebugVisible}
        />
      </Canvas>

      {/* Connection Lost Overlay */}
      {connectionStatus === 'disconnected' && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'white',
          background: 'rgba(239,68,68,0.95)',
          padding: '30px',
          borderRadius: '12px',
          textAlign: 'center',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          border: '2px solid #dc2626',
          zIndex: 1000
        }}>
          <h2 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>
            🔌 Connection Lost
          </h2>
          <p style={{ margin: '0 0 15px 0', fontSize: '16px' }}>
            Lost connection to the game server
          </p>
          <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
            Please check if the server is running on port 3001
          </p>
          <div style={{ 
            marginTop: '20px', 
            fontSize: '12px', 
            color: '#fecaca' 
          }}>
            Attempting to reconnect...
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {connectionStatus === 'connecting' && !gameState && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'white',
          background: 'rgba(59,130,246,0.9)',
          padding: '30px',
          borderRadius: '12px',
          textAlign: 'center',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          border: '2px solid #3b82f6',
          zIndex: 1000
        }}>
          <h2 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>
            � Connecting...
          </h2>
          <p style={{ margin: 0, fontSize: '16px' }}>
            Establishing connection to game server
          </p>
          <div style={{ 
            marginTop: '20px',
            fontSize: '12px',
            color: '#dbeafe'
          }}>
            Please wait while we connect you to the multiplayer world
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiplayerGame;