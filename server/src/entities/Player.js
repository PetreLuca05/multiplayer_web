const CANNON = require('cannon-es');

class Player {
  constructor(id, physicsWorld, x = 0, y = 2, z = 0) {
    this.id = id;
    this.physicsWorld = physicsWorld;
    this.color = this.generateRandomColor();
    this.lastUpdate = Date.now();
    this.onGround = false;

    // Input
    this.input = { left: false, right: false, forward: false, backward: false, jump: false };

    let xxxx = 150;

    this.SPEED = 16.0 * xxxx;              // very high top horizontal speed
    this.MAX_HORIZONTAL_SPEED = 18.0 * xxxx; // small buffer above top speed
    this.ACCELERATION = 19.0 * xxxx;       // quick ground acceleration
    this.AIR_ACCELERATION = 1.4;   // decent air control
    this.JUMP_FORCE = 1.3;         // powerful jump
    this.LINEAR_DAMPING = 0.18;     // less resistance for faster feel
    this.FLOATINESS = 0.35;         // 0.3–0.5 = floatier, more hang time
    this.VELOCITY_LERP = 18.0;      // smoother simple movement fallback

    // Create physics body
    this.createPhysicsBody(x, y, z);
  }

  createPhysicsBody(x, y, z) {
    if (!this.physicsWorld.isPhysicsEnabled()) {
      this.position = { x, y, z };
      this.velocity = { x: 0, y: 0, z: 0 };
      return;
    }

    const shape = new CANNON.Box(new CANNON.Vec3(0.4, 0.9, 0.4));
    const mat = new CANNON.Material({ friction: 0.0, restitution: 0.0 });
    this.body = new CANNON.Body({
      mass: 1,
      shape,
      position: new CANNON.Vec3(x, y, z),
      material: mat,
      fixedRotation: true
    });

    this.body.linearDamping = this.LINEAR_DAMPING;
    this.body.angularDamping = 1.0;
    this.body.angularFactor = new CANNON.Vec3(0, 0, 0);
    this.body.allowSleep = false;
    this.physicsWorld.addBody(this.body);

    this.position = { x, y, z };
    this.velocity = { x: 0, y: 0, z: 0 };
  }

