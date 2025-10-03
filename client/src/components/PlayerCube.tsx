import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Box } from '@react-three/drei';
import * as THREE from 'three';

interface Player {
  id: string;
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  color: string;
  onGround?: boolean;
}

interface PlayerCubeProps {
  player: Player;
  isLocalPlayer: boolean;
}

/**
 * Individual player cube component - purely visual, no local physics
 * Renders a player with smooth interpolation and name tag
 */
const PlayerCube: React.FC<PlayerCubeProps> = ({ player, isLocalPlayer }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [currentPosition, setCurrentPosition] = useState(player.position);
  const [targetPosition, setTargetPosition] = useState(player.position);

  // Update target position when server sends new data
  useEffect(() => {
    setTargetPosition(player.position);
  }, [player.position]);

  // Smooth interpolation animation
  useFrame(() => {
    if (meshRef.current) {
      // Server is authoritative, so we always interpolate to server position
      const lerpFactor = isLocalPlayer ? 0.25 : 0.12; // Smoother interpolation
      
      // Smooth interpolation using lerp
      currentPosition.x = THREE.MathUtils.lerp(currentPosition.x, targetPosition.x, lerpFactor);
      currentPosition.y = THREE.MathUtils.lerp(currentPosition.y, targetPosition.y, lerpFactor);
      currentPosition.z = THREE.MathUtils.lerp(currentPosition.z, targetPosition.z, lerpFactor);
      
      // Apply position to mesh
      meshRef.current.position.set(currentPosition.x, currentPosition.y, currentPosition.z);
      setCurrentPosition({ ...currentPosition });
    }
  });

  return (
    <group>
      {/* Player cube */}
      <Box
        ref={meshRef}
        args={[0.8, 1.8, 0.8]} // Match server physics box size
      >
        <meshStandardMaterial 
          color={player.color} 
          metalness={0.1}
          roughness={0.8}
        />
      </Box>
      
      {/* Player name tag */}
      <Text
        position={[currentPosition.x, currentPosition.y + 1.5, currentPosition.z]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {isLocalPlayer ? 'You' : `Player ${player.id.slice(0, 6)}`}
      </Text>
      
      {/* Visual indicator for local player */}
      {isLocalPlayer && (
        <mesh position={[currentPosition.x, currentPosition.y + 2.2, currentPosition.z]}>
          <coneGeometry args={[0.1, 0.3, 4]} />
          <meshBasicMaterial color="#00ff00" />
        </mesh>
      )}
    </group>
  );
};

export default PlayerCube;