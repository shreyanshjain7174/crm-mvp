/**
 * Socket Service
 * 
 * Manages WebSocket connections and real-time communication
 * for agent events, status updates, and live notifications.
 */

import { Server as SocketIOServer } from 'socket.io'
import { logger } from '../utils/logger'

class SocketService {
  private io: SocketIOServer | null = null

  /**
   * Initialize Socket.IO server
   */
  initialize(io: SocketIOServer) {
    this.io = io
    this.setupEventHandlers()
    logger.info('Socket service initialized')
  }

  /**
   * Setup event handlers for Socket.IO
   */
  private setupEventHandlers() {
    if (!this.io) return

    this.io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`)

      // Handle agent-specific events
      socket.on('join-agent-room', (agentId: string) => {
        socket.join(`agent-${agentId}`)
        logger.info(`Client ${socket.id} joined agent room: ${agentId}`)
      })

      socket.on('leave-agent-room', (agentId: string) => {
        socket.leave(`agent-${agentId}`)
        logger.info(`Client ${socket.id} left agent room: ${agentId}`)
      })

      // Handle user-specific events
      socket.on('join-user-room', (userId: string) => {
        socket.join(`user-${userId}`)
        logger.info(`Client ${socket.id} joined user room: ${userId}`)
      })

      socket.on('leave-user-room', (userId: string) => {
        socket.leave(`user-${userId}`)
        logger.info(`Client ${socket.id} left user room: ${userId}`)
      })

      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`)
      })
    })
  }

  /**
   * Emit event to specific user
   */
  emitToUser(userId: string, event: string, data: any) {
    if (!this.io) {
      logger.warn('Socket.IO not initialized, cannot emit to user')
      return
    }

    this.io.to(`user-${userId}`).emit(event, {
      ...data,
      timestamp: new Date()
    })

    logger.debug(`Emitted ${event} to user ${userId}`)
  }

  /**
   * Emit event to specific agent watchers
   */
  emitToAgent(agentId: string, event: string, data: any) {
    if (!this.io) {
      logger.warn('Socket.IO not initialized, cannot emit to agent')
      return
    }

    this.io.to(`agent-${agentId}`).emit(event, {
      ...data,
      timestamp: new Date()
    })

    logger.debug(`Emitted ${event} to agent ${agentId}`)
  }

  /**
   * Emit event to all connected clients
   */
  emitToAll(event: string, data: any) {
    if (!this.io) {
      logger.warn('Socket.IO not initialized, cannot emit to all')
      return
    }

    this.io.emit(event, {
      ...data,
      timestamp: new Date()
    })

    logger.debug(`Emitted ${event} to all clients`)
  }

  /**
   * Emit agent status change
   */
  emitAgentStatus(userId: string, agentId: string, status: string, message?: string) {
    this.emitToUser(userId, 'agent-status-changed', {
      agentId,
      status,
      message
    })

    this.emitToAgent(agentId, 'status-changed', {
      status,
      message
    })
  }

  /**
   * Emit agent metrics update
   */
  emitAgentMetrics(userId: string, agentId: string, metrics: any) {
    this.emitToUser(userId, 'agent-metrics-updated', {
      agentId,
      metrics
    })

    this.emitToAgent(agentId, 'metrics-updated', {
      metrics
    })
  }

  /**
   * Emit agent log entry
   */
  emitAgentLog(userId: string, agentId: string, logEntry: any) {
    this.emitToUser(userId, 'agent-log', {
      agentId,
      log: logEntry
    })

    this.emitToAgent(agentId, 'log', {
      log: logEntry
    })
  }

  /**
   * Emit agent installation status
   */
  emitAgentInstallation(userId: string, agentId: string, status: 'installing' | 'installed' | 'failed', error?: string) {
    const event = status === 'installed' ? 'agent-installed' : 
                 status === 'failed' ? 'agent-installation-failed' : 'agent-installing'

    this.emitToUser(userId, event, {
      agentId,
      status,
      error
    })
  }

  /**
   * Emit agent health check results
   */
  emitAgentHealth(userId: string, agentId: string, health: any) {
    this.emitToUser(userId, 'agent-health-updated', {
      agentId,
      health
    })

    this.emitToAgent(agentId, 'health-updated', {
      health
    })
  }

  /**
   * Emit agent action execution result
   */
  emitAgentActionResult(userId: string, agentId: string, action: string, result: any, success: boolean = true) {
    this.emitToUser(userId, 'agent-action-result', {
      agentId,
      action,
      result,
      success
    })

    this.emitToAgent(agentId, 'action-result', {
      action,
      result,
      success
    })
  }

  /**
   * Get connected clients count
   */
  getConnectedClientsCount(): number {
    if (!this.io) return 0
    return this.io.sockets.sockets.size
  }

  /**
   * Get clients in specific room
   */
  async getClientsInRoom(room: string): Promise<string[]> {
    if (!this.io) return []
    
    try {
      const sockets = await this.io.in(room).fetchSockets()
      return sockets.map(socket => socket.id)
    } catch (error) {
      logger.error(`Failed to get clients in room ${room}:`, error)
      return []
    }
  }

  /**
   * Check if user is online
   */
  async isUserOnline(userId: string): Promise<boolean> {
    const clients = await this.getClientsInRoom(`user-${userId}`)
    return clients.length > 0
  }

  /**
   * Send notification to user (with fallback for offline users)
   */
  async sendNotification(userId: string, notification: {
    title: string
    message: string
    type: 'info' | 'success' | 'warning' | 'error'
    data?: any
  }) {
    const isOnline = await this.isUserOnline(userId)
    
    if (isOnline) {
      this.emitToUser(userId, 'notification', notification)
      logger.info(`Notification sent to online user ${userId}`)
    } else {
      // Store notification for offline user (could implement database storage)
      logger.info(`User ${userId} offline, notification queued: ${notification.title}`)
      // TODO: Implement offline notification storage
    }
  }

  /**
   * Broadcast system announcement
   */
  broadcastSystemAnnouncement(announcement: {
    title: string
    message: string
    level: 'info' | 'warning' | 'critical'
    expiresAt?: Date
  }) {
    this.emitToAll('system-announcement', announcement)
    logger.info(`System announcement broadcasted: ${announcement.title}`)
  }

  /**
   * Get Socket.IO instance (for advanced usage)
   */
  getIO(): SocketIOServer | null {
    return this.io
  }
}

export const socketService = new SocketService()