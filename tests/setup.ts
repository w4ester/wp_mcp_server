/**
 * Jest Test Setup
 * 
 * Global setup for all tests.
 */

import { jest } from '@jest/globals';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent'; // Suppress logs during tests

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock performance.now() for consistent test results
const mockPerformanceNow = jest.fn();
mockPerformanceNow.mockReturnValue(1000);
global.performance = {
  ...global.performance,
  now: mockPerformanceNow
};
