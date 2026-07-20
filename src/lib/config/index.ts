export const config = {
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY || "",
    model: process.env.OPENROUTER_MODEL || "openrouter/free",
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
    defaultModel: "google/gemma-4-31b-it:free",
    defaultTemperature: 0.3,
    defaultMaxTokens: 1024,
    maxHistoryLength: 50,
    sessionTimeoutMs: 30 * 60 * 1000,
    rateLimitPerMinute: 20,
  },
  env: process.env.NODE_ENV || "development",
}

export const PROVIDER_MODELS: Record<string, { value: string; label: string }[]> = {
  openrouter: [
    { value: "google/gemma-4-31b-it:free", label: "google/gemma-4-31b-it:free" },
    { value: "nvidia/nemotron-3-ultra-550b-a55b:free", label: "nvidia/nemotron-3-ultra-550b-a55b:free" },
    { value: "tencent/hy3:free", label: "tencent/hy3:free" },
    { value: "openai/gpt-oss-20b:free", label: "openai/gpt-oss-20b:free" },
  ],
}

export const PROVIDER_LABELS: Record<string, string> = {
  openrouter: "OpenRouter",
}

export function getProviderModels(provider: string): { value: string; label: string }[] {
  return PROVIDER_MODELS[provider] || PROVIDER_MODELS.openrouter
}
