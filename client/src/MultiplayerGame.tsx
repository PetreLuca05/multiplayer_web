import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Box, Plane } from '@react-three/drei';
import * as THREE from 'three';
import { io, Socket } from 'socket.io-client';

interface Player {
  id: string;
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  color: string;
  onGround?: boolean;
}

interface GameState {
  players: Player[];
  timestamp: number;
  playerId?: string;
}

interface PlayerCubeProps {
  player: Player;
  isLocalPlayer: boolean;
}

// Individual player cube component
const PlayerCube: React.FC<PlayerCubeProps> = ({ player, isLocalPlayer }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [targetPosition, setTargetPosition] = useState(player.position);

  useEffect(() => {
    setTargetPosition(player.position);
  }, [player.position]);

  useFrame(() => {
    if (meshRef.current && !isLocalPlayer) {
      // Smooth interpolation for remote players
      meshRef.current.position.lerp(
        new THREE.Vector3(targetPosition.x, targetPosition.y, targetPosition.z),
        0.1
      );
    } else if (meshRef.current && isLocalPlayer) {
      // Direct position update for local player
      meshRef.current.position.set(
        targetPosition.x,
        targetPosition.y,
        targetPosition.z
      );
    }
  });

  return (
    <group>
      <Box
        ref={meshRef}
        position={[player.position.x, player.position.y, player.position.z]}
        args={[1, 1, 1]}
      >
        <meshStandardMaterial color={player.color} />
      </Box>
      {/* Player name tag */}
      <Text
        position={[player.position.x, player.position.y + 1.5, player.position.z]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {isLocalPlayer ? 'You' : `Player ${player.id.slice(0, 6)}`}
      </Text>
    </group>
  );
};

// Scene setup component
const Scene: React.FC<{ gameState: GameState | null; localPlayerId: string | null }> = ({ 
  gameState, 
  localPlayerId 
}) => {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={0.8} />
      <directionalLight position={[5, 10, 5]} intensity={0.5} />

      {/* Ground plane */}
      <Plane
        args={[100, 100]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.5, 0]}
      >
        <meshStandardMaterial color="#4a5568" />
      </Plane>

      {/* Grid helper */}
      <gridHelper args={[100, 50, '#718096', '#4a5568']} position={[0, -0.49, 0]} />

      {/* Render all players */}
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
        target={[0, 0, 0]}
      />
    </>
  );
};

// Main game component
const MultiplayerGame: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [localPlayerId, setLocalPlayerId] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [playerCount, setPlayerCount] = useState(0);

  // Input state
  const [input, setInput] = useState({
    left: false,
    right: false,
    forward: false,
    backward: false,
    jump: false
  });

  // Connect to server
  useEffect(() => {
    const serverUrl = import.meta.env.VITE_SERVER_URL || window.location.origin;
    const newSocket = io(serverUrl, {
      transports: ['websocket'],
      upgrade: true
    });

    newSocket.on('connect', () => {
      console.log('Connected to server');
      setConnectionStatus('connected');
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnectionStatus('disconnected');
    });

    newSocket.on('gameState', (state: GameState) => {
      console.log('Initial game state received:', state);
      setGameState(state);
      if (state.playerId) {
        setLocalPlayerId(state.playerId);
      }
      setPlayerCount(state.players.length);
    });

    newSocket.on('gameUpdate', (state: GameState) => {
      setGameState(state);
      setPlayerCount(state.players.length);
    });

    newSocket.on('playerJoined', (player: Player) => {
      console.log('Player joined:', player.id);
    });

    newSocket.on('playerLeft', (playerId: string) => {
      console.log('Player left:', playerId);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
          setInput(prev => ({ ...prev, forward: true }));
          break;
        case 'KeyS':
        case 'ArrowDown':
          setInput(prev => ({ ...prev, backward: true }));
          break;
        case 'KeyA':
        case 'ArrowLeft':
          setInput(prev => ({ ...prev, left: true }));
          break;
        case 'KeyD':
        case 'ArrowRight':
          setInput(prev => ({ ...prev, right: true }));
          break;
        case 'Space':
          event.preventDefault(); // Prevent page scroll
          setInput(prev => ({ ...prev, jump: true }));
          break;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
          setInput(prev => ({ ...prev, forward: false }));
          break;
        case 'KeyS':
        case 'ArrowDown':
          setInput(prev => ({ ...prev, backward: false }));
          break;
        case 'KeyA':
        case 'ArrowLeft':
          setInput(prev => ({ ...prev, left: false }));
          break;
        case 'KeyD':
        case 'ArrowRight':
          setInput(prev => ({ ...prev, right: false }));
          break;
        case 'Space':
          setInput(prev => ({ ...prev, jump: false }));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Send input to server
  useEffect(() => {
    if (socket && connectionStatus === 'connected') {
      socket.emit('playerInput', input);
    }
  }, [input, socket, connectionStatus]);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#1a1a1a' }}>
      {/* UI Overlay */}
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        zIndex: 100,
        color: 'white',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        background: 'rgba(0,0,0,0.7)',
        padding: '10px',
        borderRadius: '5px'
      }}>
        <div>Status: {connectionStatus}</div>
        <div>Players: {playerCount}</div>
        <div>Your ID: {localPlayerId?.slice(0, 8) || 'N/A'}</div>
        <div style={{ marginTop: '10px', fontSize: '12px' }}>
          <div>Controls:</div>
          <div>WASD or Arrow Keys to move</div>
          <div>SPACE to jump</div>
          <div>Mouse to rotate camera</div>
          <div>Scroll to zoom</div>
        </div>
      </div>

      {/* Three.js Canvas */}
      <Canvas
        camera={{
          position: [10, 10, 10],
          fov: 75,
          near: 0.1,
          far: 1000
        }}
        style={{ background: '#0f0f0f' }}
      >
        <Scene gameState={gameState} localPlayerId={localPlayerId} />
      </Canvas>

      {/* Connection indicator */}
      {connectionStatus === 'disconnected' && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'white',
          background: 'rgba(255,0,0,0.8)',
          padding: '20px',
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <h2>Disconnected from server</h2>
          <p>Please check if the server is running on port 3001</p>
        </div>
      )}
    </div>
  );
};

export default MultiplayerGame;