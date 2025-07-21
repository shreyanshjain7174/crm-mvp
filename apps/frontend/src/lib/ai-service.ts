/**
 * AI Service Client - Local AI Employee Management
 */

export interface AIEmployee {
  name: string;
  role: string;
  created_at: string;
  tasks_completed: number;
}

export interface CreateEmployeeRequest {
  name: string;
  role: string;
}

export interface TaskRequest {
  employee_name: string;
  task_description: string;
  context?: {
    lead_data?: any;
    [key: string]: any;
  };
}

export interface TaskResult {
  employee: string;
  role: string;
  task: string;
  result: string;
  success: boolean;
  cost: number;
  completed_at: string;
  total_tasks: number;
}

export interface EmployeeRole {
  name: string;
  description: string;
  capabilities: string[];
  cost: string;
}

export interface AIServiceHealth {
  status: string;
  ai_system: {
    status: string;
    available_models: string[];
    default_model: string;
  };
  total_employees: number;
  employees: AIEmployee[];
  cost_savings: string;
}

class AIServiceClient {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000';
  }

  async healthCheck(): Promise<AIServiceHealth> {
    const response = await fetch(`${this.baseURL}/health`);
    if (!response.ok) {
      throw new Error('AI service health check failed');
    }
    return response.json();
  }

  async getEmployeeRoles(): Promise<EmployeeRole[]> {
    const response = await fetch(`${this.baseURL}/api/templates/employee-roles`);
    if (!response.ok) {
      throw new Error('Failed to fetch employee roles');
    }
    const data = await response.json();
    return data.roles;
  }

  async createEmployee(request: CreateEmployeeRequest): Promise<AIEmployee> {
    const response = await fetch(`${this.baseURL}/api/employees/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create AI employee');
    }

    const data = await response.json();
    return data.employee;
  }

  async listEmployees(): Promise<AIEmployee[]> {
    const response = await fetch(`${this.baseURL}/api/employees`);
    if (!response.ok) {
      throw new Error('Failed to fetch employees');
    }
    const data = await response.json();
    return data.employees;
  }

  async getEmployee(name: string): Promise<AIEmployee> {
    const response = await fetch(`${this.baseURL}/api/employees/${encodeURIComponent(name)}`);
    if (!response.ok) {
      throw new Error(`Employee ${name} not found`);
    }
    return response.json();
  }

  async executeTask(request: TaskRequest): Promise<TaskResult> {
    const response = await fetch(`${this.baseURL}/api/employees/execute-task`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to execute task');
    }

    return response.json();
  }

  async createStarterTeam(): Promise<AIEmployee[]> {
    const response = await fetch(`${this.baseURL}/api/templates/create-starter-team`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create starter team');
    }

    const data = await response.json();
    return data.team;
  }

  // Quick Actions
  async qualifyLead(leadData: any): Promise<TaskResult> {
    const response = await fetch(`${this.baseURL}/api/quick-actions/qualify-lead`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(leadData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to qualify lead');
    }

    return response.json();
  }

  async generateMessage(leadData: any, messageType: string = 'follow_up'): Promise<TaskResult> {
    const response = await fetch(`${this.baseURL}/api/quick-actions/generate-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...leadData, message_type: messageType }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to generate message');
    }

    return response.json();
  }

  async chatWithAI(message: string, leadData?: any): Promise<any> {
    const response = await fetch(`${this.baseURL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        lead_data: leadData,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Chat failed');
    }

    return response.json();
  }
}

export const aiService = new AIServiceClient();