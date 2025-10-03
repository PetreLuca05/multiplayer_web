/**
 * Input Handler
 * Manages player input validation and processing
 */
class InputHandler {
  constructor() {
    // Valid input keys
    this.validInputs = ['left', 'right', 'forward', 'backward', 'jump'];
    
    // Input rate limiting
    this.lastInputTime = new Map();
    this.INPUT_RATE_LIMIT = 16; // Minimum ms between input updates (60 FPS)
  }

  /**
   * Validate and sanitize input data
   * @param {Object} inputData - Raw input data from client
   * @returns {Object|null} Validated input or null if invalid
   */
  validateInput(inputData) {
    if (!inputData || typeof inputData !== 'object') {
      return null;
    }

    const validatedInput = {};
    
    // Validate each input key
    for (const key of this.validInputs) {
      if (key in inputData) {
        // Ensure boolean values
        validatedInput[key] = Boolean(inputData[key]);
      }
    }

    return validatedInput;
  }

  /**
   * Check if input should be processed based on rate limiting
   * @param {string} playerId - ID of the player sending input
   * @returns {boolean} True if input should be processed
   */
  shouldProcessInput(playerId) {
    const now = Date.now();
    const lastTime = this.lastInputTime.get(playerId) || 0;
    
    if (now - lastTime >= this.INPUT_RATE_LIMIT) {
      this.lastInputTime.set(playerId, now);
      return true;
    }
    
    return false;
  }

  /**
   * Process input for a player
   * @param {string} playerId - ID of the player
   * @param {Object} inputData - Input data from client
   * @param {Player} player - Player entity to update
   * @returns {boolean} True if input was processed
   */
  processInput(playerId, inputData, player) {
    // Validate input format
    const validInput = this.validateInput(inputData);
    if (!validInput) {
      return false;
    }

    // Check rate limiting
    if (!this.shouldProcessInput(playerId)) {
      return false;
    }

    // Update player input
    player.updateInput(validInput);
    return true;
  }

  /**
   * Clean up rate limiting data for disconnected player
   * @param {string} playerId - ID of the disconnected player
   */
  cleanupPlayer(playerId) {
    this.lastInputTime.delete(playerId);
  }

  /**
   * Get input statistics for monitoring
   * @returns {Object} Input handler statistics
   */
  getStats() {
    return {
      activeInputs: this.lastInputTime.size,
      rateLimit: this.INPUT_RATE_LIMIT
    };
  }
}

module.exports = InputHandler;