const CANNON = require('cannon-es');

/**
 * Physics World Manager
 * Handles the physics simulation, world setup, and physics stepping
 */
class PhysicsWorld {
  constructor() {
    this.world = null;
    this.groundBody = null;
    this.isEnabled = false;
  }

  /**
   * Initialize the physics world with gravity and ground
   */
  initialize() {
    try {
      // Create Cannon.js physics world
      this.world = new CANNON.World({
        gravity: new CANNON.Vec3(0, -9.82, 0)
      });
      
      // Configure world settings
      this.world.broadphase = new CANNON.NaiveBroadphase();
      this.world.solver.iterations = 15; // Increased for more stable physics
      this.world.defaultContactMaterial.friction = 0.9; // Higher friction for less sliding
      this.world.defaultContactMaterial.restitution = 0.1; // Low bounce
      
      // Create ground plane
      this.createGround();
      
      console.log('🔬 Physics world initialized with Cannon.js');
      this.isEnabled = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize physics:', error);
      console.log('⚠️  Running without physics - using basic movement');
      this.isEnabled = false;
      return false;
    }
  }

  /**
   * Create the ground plane for collision
   */
  createGround() {
    const groundShape = new CANNON.Plane();
    this.groundBody = new CANNON.Body({ mass: 0 }); // mass: 0 makes it static
    this.groundBody.addShape(groundShape);
    this.groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(-1, 0, 0), Math.PI * 0.5);
    this.groundBody.position.set(0, -0.5, 0);
    this.world.addBody(this.groundBody);
  }

  /**
   * Step the physics simulation forward
   * @param {number} deltaTime - Time step for physics simulation
   */
  step(deltaTime = 1/60) {
    if (this.world && this.isEnabled) {
      this.world.step(deltaTime);
    }
  }

  /**
   * Add a physics body to the world
   * @param {CANNON.Body} body - The physics body to add
   */
  addBody(body) {
    if (this.world && this.isEnabled) {
      this.world.addBody(body);
    }
  }

  /**
   * Remove a physics body from the world
   * @param {CANNON.Body} body - The physics body to remove
   */
  removeBody(body) {
    if (this.world && this.isEnabled) {
      this.world.removeBody(body);
    }
  }

  /**
   * Get the physics world instance
   * @returns {CANNON.World|null} The physics world
   */
  getWorld() {
    return this.world;
  }

  /**
   * Get debug information about all physics bodies
   * @returns {Array} Array of physics body debug data
   */
  getDebugData() {
    if (!this.world || !this.isEnabled) {
      return [];
    }

    const debugData = [];

    // Add all bodies in the world
    this.world.bodies.forEach((body, index) => {
      const bodyData = {
        id: body.id || index,
        position: {
          x: body.position.x,
          y: body.position.y,
          z: body.position.z
        },
        quaternion: {
          x: body.quaternion.x,
          y: body.quaternion.y,
          z: body.quaternion.z,
          w: body.quaternion.w
        },
        shapes: []
      };

      // Add shape information
      body.shapes.forEach((shape, shapeIndex) => {
        const shapeData = {
          id: shapeIndex,
          type: shape.type,
          material: {
            friction: shape.material?.friction || this.world.defaultContactMaterial.friction,
            restitution: shape.material?.restitution || this.world.defaultContactMaterial.restitution
          }
        };

        // Add shape-specific data
        switch (shape.type) {
          case CANNON.Shape.types.BOX:
            shapeData.halfExtents = {
              x: shape.halfExtents.x,
              y: shape.halfExtents.y,
              z: shape.halfExtents.z
            };
            break;
          case CANNON.Shape.types.PLANE:
            shapeData.normal = {
              x: shape.normal?.x || 0,
              y: shape.normal?.y || 1,
              z: shape.normal?.z || 0
            };
            break;
          case CANNON.Shape.types.SPHERE:
            shapeData.radius = shape.radius;
            break;
        }

        bodyData.shapes.push(shapeData);
      });

      debugData.push(bodyData);
    });

    return debugData;
  }

  /**
   * Check if physics is enabled
   * @returns {boolean} True if physics is enabled
   */
  isPhysicsEnabled() {
    return this.isEnabled;
  }
}

module.exports = PhysicsWorld;