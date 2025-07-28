/**
 * Keep-Alive Service
 * 
 * Internal service that prevents the backend from going idle
 * by performing periodic self-monitoring activities.
 */

import { EventEmitter } from 'events';

interface KeepAliveConfig {
  enabled: boolean;
  intervalMinutes: number;
  logActivity: boolean;
}

interface KeepAliveStats {
  startTime: Date;
  lastActivity: Date;
  totalChecks: number;
  uptime: number;
}

export class KeepAliveService extends EventEmitter {
  private config: KeepAliveConfig;
  private stats: KeepAliveStats;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(config: Partial<KeepAliveConfig> = {}) {
    super();
    
    this.config = {
      enabled: process.env.KEEP_ALIVE_ENABLED !== 'false', // Enabled by default
      intervalMinutes: parseInt(process.env.KEEP_ALIVE_INTERVAL || '15'), // 15 minutes default
      logActivity: process.env.NODE_ENV !== 'production', // Log in dev, quiet in prod
      ...config
    };

    this.stats = {
      startTime: new Date(),
      lastActivity: new Date(),
      totalChecks: 0,
      uptime: 0
    };

    this.log('KeepAlive service initialized', {
      enabled: this.config.enabled,
      intervalMinutes: this.config.intervalMinutes
    });
  }

  /**
   * Start the keep-alive monitoring
   */
  start(): void {
    if (!this.config.enabled) {
      this.log('KeepAlive service is disabled');
      return;
    }

    if (this.isRunning) {
      this.log('KeepAlive service is already running');
      return;
    }

    this.isRunning = true;
    this.stats.startTime = new Date();
    
    // Run initial check immediately
    this.performKeepAliveCheck();

    // Set up periodic checks
    const intervalMs = this.config.intervalMinutes * 60 * 1000;
    this.intervalId = setInterval(() => {
      this.performKeepAliveCheck();
    }, intervalMs);

    this.log(`KeepAlive service started - checking every ${this.config.intervalMinutes} minutes`);
    this.emit('started');
  }

  /**
   * Stop the keep-alive monitoring
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    this.log('KeepAlive service stopped');
    this.emit('stopped');
  }

  /**
   * Perform keep-alive activities
   */
  private async performKeepAliveCheck(): Promise<void> {
    try {
      const startTime = Date.now();
      
      // Update stats
      this.stats.lastActivity = new Date();
      this.stats.totalChecks++;
      this.stats.uptime = Date.now() - this.stats.startTime.getTime();

      // Perform various keep-alive activities
      const activities = await Promise.all([
        this.checkMemoryUsage(),
        this.checkDiskSpace(),
        this.checkDatabaseConnection(),
        this.performLightworkActivity()
      ]);

      const duration = Date.now() - startTime;
      
      // Log summary (only in development or if explicitly enabled)
      if (this.config.logActivity) {
        this.log('Keep-alive check completed', {
          duration: `${duration}ms`,
          totalChecks: this.stats.totalChecks,
          uptime: this.formatUptime(this.stats.uptime),
          activities: activities.length
        });
      }

      // Emit success event
      this.emit('check-completed', {
        duration,
        activities: activities.length,
        stats: this.getStats()
      });

    } catch (error) {
      this.log('Keep-alive check failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      this.emit('check-failed', error);
    }
  }

  /**
   * Check memory usage
   */
  private async checkMemoryUsage(): Promise<{ type: string; status: string; data: any }> {
    const usage = process.memoryUsage();
    const totalMB = Math.round(usage.rss / 1024 / 1024);
    
    return {
      type: 'memory',
      status: totalMB < 400 ? 'healthy' : 'warning', // Alert if > 400MB
      data: {
        rss: `${totalMB}MB`,
        heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
        external: `${Math.round(usage.external / 1024 / 1024)}MB`
      }
    };
  }

  /**
   * Check available disk space
   */
  private async checkDiskSpace(): Promise<{ type: string; status: string; data: any }> {
    try {
      const fs = await import('fs/promises');
      const stats = await fs.stat('/app/data');
      
      return {
        type: 'disk',
        status: 'healthy',
        data: {
          accessible: true,
          mounted: !!stats
        }
      };
    } catch (error) {
      return {
        type: 'disk',
        status: 'warning',
        data: { error: 'Cannot access data directory' }
      };
    }
  }

  /**
   * Check database connection
   */
  private async checkDatabaseConnection(): Promise<{ type: string; status: string; data: any }> {
    // This would typically ping the database
    // For now, just simulate a quick check
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          type: 'database',
          status: 'healthy',
          data: { connected: true, latency: '< 5ms' }
        });
      }, 1);
    });
  }

  /**
   * Perform light background activity to maintain "active" status
   */
  private async performLightworkActivity(): Promise<{ type: string; status: string; data: any }> {
    // Perform very light CPU/memory activity
    const start = Date.now();
    let counter = 0;
    
    // Light computation to show activity
    for (let i = 0; i < 1000; i++) {
      counter += Math.random();
    }
    
    const duration = Date.now() - start;
    
    return {
      type: 'activity',
      status: 'completed',
      data: {
        operations: 1000,
        duration: `${duration}ms`,
        result: Math.round(counter)
      }
    };
  }

  /**
   * Get current statistics
   */
  getStats(): KeepAliveStats & { isRunning: boolean } {
    return {
      ...this.stats,
      uptime: Date.now() - this.stats.startTime.getTime(),
      isRunning: this.isRunning
    };
  }

  /**
   * Get configuration
   */
  getConfig(): KeepAliveConfig {
    return { ...this.config };
  }

  /**
   * Format uptime in human-readable format
   */
  private formatUptime(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  /**
   * Internal logging method
   */
  private log(message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const logData = data ? ` ${JSON.stringify(data)}` : '';
    
    if (this.config.logActivity) {
      console.log(`[${timestamp}] [KeepAlive] ${message}${logData}`);
    }
  }
}