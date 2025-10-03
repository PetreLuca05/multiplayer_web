import { useState, useEffect, useRef } from 'react';
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
  physics?: {
    enabled: boolean;
    debugData: any[];
  };
}

interface InputState {
  left: boolean;
  right: boolean;
  forward: boolean;
  backward: boolean;
  jump: boolean;
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

interface UseSocketProps {
  serverUrl?: string;
}

/**
 * Custom hook for managing Socket.io connection and game state
 * Handles connection, disconnection, game state updates, and input sending
 */
export const useSocket = ({ serverUrl }: UseSocketProps = {}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [localPlayerId, setLocalPlayerId] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [playerCount, setPlayerCount] = useState(0);
  const [ping, setPing] = useState<number>(0);

  // Input throttling to reduce network traffic
  const lastInputSent = useRef<string>('');
  const pingIntervalRef = useRef<number | null>(null);

  // Connect to server
  useEffect(() => {
    const url = serverUrl || import.meta.env.VITE_SERVER_URL || window.location.origin;
    const newSocket = io(url, {
      transports: ['websocket'],
      upgrade: true
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('✅ Connected to server');
      setConnectionStatus('connected');
      
      // Start ping measurement
      pingIntervalRef.current = setInterval(() => {
        const start = Date.now();
        newSocket.emit('ping', start);
      }, 2000);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from server');
      setConnectionStatus('disconnected');
      
      // Clear ping interval
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
    });

    // Ping response
    newSocket.on('pong', (timestamp: number) => {
      setPing(Date.now() - timestamp);
    });

    // Game state events
    newSocket.on('gameState', (state: GameState) => {
      console.log('🎮 Initial game state received:', state);
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

    // Player events
    newSocket.on('playerJoined', (player: Player) => {
      console.log('👤 Player joined:', player.id);
    });

    newSocket.on('playerLeft', (playerId: string) => {
      console.log('👋 Player left:', playerId);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      newSocket.disconnect();
    };
  }, [serverUrl]);

  /**
   * Send input to server with throttling
   */
  const sendInput = (input: InputState) => {
    if (socket && connectionStatus === 'connected') {
      const inputString = JSON.stringify(input);
      if (inputString !== lastInputSent.current) {
        socket.emit('playerInput', input);
        lastInputSent.current = inputString;
      }
    }
  };

  /**
   * Get connection statistics
   */
  const getConnectionStats = () => {
    return {
      status: connectionStatus,
      ping,
      playerId: localPlayerId,
      playerCount
    };
  };

  return {
    socket,
    gameState,
    localPlayerId,
    connectionStatus,
    playerCount,
    ping,
    sendInput,
    getConnectionStats
  };
};