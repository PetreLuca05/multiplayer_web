/**
 * Game Manager
 * Orchestrates the main game loop, player management, and state updates
 */
class GameManager {
  constructor(physicsWorld, io) {
    this.physicsWorld = physicsWorld;
    this.io = io;
    this.players = new Map();
    
    // Game loop configuration
    this.TICK_RATE = 60; // 60 ticks per second
    this.TICK_INTERVAL = 1000 / this.TICK_RATE;
    this.lastTick = Date.now();
    
    // Game loop timer
    this.gameLoopInterval = null;
  }

  /**
   * Start the game loop
   */
  startGameLoop() {
    if (this.gameLoopInterval) {
      console.log('⚠️  Game loop already running');
      return;
    }

    this.gameLoopInterval = setInterval(() => {
      this.gameLoop();
    }, this.TICK_INTERVAL);

    console.log(`🎮 Game loop started at ${this.TICK_RATE} ticks per second`);
  }

  /**
   * Stop the game loop
   */
  stopGameLoop() {
    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
      this.gameLoopInterval = null;
      console.log('🛑 Game loop stopped');
    }
  }

  /**
   * Main game loop - runs at 60 FPS
   */
  gameLoop() {
    const now = Date.now();
    const deltaTime = (now - this.lastTick) / 1000; // Convert to seconds
    this.lastTick = now;

    // Step physics simulation
    this.physicsWorld.step();

    // Update all players
    this.updateAllPlayers(deltaTime);

    // Broadcast game state to all clients
    this.broadcastGameState(now);
  }

  /**
   * Update all player entities
   * @param {number} deltaTime - Time elapsed since last update
   */
  updateAllPlayers(deltaTime) {
    for (const player of this.players.values()) {
      player.update(deltaTime);
    }
  }

  /**
   * Broadcast current game state to all connected clients
   * @param {number} timestamp - Current timestamp
   */
  broadcastGameState(timestamp) {
    if (this.players.size > 0) {
      const gameState = {
        players: Array.from(this.players.values()).map(p => p.getState()),
        timestamp: timestamp,
        physics: {
          enabled: this.physicsWorld.isPhysicsEnabled(),
          debugData: this.physicsWorld.getDebugData()
        }
      };
      this.io.emit('gameUpdate', gameState);
    }
  }

  /**
   * Add a new player to the game
   * @param {string} playerId - Unique player ID
   * @param {number} x - Spawn X position
   * @param {number} y - Spawn Y position  
   * @param {number} z - Spawn Z position
   * @returns {Player} The created player
   */
  addPlayer(playerId, x = 0, y = 2, z = 0) {
    const Player = require('../entities/Player');
    
    // Add some randomness to spawn position
    const spawnX = x + (Math.random() * 10 - 5);
    const spawnZ = z + (Math.random() * 10 - 5);
    
    const player = new Player(playerId, this.physicsWorld, spawnX, y, spawnZ);
    this.players.set(playerId, player);
    
    console.log(`👤 Player added: ${playerId} at (${spawnX.toFixed(1)}, ${y}, ${spawnZ.toFixed(1)})`);
    return player;
  }

  /**
   * Remove a player from the game
   * @param {string} playerId - Player ID to remove
   */
  removePlayer(playerId) {
    const player = this.players.get(playerId);
    if (player) {
      player.destroy(); // Clean up physics body
      this.players.delete(playerId);
      console.log(`👋 Player removed: ${playerId}`);
    }
  }

  /**
   * Get a player by ID
   * @param {string} playerId - Player ID
   * @returns {Player|undefined} The player or undefined if not found
   */
  getPlayer(playerId) {
    return this.players.get(playerId);
  }

  /**
   * Get all players
   * @returns {Map} Map of all players
   */
  getAllPlayers() {
    return this.players;
  }

  /**
   * Get current game statistics
   * @returns {Object} Game statistics
   */
  getGameStats() {
    return {
      playerCount: this.players.size,
      tickRate: this.TICK_RATE,
      physicsEnabled: this.physicsWorld.isPhysicsEnabled(),
      uptime: process.uptime()
    };
  }

  /**
   * Get current game state for new players
   * @returns {Object} Complete game state
   */
  getGameState() {
    return {
      players: Array.from(this.players.values()).map(p => p.getState()),
      timestamp: Date.now(),
      physics: {
        enabled: this.physicsWorld.isPhysicsEnabled(),
        debugData: this.physicsWorld.getDebugData()
      }
    };
  }

  /**
   * Clean shutdown of game manager
   */
  shutdown() {
    this.stopGameLoop();
    
    // Clean up all players
    for (const player of this.players.values()) {
      player.destroy();
    }
    this.players.clear();
    
    console.log('🔄 Game manager shutdown complete');
  }
}

module.exports = GameManager;