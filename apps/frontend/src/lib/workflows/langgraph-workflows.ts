// @ts-nocheck
import { StateGraph, END, START } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";

// Define the state interface for our CRM workflows
interface CRMWorkflowState {
  messages: BaseMessage[];
  leadId?: string;
  messageId?: string;
  userId?: string;
  businessId?: string;
  context: {
    customerName?: string;
    product?: string;
    intent?: string;
    leadScore?: number;
    conversationHistory?: string[];
    businessProfile?: any;
  };
  currentStep?: string;
  stepResults: Record<string, any>;
  requiresApproval?: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  error?: string;
  retryCount?: number;
}

// Lead Qualification and Response Workflow
export function createLeadQualificationWorkflow() {
  const llm = new ChatOpenAI({
    modelName: "gpt-4o",
    temperature: 0.3,
  });

  // Step 1: Intent Recognition
  const intentRecognition = async (state: CRMWorkflowState): Promise<Partial<CRMWorkflowState>> => {
    const lastMessage = state.messages[state.messages.length - 1];
    
    const intentPrompt = `
    Analyze the following customer message and identify the intent:
    Message: "${lastMessage.content}"
    
    Determine:
    1. Primary intent (inquiry, complaint, purchase, support, etc.)
    2. Urgency level (low, medium, high, urgent)
    3. Product/service interest
    4. Customer sentiment
    
    Respond in JSON format.
    `;

    try {
      const response = await llm.invoke([new HumanMessage(intentPrompt)]);
      const intentData = JSON.parse(response.content as string);
      
      return {
        context: {
          ...state.context,
          intent: intentData.intent,
        },
        stepResults: {
          ...state.stepResults,
          intentRecognition: intentData,
        },
        currentStep: 'leadQualification',
      };
    } catch (error) {
      return {
        error: `Intent recognition failed: ${error}`,
        currentStep: 'error',
      };
    }
  };

  // Step 2: Lead Qualification
  const leadQualification = async (state: CRMWorkflowState): Promise<Partial<CRMWorkflowState>> => {
    const { intent } = state.stepResults.intentRecognition || {};
    const lastMessage = state.messages[state.messages.length - 1];

    const qualificationPrompt = `
    Qualify this lead based on:
    - Message: "${lastMessage.content}"
    - Intent: ${intent}
    - Customer context: ${JSON.stringify(state.context)}
    
    Provide:
    1. Lead score (0-100)
    2. Lead category (hot, warm, cold)
    3. Recommended next action
    4. Priority level
    5. Qualification reasoning
    
    Respond in JSON format.
    `;

    try {
      const response = await llm.invoke([new HumanMessage(qualificationPrompt)]);
      const qualificationData = JSON.parse(response.content as string);
      
      return {
        context: {
          ...state.context,
          leadScore: qualificationData.leadScore,
        },
        stepResults: {
          ...state.stepResults,
          leadQualification: qualificationData,
        },
        currentStep: 'responseGeneration',
      };
    } catch (error) {
      return {
        error: `Lead qualification failed: ${error}`,
        currentStep: 'error',
      };
    }
  };

  // Step 3: Response Generation
  const responseGeneration = async (state: CRMWorkflowState): Promise<Partial<CRMWorkflowState>> => {
    const lastMessage = state.messages[state.messages.length - 1];
    const { leadQualification, intentRecognition } = state.stepResults;

    const responsePrompt = `
    Generate a personalized WhatsApp response based on:
    
    Customer Message: "${lastMessage.content}"
    Customer Name: ${state.context.customerName || 'Customer'}
    Intent: ${intentRecognition?.intent}
    Lead Score: ${leadQualification?.leadScore}
    Lead Category: ${leadQualification?.category}
    Business Context: AI-powered CRM for SMEs
    
    Guidelines:
    - Professional but friendly tone
    - Address their specific intent
    - Include relevant call-to-action
    - Keep it concise for WhatsApp
    - Use appropriate emojis sparingly
    - Personalize with their name
    
    Generate the response message only, no JSON wrapper.
    `;

    try {
      const response = await llm.invoke([new HumanMessage(responsePrompt)]);
      const generatedResponse = response.content as string;
      
      // Check if response needs approval based on lead score or content
      const needsApproval = leadQualification?.leadScore > 80 || 
                           generatedResponse.length > 200 ||
                           intentRecognition?.urgency === 'urgent';
      
      return {
        stepResults: {
          ...state.stepResults,
          responseGeneration: {
            message: generatedResponse,
            needsApproval,
            timestamp: new Date().toISOString(),
          },
        },
        requiresApproval: needsApproval,
        currentStep: needsApproval ? 'humanApproval' : 'sendMessage',
      };
    } catch (error) {
      return {
        error: `Response generation failed: ${error}`,
        currentStep: 'error',
      };
    }
  };

  // Step 4: Human Approval (conditional)
  const humanApproval = async (state: CRMWorkflowState): Promise<Partial<CRMWorkflowState>> => {
    // This step waits for human approval - handled by the frontend
    return {
      currentStep: 'waitingApproval',
      approvalStatus: 'pending',
    };
  };

  // Step 5: Send Message
  const sendMessage = async (state: CRMWorkflowState): Promise<Partial<CRMWorkflowState>> => {
    const { message } = state.stepResults.responseGeneration;
    
    // Simulate sending WhatsApp message
    try {
      // In real implementation, this would call WhatsApp API
      console.log('Sending WhatsApp message:', message);
      
      return {
        stepResults: {
          ...state.stepResults,
          sendMessage: {
            status: 'sent',
            messageId: `msg_${Date.now()}`,
            timestamp: new Date().toISOString(),
          },
        },
        currentStep: 'completed',
      };
    } catch (error) {
      return {
        error: `Failed to send message: ${error}`,
        currentStep: 'error',
      };
    }
  };

  // Define the workflow graph
  const workflow = new StateGraph({
    channels: {
      messages: {
        reducer: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
      },
      leadId: null,
      messageId: null,
      userId: null,
      businessId: null,
      context: {
        reducer: (x: any, y: any) => ({ ...x, ...y }),
      },
      currentStep: null,
      stepResults: {
        reducer: (x: any, y: any) => ({ ...x, ...y }),
      },
      requiresApproval: null,
      approvalStatus: null,
      error: null,
      retryCount: null,
    },
  });

  // Add nodes
  workflow.addNode("intentRecognition", intentRecognition);
  workflow.addNode("leadQualification", leadQualification);
  workflow.addNode("responseGeneration", responseGeneration);
  workflow.addNode("humanApproval", humanApproval);
  workflow.addNode("sendMessage", sendMessage);

  // Define edges
  workflow.addEdge(START, "intentRecognition");
  workflow.addEdge("intentRecognition", "leadQualification");
  workflow.addEdge("leadQualification", "responseGeneration");
  
  // Conditional edge based on approval requirement
  workflow.addConditionalEdges(
    "responseGeneration",
    (state: CRMWorkflowState) => {
      return state.requiresApproval ? "humanApproval" : "sendMessage";
    },
    {
      humanApproval: "humanApproval",
      sendMessage: "sendMessage",
    }
  );
  
  workflow.addEdge("humanApproval", "sendMessage");
  workflow.addEdge("sendMessage", END);

  return workflow.compile();
}

