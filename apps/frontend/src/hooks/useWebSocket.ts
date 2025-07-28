/**
 * WebSocket Hook
 * 
 * Custom hook for WebSocket connection management with automatic reconnection,
 * message queuing, and connection state tracking.
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { WS_BASE_URL } from '@/lib/config'

export interface UseWebSocketOptions {
  enabled?: boolean
  autoConnect?: boolean
  reconnectAttempts?: number
  reconnectDelay?: number
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Error) => void
  onMessage?: (data: any) => void
}

export function useWebSocket({
  enabled = true,
  autoConnect = true,
  reconnectAttempts = 5,
  reconnectDelay = 1000,
  onConnect,
  onDisconnect,
  onError,
  onMessage
}: UseWebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')
  const socketRef = useRef<Socket | null>(null)
  const messageQueueRef = useRef<any[]>([])
  const reconnectCountRef = useRef(0)

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!enabled || socketRef.current?.connected) return

    try {
      setConnectionState('connecting')
      
      const socket = io(WS_BASE_URL, {
        path: '/socket.io/',
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      })

      socket.on('connect', () => {
        console.log('WebSocket connected')
        setIsConnected(true)
        setConnectionState('connected')
        reconnectCountRef.current = 0
        
        // Send queued messages
        messageQueueRef.current.forEach(message => {
          socket.emit('message', message)
        })
        messageQueueRef.current = []
        
        onConnect?.()
      })

      socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason)
        setIsConnected(false)
        setConnectionState('disconnected')
        onDisconnect?.()

        // Auto-reconnect if not intentional disconnect
        if (reason !== 'io client disconnect' && reconnectCountRef.current < reconnectAttempts) {
          setTimeout(() => {
            reconnectCountRef.current++
            connect()
          }, reconnectDelay * Math.pow(2, reconnectCountRef.current))
        }
      })

      socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error)
        setConnectionState('error')
        onError?.(error)
      })

      socket.on('message', (data) => {
        try {
          onMessage?.(data)
        } catch (error) {
          console.error('Error handling WebSocket message:', error)
        }
      })

      // Listen for specific monitoring events
      if (onMessage) {
        socket.on('agent_metrics_update', onMessage)
        socket.on('task_execution_update', onMessage)
        socket.on('new_alert', onMessage)
        socket.on('alert_resolved', onMessage)
      }

      socketRef.current = socket

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      setConnectionState('error')
      onError?.(error instanceof Error ? error : new Error('Connection failed'))
    }
  }, [enabled, reconnectAttempts, reconnectDelay, onConnect, onDisconnect, onError, onMessage])

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }
    setIsConnected(false)
    setConnectionState('disconnected')
  }, [])

  // Send message through WebSocket
  const sendMessage = useCallback((data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('message', data)
    } else if (enabled) {
      // Queue message for when connection is established
      messageQueueRef.current.push(data)
    }
  }, [enabled])

  // Send authentication token
  const authenticate = useCallback((token: string) => {
    if (socketRef.current) {
      socketRef.current.emit('authenticate', token)
    }
  }, [])

  // Join room
  const joinRoom = useCallback((room: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join_room', room)
    }
  }, [])

  // Leave room
  const leaveRoom = useCallback((room: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave_room', room)
    }
  }, [])

  // Auto-connect on mount
  useEffect(() => {
    if (enabled && autoConnect) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [enabled, autoConnect, connect, disconnect])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [])

  return {
    isConnected,
    connectionState,
    connect,
    disconnect,
    sendMessage,
    authenticate,
    joinRoom,
    leaveRoom,
    socket: socketRef.current
  }
}