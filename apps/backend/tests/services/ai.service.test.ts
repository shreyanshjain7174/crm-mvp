import { Pool } from 'pg';
import { AIService } from '../../src/services/ai.service';
import { SuggestionType } from '../../src/types/enums';
import { getTestPool, cleanDatabase } from '../helpers/db';
import Anthropic from '@anthropic-ai/sdk';

// Mock Anthropic SDK
jest.mock('@anthropic-ai/sdk');
const MockedAnthropic = Anthropic as jest.MockedClass<typeof Anthropic>;

describe('AI Service', () => {
  let aiService: AIService;
  let testPool: Pool;
  let mockAnthropic: jest.Mocked<Anthropic>;
  const originalEnv = process.env;

  beforeAll(async () => {
    testPool = getTestPool();
  });

  beforeEach(async () => {
    await cleanDatabase();
    
    // Setup environment
    process.env = { ...originalEnv };
    
    // Mock Anthropic
    mockAnthropic = {
      messages: {
        create: jest.fn()
      }
    } as any;
    
    MockedAnthropic.mockImplementation(() => mockAnthropic);
    
    aiService = new AIService(testPool);
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  describe('Service Initialization', () => {
    it('should initialize without Anthropic API key', () => {
      delete process.env.ANTHROPIC_API_KEY;
      const service = new AIService(testPool);
      expect(service).toBeInstanceOf(AIService);
    });

    it('should initialize with Anthropic API key', () => {
      process.env.ANTHROPIC_API_KEY = 'test-api-key';
      const service = new AIService(testPool);
      expect(service).toBeInstanceOf(AIService);
      expect(MockedAnthropic).toHaveBeenCalledWith({
        apiKey: 'test-api-key'
      });
    });

    it('should handle missing database pool', () => {
      expect(() => new AIService(null as any)).not.toThrow();
    });
  });

  describe('Suggestion Generation', () => {
    let leadId: string;
    let userId: string;

    beforeEach(async () => {
      // Create test user and lead
      const userResult = await testPool.query(
        'INSERT INTO users (email, password, name, company) VALUES ($1, $2, $3, $4) RETURNING id',
        ['test@example.com', 'password', 'Test User', 'Test Company']
      );
      userId = userResult.rows[0].id;

      const leadResult = await testPool.query(
        'INSERT INTO leads (name, phone, email, status, priority, source, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
        ['Test Lead', '+1234567890', 'lead@example.com', 'WARM', 'MEDIUM', 'WhatsApp', userId]
      );
      leadId = leadResult.rows[0].id;

      // Add some test messages
      await testPool.query(
        'INSERT INTO messages (lead_id, content, direction, message_type, timestamp) VALUES ($1, $2, $3, $4, $5)',
        [leadId, 'Hello, I need information about your products', 'INBOUND', 'TEXT', new Date()]
      );
      await testPool.query(
        'INSERT INTO messages (lead_id, content, direction, message_type, timestamp) VALUES ($1, $2, $3, $4, $5)',
        [leadId, 'Thank you for your inquiry! Let me help you.', 'OUTBOUND', 'TEXT', new Date(Date.now() - 1000)]
      );
    });

    it('should generate suggestion with Claude API when configured', async () => {
      process.env.ANTHROPIC_API_KEY = 'test-api-key';
      const service = new AIService(testPool);
      
      mockAnthropic.messages.create.mockResolvedValue({
        content: [{ type: 'text', text: 'Based on your inquiry, I recommend our premium package which includes...' }],
        model: 'claude-3-sonnet-20240229',
        role: 'assistant',
        stop_reason: 'end_turn',
        stop_sequence: null,
        type: 'message',
        usage: { input_tokens: 100, output_tokens: 50 }
      });

      const suggestion = await service.generateSuggestion(leadId, SuggestionType.MESSAGE);

      expect(suggestion).toBeDefined();
      expect(suggestion.type).toBe(SuggestionType.MESSAGE);
      expect(suggestion.lead_id).toBe(leadId);
      expect(suggestion.content).toContain('premium package');
      expect(suggestion.confidence).toBe(0.85);
      expect(mockAnthropic.messages.create).toHaveBeenCalledWith({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: expect.stringContaining('You are an AI CRM assistant')
          }
        ]
      });
    });

    it('should generate fallback suggestion when Claude API is not configured', async () => {
      delete process.env.ANTHROPIC_API_KEY;
      const service = new AIService(testPool);

      const suggestion = await service.generateSuggestion(leadId, SuggestionType.MESSAGE);

      expect(suggestion).toBeDefined();
      expect(suggestion.type).toBe(SuggestionType.MESSAGE);
      expect(suggestion.lead_id).toBe(leadId);
      expect(suggestion.content).toContain('Thank you for your message');
      expect(suggestion.confidence).toBe(0.6);
      expect(mockAnthropic.messages.create).not.toHaveBeenCalled();
    });

    it('should fallback to rule-based when Claude API fails', async () => {
      process.env.ANTHROPIC_API_KEY = 'test-api-key';
      const service = new AIService(testPool);
      
      mockAnthropic.messages.create.mockRejectedValue(new Error('API Error'));

      const suggestion = await service.generateSuggestion(leadId, SuggestionType.MESSAGE);

      expect(suggestion).toBeDefined();
      expect(suggestion.content).toContain('Thank you for your message');
      expect(suggestion.confidence).toBe(0.6); // Fallback confidence
    });

    it('should throw error for non-existent lead', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      
      await expect(
        aiService.generateSuggestion(nonExistentId, SuggestionType.MESSAGE)
      ).rejects.toThrow('Lead not found');
    });

    it('should handle different suggestion types', async () => {
      const types = [
        SuggestionType.MESSAGE,
        SuggestionType.FOLLOW_UP,
        SuggestionType.STATUS_CHANGE,
        SuggestionType.PRIORITY_UPDATE
      ];

      for (const type of types) {
        const suggestion = await aiService.generateSuggestion(leadId, type);
        expect(suggestion.type).toBe(type);
        expect(suggestion.content).toBeDefined();
        expect(suggestion.content.length).toBeGreaterThan(0);
      }
    });

    it('should include context in suggestion when provided', async () => {
      const context = 'Customer expressed interest in premium features';
      
      const suggestion = await aiService.generateSuggestion(
        leadId, 
        SuggestionType.MESSAGE, 
        context
      );

      expect(suggestion.context).toBe(context);
    });
  });

  describe('Fallback Suggestion Generation', () => {
    let leadId: string;
    let userId: string;

    beforeEach(async () => {
      const userResult = await testPool.query(
        'INSERT INTO users (email, password, name, company) VALUES ($1, $2, $3, $4) RETURNING id',
        ['test@example.com', 'password', 'Test User', 'Test Company']
      );
      userId = userResult.rows[0].id;

      const leadResult = await testPool.query(
        'INSERT INTO leads (name, phone, email, status, priority, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        ['Test Lead', '+1234567890', 'lead@example.com', 'COLD', 'LOW', userId]
      );
      leadId = leadResult.rows[0].id;
    });

    it('should generate message suggestion for lead with no messages', async () => {
      const suggestion = await aiService.generateSuggestion(leadId, SuggestionType.MESSAGE);
      
      expect(suggestion.content).toContain('Hope you\'re doing well');
      expect(suggestion.content).toContain('Test Lead');
    });

    it('should generate follow-up suggestion based on last contact time', async () => {
      // Add old message (over 7 days ago)
      const oldTimestamp = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
      await testPool.query(
        'INSERT INTO messages (lead_id, content, direction, timestamp) VALUES ($1, $2, $3, $4)',
        [leadId, 'Old message', 'INBOUND', oldTimestamp]
      );

      const suggestion = await aiService.generateSuggestion(leadId, SuggestionType.FOLLOW_UP);
      
      expect(suggestion.content).toContain('check-in message');
      expect(suggestion.content).toContain('over a week');
    });

    it('should suggest status change for engaged cold lead', async () => {
      // Add recent messages to cold lead
      await testPool.query(
        'INSERT INTO messages (lead_id, content, direction, timestamp) VALUES ($1, $2, $3, $4)',
        [leadId, 'Recent engagement', 'INBOUND', new Date()]
      );

      const suggestion = await aiService.generateSuggestion(leadId, SuggestionType.STATUS_CHANGE);
      
      expect(suggestion.content).toContain('WARM');
      expect(suggestion.content).toContain('recent engagement');
    });

    it('should suggest priority update for highly engaged lead', async () => {
      // Add multiple recent messages
      for (let i = 0; i < 4; i++) {
        await testPool.query(
          'INSERT INTO messages (lead_id, content, direction, timestamp) VALUES ($1, $2, $3, $4)',
          [leadId, `Message ${i}`, 'INBOUND', new Date(Date.now() - i * 1000)]
        );
      }

      const suggestion = await aiService.generateSuggestion(leadId, SuggestionType.PRIORITY_UPDATE);
      
      expect(suggestion.content).toContain('increasing priority');
      expect(suggestion.content).toContain('highly engaged');
    });
  });

  describe('Claude API Integration', () => {
    let leadId: string;
    let userId: string;

    beforeEach(async () => {
      process.env.ANTHROPIC_API_KEY = 'test-api-key';
      
      const userResult = await testPool.query(
        'INSERT INTO users (email, password, name, company) VALUES ($1, $2, $3, $4) RETURNING id',
        ['test@example.com', 'password', 'Test User', 'Test Company']
      );
      userId = userResult.rows[0].id;

      const leadResult = await testPool.query(
        'INSERT INTO leads (name, phone, email, status, priority, source, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
        ['Indian Business Lead', '+91-9876543210', 'business@example.in', 'HOT', 'HIGH', 'WhatsApp', userId]
      );
      leadId = leadResult.rows[0].id;
    });

    it('should build appropriate system prompt for Indian SME context', async () => {
      const service = new AIService(testPool);
      
      mockAnthropic.messages.create.mockResolvedValue({
        content: [{ type: 'text', text: 'Professional response for Indian business context' }],
        model: 'claude-3-sonnet-20240229',
        role: 'assistant',
        stop_reason: 'end_turn',
        stop_sequence: null,
        type: 'message',
        usage: { input_tokens: 100, output_tokens: 50 }
      });

      await service.generateSuggestion(leadId, SuggestionType.MESSAGE);

      const callArgs = mockAnthropic.messages.create.mock.calls[0][0];
      const prompt = callArgs.messages[0].content;
      
      expect(prompt).toContain('AI CRM assistant for Indian SMEs');
      expect(prompt).toContain('Indian business culture');
      expect(prompt).toContain('WhatsApp');
      expect(prompt).toContain('Indian Business Lead');
      expect(prompt).toContain('+91-9876543210');
    });

    it('should build different user prompts for different suggestion types', async () => {
      const service = new AIService(testPool);
      
      mockAnthropic.messages.create.mockResolvedValue({
        content: [{ type: 'text', text: 'Test response' }],
        model: 'claude-3-sonnet-20240229',
        role: 'assistant',
        stop_reason: 'end_turn',
        stop_sequence: null,
        type: 'message',
        usage: { input_tokens: 100, output_tokens: 50 }
      });

      // Test MESSAGE type
      await service.generateSuggestion(leadId, SuggestionType.MESSAGE);
      let prompt = mockAnthropic.messages.create.mock.calls[0][0].messages[0].content;
      expect(prompt).toContain('WhatsApp message response');
      expect(prompt).toContain('160 characters');

      // Test FOLLOW_UP type
      jest.clearAllMocks();
      await service.generateSuggestion(leadId, SuggestionType.FOLLOW_UP);
      prompt = mockAnthropic.messages.create.mock.calls[0][0].messages[0].content;
      expect(prompt).toContain('follow-up action');
      expect(prompt).toContain('timing');

      // Test STATUS_CHANGE type
      jest.clearAllMocks();
      await service.generateSuggestion(leadId, SuggestionType.STATUS_CHANGE);
      prompt = mockAnthropic.messages.create.mock.calls[0][0].messages[0].content;
      expect(prompt).toContain('status should be updated');
      expect(prompt).toContain('Current status: HOT');
    });

    it('should handle Claude API rate limiting errors', async () => {
      const service = new AIService(testPool);
      
      mockAnthropic.messages.create.mockRejectedValue(
        new Error('Rate limit exceeded')
      );

      const suggestion = await service.generateSuggestion(leadId, SuggestionType.MESSAGE);
      
      // Should fallback to rule-based suggestion
      expect(suggestion.content).toBeDefined();
      expect(suggestion.confidence).toBe(0.6);
    });

    it('should handle Claude API authentication errors', async () => {
      const service = new AIService(testPool);
      
      mockAnthropic.messages.create.mockRejectedValue(
        new Error('Invalid API key')
      );

      const suggestion = await service.generateSuggestion(leadId, SuggestionType.MESSAGE);
      
      // Should fallback gracefully
      expect(suggestion.content).toBeDefined();
      expect(suggestion.confidence).toBe(0.6);
    });

    it('should handle Claude API response format variations', async () => {
      const service = new AIService(testPool);
      
      // Test with empty content
      mockAnthropic.messages.create.mockResolvedValue({
        content: [],
        model: 'claude-3-sonnet-20240229',
        role: 'assistant',
        stop_reason: 'end_turn',
        stop_sequence: null,
        type: 'message',
        usage: { input_tokens: 100, output_tokens: 0 }
      });

      const suggestion = await service.generateSuggestion(leadId, SuggestionType.MESSAGE);
      expect(suggestion.content).toBe('');

      // Test with non-text content
      jest.clearAllMocks();
      mockAnthropic.messages.create.mockResolvedValue({
        content: [{ type: 'image', source: { type: 'base64', media_type: 'image/png', data: 'test' } }],
        model: 'claude-3-sonnet-20240229',
        role: 'assistant',
        stop_reason: 'end_turn',
        stop_sequence: null,
        type: 'message',
        usage: { input_tokens: 100, output_tokens: 50 }
      } as any);

      const suggestion2 = await service.generateSuggestion(leadId, SuggestionType.MESSAGE);
      expect(suggestion2.content).toBe('');
    });
  });

  describe('Suggestion Execution', () => {
    let leadId: string;
    let userId: string;
    let suggestionId: string;

    beforeEach(async () => {
      const userResult = await testPool.query(
        'INSERT INTO users (email, password, name, company) VALUES ($1, $2, $3, $4) RETURNING id',
        ['test@example.com', 'password', 'Test User', 'Test Company']
      );
      userId = userResult.rows[0].id;

      const leadResult = await testPool.query(
        'INSERT INTO leads (name, phone, email, status, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        ['Test Lead', '+1234567890', 'lead@example.com', 'WARM', userId]
      );
      leadId = leadResult.rows[0].id;

      const suggestionResult = await testPool.query(
        'INSERT INTO ai_suggestions (lead_id, type, content, confidence) VALUES ($1, $2, $3, $4) RETURNING *',
        [leadId, SuggestionType.FOLLOW_UP, 'Schedule follow-up call', 0.8]
      );
      suggestionId = suggestionResult.rows[0].id;
    });

    it('should execute follow-up suggestion by creating interaction', async () => {
      const suggestion = {
        id: suggestionId,
        lead_id: leadId,
        type: SuggestionType.FOLLOW_UP,
        content: 'Schedule follow-up call in 2 days'
      };

      await aiService.executeSuggestion(suggestion);

      // Check that interaction was created
      const interactions = await testPool.query(
        'SELECT * FROM interactions WHERE lead_id = $1',
        [leadId]
      );
      
      expect(interactions.rows).toHaveLength(1);
      expect(interactions.rows[0].type).toBe('NOTE');
      expect(interactions.rows[0].description).toContain('AI Suggested Follow-up');
      expect(interactions.rows[0].scheduled_at).toBeDefined();

      // Check that suggestion was marked as executed
      const updatedSuggestion = await testPool.query(
        'SELECT executed, executed_at FROM ai_suggestions WHERE id = $1',
        [suggestionId]
      );
      
      expect(updatedSuggestion.rows[0].executed).toBe(true);
      expect(updatedSuggestion.rows[0].executed_at).toBeDefined();
    });

    it('should handle message suggestion execution', async () => {
      const suggestion = {
        id: suggestionId,
        lead_id: leadId,
        type: SuggestionType.MESSAGE,
        content: 'Thank you for your interest!'
      };

      // Should not throw error
      await expect(aiService.executeSuggestion(suggestion)).resolves.not.toThrow();
      
      // Should mark as executed
      const updatedSuggestion = await testPool.query(
        'SELECT executed FROM ai_suggestions WHERE id = $1',
        [suggestionId]
      );
      
      expect(updatedSuggestion.rows[0].executed).toBe(true);
    });

    it('should handle status change suggestion execution', async () => {
      const suggestion = {
        id: suggestionId,
        lead_id: leadId,
        type: SuggestionType.STATUS_CHANGE,
        content: 'Update status to HOT due to high engagement'
      };

      await expect(aiService.executeSuggestion(suggestion)).resolves.not.toThrow();
      
      const updatedSuggestion = await testPool.query(
        'SELECT executed FROM ai_suggestions WHERE id = $1',
        [suggestionId]
      );
      
      expect(updatedSuggestion.rows[0].executed).toBe(true);
    });

    it('should handle priority update suggestion execution', async () => {
      const suggestion = {
        id: suggestionId,
        lead_id: leadId,
        type: SuggestionType.PRIORITY_UPDATE,
        content: 'Increase priority to HIGH'
      };

      await expect(aiService.executeSuggestion(suggestion)).resolves.not.toThrow();
      
      const updatedSuggestion = await testPool.query(
        'SELECT executed FROM ai_suggestions WHERE id = $1',
        [suggestionId]
      );
      
      expect(updatedSuggestion.rows[0].executed).toBe(true);
    });

    it('should handle database errors during execution', async () => {
      const suggestion = {
        id: 'invalid-id',
        lead_id: leadId,
        type: SuggestionType.FOLLOW_UP,
        content: 'Test content'
      };

      await expect(aiService.executeSuggestion(suggestion)).rejects.toThrow();
    });
  });

  describe('Integration and Performance', () => {
    let leadId: string;
    let userId: string;

    beforeEach(async () => {
      const userResult = await testPool.query(
        'INSERT INTO users (email, password, name, company) VALUES ($1, $2, $3, $4) RETURNING id',
        ['test@example.com', 'password', 'Test User', 'Test Company']
      );
      userId = userResult.rows[0].id;

      const leadResult = await testPool.query(
        'INSERT INTO leads (name, phone, email, status, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        ['Test Lead', '+1234567890', 'lead@example.com', 'WARM', userId]
      );
      leadId = leadResult.rows[0].id;
    });

    it('should handle concurrent suggestion generation', async () => {
      const promises = Array.from({ length: 5 }, (_, i) =>
        aiService.generateSuggestion(leadId, SuggestionType.MESSAGE, `Context ${i}`)
      );

      const suggestions = await Promise.all(promises);
      
      expect(suggestions).toHaveLength(5);
      suggestions.forEach((suggestion, i) => {
        expect(suggestion.context).toBe(`Context ${i}`);
        expect(suggestion.lead_id).toBe(leadId);
      });
    });

    it('should complete suggestion generation within reasonable time', async () => {
      const startTime = Date.now();
      
      await aiService.generateSuggestion(leadId, SuggestionType.MESSAGE);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete quickly for fallback suggestions
      expect(duration).toBeLessThan(1000);
    });

    it('should handle leads with large message history efficiently', async () => {
      // Create many messages
      for (let i = 0; i < 50; i++) {
        await testPool.query(
          'INSERT INTO messages (lead_id, content, direction, timestamp) VALUES ($1, $2, $3, $4)',
          [leadId, `Message ${i}`, i % 2 === 0 ? 'INBOUND' : 'OUTBOUND', new Date(Date.now() - i * 1000)]
        );
      }

      const startTime = Date.now();
      const suggestion = await aiService.generateSuggestion(leadId, SuggestionType.MESSAGE);
      const endTime = Date.now();

      expect(suggestion).toBeDefined();
      expect(endTime - startTime).toBeLessThan(2000); // Should handle efficiently
    });

    it('should maintain data consistency during concurrent operations', async () => {
      // Generate multiple suggestions concurrently
      const suggestionPromises = Array.from({ length: 3 }, () =>
        aiService.generateSuggestion(leadId, SuggestionType.FOLLOW_UP)
      );

      const suggestions = await Promise.all(suggestionPromises);
      
      // Check that all suggestions were saved
      const savedSuggestions = await testPool.query(
        'SELECT * FROM ai_suggestions WHERE lead_id = $1',
        [leadId]
      );

      expect(savedSuggestions.rows).toHaveLength(3);
      
      // Each suggestion should have unique ID
      const ids = savedSuggestions.rows.map(s => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(3);
    });
  });
});