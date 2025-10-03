const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

// Import Rapier.js with async initialization
let RAPIER;

const app = express();
const server = http.createServer(app);

// Configure CORS for Socket.io
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173", // Vite default port
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Enable CORS for Express
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

// Serve static files in production
app.use(express.static(path.join(__dirname, '../client/dist')));

// Initialize physics world
let world;
let groundBody;

async function initPhysics() {
  try {
    // Try to import Rapier.js
    RAPIER = require('@dimforge/rapier3d');
    await RAPIER.init();
    
    // Create physics world with gravity
    let gravity = { x: 0.0, y: -9.81, z: 0.0 };
    world = new RAPIER.World(gravity);
    
    // Create ground
    let groundColliderDesc = RAPIER.ColliderDesc.cuboid(50.0, 0.1, 50.0);
    groundBody = world.createCollider(groundColliderDesc);
    groundBody.setTranslation({ x: 0.0, y: -0.5, z: 0.0 });
    
    console.log('🔬 Physics world initialized with Rapier.js');
  } catch (error) {
    console.error('Failed to initialize physics:', error);
    console.log('⚠️  Running without physics - using basic movement');
    // Set a flag to disable physics
    global.physicsEnabled = false;
  }
}

// Game state
const players = new Map();
const TICK_RATE = 60; // 60 ticks per second
const TICK_INTERVAL = 1000 / TICK_RATE;
const PLAYER_SPEED = 5; // units per second
const JUMP_FORCE = 8; // jump impulse force

// Player class with physics
class Player {
  constructor(id, x = 0, y = 2, z = 0) {
    this.id = id;
    this.input = { left: false, right: false, forward: false, backward: false, jump: false };
    this.color = this.generateRandomColor();
    this.lastUpdate = Date.now();
    this.onGround = false;
    
    // Create physics body
    this.createPhysicsBody(x, y, z);
  }

  createPhysicsBody(x, y, z) {
    if (!world || !RAPIER || global.physicsEnabled === false) {
      // Fallback: use simple position tracking
      this.position = { x, y, z };
      this.velocity = { x: 0, y: 0, z: 0 };
      return;
    }
    
    // Create rigid body
    let rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(x, y, z)
      .setCanSleep(false); // Keep active for responsive controls
    
    this.rigidBody = world.createRigidBody(rigidBodyDesc);
    
    // Create collider (box shape for player)
    let colliderDesc = RAPIER.ColliderDesc.cuboid(0.4, 0.9, 0.4)
      .setRestitution(0.1) // Slight bounce
      .setFriction(0.8); // Good grip
    
    this.collider = world.createCollider(colliderDesc, this.rigidBody);
    
    // Set physics properties
    this.rigidBody.setLinearDamping(5.0); // Air resistance
    this.rigidBody.setAngularDamping(10.0); // Prevent spinning
    
    // Lock rotation to prevent tumbling
    this.rigidBody.lockRotations(true, true, true);
  }

