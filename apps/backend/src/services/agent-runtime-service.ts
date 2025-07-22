import { Pool } from 'pg';
import { Redis } from 'ioredis';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

// Temporary type definitions until Universal Agent Protocol package is available
interface UniversalAgentAdapter {
  connect(instanceId: string): Promise<void>;
  disconnect(instanceId: string): Promise<void>;
  sendToAgent(instanceId: string, data: any): Promise<void>;
  receiveFromAgent(instanceId: string): any;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface AgentManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  capabilities: string[];
  permissions: string[];
  runtime: 'nodejs' | 'browser' | 'external';
  endpoints?: Record<string, string>;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface CRMData {
  [key: string]: any;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface AgentData {
  [key: string]: any;
}

export interface AgentInstallationRequest {
  businessId: string;
  agentId: string;
  instanceName?: string;
  config: Record<string, any>;
  permissionsGranted: string[];
  installerUserId: string;
}

export interface RuntimeSession {
  id: string;
  installedAgentId: string;
  sessionToken: string;
  status: 'starting' | 'running' | 'paused' | 'stopping' | 'crashed';
  startedAt: Date;
  lastHeartbeat: Date;
  processId?: string;
  workerNode?: string;
  memoryUsageMb: number;
  cpuUsagePercent: number;
  apiCallsCount: number;
  errorCount: number;
  eventsProcessed: number;
}

export interface AgentEvent {
  id: string;
  businessId: string;
  installedAgentId: string;
  eventType: string;
  direction: 'to_agent' | 'from_agent';
  eventData: any;
  correlationId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'retry';
}

export class AgentRuntimeService extends EventEmitter {
  private db: Pool;
  private redis: Redis;
  private runningAgents: Map<string, UniversalAgentAdapter> = new Map();
  private activeSessions: Map<string, RuntimeSession> = new Map();
  private eventQueue: string = 'agent-events';

  constructor(db: Pool, redis: Redis) {
    super();
    this.db = db;
    this.redis = redis;
    this.initializeEventProcessing();
  }

  // Agent Installation Methods
  async installAgent(request: AgentInstallationRequest): Promise<string> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Check if agent exists in registry
      const agentQuery = await client.query(
        'SELECT * FROM agent_registry WHERE agent_id = $1 AND status = $2',
        [request.agentId, 'active']
      );

      if (agentQuery.rows.length === 0) {
        throw new Error(`Agent ${request.agentId} not found or inactive`);
      }

      const agentManifest = agentQuery.rows[0];

      // Check if agent is already installed for this business
      const existingQuery = await client.query(
        'SELECT id FROM installed_agents WHERE business_id = $1 AND agent_id = $2',
        [request.businessId, request.agentId]
      );

      if (existingQuery.rows.length > 0) {
        throw new Error(`Agent ${request.agentId} is already installed for this business`);
      }

      // Validate permissions
      const requiredPermissions = agentManifest.permissions;
      const missingPermissions = requiredPermissions.filter(
        (perm: string) => !request.permissionsGranted.includes(perm)
      );

      if (missingPermissions.length > 0) {
        throw new Error(`Missing required permissions: ${missingPermissions.join(', ')}`);
      }

      // Create installed agent record
      const installedAgentQuery = await client.query(`
        INSERT INTO installed_agents (
          business_id, agent_id, instance_name, installed_version,
          installer_user_id, config, permissions_granted, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `, [
        request.businessId,
        request.agentId,
        request.instanceName,
        agentManifest.version,
        request.installerUserId,
        JSON.stringify(request.config),
        request.permissionsGranted,
        'installing'
      ]);

      const installedAgentId = installedAgentQuery.rows[0].id;

      // Create permission records
      for (const permission of request.permissionsGranted) {
        await client.query(`
          INSERT INTO agent_permissions (installed_agent_id, permission, granted_by_user_id)
          VALUES ($1, $2, $3)
        `, [installedAgentId, permission, request.installerUserId]);
      }

      // Log installation action
      await this.logAuditAction(client, {
        businessId: request.businessId,
        installedAgentId,
        userId: request.installerUserId,
        action: 'install',
        status: 'success',
        requestData: { agentId: request.agentId, config: request.config }
      });

      await client.query('COMMIT');

      // Start agent initialization in background
      this.initializeAgent(installedAgentId).catch(error => {
        console.error(`Failed to initialize agent ${installedAgentId}:`, error);
        this.updateAgentStatus(installedAgentId, 'error', error.message);
      });

      return installedAgentId;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async uninstallAgent(installedAgentId: string, userId: string): Promise<void> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Get agent info
      const agentQuery = await client.query(
        'SELECT * FROM installed_agents WHERE id = $1',
        [installedAgentId]
      );

      if (agentQuery.rows.length === 0) {
        throw new Error('Agent installation not found');
      }

      const agent = agentQuery.rows[0];

      // Stop agent if running
      await this.stopAgent(installedAgentId);

      // Update status to uninstalling
      await client.query(
        'UPDATE installed_agents SET status = $1, updated_at = NOW() WHERE id = $2',
        ['uninstalling', installedAgentId]
      );

      // Log uninstallation
      await this.logAuditAction(client, {
        businessId: agent.business_id,
        installedAgentId,
        userId,
        action: 'uninstall',
        status: 'success'
      });

      await client.query('COMMIT');

      // Clean up agent data (this will cascade delete related records)
      setTimeout(async () => {
        try {
          await this.db.query('DELETE FROM installed_agents WHERE id = $1', [installedAgentId]);
        } catch (error) {
          console.error(`Failed to clean up agent ${installedAgentId}:`, error);
        }
      }, 5000); // 5 second delay to allow final cleanup

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Agent Lifecycle Management
  async startAgent(installedAgentId: string): Promise<RuntimeSession> {
    const agent = await this.getInstalledAgent(installedAgentId);
    if (!agent) {
      throw new Error('Agent not found');
    }

    if (agent.status !== 'active') {
      throw new Error(`Cannot start agent in ${agent.status} status`);
    }

    // Check if already running
    const existingSession = await this.getActiveSession(installedAgentId);
    if (existingSession) {
      return existingSession;
    }

    // Create new runtime session
    const sessionToken = uuidv4();
    const sessionId = uuidv4();

    const session: RuntimeSession = {
      id: sessionId,
      installedAgentId,
      sessionToken,
      status: 'starting',
      startedAt: new Date(),
      lastHeartbeat: new Date(),
      memoryUsageMb: 0,
      cpuUsagePercent: 0,
      apiCallsCount: 0,
      errorCount: 0,
      eventsProcessed: 0
    };

    // Save session to database
    await this.db.query(`
      INSERT INTO agent_runtime_sessions (
        id, installed_agent_id, session_token, status,
        started_at, last_heartbeat
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      sessionId, installedAgentId, sessionToken, 'starting',
      session.startedAt, session.lastHeartbeat
    ]);

    this.activeSessions.set(sessionId, session);

    try {
      // Initialize agent adapter
      const agentAdapter = await this.createAgentAdapter(agent);
      await agentAdapter.connect(sessionToken);
      
      this.runningAgents.set(sessionToken, agentAdapter);
      
      // Update session status
      session.status = 'running';
      await this.updateSessionStatus(sessionId, 'running');

      // Start heartbeat monitoring
      this.startHeartbeatMonitoring(session);

      return session;

    } catch (error) {
      session.status = 'crashed';
      await this.updateSessionStatus(sessionId, 'crashed');
      throw error;
    }
  }

  async stopAgent(installedAgentId: string): Promise<void> {
    const session = await this.getActiveSession(installedAgentId);
    if (!session) {
      return; // Already stopped
    }

    session.status = 'stopping';
    await this.updateSessionStatus(session.id, 'stopping');

    try {
      // Disconnect agent
      const adapter = this.runningAgents.get(session.sessionToken);
      if (adapter) {
        await adapter.disconnect(session.sessionToken);
        this.runningAgents.delete(session.sessionToken);
      }

      // Remove session
      this.activeSessions.delete(session.id);
      await this.db.query('DELETE FROM agent_runtime_sessions WHERE id = $1', [session.id]);

    } catch (error) {
      console.error(`Error stopping agent ${installedAgentId}:`, error);
      // Even if there's an error, mark as stopped
      await this.updateSessionStatus(session.id, 'crashed');
    }
  }

  async pauseAgent(installedAgentId: string): Promise<void> {
    const session = await this.getActiveSession(installedAgentId);
    if (!session) {
      throw new Error('No active session found');
    }

    session.status = 'paused';
    await this.updateSessionStatus(session.id, 'paused');
  }

  async resumeAgent(installedAgentId: string): Promise<void> {
    const session = await this.getActiveSession(installedAgentId);
    if (!session) {
      throw new Error('No session found');
    }

    if (session.status !== 'paused') {
      throw new Error('Agent is not paused');
    }

    session.status = 'running';
    session.lastHeartbeat = new Date();
    await this.updateSessionStatus(session.id, 'running');
  }

  // Event Processing
  async sendEventToAgent(installedAgentId: string, eventType: string, eventData: any, correlationId?: string): Promise<string> {
    const session = await this.getActiveSession(installedAgentId);
    if (!session || session.status !== 'running') {
      throw new Error('Agent is not running');
    }

    const agent = await this.getInstalledAgent(installedAgentId);
    const eventId = uuidv4();

    // Create event record
    await this.db.query(`
      INSERT INTO agent_events (
        id, business_id, installed_agent_id, event_type, direction,
        event_data, correlation_id, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      eventId, agent.business_id, installedAgentId, eventType, 'to_agent',
      JSON.stringify(eventData), correlationId, 'pending'
    ]);

    // Add to processing queue
    await this.redis.lpush(this.eventQueue, JSON.stringify({
      eventId,
      installedAgentId,
      sessionToken: session.sessionToken,
      eventType,
      eventData,
      correlationId
    }));

    return eventId;
  }

  private async initializeEventProcessing(): Promise<void> {
    // Process events from Redis queue
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        const result = await this.redis.brpop(this.eventQueue, 1);
        if (result) {
          const [, eventStr] = result;
          const event = JSON.parse(eventStr);
          await this.processEvent(event);
        }
      } catch (error) {
        console.error('Error processing event:', error);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  private async processEvent(event: any): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Update event status
      await this.db.query(
        'UPDATE agent_events SET status = $1, processed_at = NOW() WHERE id = $2',
        ['processing', event.eventId]
      );

      // Get agent adapter
      const adapter = this.runningAgents.get(event.sessionToken);
      if (!adapter) {
        throw new Error('Agent adapter not found');
      }

      // Send event to agent
      await adapter.sendToAgent(event.sessionToken, event.eventData);

      // Update session metrics
      const session = this.activeSessions.get(event.installedAgentId);
      if (session) {
        session.eventsProcessed++;
        session.lastHeartbeat = new Date();
      }

      // Mark event as completed
      const processingTime = Date.now() - startTime;
      await this.db.query(`
        UPDATE agent_events 
        SET status = $1, processing_time_ms = $2 
        WHERE id = $3
      `, ['completed', processingTime, event.eventId]);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error processing event ${event.eventId}:`, error);
      
      // Update event as failed
      await this.db.query(`
        UPDATE agent_events 
        SET status = $1, error_message = $2, retry_count = retry_count + 1
        WHERE id = $3
      `, ['failed', errorMessage, event.eventId]);

      // Retry logic (max 3 retries)
      const eventRecord = await this.db.query(
        'SELECT retry_count FROM agent_events WHERE id = $1',
        [event.eventId]
      );
      
      if (eventRecord.rows[0]?.retry_count < 3) {
        // Re-queue for retry with exponential backoff
        const delay = Math.pow(2, eventRecord.rows[0].retry_count) * 1000;
        setTimeout(() => {
          this.redis.lpush(this.eventQueue, JSON.stringify(event));
        }, delay);
      }
    }
  }

  // Resource Monitoring
  private startHeartbeatMonitoring(session: RuntimeSession): void {
    const interval = setInterval(async () => {
      try {
        const currentSession = this.activeSessions.get(session.id);
        if (!currentSession || currentSession.status !== 'running') {
          clearInterval(interval);
          return;
        }

        // Update heartbeat
        currentSession.lastHeartbeat = new Date();
        await this.updateSessionHeartbeat(session.id, currentSession.lastHeartbeat);

        // Check for stale sessions (no heartbeat for 5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        if (currentSession.lastHeartbeat < fiveMinutesAgo) {
          console.warn(`Agent session ${session.id} appears stale, stopping...`);
          await this.stopAgent(session.installedAgentId);
          clearInterval(interval);
        }

      } catch (error) {
        console.error(`Heartbeat error for session ${session.id}:`, error);
      }
    }, 30000); // 30 second intervals
  }

  async trackResourceUsage(installedAgentId: string, usage: {
    cpuSeconds: number;
    memoryMbHours: number;
    apiCalls: number;
    eventsProcessed: number;
    dataInBytes: number;
    dataOutBytes: number;
  }): Promise<void> {
    const periodStart = new Date();
    periodStart.setHours(0, 0, 0, 0); // Start of day
    const periodEnd = new Date(periodStart);
    periodEnd.setDate(periodEnd.getDate() + 1); // End of day

    await this.db.query(`
      INSERT INTO agent_resource_usage (
        installed_agent_id, period_start, period_end,
        cpu_seconds_used, memory_mb_hours, api_calls_made,
        events_processed, data_in_bytes, data_out_bytes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (installed_agent_id, period_start)
      DO UPDATE SET
        cpu_seconds_used = agent_resource_usage.cpu_seconds_used + EXCLUDED.cpu_seconds_used,
        memory_mb_hours = agent_resource_usage.memory_mb_hours + EXCLUDED.memory_mb_hours,
        api_calls_made = agent_resource_usage.api_calls_made + EXCLUDED.api_calls_made,
        events_processed = agent_resource_usage.events_processed + EXCLUDED.events_processed,
        data_in_bytes = agent_resource_usage.data_in_bytes + EXCLUDED.data_in_bytes,
        data_out_bytes = agent_resource_usage.data_out_bytes + EXCLUDED.data_out_bytes
    `, [
      installedAgentId, periodStart, periodEnd,
      usage.cpuSeconds, usage.memoryMbHours, usage.apiCalls,
      usage.eventsProcessed, usage.dataInBytes, usage.dataOutBytes
    ]);
  }

  // Helper Methods
  private async createAgentAdapter(agent: any): Promise<UniversalAgentAdapter> {
    // Placeholder implementation until actual adapters are created
    // Load agent adapter based on runtime type
    switch (agent.runtime) {
      case 'nodejs':
        // Return a mock adapter for now
        return {
          connect: async (instanceId: string) => {
            console.log(`Connecting Node.js agent: ${instanceId}`);
          },
          disconnect: async (instanceId: string) => {
            console.log(`Disconnecting Node.js agent: ${instanceId}`);
          },
          sendToAgent: async (instanceId: string, data: any) => {
            console.log(`Sending data to Node.js agent ${instanceId}:`, data);
          },
          receiveFromAgent: (instanceId: string) => {
            console.log(`Receiving data from Node.js agent: ${instanceId}`);
            return null;
          }
        };
      
      case 'browser':
        // Return a mock adapter for now
        return {
          connect: async (instanceId: string) => {
            console.log(`Connecting browser agent: ${instanceId}`);
          },
          disconnect: async (instanceId: string) => {
            console.log(`Disconnecting browser agent: ${instanceId}`);
          },
          sendToAgent: async (instanceId: string, data: any) => {
            console.log(`Sending data to browser agent ${instanceId}:`, data);
          },
          receiveFromAgent: (instanceId: string) => {
            console.log(`Receiving data from browser agent: ${instanceId}`);
            return null;
          }
        };
      
      case 'external':
        // Return a mock adapter for now
        return {
          connect: async (instanceId: string) => {
            console.log(`Connecting external agent: ${instanceId}`);
          },
          disconnect: async (instanceId: string) => {
            console.log(`Disconnecting external agent: ${instanceId}`);
          },
          sendToAgent: async (instanceId: string, data: any) => {
            console.log(`Sending data to external agent ${instanceId}:`, data);
          },
          receiveFromAgent: (instanceId: string) => {
            console.log(`Receiving data from external agent: ${instanceId}`);
            return null;
          }
        };
      
      default:
        throw new Error(`Unsupported runtime: ${agent.runtime}`);
    }
  }

  private async initializeAgent(installedAgentId: string): Promise<void> {
    try {
      // Update status to active
      await this.updateAgentStatus(installedAgentId, 'active');
      
      // Trigger agent-installed event
      this.emit('agentInstalled', { installedAgentId });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.updateAgentStatus(installedAgentId, 'error', errorMessage);
      throw error;
    }
  }

  private async updateAgentStatus(installedAgentId: string, status: string, errorMessage?: string): Promise<void> {
    const errorField = errorMessage ? ', error_message = $3' : '';
    const params = errorMessage ? [status, installedAgentId, errorMessage] : [status, installedAgentId];
    
    await this.db.query(
      `UPDATE installed_agents SET status = $1, updated_at = NOW()${errorField} WHERE id = $2`,
      params
    );
  }

  private async updateSessionStatus(sessionId: string, status: string): Promise<void> {
    await this.db.query(
      'UPDATE agent_runtime_sessions SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, sessionId]
    );
  }

  private async updateSessionHeartbeat(sessionId: string, heartbeat: Date): Promise<void> {
    await this.db.query(
      'UPDATE agent_runtime_sessions SET last_heartbeat = $1 WHERE id = $2',
      [heartbeat, sessionId]
    );
  }

  private async getInstalledAgent(installedAgentId: string): Promise<any> {
    const result = await this.db.query(
      'SELECT * FROM installed_agents WHERE id = $1',
      [installedAgentId]
    );
    return result.rows[0];
  }

  private async getActiveSession(installedAgentId: string): Promise<RuntimeSession | null> {
    const result = await this.db.query(
      'SELECT * FROM agent_runtime_sessions WHERE installed_agent_id = $1 AND status IN ($2, $3, $4)',
      [installedAgentId, 'starting', 'running', 'paused']
    );
    
    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      installedAgentId: row.installed_agent_id,
      sessionToken: row.session_token,
      status: row.status,
      startedAt: row.started_at,
      lastHeartbeat: row.last_heartbeat,
      processId: row.process_id,
      workerNode: row.worker_node,
      memoryUsageMb: row.memory_usage_mb,
      cpuUsagePercent: row.cpu_usage_percent,
      apiCallsCount: row.api_calls_count,
      errorCount: row.error_count,
      eventsProcessed: row.events_processed
    };
  }

  private async logAuditAction(client: any, action: {
    businessId: string;
    installedAgentId?: string;
    userId?: string;
    action: string;
    resourceType?: string;
    resourceId?: string;
    permissionUsed?: string;
    requestData?: any;
    responseData?: any;
    status: 'success' | 'failure' | 'denied';
    errorCode?: string;
    errorMessage?: string;
    ipAddress?: string;
    userAgent?: string;
    executionTimeMs?: number;
  }): Promise<void> {
    await client.query(`
      INSERT INTO agent_audit_log (
        business_id, installed_agent_id, user_id, action,
        resource_type, resource_id, permission_used,
        request_data, response_data, status, error_code,
        error_message, ip_address, user_agent, execution_time_ms
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    `, [
      action.businessId, action.installedAgentId, action.userId, action.action,
      action.resourceType, action.resourceId, action.permissionUsed,
      action.requestData ? JSON.stringify(action.requestData) : null,
      action.responseData ? JSON.stringify(action.responseData) : null,
      action.status, action.errorCode, action.errorMessage,
      action.ipAddress, action.userAgent, action.executionTimeMs
    ]);
  }

  // Public API Methods
  async getInstalledAgents(businessId: string): Promise<any[]> {
    const result = await this.db.query(`
      SELECT ia.*, ar.name, ar.description, ar.icon_url, ar.category, ar.capabilities
      FROM installed_agents ia
      JOIN agent_registry ar ON ia.agent_id = ar.agent_id
      WHERE ia.business_id = $1
      ORDER BY ia.installed_at DESC
    `, [businessId]);
    
    return result.rows;
  }

  async getAgentSessions(businessId: string): Promise<RuntimeSession[]> {
    const result = await this.db.query(`
      SELECT ars.*, ia.agent_id, ar.name
      FROM agent_runtime_sessions ars
      JOIN installed_agents ia ON ars.installed_agent_id = ia.id
      JOIN agent_registry ar ON ia.agent_id = ar.agent_id
      WHERE ia.business_id = $1
      ORDER BY ars.started_at DESC
    `, [businessId]);
    
    return result.rows.map(row => ({
      id: row.id,
      installedAgentId: row.installed_agent_id,
      sessionToken: row.session_token,
      status: row.status,
      startedAt: row.started_at,
      lastHeartbeat: row.last_heartbeat,
      processId: row.process_id,
      workerNode: row.worker_node,
      memoryUsageMb: row.memory_usage_mb,
      cpuUsagePercent: row.cpu_usage_percent,
      apiCallsCount: row.api_calls_count,
      errorCount: row.error_count,
      eventsProcessed: row.events_processed
    }));
  }

  async getAgentEvents(installedAgentId: string, limit: number = 100): Promise<AgentEvent[]> {
    const result = await this.db.query(`
      SELECT * FROM agent_events 
      WHERE installed_agent_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2
    `, [installedAgentId, limit]);
    
    return result.rows.map(row => ({
      id: row.id,
      businessId: row.business_id,
      installedAgentId: row.installed_agent_id,
      eventType: row.event_type,
      direction: row.direction,
      eventData: row.event_data,
      correlationId: row.correlation_id,
      status: row.status
    }));
  }

  async getResourceUsage(installedAgentId: string, days: number = 30): Promise<any[]> {
    const result = await this.db.query(`
      SELECT * FROM agent_resource_usage 
      WHERE installed_agent_id = $1 
        AND period_start >= NOW() - INTERVAL '${days} days'
      ORDER BY period_start DESC
    `, [installedAgentId]);
    
    return result.rows;
  }
}