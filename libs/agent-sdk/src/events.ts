/**
 * Agent Event System
 * 
 * Provides event-driven communication between agents and the CRM platform.
 * Supports real-time data flow, status updates, and inter-agent communication.
 */

import { EventEmitter } from 'eventemitter3'
import { AgentData, CRMData, AgentMetrics, HealthCheckResult } from './types'

export interface AgentEvent {
  type: string
  agentId: string
  timestamp: Date
  data: any
}

export interface StatusUpdateEvent extends AgentEvent {
  type: 'status-update'
  data: {
    status: 'starting' | 'running' | 'stopping' | 'stopped' | 'error'
    message?: string
  }
}

export interface DataProcessedEvent extends AgentEvent {
  type: 'data-processed'
  data: {
    inputType: string
    outputData: AgentData
    responseTime: number
  }
}

export interface ErrorEvent extends AgentEvent {
  type: 'error'
  data: {
    error: Error
    context?: any
  }
}

export interface MetricsUpdateEvent extends AgentEvent {
  type: 'metrics-update'
  data: AgentMetrics
}

export interface HealthCheckEvent extends AgentEvent {
  type: 'health-check'
  data: HealthCheckResult
}

/**
 * Enhanced event emitter for agents with typed events
 */
export class AgentEventEmitter extends EventEmitter {
  private agentId: string

  constructor(agentId: string) {
    super()
    this.agentId = agentId
  }

  /**
   * Emit status update event
   */
  emitStatusUpdate(
    status: 'starting' | 'running' | 'stopping' | 'stopped' | 'error',
    message?: string
  ): void {
    const event: StatusUpdateEvent = {
      type: 'status-update',
      agentId: this.agentId,
      timestamp: new Date(),
      data: { status, message }
    }
    this.emit('status-update', event)
    this.emit('*', event) // Wildcard for all events
  }

  /**
   * Emit data processed event
   */
  emitDataProcessed(inputType: string, outputData: AgentData, responseTime: number): void {
    const event: DataProcessedEvent = {
      type: 'data-processed',
      agentId: this.agentId,
      timestamp: new Date(),
      data: { inputType, outputData, responseTime }
    }
    this.emit('data-processed', event)
    this.emit('*', event)
  }

  /**
   * Emit error event
   */
  emitError(error: Error, context?: any): void {
    const event: ErrorEvent = {
      type: 'error',
      agentId: this.agentId,
      timestamp: new Date(),
      data: { error, context }
    }
    this.emit('error', event)
    this.emit('*', event)
  }

  /**
   * Emit metrics update event
   */
  emitMetricsUpdate(metrics: AgentMetrics): void {
    const event: MetricsUpdateEvent = {
      type: 'metrics-update',
      agentId: this.agentId,
      timestamp: new Date(),
      data: metrics
    }
    this.emit('metrics-update', event)
    this.emit('*', event)
  }

  /**
   * Emit health check event
   */
  emitHealthCheck(result: HealthCheckResult): void {
    const event: HealthCheckEvent = {
      type: 'health-check',
      agentId: this.agentId,
      timestamp: new Date(),
      data: result
    }
    this.emit('health-check', event)
    this.emit('*', event)
  }

  /**
   * Emit custom event
   */
  emitCustom(type: string, data: any): void {
    const event: AgentEvent = {
      type,
      agentId: this.agentId,
      timestamp: new Date(),
      data
    }
    this.emit(type, event)
    this.emit('*', event)
  }

  /**
   * Subscribe to status updates
   */
  onStatusUpdate(listener: (event: StatusUpdateEvent) => void): void {
    this.on('status-update', listener)
  }

  /**
   * Subscribe to data processed events
   */
  onDataProcessed(listener: (event: DataProcessedEvent) => void): void {
    this.on('data-processed', listener)
  }

  /**
   * Subscribe to error events
   */
  onError(listener: (event: ErrorEvent) => void): void {
    this.on('error', listener)
  }

  /**
   * Subscribe to metrics updates
   */
  onMetricsUpdate(listener: (event: MetricsUpdateEvent) => void): void {
    this.on('metrics-update', listener)
  }

  /**
   * Subscribe to health check events
   */
  onHealthCheck(listener: (event: HealthCheckEvent) => void): void {
    this.on('health-check', listener)
  }

  /**
   * Subscribe to all events (wildcard)
   */
  onAny(listener: (event: AgentEvent) => void): void {
    this.on('*', listener)
  }
}

/**
 * Global event bus for inter-agent communication
 */
export class GlobalEventBus extends EventEmitter {
  private static instance: GlobalEventBus

  static getInstance(): GlobalEventBus {
    if (!GlobalEventBus.instance) {
      GlobalEventBus.instance = new GlobalEventBus()
    }
    return GlobalEventBus.instance
  }

  /**
   * Publish event to all agents
   */
  publish(event: AgentEvent): void {
    this.emit('agent-event', event)
    this.emit(`agent-event:${event.agentId}`, event)
    this.emit(`event-type:${event.type}`, event)
  }

