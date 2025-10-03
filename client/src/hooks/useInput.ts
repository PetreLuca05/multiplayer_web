import { useEffect, useRef } from 'react';

interface InputState {
  left: boolean;
  right: boolean;
  forward: boolean;
  backward: boolean;
  jump: boolean;
}

interface UseInputProps {
  onInputChange: (input: InputState) => void;
  onTogglePhysicsDebug?: () => void;
}

/**
 * Custom hook for handling keyboard input
 * Manages WASD movement and space bar jumping
 */
export const useInput = ({ onInputChange, onTogglePhysicsDebug }: UseInputProps) => {
  const inputRef = useRef<InputState>({
    left: false,
    right: false,
    forward: false,
    backward: false,
    jump: false
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      let inputChanged = false;

      switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
          if (!inputRef.current.forward) {
            inputRef.current.forward = true;
            inputChanged = true;
          }
          break;
        case 'KeyS':
        case 'ArrowDown':
          if (!inputRef.current.backward) {
            inputRef.current.backward = true;
            inputChanged = true;
          }
          break;
        case 'KeyA':
        case 'ArrowLeft':
          if (!inputRef.current.left) {
            inputRef.current.left = true;
            inputChanged = true;
          }
          break;
        case 'KeyD':
        case 'ArrowRight':
          if (!inputRef.current.right) {
            inputRef.current.right = true;
            inputChanged = true;
          }
          break;
        case 'Space':
          event.preventDefault(); // Prevent page scroll
          if (!inputRef.current.jump) {
            inputRef.current.jump = true;
            inputChanged = true;
          }
          break;
        case 'KeyP':
          // Toggle physics debug
          if (onTogglePhysicsDebug) {
            onTogglePhysicsDebug();
          }
          break;
      }

      if (inputChanged) {
        onInputChange({ ...inputRef.current });
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      let inputChanged = false;

      switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
          if (inputRef.current.forward) {
            inputRef.current.forward = false;
            inputChanged = true;
          }
          break;
        case 'KeyS':
        case 'ArrowDown':
          if (inputRef.current.backward) {
            inputRef.current.backward = false;
            inputChanged = true;
          }
          break;
        case 'KeyA':
        case 'ArrowLeft':
          if (inputRef.current.left) {
            inputRef.current.left = false;
            inputChanged = true;
          }
          break;
        case 'KeyD':
        case 'ArrowRight':
          if (inputRef.current.right) {
            inputRef.current.right = false;
            inputChanged = true;
          }
          break;
        case 'Space':
          if (inputRef.current.jump) {
            inputRef.current.jump = false;
            inputChanged = true;
          }
          break;
      }

      if (inputChanged) {
        onInputChange({ ...inputRef.current });
      }
    };

    // Add event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onInputChange]);

  return inputRef.current;
};

/**
 * Get input control descriptions for UI display
 */
export const getInputControls = () => {
  return [
    { key: 'WASD / Arrow Keys', action: 'Move' },
    { key: 'SPACE', action: 'Jump' },
    { key: 'Mouse', action: 'Rotate camera' },
    { key: 'Scroll', action: 'Zoom' }
  ];
};