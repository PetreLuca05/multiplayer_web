import React from 'react';
import { OrbitControls, Plane } from '@react-three/drei';
import PlayerCube from './PlayerCube';
import PhysicsDebugRenderer from './PhysicsDebugRenderer';

interface Player {
  id: string;
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  color: string;
  onGround?: boolean;
}

interface PhysicsDebugData {
  enabled: boolean;
  debugData: any[];
}

interface GameState {
  players: Player[];
  timestamp: number;
  playerId?: string;
  physics?: PhysicsDebugData;
}

interface SceneProps {
  gameState: GameState | null;
  localPlayerId: string | null;
  physicsDebugVisible: boolean;
}

/**
 * 3D Scene component - purely visual, no physics
 * Renders the game world, lighting, ground, and all players
 */
const Scene: React.FC<SceneProps> = ({ gameState, localPlayerId, physicsDebugVisible }) => {
  // Find local player for camera targeting
  const localPlayer = gameState?.players.find(p => p.id === localPlayerId);

  return (
    <>
      {/* Lighting setup */}
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={1.0} />
      <directionalLight 
        position={[5, 10, 5]} 
        intensity={0.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      {/* Ground plane - visual only, physics handled on server */}
      <Plane
        args={[100, 100]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.5, 0]}
        receiveShadow
      >
        <meshStandardMaterial 
          color="#2d3748" 
          metalness={0.1}
          roughness={0.9}
        />
      </Plane>

      {/* Grid helper for spatial reference */}
      <gridHelper 
        args={[100, 50, '#4a5568', '#2d3748']} 
        position={[0, -0.49, 0]} 
      />

      {/* Physics Debug Renderer */}
      <PhysicsDebugRenderer 
        physicsData={gameState?.physics || null}
        visible={physicsDebugVisible}
      />

      {/* Render all players based on server physics */}
      {gameState?.players.map((player) => (
        <PlayerCube
          key={player.id}
          player={player}
          isLocalPlayer={player.id === localPlayerId}
        />
      ))}

      {/* Camera controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={50}
        target={localPlayer ? [
          localPlayer.position.x,
          localPlayer.position.y,
          localPlayer.position.z
        ] : [0, 0, 0]}
        enableDamping={true}
        dampingFactor={0.05}
      />

      {/* World boundaries visualization */}
      <group>
        {/* Boundary walls */}
        {[-48, 48].map((x) => (
          <mesh key={`wall-x-${x}`} position={[x, 5, 0]}>
            <boxGeometry args={[1, 10, 100]} />
            <meshStandardMaterial color="#1a202c" transparent opacity={0.3} />
          </mesh>
        ))}
        {[-48, 48].map((z) => (
          <mesh key={`wall-z-${z}`} position={[0, 5, z]}>
            <boxGeometry args={[100, 10, 1]} />
            <meshStandardMaterial color="#1a202c" transparent opacity={0.3} />
          </mesh>
        ))}
      </group>
    </>
  );
};

export default Scene;