  /**
   * Subscribe to all agent events
   */
  subscribeToAll(listener: (event: AgentEvent) => void): void {
    this.on('agent-event', listener)
  }

  /**
   * Subscribe to events from specific agent
   */
  subscribeToAgent(agentId: string, listener: (event: AgentEvent) => void): void {
    this.on(`agent-event:${agentId}`, listener)
  }

  /**
   * Subscribe to specific event type from all agents
   */
  subscribeToEventType(eventType: string, listener: (event: AgentEvent) => void): void {
    this.on(`event-type:${eventType}`, listener)
  }

  /**
   * Unsubscribe from all events
   */
  unsubscribeAll(): void {
    this.removeAllListeners()
  }

  /**
   * Get event statistics
   */
  getStats(): { totalEvents: number, agentCounts: Record<string, number> } {
    const events = this.eventNames()
    const agentCounts: Record<string, number> = {}
    
    for (const eventName of events) {
      if (typeof eventName === 'string' && eventName.startsWith('agent-event:')) {
        const agentId = eventName.split(':')[1]
        agentCounts[agentId] = this.listenerCount(eventName)
      }
    }

    return {
      totalEvents: this.listenerCount('agent-event'),
      agentCounts
    }
  }
}

/**
 * Event stream utility for real-time data flow
 */
export class EventStream {
  private emitter: EventEmitter
  private filters: Array<(event: AgentEvent) => boolean> = []

  constructor(emitter?: EventEmitter) {
    this.emitter = emitter || new EventEmitter()
  }

  /**
   * Add event filter
   */
  filter(predicate: (event: AgentEvent) => boolean): EventStream {
    this.filters.push(predicate)
    return this
  }

  /**
   * Filter by event type
   */
  filterByType(eventType: string): EventStream {
    return this.filter(event => event.type === eventType)
  }

  /**
   * Filter by agent ID
   */
  filterByAgent(agentId: string): EventStream {
    return this.filter(event => event.agentId === agentId)
  }

  /**
   * Filter by time range
   */
  filterByTimeRange(startTime: Date, endTime?: Date): EventStream {
    return this.filter(event => {
      const eventTime = event.timestamp
      return eventTime >= startTime && (!endTime || eventTime <= endTime)
    })
  }

  /**
   * Subscribe to filtered events
   */
  subscribe(listener: (event: AgentEvent) => void): () => void {
    const wrappedListener = (event: AgentEvent) => {
      // Apply all filters
      for (const filter of this.filters) {
        if (!filter(event)) {
          return // Event filtered out
        }
      }
      listener(event)
    }

    this.emitter.on('event', wrappedListener)
    
    // Return unsubscribe function
    return () => {
      this.emitter.removeListener('event', wrappedListener)
    }
  }

  /**
   * Emit event to stream
   */
  emit(event: AgentEvent): void {
    this.emitter.emit('event', event)
  }

  /**
   * Create observable-like interface
   */
  toObservable() {
    return {
      subscribe: (observer: {
        next?: (event: AgentEvent) => void
        error?: (error: Error) => void
        complete?: () => void
      }) => {
        const unsubscribe = this.subscribe(event => {
          observer.next?.(event)
        })

        this.emitter.on('error', error => {
          observer.error?.(error)
        })

        return { unsubscribe }
      }
    }
  }
}

/**
 * Event replay utility for debugging and testing
 */
export class EventReplay {
  private events: AgentEvent[] = []
  private maxEvents: number

  constructor(maxEvents: number = 1000) {
    this.maxEvents = maxEvents
  }

  /**
   * Record an event
   */
  record(event: AgentEvent): void {
    this.events.push(event)
    
    // Keep only the most recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents)
    }
  }

  /**
   * Get recorded events
   */
  getEvents(): AgentEvent[] {
    return [...this.events]
  }

  /**
   * Get events by agent
   */
  getEventsByAgent(agentId: string): AgentEvent[] {
    return this.events.filter(event => event.agentId === agentId)
  }

  /**
   * Get events by type
   */
  getEventsByType(eventType: string): AgentEvent[] {
    return this.events.filter(event => event.type === eventType)
  }

  /**
   * Get events in time range
   */
  getEventsInRange(startTime: Date, endTime: Date): AgentEvent[] {
    return this.events.filter(event => 
      event.timestamp >= startTime && event.timestamp <= endTime
    )
  }

  /**
   * Clear recorded events
   */
  clear(): void {
    this.events = []
  }

  /**
   * Export events to JSON
   */
  exportToJson(): string {
    return JSON.stringify(this.events, null, 2)
  }

  /**
   * Import events from JSON
   */
  importFromJson(json: string): void {
    try {
      const events = JSON.parse(json)
      this.events = events.map((event: any) => ({
        ...event,
        timestamp: new Date(event.timestamp)
      }))
    } catch (error) {
      throw new Error(`Failed to import events: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}