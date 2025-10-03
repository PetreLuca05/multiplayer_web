const CANNON = require('cannon-es');

/**
 * Player Entity Class
 * Represents a player with physics body, input handling, and state management
 */
class Player {
  constructor(id, physicsWorld, x = 0, y = 2, z = 0) {
    this.id = id;
    this.physicsWorld = physicsWorld;
    this.color = this.generateRandomColor();
    this.lastUpdate = Date.now();
    this.onGround = false;
    
    // Input state
    this.input = {
      left: false,
      right: false,
      forward: false,
      backward: false,
      jump: false
    };
    
    // Physics constants
    this.SPEED = 100; // units per second (increased for more responsive movement)
    this.JUMP_FORCE = 8; // jump impulse force
    this.MOVE_FORCE_MULTIPLIER = 8; // Reduced for smoother movement
    this.MAX_HORIZONTAL_SPEED = 6; // Maximum horizontal speed to prevent sliding
    
    // Create physics representation
    this.createPhysicsBody(x, y, z);
  }

  /**
   * Create the physics body for this player
   * @param {number} x - Initial X position
   * @param {number} y - Initial Y position
   * @param {number} z - Initial Z position
   */
  createPhysicsBody(x, y, z) {
    if (!this.physicsWorld.isPhysicsEnabled()) {
      // Fallback: use simple position tracking
      this.position = { x, y, z };
      this.velocity = { x: 0, y: 0, z: 0 };
      return;
    }
    
    // Create Cannon.js physics body
    const shape = new CANNON.Box(new CANNON.Vec3(0.4, 0.9, 0.4)); // Player box shape
    this.body = new CANNON.Body({ 
      mass: 1,
      shape: shape,
      position: new CANNON.Vec3(x, y, z),
      material: new CANNON.Material({ 
        friction: 0.8, 
        restitution: 0.1 
      })
    });
    
    // Set physics properties
    this.body.linearDamping = 0.8; // Increased damping for smoother movement
    this.body.angularDamping = 0.9; // Prevent spinning
    
    // Lock rotation to prevent tumbling - cannon-es way
    this.body.fixedRotation = true;
    this.body.updateMassProperties();
    
    // Alternative method: Set very high rotational inertia
    // this.body.material.friction = 0.8;
    // this.body.material.restitution = 0.1;
    
    // Add to physics world
    this.physicsWorld.addBody(this.body);
    
    // Initialize position and velocity tracking
    this.position = { x, y, z };
    this.velocity = { x: 0, y: 0, z: 0 };
  }

