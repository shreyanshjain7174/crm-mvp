
interface ProcessingResult {
  id: string;
  type: string;
  processed?: boolean;
}

export class AgentDataProcessor {
  constructor(private db: any) {}

  async processContactData(agentId: string, userId: string, payload: any): Promise<ProcessingResult> {
    const result = await this.db.query(`
      INSERT INTO leads (id, name, phone, email, source, user_id, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())
      ON CONFLICT (phone) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        updated_at = NOW()
      RETURNING id
    `, [payload.name, payload.phone, payload.email, `agent:${agentId}`, userId]);
    
    return { id: result.rows[0].id, type: 'contact' };
  }

  async processMessageData(agentId: string, userId: string, payload: any): Promise<ProcessingResult> {
    const result = await this.db.query(`
      INSERT INTO messages (id, lead_id, content, direction, message_type, timestamp, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW(), NOW())
      RETURNING id
    `, [payload.leadId, payload.content, payload.direction || 'INBOUND', payload.type || 'TEXT']);
    
    return { id: result.rows[0].id, type: 'message' };
  }

  async processInteractionData(agentId: string, userId: string, payload: any): Promise<ProcessingResult> {
    const result = await this.db.query(`
      INSERT INTO interactions (id, lead_id, type, description, completed_at, created_at)
      VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW())
      RETURNING id
    `, [payload.leadId, payload.type, payload.description]);
    
    return { id: result.rows[0].id, type: 'interaction' };
  }

  async processCustomData(_agentId: string, _userId: string, _payload: any): Promise<ProcessingResult> {
    return { id: 'custom', type: 'custom', processed: true };
  }

  async queryLeads(userId: string, filters: any, limit = 50, offset = 0) {
    const result = await this.db.query(`
      SELECT * FROM leads 
      WHERE user_id = $1 
      ORDER BY updated_at DESC 
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);
    
    return result.rows;
  }

  async queryMessages(userId: string, filters: any, limit = 50, offset = 0) {
    const result = await this.db.query(`
      SELECT m.*, l.name as lead_name FROM messages m
      JOIN leads l ON m.lead_id = l.id
      WHERE l.user_id = $1 
      ORDER BY m.timestamp DESC 
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);
    
    return result.rows;
  }

  async queryContacts(userId: string, filters: any, limit = 50, offset = 0) {
    return this.queryLeads(userId, filters, limit, offset);
  }

  async queryCustom(agentId: string, filters: any, _limit = 50, _offset = 0) {
    return [];
  }
}