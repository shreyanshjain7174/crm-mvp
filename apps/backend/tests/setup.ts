import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Mock console.log during tests to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock database for testing
const mockData = {
  users: new Map(),
  leads: new Map(),
  messages: new Map(),
  interactions: new Map(),
};

const testDb = {
  query: jest.fn().mockImplementation(async (query: string, params: any[] = []) => {
    // Simple mock implementation for common queries
    if (query.includes('INSERT INTO users')) {
      const [id, email, name, company, password] = params;
      mockData.users.set(id, { id, email, name, company, password });
      return { rows: [], rowCount: 1 };
    }
    
    if (query.includes('INSERT INTO leads')) {
      const [id, name, phone, email, status, priority, source, user_id, created_at] = params.length > 8 ? params : 
        [...params, new Date()];
      mockData.leads.set(id, { 
        id, name, phone, email, status, priority, source, user_id, 
        created_at: created_at || new Date(),
        updated_at: new Date()
      });
      return { rows: [], rowCount: 1 };
    }
    
    if (query.includes('INSERT INTO messages')) {
      const [id, lead_id, content, direction, message_type, status, created_at] = params.length > 6 ? params :
        [...params, new Date()];
      mockData.messages.set(id, { 
        id, lead_id, content, direction, message_type, status, 
        created_at: created_at || new Date() 
      });
      return { rows: [], rowCount: 1 };
    }
    
    // Dashboard stats queries
    if (query.includes('SELECT COUNT(*) as count FROM leads') && !query.includes('WHERE')) {
      return { rows: [{ count: mockData.leads.size.toString() }] };
    }
    
    if (query.includes('SELECT COUNT(DISTINCT leadId) as count') && query.includes('messages')) {
      const uniqueLeadIds = new Set(Array.from(mockData.messages.values()).map((msg: any) => msg.lead_id));
      return { rows: [{ count: uniqueLeadIds.size.toString() }] };
    }
    
    if (query.includes("WHERE status IN ('WARM', 'HOT', 'CONVERTED')")) {
      const convertedLeads = Array.from(mockData.leads.values()).filter((lead: any) => 
        ['WARM', 'HOT', 'CONVERTED'].includes(lead.status)
      ).length;
      return { rows: [{ count: convertedLeads.toString() }] };
    }
    
    if (query.includes("WHERE status = 'HOT'")) {
      const hotLeads = Array.from(mockData.leads.values()).filter((lead: any) => 
        lead.status === 'HOT'
      ).length;
      return { rows: [{ count: hotLeads.toString() }] };
    }
    
    // User progress queries
    if (query.includes("WHERE direction = 'OUTBOUND'")) {
      const outboundMessages = Array.from(mockData.messages.values()).filter((msg: any) => 
        msg.direction === 'OUTBOUND'
      ).length;
      return { rows: [{ count: outboundMessages.toString() }] };
    }
    
    // Growth percentage queries - simulate date filtering
    if (query.includes('INTERVAL') && query.includes('createdAt')) {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      
      // Last 30 days leads
      if (query.includes('30 days') && !query.includes('60 days')) {
        const recentLeads = Array.from(mockData.leads.values()).filter((lead: any) => {
          const leadDate = new Date(lead.created_at);
          return leadDate >= thirtyDaysAgo;
        }).length;
        return { rows: [{ count: recentLeads.toString() }] };
      }
      
      // Previous month (30-60 days ago)
      if (query.includes('60 days') && query.includes('30 days')) {
        const previousMonthLeads = Array.from(mockData.leads.values()).filter((lead: any) => {
          const leadDate = new Date(lead.created_at);
          return leadDate >= sixtyDaysAgo && leadDate < thirtyDaysAgo;
        }).length;
        return { rows: [{ count: previousMonthLeads.toString() }] };
      }
    }
    
    // Default empty response
    return { rows: [], rowCount: 0 };
  }),
  
  end: jest.fn().mockResolvedValue(undefined)
};

beforeEach(() => {
  // Clear mock data before each test
  mockData.users.clear();
  mockData.leads.clear();
  mockData.messages.clear();
  mockData.interactions.clear();
  
  // Reset all mocks
  jest.clearAllMocks();
});

export { testDb };