  /**
   * Generate a random color for the player
   * @returns {string} Hex color code
   */
  generateRandomColor() {
    const colors = [
      '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', 
      '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * Update player input state
   * @param {Object} inputData - Input state object
   */
  updateInput(inputData) {
    this.input = { ...this.input, ...inputData };
  }

  /**
   * Update the player's physics and state
   * @param {number} deltaTime - Time elapsed since last update
   */
  update(deltaTime) {
    if (!this.body || !this.physicsWorld.isPhysicsEnabled()) {
      // Fallback: simple movement without physics
      this.updateSimpleMovement(deltaTime);
      return;
    }
    
    // Get current position and velocity from physics body
    const position = this.body.position;
    const velocity = this.body.velocity;
    
    // Update stored position and velocity
    this.position = { x: position.x, y: position.y, z: position.z };
    this.velocity = { x: velocity.x, y: velocity.y, z: velocity.z };
    
    // Check if player is on ground (for jump control)
    this.checkGroundContact();
    
    // Apply movement forces based on input
    this.applyMovementForces();
    
    // Explicitly lock rotation by zeroing angular velocity
    this.body.angularVelocity.set(0, 0, 0);
    
    // Keep player in bounds
    this.applyBoundaryConstraints();
    
    this.lastUpdate = Date.now();
  }

  /**
   * Simple movement without physics (fallback)
   * @param {number} deltaTime - Time elapsed since last update
   */
  updateSimpleMovement(deltaTime) {
    // Calculate target velocity
    const targetVelocity = { x: 0, y: 0, z: 0 };

    if (this.input.left) targetVelocity.x -= this.SPEED;
    if (this.input.right) targetVelocity.x += this.SPEED;
    if (this.input.forward) targetVelocity.z -= this.SPEED;
    if (this.input.backward) targetVelocity.z += this.SPEED;

    // Normalize diagonal movement
    const horizontalLength = Math.sqrt(targetVelocity.x ** 2 + targetVelocity.z ** 2);
    if (horizontalLength > this.SPEED) {
      targetVelocity.x = (targetVelocity.x / horizontalLength) * this.SPEED;
      targetVelocity.z = (targetVelocity.z / horizontalLength) * this.SPEED;
    }

    // Smooth velocity interpolation
    const lerpFactor = 0.15; // Smoothness factor
    this.velocity.x = this.velocity.x + (targetVelocity.x - this.velocity.x) * lerpFactor;
    this.velocity.z = this.velocity.z + (targetVelocity.z - this.velocity.z) * lerpFactor;

    // Update position with smooth velocity
    this.position.x += this.velocity.x * deltaTime;
    this.position.z += this.velocity.z * deltaTime;

    // Simple boundary constraints
    this.position.x = Math.max(-50, Math.min(50, this.position.x));
    this.position.z = Math.max(-50, Math.min(50, this.position.z));
    this.position.y = Math.max(0, this.position.y); // Stay above ground

    this.lastUpdate = Date.now();
  }

  /**
   * Check if player is touching the ground
   */
  checkGroundContact() {
    if (!this.physicsWorld.getWorld() || !this.body) return;
    
    // Simple ground check based on Y position and velocity
    const position = this.body.position;
    const velocity = this.body.velocity;
    
    // Check if player is close to ground level and not moving up rapidly
    this.onGround = position.y <= 1.5 && velocity.y <= 0.5;
  }

  /**
   * Apply movement forces based on current input
   */
  applyMovementForces() {
    if (!this.body) return;
    
    const velocity = this.body.velocity;
    const targetVelocity = new CANNON.Vec3(0, velocity.y, 0); // Keep Y velocity
    
    // Calculate target horizontal velocity based on input
    if (this.input.left) targetVelocity.x -= this.SPEED;
    if (this.input.right) targetVelocity.x += this.SPEED;
    if (this.input.forward) targetVelocity.z -= this.SPEED;
    if (this.input.backward) targetVelocity.z += this.SPEED;
    
    // Normalize diagonal movement
    const horizontalLength = Math.sqrt(targetVelocity.x ** 2 + targetVelocity.z ** 2);
    if (horizontalLength > this.SPEED) {
      targetVelocity.x = (targetVelocity.x / horizontalLength) * this.SPEED;
      targetVelocity.z = (targetVelocity.z / horizontalLength) * this.SPEED;
    }
    
    // Apply smooth velocity changes instead of forces for more responsive movement
    const velocityDiff = new CANNON.Vec3(
      targetVelocity.x - velocity.x,
      0, // Don't interfere with gravity/jumping
      targetVelocity.z - velocity.z
    );
    
    // Apply the velocity difference as an impulse for immediate response
    const impulseStrength = 0.3; // Adjust for smoothness vs responsiveness
    this.body.applyImpulse(velocityDiff.scale(impulseStrength * this.body.mass));
    
    // Jumping
    if (this.input.jump && this.onGround) {
      this.body.velocity.y = this.JUMP_FORCE; // Direct velocity setting for consistent jumps
      this.onGround = false; // Prevent multi-jump
    }
  }

  /**
   * Keep player within world boundaries
   */
  applyBoundaryConstraints() {
    if (!this.body) return;
    
    const position = this.body.position;
    const boundary = 48; // Keep within world bounds
    
    // Check boundaries and reset position if needed
    if (Math.abs(position.x) > boundary || Math.abs(position.z) > boundary || position.y < -10) {
      // Reset to center if out of bounds
      this.body.position.set(0, 5, 0);
      this.body.velocity.set(0, 0, 0);
      this.body.angularVelocity.set(0, 0, 0);
    }
  }

  /**
   * Get the current state of the player for network transmission
   * @returns {Object} Player state object
   */
  getState() {
    return {
      id: this.id,
      position: this.position || { x: 0, y: 0, z: 0 },
      velocity: this.velocity || { x: 0, y: 0, z: 0 },
      color: this.color,
      onGround: this.onGround
    };
  }

  /**
   * Clean up the player's physics body
   */
  destroy() {
    if (this.body && this.physicsWorld) {
      this.physicsWorld.removeBody(this.body);
    }
  }
}

module.exports = Player;