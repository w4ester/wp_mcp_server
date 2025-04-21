/**
 * Monitoring and Metrics Utilities
 * 
 * Provides metrics collection and monitoring for the WordPress MCP server.
 */

import { logger } from '../logger.js';

// Basic metric types
type MetricLabels = Record<string, string>;

/**
 * Simple in-memory metrics implementation
 * In production, this would be replaced with Prometheus
 */
class Metrics {
  private counters = new Map<string, number>();
  private gauges = new Map<string, number>();
  private histograms = new Map<string, number[]>();

  /**
   * Increment a counter metric
   */
  incrementCounter(name: string, labels: MetricLabels = {}, value: number = 1): void {
    const key = this.formatKey(name, labels);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);

    if (process.env.NODE_ENV === 'development') {
      logger.debug(`Metric [counter] ${key}: +${value}`);
    }
  }

  /**
   * Set a gauge metric
   */
  setGauge(name: string, value: number, labels: MetricLabels = {}): void {
    const key = this.formatKey(name, labels);
    this.gauges.set(key, value);

    if (process.env.NODE_ENV === 'development') {
      logger.debug(`Metric [gauge] ${key}: ${value}`);
    }
  }

  /**
   * Record a histogram observation
   */
  recordHistogram(name: string, value: number, labels: MetricLabels = {}): void {
    const key = this.formatKey(name, labels);
    if (!this.histograms.has(key)) {
      this.histograms.set(key, []);
    }
    this.histograms.get(key)!.push(value);

    if (process.env.NODE_ENV === 'development') {
      logger.debug(`Metric [histogram] ${key}: ${value}`);
    }
  }

  /**
   * Format a metric key with labels
   */
  private formatKey(name: string, labels: MetricLabels): string {
    if (Object.keys(labels).length === 0) {
      return name;
    }

    const parts = Object.entries(labels).map(
      ([key, value]) => `${key}="${value}"`
    );
    return `${name}{${parts.join(',')}}`;
  }

  /**
   * Get content type for metrics endpoint
   */
  get contentType(): string {
    return 'text/plain; version=0.0.4';
  }
}

// Export singleton instance
export const metrics = new Metrics();
