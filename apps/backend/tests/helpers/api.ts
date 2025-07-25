import { FastifyInstance } from 'fastify';
import { InjectOptions } from 'fastify';

export interface ApiTestResponse<T = any> {
  statusCode: number;
  headers: Record<string, string>;
  body: T;
  json: T;
}

export class ApiTestHelper {
  constructor(private app: FastifyInstance) {}

  async get<T = any>(url: string, options?: Partial<InjectOptions>): Promise<ApiTestResponse<T>> {
    const response = await this.app.inject({
      method: 'GET',
      url,
      ...options,
    });
    
    return this.parseResponse<T>(response);
  }

  async post<T = any>(url: string, payload?: any, options?: Partial<InjectOptions>): Promise<ApiTestResponse<T>> {
    const response = await this.app.inject({
      method: 'POST',
      url,
      payload,
      ...options,
    });
    
    return this.parseResponse<T>(response);
  }

  async put<T = any>(url: string, payload?: any, options?: Partial<InjectOptions>): Promise<ApiTestResponse<T>> {
    const response = await this.app.inject({
      method: 'PUT',
      url,
      payload,
      ...options,
    });
    
    return this.parseResponse<T>(response);
  }

  async delete<T = any>(url: string, options?: Partial<InjectOptions>): Promise<ApiTestResponse<T>> {
    const response = await this.app.inject({
      method: 'DELETE',
      url,
      ...options,
    });
    
    return this.parseResponse<T>(response);
  }

  private parseResponse<T>(response: any): ApiTestResponse<T> {
    let body: T;
    let json: T;
    
    try {
      json = JSON.parse(response.body);
      body = json;
    } catch {
      body = response.body;
      json = response.body;
    }
    
    return {
      statusCode: response.statusCode,
      headers: response.headers as Record<string, string>,
      body,
      json,
    };
  }
}

export function createApiHelper(app: FastifyInstance): ApiTestHelper {
  return new ApiTestHelper(app);
}