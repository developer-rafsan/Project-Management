export const config = {
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY || "",
    model: process.env.OPENROUTER_MODEL || "deepseek/deepseek-v4-flash",
    baseURL: "https://openrouter.ai/api/v1",
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || "",
    botUsername: process.env.TELEGRAM_BOT_USERNAME || "",
    webhookUrl: process.env.TELEGRAM_WEBHOOK_URL || "",
    apiBase: "https://api.telegram.org/bot",
  },
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    name: "Project Manager",
  },
  ai: {
    defaultProvider: "openrouter",
    defaultModel: "deepseek/deepseek-v4-flash",
    defaultTemperature: 0.3,
    defaultMaxTokens: 1024,
    maxHistoryLength: 50,
    sessionTimeoutMs: 30 * 60 * 1000,
    rateLimitPerMinute: 20,
  },
  env: process.env.NODE_ENV || "development",
}

export const PROVIDER_MODELS: Record<string, { value: string; label: string; free: boolean }[]> = {
  openrouter: [
    { value: "deepseek/deepseek-v4-flash", label: "DeepSeek V4 Flash (Free Credits)", free: true },
    { value: "deepseek/deepseek-v4-pro", label: "DeepSeek V4 Pro (Free Credits)", free: true },
  ],
}

export const PROVIDER_LABELS: Record<string, string> = {
  openrouter: "OpenRouter (Free)",
}

export function getProviderModels(provider: string) {
  return PROVIDER_MODELS[provider] || PROVIDER_MODELS.openrouter
}
