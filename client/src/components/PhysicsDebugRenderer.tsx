import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface PhysicsBodyDebugData {
  id: string | number;
  position: { x: number; y: number; z: number };
  quaternion: { x: number; y: number; z: number; w: number };
  shapes: Array<{
    id: number;
    type: number;
    halfExtents?: { x: number; y: number; z: number };
    normal?: { x: number; y: number; z: number };
    radius?: number;
    material: {
      friction: number;
      restitution: number;
    };
  }>;
}

interface PhysicsDebugData {
  enabled: boolean;
  debugData: PhysicsBodyDebugData[];
}

interface PhysicsDebugRendererProps {
  physicsData: PhysicsDebugData | null;
  visible: boolean;
}

// Shape type constants (matching Cannon.js)
const SHAPE_TYPES = {
  SPHERE: 1,
  PLANE: 2,
  BOX: 4,
  COMPOUND: 8,
  CONVEXPOLYHEDRON: 16,
  HEIGHTFIELD: 32,
  PARTICLE: 64,
  CYLINDER: 128,
  TRIMESH: 256
};

/**
 * Physics Debug Renderer Component
 * Visualizes physics bodies and collision shapes
 */
const PhysicsDebugRenderer: React.FC<PhysicsDebugRendererProps> = ({ 
  physicsData, 
  visible 
}) => {
  const groupRef = useRef<THREE.Group>(null);

  // Create wireframe materials for different body types
  const materials = {
    static: new THREE.MeshBasicMaterial({ 
      color: 0x00ff00, 
      wireframe: true, 
      transparent: true, 
      opacity: 0.6 
    }),
    dynamic: new THREE.MeshBasicMaterial({ 
      color: 0xff0000, 
      wireframe: true, 
      transparent: true, 
      opacity: 0.8 
    }),
    ground: new THREE.MeshBasicMaterial({ 
      color: 0x0000ff, 
      wireframe: true, 
      transparent: true, 
      opacity: 0.4 
    })
  };

  // Update debug meshes when physics data changes
  useEffect(() => {
    if (!groupRef.current || !physicsData?.debugData) return;

    // Clear existing meshes
    while (groupRef.current.children.length > 0) {
      const child = groupRef.current.children[0];
      groupRef.current.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
      }
    }

    if (!visible) return;

    // Create debug meshes for each physics body
    physicsData.debugData.forEach((body) => {
      body.shapes.forEach((shape) => {
        let geometry: THREE.BufferGeometry | null = null;
        let material = materials.dynamic;

        // Determine material based on body type
        if (body.position.y < -0.4) {
          material = materials.ground; // Ground body
        } else if (shape.material.friction > 0.8) {
          material = materials.static; // Static body
        }

        // Create geometry based on shape type
        switch (shape.type) {
          case SHAPE_TYPES.BOX:
            if (shape.halfExtents) {
              geometry = new THREE.BoxGeometry(
                shape.halfExtents.x * 2,
                shape.halfExtents.y * 2,
                shape.halfExtents.z * 2
              );
            }
            break;

          case SHAPE_TYPES.SPHERE:
            if (shape.radius) {
              geometry = new THREE.SphereGeometry(shape.radius, 8, 6);
            }
            break;

          case SHAPE_TYPES.PLANE:
            geometry = new THREE.PlaneGeometry(100, 100, 10, 10);
            break;

          default:
            // Fallback to a small sphere for unknown shapes
            geometry = new THREE.SphereGeometry(0.1, 4, 3);
            break;
        }

        if (geometry) {
          const mesh = new THREE.Mesh(geometry, material);
          
          // Set position
          mesh.position.set(
            body.position.x,
            body.position.y,
            body.position.z
          );

          // Set rotation from quaternion
          mesh.quaternion.set(
            body.quaternion.x,
            body.quaternion.y,
            body.quaternion.z,
            body.quaternion.w
          );

          // Add to group
          groupRef.current?.add(mesh);
        }
      });
    });
  }, [physicsData, visible]);

  // Handle visibility changes
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.visible = visible && !!physicsData?.enabled;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Debug info text */}
      {visible && physicsData?.enabled && (
        <mesh position={[0, 10, 0]}>
          <planeGeometry args={[8, 2]} />
          <meshBasicMaterial 
            color={0x000000} 
            transparent 
            opacity={0.7} 
          />
        </mesh>
      )}
    </group>
  );
};

export default PhysicsDebugRenderer;