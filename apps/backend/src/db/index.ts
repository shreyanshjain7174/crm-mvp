/**
 * Database Interface
 * 
 * Provides a unified interface for database operations used throughout the application.
 * Wraps the PostgreSQL pool with convenient methods.
 */

import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg'
import { pool } from './connection'
import { logger } from '../utils/logger'

interface QueryOptions {
  timeout?: number
  retries?: number
}

class DatabaseInterface {
  private pool: Pool

  constructor(pool: Pool) {
    this.pool = pool
  }

  /**
   * Execute a query with parameters
   */
  async query<T extends QueryResultRow = any>(
    text: string, 
    params?: any[], 
    _options?: QueryOptions
  ): Promise<QueryResult<T>> {
    const client = await this.pool.connect()
    
    try {
      logger.debug('Executing query:', { text, params: params?.length || 0 })
      const result = await client.query<T>(text, params)
      logger.debug('Query completed:', { rowCount: result.rowCount })
      return result
    } catch (error) {
      logger.error('Query failed:', { text, error })
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Execute multiple queries in a transaction
   */
  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.pool.connect()
    
    try {
      await client.query('BEGIN')
      logger.debug('Transaction started')
      
      const result = await callback(client)
      
      await client.query('COMMIT')
      logger.debug('Transaction committed')
      
      return result
    } catch (error) {
      await client.query('ROLLBACK')
      logger.error('Transaction rolled back:', error)
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Get a client for manual transaction management
   */
  async getClient(): Promise<PoolClient> {
    return await this.pool.connect()
  }

  /**
   * Execute a prepared statement
   */
  async executeStatement<T extends QueryResultRow = any>(
    name: string,
    text: string,
    values?: any[]
  ): Promise<QueryResult<T>> {
    const client = await this.pool.connect()
    
    try {
      // Prepare the statement if not already prepared
      await client.query(`PREPARE ${name} AS ${text}`)
      
      // Execute the prepared statement
      const result = await client.query<T>(`EXECUTE ${name}`, values)
      
      return result
    } catch (error) {
      logger.error('Prepared statement failed:', { name, error })
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Check database connection health
   */
  async healthCheck(): Promise<{ healthy: boolean; latency: number }> {
    const startTime = Date.now()
    
    try {
      await this.query('SELECT 1 as health_check')
      const latency = Date.now() - startTime
      
      return { healthy: true, latency }
    } catch (error) {
      logger.error('Database health check failed:', error)
      return { healthy: false, latency: Date.now() - startTime }
    }
  }

  /**
   * Get connection pool stats
   */
  getPoolStats() {
    return {
      totalConnections: this.pool.totalCount,
      idleConnections: this.pool.idleCount,
      waitingClients: this.pool.waitingCount
    }
  }

  /**
   * Close all connections in the pool
   */
  async close(): Promise<void> {
    await this.pool.end()
    logger.info('Database pool closed')
  }
}

// Export the database interface instance
export const db = new DatabaseInterface(pool)

// Export types for use in other modules
export type { QueryResult, PoolClient } from 'pg'