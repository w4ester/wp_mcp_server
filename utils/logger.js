/**
 * Logger Utility
 * 
 * Provides logging functionality for the WordPress MCP server
 */

// Log levels with their corresponding numeric values
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4
};

// Default log level from environment or INFO
const DEFAULT_LOG_LEVEL = process.env.LOG_LEVEL ? 
  (LOG_LEVELS[process.env.LOG_LEVEL] !== undefined ? 
    process.env.LOG_LEVEL : 'INFO') : 
  'INFO';

/**
 * Logger class for consistent logging
 */
class Logger {
  /**
   * Constructor
   * @param {string} name - Logger name/category
   * @param {string} level - Minimum log level
   */
  constructor(name, level = DEFAULT_LOG_LEVEL) {
    this.name = name;
    this.level = LOG_LEVELS[level] !== undefined ? level : DEFAULT_LOG_LEVEL;
  }
  
  /**
   * Check if a log level should be logged
   * @param {string} level - Log level to check
   * @returns {boolean} - Whether the level should be logged
   */
  shouldLog(level) {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
  }
  
  /**
   * Format a log message
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} [meta] - Additional metadata
   * @returns {string} - Formatted log message
   */
  formatLog(level, message, meta) {
    const timestamp = new Date().toISOString();
    const metaString = meta ? ` | ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] [${this.name}] ${message}${metaString}`;
  }
  
  /**
   * Log at the debug level
   * @param {string} message - Log message
   * @param {Object} [meta] - Additional metadata
   */
  debug(message, meta) {
    if (this.shouldLog('DEBUG')) {
      console.log(this.formatLog('DEBUG', message, meta));
    }
  }
  
  /**
   * Log at the info level
   * @param {string} message - Log message
   * @param {Object} [meta] - Additional metadata
   */
  info(message, meta) {
    if (this.shouldLog('INFO')) {
      console.log(this.formatLog('INFO', message, meta));
    }
  }
  
  /**
   * Log at the warn level
   * @param {string} message - Log message
   * @param {Object} [meta] - Additional metadata
   */
  warn(message, meta) {
    if (this.shouldLog('WARN')) {
      console.warn(this.formatLog('WARN', message, meta));
    }
  }
  
  /**
   * Log at the error level
   * @param {string} message - Log message
   * @param {Object} [meta] - Additional metadata
   */
  error(message, meta) {
    if (this.shouldLog('ERROR')) {
      console.error(this.formatLog('ERROR', message, meta));
    }
  }
  
  /**
   * Create a child logger with the same settings but different name
   * @param {string} name - Child logger name
   * @returns {Logger} - Child logger instance
   */
  child(name) {
    return new Logger(`${this.name}:${name}`, this.level);
  }
  
  /**
   * Set the log level
   * @param {string} level - New log level
   */
  setLevel(level) {
    if (LOG_LEVELS[level] !== undefined) {
      this.level = level;
    }
  }
}

// Create a main logger for the WordPress MCP server
const logger = new Logger('WordPress-MCP');

module.exports = {
  LOG_LEVELS,
  Logger,
  logger
};