  generateRandomColor() {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  updateInput(inputData) {
    this.input = { ...this.input, ...inputData };
  }

  /**
   * deltaTime can be seconds or ms; this normalizes to seconds.
   */
  update(deltaTime) {
    if (typeof deltaTime !== 'number') deltaTime = (Date.now() - this.lastUpdate) / 1000;
    // If delta looks like ms (>0.1), convert to seconds
    if (deltaTime > 0.1) deltaTime = deltaTime / 1000;

    if (!this.body || !this.physicsWorld.isPhysicsEnabled()) {
      this.updateSimpleMovement(deltaTime);
      this.lastUpdate = Date.now();
      return;
    }

    // sync stored pos/vel
    const pos = this.body.position;
    const vel = this.body.velocity;
    this.position = { x: pos.x, y: pos.y, z: pos.z };
    this.velocity = { x: vel.x, y: vel.y, z: vel.z };

    // ground check
    this.checkGroundContact();

    // movement
    this.applyMovementForces(deltaTime);

    // apply floatiness (small upward force while in air to soften gravity)
    if (!this.onGround && this.FLOATINESS > 0) {
      const world = this.physicsWorld.getWorld && this.physicsWorld.getWorld();
      if (world && world.gravity) {
        // world.gravity is Vec3, typically (0, -9.82, 0)
        // Apply upward force equal to a fraction of gravity * mass
        const gravityY = world.gravity.y; // negative
        // upward force = mass * -gravityY * FLOATINESS
        const upForce = this.body.mass * (-gravityY) * this.FLOATINESS;
        this.body.applyForce(new CANNON.Vec3(0, upForce, 0));
      }
    }

    // stop rotation and enforce bounds
    this.body.angularVelocity.x = 0;
    this.body.angularVelocity.z = 0;
    this.applyBoundaryConstraints();

    this.lastUpdate = Date.now();
  }

  updateSimpleMovement(deltaTime) {
    // expect seconds
    if (deltaTime > 0.1) deltaTime = deltaTime / 1000;
    let targetX = 0, targetZ = 0;
    if (this.input.left) targetX -= this.SPEED;
    if (this.input.right) targetX += this.SPEED;
    if (this.input.forward) targetZ -= this.SPEED;
    if (this.input.backward) targetZ += this.SPEED;

    // normalize diagonal
    const len = Math.hypot(targetX, targetZ);
    if (len > this.SPEED) {
      targetX = (targetX / len) * this.SPEED;
      targetZ = (targetZ / len) * this.SPEED;
    }

    const lerp = Math.min(1, this.VELOCITY_LERP * deltaTime);
    this.velocity.x += (targetX - this.velocity.x) * lerp;
    this.velocity.z += (targetZ - this.velocity.z) * lerp;

    this.position.x += this.velocity.x * deltaTime;
    this.position.z += this.velocity.z * deltaTime;

    // bounds
    this.position.x = Math.max(-50, Math.min(50, this.position.x));
    this.position.z = Math.max(-50, Math.min(50, this.position.z));
    this.position.y = Math.max(0, this.position.y);
  }

  checkGroundContact() {
    if (!this.physicsWorld.getWorld || !this.body) return;
    const world = this.physicsWorld.getWorld();
    const p = this.body.position;
    const start = new CANNON.Vec3(p.x, p.y, p.z);
    const end = new CANNON.Vec3(p.x, p.y - 1.05, p.z);
    const result = new CANNON.RaycastResult();
    world.raycastClosest(start, end, {}, result);
    this.onGround = result.hasHit && result.distance < 1.01;
  }

  applyMovementForces(deltaTime) {
    if (!this.body) return;

    // build target velocity
    let targetX = 0, targetZ = 0;
    if (this.input.left) targetX -= this.SPEED;
    if (this.input.right) targetX += this.SPEED;
    if (this.input.forward) targetZ -= this.SPEED;
    if (this.input.backward) targetZ += this.SPEED;

    const hLen = Math.hypot(targetX, targetZ);
    if (hLen > this.SPEED) {
      targetX = (targetX / hLen) * this.SPEED;
      targetZ = (targetZ / hLen) * this.SPEED;
    }

    const vel = this.body.velocity;

    if (this.onGround) {
      // smooth lerp to target velocity (frame-rate independent)
      const lerp = Math.min(1, this.ACCELERATION * deltaTime);
      vel.x += (targetX - vel.x) * lerp;
      vel.z += (targetZ - vel.z) * lerp;

      // clamp horizontal
      const hv = Math.hypot(vel.x, vel.z);
      if (hv > this.MAX_HORIZONTAL_SPEED) {
        const s = this.MAX_HORIZONTAL_SPEED / hv;
        vel.x *= s;
        vel.z *= s;
      }

      // jump
      if (this.input.jump && this.onGround) {
        vel.y = this.JUMP_FORCE;
        this.onGround = false;
      }

    } else {
      // in-air: apply smaller forces for floaty control
      const desiredX = (targetX - vel.x);
      const desiredZ = (targetZ - vel.z);

      // scale desired change to a force (mass ~1)
      const forceX = desiredX * this.AIR_ACCELERATION * this.body.mass;
      const forceZ = desiredZ * this.AIR_ACCELERATION * this.body.mass;
      const f = new CANNON.Vec3(forceX, 0, forceZ);
      this.body.applyForce(f);

      // gentle clamp so player doesn't rocket horizontally in mid-air
      const hv = Math.hypot(vel.x, vel.z);
      if (hv > this.MAX_HORIZONTAL_SPEED * 1.4) {
        const s = (this.MAX_HORIZONTAL_SPEED * 1.4) / hv;
        vel.x *= s;
        vel.z *= s;
      }
    }
  }

  applyBoundaryConstraints() {
    if (!this.body) return;
    const p = this.body.position;
    const boundary = 48;
    if (Math.abs(p.x) > boundary || Math.abs(p.z) > boundary || p.y < -10) {
      this.body.position.set(0, 5, 0);
      this.body.velocity.set(0, 0, 0);
      this.body.angularVelocity.set(0, 0, 0);
    }
  }

  getState() {
    return {
      id: this.id,
      position: this.position || { x: 0, y: 0, z: 0 },
      velocity: this.velocity || { x: 0, y: 0, z: 0 },
      color: this.color,
      onGround: this.onGround
    };
  }

  destroy() {
    if (this.body && this.physicsWorld) this.physicsWorld.removeBody(this.body);
  }
}

module.exports = Player;
