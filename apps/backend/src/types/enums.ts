// Database enums - aligned with frontend types for progressive disclosure
export enum LeadStatus {
  COLD = 'COLD',
  WARM = 'WARM', 
  HOT = 'HOT',
  CONVERTED = 'CONVERTED',
  LOST = 'LOST'
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum Direction {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND'
}

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  DOCUMENT = 'DOCUMENT',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO'
}

export enum SuggestionType {
  MESSAGE = 'MESSAGE',
  ACTION = 'ACTION',
  FOLLOW_UP = 'FOLLOW_UP',
  STATUS_CHANGE = 'STATUS_CHANGE',
  PRIORITY_UPDATE = 'PRIORITY_UPDATE'
}