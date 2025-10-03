const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

// Import our modular components
const PhysicsWorld = require('./src/physics/World');
const GameManager = require('./src/game/GameManager');
const InputHandler = require('./src/input/InputHandler');

const app = express();
const server = http.createServer(app);

// Configure CORS for Socket.io
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174"], // Support both ports
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Enable CORS for Express
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174"],
  credentials: true
}));

// Serve static files in production
app.use(express.static(path.join(__dirname, '../client/dist')));

// Initialize game components
const physicsWorld = new PhysicsWorld();
const inputHandler = new InputHandler();
let gameManager = null;

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`🔌 Player connected: ${socket.id}`);

  // Create new player and add to game
  const player = gameManager.addPlayer(socket.id);

  // Send initial game state to new player
  socket.emit('gameState', {
    ...gameManager.getGameState(),
    playerId: socket.id
  });

  // Broadcast new player to all other clients
  socket.broadcast.emit('playerJoined', player.getState());

  // Handle player input
  socket.on('playerInput', (inputData) => {
    const player = gameManager.getPlayer(socket.id);
    if (player) {
      inputHandler.processInput(socket.id, inputData, player);
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`🔌 Player disconnected: ${socket.id}`);
    
    // Clean up player and input handler
    gameManager.removePlayer(socket.id);
    inputHandler.cleanupPlayer(socket.id);
    
    // Broadcast player left to all clients
    io.emit('playerLeft', socket.id);
  });

  // Handle ping for latency measurement
  socket.on('ping', (timestamp) => {
    socket.emit('pong', timestamp);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  const stats = gameManager ? gameManager.getGameStats() : { playerCount: 0, uptime: process.uptime() };
  const inputStats = inputHandler.getStats();
  
  res.json({ 
    status: 'OK',
    ...stats,
    input: inputStats,
    physics: {
      enabled: physicsWorld.isPhysicsEnabled(),
      engine: 'cannon-es'
    }
  });
});

// Serve React app in production
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

const PORT = process.env.PORT || 3001;

// Initialize and start server
function startServer() {
  // Initialize physics world
  const physicsInitialized = physicsWorld.initialize();
  
  // Initialize game manager
  gameManager = new GameManager(physicsWorld, io);
  
  // Start game loop
  gameManager.startGameLoop();
  
  // Start server
  server.listen(PORT, () => {
    console.log(`🚀 Multiplayer game server running on port ${PORT}`);
    console.log(` CORS enabled for http://localhost:5173`);
    if (physicsInitialized) {
      console.log(`🔬 Physics simulation enabled with Cannon.js`);
    } else {
      console.log(`⚠️  Physics simulation disabled - using basic movement`);
    }
  });
  
  // Graceful shutdown handling
  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
}

// Graceful shutdown
function gracefulShutdown() {
  console.log('\n🔄 Received shutdown signal, cleaning up...');
  
  if (gameManager) {
    gameManager.shutdown();
  }
  
  server.close(() => {
    console.log('✅ Server shutdown complete');
    process.exit(0);
  });
}

// Start the server
startServer();

module.exports = { app, server, io, gameManager, physicsWorld, inputHandler };