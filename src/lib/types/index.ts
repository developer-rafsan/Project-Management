export interface TelegramConnection {
  _id: string
  userId: string
  telegramId: string
  username?: string
  chatId: string
  isConnected: boolean
  connectedAt: Date
  disconnectedAt?: Date
}

export interface AIConversation {
  _id: string
  userId: string
  telegramId?: string
  messages: AIMessage[]
  sessionId: string
  createdAt: Date
  updatedAt: Date
}

export interface AIMessage {
  role: "user" | "assistant" | "system" | "tool"
  content: string
  toolCalls?: ToolCall[]
  toolCallId?: string
  name?: string
  timestamp: Date
}

export interface ToolCall {
  id: string
  type: "function"
  function: {
    name: string
    arguments: string
  }
}

export interface AISettings {
  _id: string
  userId: string
  enabled: boolean
  model: string
  temperature: number
  maxTokens: number
  promptTemplate: string
  createdAt: Date
  updatedAt: Date
}

export interface ToolDefinition {
  name: string
  description: string
  parameters: Record<string, unknown>
}

export interface ToolResult {
  success: boolean
  data?: unknown
  error?: string
  message?: string
}

export interface TelegramMessage {
  messageId: number
  chatId: string
  text?: string
  from: {
    id: number
    username?: string
    firstName?: string
    lastName?: string
  }
}

export interface AIAgentRequest {
  userId: string
  message: string
  sessionId?: string
  telegramId?: string
}

export interface AIAgentResponse {
  reply: string
  sessionId: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export interface CreateProjectInput {
  projectName: string
  status?: string
  priority?: string
  price?: number
  orderId?: string
  cms?: string
  deadline?: string
}

export interface UpdateProjectInput {
  projectId: string
  updates: Record<string, unknown>
}

export interface AssignDeveloperInput {
  projectId: string
  developerName: string
  developerEmail?: string
}
