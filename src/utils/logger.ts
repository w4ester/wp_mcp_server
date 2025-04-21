/**
 * Logger Utility
 * 
 * Provides logging functionality for the WordPress MCP server
 */

// Log levels with their corresponding numeric values
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

// Default log level from environment or INFO
const DEFAULT_LOG_LEVEL = process.env.LOG_LEVEL && 
  LogLevel[process.env.LOG_LEVEL as keyof typeof LogLevel] !== undefined ? 
  process.env.LOG_LEVEL as keyof typeof LogLevel : 
  'INFO';

/**
 * Logger class for consistent logging
 */
export class Logger {
  private name: string;
  private level: keyof typeof LogLevel;

  /**
   * Constructor
   * @param {string} name - Logger name/category
   * @param {keyof typeof LogLevel} level - Minimum log level
   */
  constructor(name: string, level: keyof typeof LogLevel = DEFAULT_LOG_LEVEL) {
    this.name = name;
    this.level = LogLevel[level] !== undefined ? level : DEFAULT_LOG_LEVEL;
  }
  
  /**
   * Check if a log level should be logged
   * @param {keyof typeof LogLevel} level - Log level to check
   * @returns {boolean} - Whether the level should be logged
   */
  private shouldLog(level: keyof typeof LogLevel): boolean {
    return LogLevel[level] >= LogLevel[this.level];
  }
  
  /**
   * Format a log message
   * @param {keyof typeof LogLevel} level - Log level
   * @param {string} message - Log message
   * @param {Record<string, any>} [meta] - Additional metadata
   * @returns {string} - Formatted log message
   */
  private formatLog(level: keyof typeof LogLevel, message: string, meta?: Record<string, any>): string {
    const timestamp = new Date().toISOString();
    const metaString = meta ? ` | ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] [${this.name}] ${message}${metaString}`;
  }
  
  /**
   * Log at the debug level
   * @param {string} message - Log message
   * @param {Record<string, any>} [meta] - Additional metadata
   */
  debug(message: string, meta?: Record<string, any>): void {
    if (this.shouldLog('DEBUG')) {
      console.log(this.formatLog('DEBUG', message, meta));
    }
  }
  
  /**
   * Log at the info level
   * @param {string} message - Log message
   * @param {Record<string, any>} [meta] - Additional metadata
   */
  info(message: string, meta?: Record<string, any>): void {
    if (this.shouldLog('INFO')) {
      console.log(this.formatLog('INFO', message, meta));
    }
  }
  
  /**
   * Log at the warn level
   * @param {string} message - Log message
   * @param {Record<string, any>} [meta] - Additional metadata
   */
  warn(message: string, meta?: Record<string, any>): void {
    if (this.shouldLog('WARN')) {
      console.warn(this.formatLog('WARN', message, meta));
    }
  }
  
  /**
   * Log at the error level
   * @param {string} message - Log message
   * @param {Record<string, any>} [meta] - Additional metadata
   */
  error(message: string, meta?: Record<string, any>): void {
    if (this.shouldLog('ERROR')) {
      console.error(this.formatLog('ERROR', message, meta));
    }
  }
  
  /**
   * Create a child logger with the same settings but different name
   * @param {string} name - Child logger name
   * @returns {Logger} - Child logger instance
   */
  child(name: string): Logger {
    return new Logger(`${this.name}:${name}`, this.level);
  }
  
  /**
   * Set the log level
   * @param {keyof typeof LogLevel} level - New log level
   */
  setLevel(level: keyof typeof LogLevel): void {
    if (LogLevel[level] !== undefined) {
      this.level = level;
    }
  }
}

// Create a main logger for the WordPress MCP server
export const logger = new Logger('WordPress-MCP');