  generateRandomColor() {
    const colors = [
      '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', 
      '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  update(deltaTime) {
    if (!this.rigidBody || global.physicsEnabled === false) {
      // Fallback: simple movement without physics
      this.updateSimpleMovement(deltaTime);
      return;
    }
    
    // Get current position and velocity from physics body
    const position = this.rigidBody.translation();
    const velocity = this.rigidBody.linvel();
    
    // Update stored position
    this.position = { x: position.x, y: position.y, z: position.z };
    this.velocity = { x: velocity.x, y: velocity.y, z: velocity.z };
    
    // Check if player is on ground (for jump control)
    this.checkGroundContact();
    
    // Apply movement forces based on input
    this.applyMovementForces();
    
    // Keep player in bounds
    this.applyBoundaryConstraints();
    
    this.lastUpdate = Date.now();
  }

  updateSimpleMovement(deltaTime) {
    // Simple movement without physics
    this.velocity = { x: 0, y: 0, z: 0 };

    if (this.input.left) this.velocity.x -= PLAYER_SPEED;
    if (this.input.right) this.velocity.x += PLAYER_SPEED;
    if (this.input.forward) this.velocity.z -= PLAYER_SPEED;
    if (this.input.backward) this.velocity.z += PLAYER_SPEED;

    // Normalize diagonal movement
    if (this.velocity.x !== 0 && this.velocity.z !== 0) {
      this.velocity.x *= 0.707; // 1/sqrt(2)
      this.velocity.z *= 0.707;
    }

    // Update position
    this.position.x += this.velocity.x * deltaTime;
    this.position.z += this.velocity.z * deltaTime;

    // Simple boundary constraints
    this.position.x = Math.max(-50, Math.min(50, this.position.x));
    this.position.z = Math.max(-50, Math.min(50, this.position.z));
    this.position.y = Math.max(0, this.position.y); // Stay above ground

    this.lastUpdate = Date.now();
  }

  checkGroundContact() {
    if (!world || !this.collider) return;
    
    // Cast ray downward to check ground contact
    const rayOrigin = this.rigidBody.translation();
    const rayDir = { x: 0, y: -1, z: 0 };
    const maxDistance = 1.2; // Slightly more than half player height
    
    const ray = new RAPIER.Ray(rayOrigin, rayDir);
    const hit = world.castRay(ray, maxDistance, true);
    
    this.onGround = hit !== null && hit.toi < maxDistance;
  }

  applyMovementForces() {
    if (!this.rigidBody) return;
    
    const force = { x: 0, y: 0, z: 0 };
    const moveForce = PLAYER_SPEED * 10; // Amplify for physics
    
    // Horizontal movement
    if (this.input.left) force.x -= moveForce;
    if (this.input.right) force.x += moveForce;
    if (this.input.forward) force.z -= moveForce;
    if (this.input.backward) force.z += moveForce;
    
    // Normalize diagonal movement
    if (force.x !== 0 && force.z !== 0) {
      force.x *= 0.707;
      force.z *= 0.707;
    }
    
    // Apply movement force
    if (force.x !== 0 || force.z !== 0) {
      this.rigidBody.addForce(force, true);
    }
    
    // Jumping
    if (this.input.jump && this.onGround) {
      const jumpImpulse = { x: 0, y: JUMP_FORCE, z: 0 };
      this.rigidBody.addImpulse(jumpImpulse, true);
      this.onGround = false; // Prevent multi-jump
    }
  }

  applyBoundaryConstraints() {
    if (!this.rigidBody) return;
    
    const position = this.rigidBody.translation();
    const boundary = 48; // Keep within world bounds
    
    // Check boundaries and reset position if needed
    if (Math.abs(position.x) > boundary || Math.abs(position.z) > boundary || position.y < -10) {
      // Reset to center if out of bounds
      this.rigidBody.setTranslation({ x: 0, y: 5, z: 0 }, true);
      this.rigidBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
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
    if (this.rigidBody && world) {
      world.removeRigidBody(this.rigidBody);
    }
  }
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Create new player
  const player = new Player(socket.id, 
    Math.random() * 10 - 5, // Random spawn position
    0, 
    Math.random() * 10 - 5
  );
  players.set(socket.id, player);

  // Send initial game state to new player
  socket.emit('gameState', {
    players: Array.from(players.values()).map(p => p.getState()),
    playerId: socket.id
  });

  // Broadcast new player to all other clients
  socket.broadcast.emit('playerJoined', player.getState());

  // Handle player input
  socket.on('playerInput', (inputData) => {
    const player = players.get(socket.id);
    if (player) {
      player.input = inputData;
    }
  });

  // Handle player movement (alternative to input-based movement)
  socket.on('playerMove', (moveData) => {
    const player = players.get(socket.id);
    if (player) {
      player.velocity = moveData.velocity || player.velocity;
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    const player = players.get(socket.id);
    if (player) {
      player.destroy(); // Clean up physics body
    }
    players.delete(socket.id);
    
    // Broadcast player left to all clients
    io.emit('playerLeft', socket.id);
  });

  // Handle ping for latency measurement
  socket.on('ping', (timestamp) => {
    socket.emit('pong', timestamp);
  });
});

// Game update loop
let lastTick = Date.now();

function gameLoop() {
  const now = Date.now();
  const deltaTime = (now - lastTick) / 1000; // Convert to seconds
  lastTick = now;

  // Step physics simulation if available
  if (world && global.physicsEnabled !== false) {
    world.step();
  }

  // Update all players
  for (const player of players.values()) {
    player.update(deltaTime);
  }

  // Broadcast game state to all clients
  if (players.size > 0) {
    const gameState = {
      players: Array.from(players.values()).map(p => p.getState()),
      timestamp: now
    };
    io.emit('gameUpdate', gameState);
  }
}

// Start game loop
setInterval(gameLoop, TICK_INTERVAL);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    players: players.size,
    uptime: process.uptime()
  });
});

// Serve React app in production
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

const PORT = process.env.PORT || 3001;

// Initialize physics and start server
async function startServer() {
  await initPhysics();
  
  // Start game loop after physics is ready
  setInterval(gameLoop, TICK_INTERVAL);
  
  server.listen(PORT, () => {
    console.log(`🚀 Multiplayer game server running on port ${PORT}`);
    console.log(`🎮 Game loop running at ${TICK_RATE} ticks per second`);
    console.log(`🌐 CORS enabled for http://localhost:5173`);
    console.log(`🔬 Physics simulation enabled with Rapier.js`);
  });
}

// Start the server
startServer().catch(console.error);

module.exports = { app, server, io };