// Follow-up Sequence Workflow
export function createFollowUpWorkflow() {
  const llm = new ChatOpenAI({
    modelName: "gpt-4o",
    temperature: 0.5,
  });

  const contextAnalysis = async (state: CRMWorkflowState): Promise<Partial<CRMWorkflowState>> => {
    const conversationHistory = state.context.conversationHistory || [];
    
    const analysisPrompt = `
    Analyze the conversation context for follow-up:
    
    Conversation History: ${JSON.stringify(conversationHistory)}
    Lead Score: ${state.context.leadScore}
    Last Interaction: ${conversationHistory[conversationHistory.length - 1]}
    Days Since Last Contact: Calculate from timestamps
    
    Determine:
    1. Follow-up strategy (soft, medium, assertive)
    2. Best timing for next contact
    3. Key points to address
    4. Urgency level
    
    Respond in JSON format.
    `;

    try {
      const response = await llm.invoke([new HumanMessage(analysisPrompt)]);
      const analysisData = JSON.parse(response.content as string);
      
      return {
        stepResults: {
          ...state.stepResults,
          contextAnalysis: analysisData,
        },
        currentStep: 'followUpStrategy',
      };
    } catch (error) {
      return {
        error: `Context analysis failed: ${error}`,
        currentStep: 'error',
      };
    }
  };

  const followUpStrategy = async (state: CRMWorkflowState): Promise<Partial<CRMWorkflowState>> => {
    const { contextAnalysis } = state.stepResults;
    
    const strategyPrompt = `
    Create a follow-up strategy based on:
    - Context Analysis: ${JSON.stringify(contextAnalysis)}
    - Customer Profile: ${JSON.stringify(state.context)}
    
    Define:
    1. Follow-up sequence (3-5 touchpoints)
    2. Message types for each touchpoint
    3. Timing between messages
    4. Success metrics
    5. Exit conditions
    
    Respond in JSON format.
    `;

    try {
      const response = await llm.invoke([new HumanMessage(strategyPrompt)]);
      const strategyData = JSON.parse(response.content as string);
      
      return {
        stepResults: {
          ...state.stepResults,
          followUpStrategy: strategyData,
        },
        currentStep: 'messageGeneration',
      };
    } catch (error) {
      return {
        error: `Follow-up strategy failed: ${error}`,
        currentStep: 'error',
      };
    }
  };

  const messageGeneration = async (state: CRMWorkflowState): Promise<Partial<CRMWorkflowState>> => {
    const { followUpStrategy, contextAnalysis } = state.stepResults;
    
    const messagePrompt = `
    Generate the first follow-up message based on:
    - Strategy: ${JSON.stringify(followUpStrategy)}
    - Context: ${JSON.stringify(contextAnalysis)}
    - Customer: ${state.context.customerName}
    
    Create a personalized, engaging follow-up message that:
    - Acknowledges previous interaction
    - Provides value or new information
    - Includes a clear call-to-action
    - Maintains professional tone
    - Optimized for WhatsApp
    
    Generate the message only, no JSON wrapper.
    `;

    try {
      const response = await llm.invoke([new HumanMessage(messagePrompt)]);
      const followUpMessage = response.content as string;
      
      return {
        stepResults: {
          ...state.stepResults,
          messageGeneration: {
            message: followUpMessage,
            timestamp: new Date().toISOString(),
          },
        },
        currentStep: 'scheduleDelivery',
      };
    } catch (error) {
      return {
        error: `Message generation failed: ${error}`,
        currentStep: 'error',
      };
    }
  };

  const scheduleDelivery = async (state: CRMWorkflowState): Promise<Partial<CRMWorkflowState>> => {
    const { followUpStrategy, messageGeneration } = state.stepResults;
    
    // Schedule the message based on strategy timing
    const deliveryTime = new Date();
    deliveryTime.setHours(deliveryTime.getHours() + (followUpStrategy?.timing?.hours || 24));
    
    return {
      stepResults: {
        ...state.stepResults,
        scheduleDelivery: {
          scheduledTime: deliveryTime.toISOString(),
          message: messageGeneration.message,
          status: 'scheduled',
        },
      },
      currentStep: 'completed',
    };
  };

  // Build the follow-up workflow
  const workflow = new StateGraph({
    channels: {
      messages: {
        reducer: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
      },
      leadId: null,
      messageId: null,
      userId: null,
      businessId: null,
      context: {
        reducer: (x: any, y: any) => ({ ...x, ...y }),
      },
      currentStep: null,
      stepResults: {
        reducer: (x: any, y: any) => ({ ...x, ...y }),
      },
      requiresApproval: null,
      approvalStatus: null,
      error: null,
      retryCount: null,
    },
  });

  workflow.addNode("contextAnalysis", contextAnalysis);
  workflow.addNode("followUpStrategy", followUpStrategy);
  workflow.addNode("messageGeneration", messageGeneration);
  workflow.addNode("scheduleDelivery", scheduleDelivery);

  workflow.addEdge(START, "contextAnalysis");
  workflow.addEdge("contextAnalysis", "followUpStrategy");
  workflow.addEdge("followUpStrategy", "messageGeneration");
  workflow.addEdge("messageGeneration", "scheduleDelivery");
  workflow.addEdge("scheduleDelivery", END);

  return workflow.compile();
}

// Workflow Factory
export const WorkflowFactory = {
  createLeadQualificationWorkflow,
  createFollowUpWorkflow,
};

// Export workflow types for the frontend
export type { CRMWorkflowState };