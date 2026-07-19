import OpenAI from 'openai'
import { config } from '@/lib/config'
import { logger } from '@/lib/utils/logger'

export enum Intent {
  GENERAL_CHAT = 'GENERAL_CHAT',
  GREETING = 'GREETING',
  HELP = 'HELP',
  PROJECT_CREATE = 'PROJECT_CREATE',
  PROJECT_UPDATE = 'PROJECT_UPDATE',
  PROJECT_DELETE = 'PROJECT_DELETE',
  PROJECT_LIST = 'PROJECT_LIST',
  PROJECT_GET = 'PROJECT_GET',
  PROJECT_SUMMARY = 'PROJECT_SUMMARY',
  ASSIGN_DEVELOPER = 'ASSIGN_DEVELOPER',
  SEARCH_PROJECT = 'SEARCH_PROJECT',
  UNKNOWN = 'UNKNOWN',
}

const ASYNC_PROJECT_INTENTS = new Set([
  Intent.PROJECT_CREATE,
  Intent.PROJECT_UPDATE,
  Intent.PROJECT_DELETE,
  Intent.PROJECT_LIST,
  Intent.PROJECT_GET,
  Intent.PROJECT_SUMMARY,
  Intent.ASSIGN_DEVELOPER,
  Intent.SEARCH_PROJECT,
])

export function isProjectIntent(intent: Intent): boolean {
  return ASYNC_PROJECT_INTENTS.has(intent)
}

const FAST_PATH_GREETINGS = /^(hi|hello|hey|hi there|hello there|good morning|good afternoon|good evening|howdy|wasup|sup|yo|hii|hiii|helloo|hlo|ello|heyya|heya)\b/i
const FAST_PATH_THANKS = /^(thanks|thank you|thank|thx|ty|appreciate it|thanks a lot|thanks so much)\b/i
const FAST_PATH_BYE = /^(bye|goodbye|see you|talk later|cya|see ya|gotta go|gtg)\b/i
const FAST_PATH_HELP = /^(help|what can you do|what do you do|how can you help|commands|what are your capabilities|what are you capable of)\b/i

export class IntentDetector {
  private getClient() {
    return new OpenAI({
      apiKey: config.openrouter.apiKey || '',
      baseURL: config.openrouter.baseURL,
    })
  }

  async detect(message: string): Promise<Intent> {
    const trimmed = message.trim()

    if (FAST_PATH_GREETINGS.test(trimmed)) return Intent.GREETING
    if (FAST_PATH_THANKS.test(trimmed) || FAST_PATH_BYE.test(trimmed)) return Intent.GENERAL_CHAT
    if (FAST_PATH_HELP.test(trimmed)) return Intent.HELP

    if (trimmed.length < 3) return Intent.UNKNOWN

    if (!config.openrouter.apiKey) return Intent.UNKNOWN

    try {
      const client = this.getClient()
      const intentsList = Object.values(Intent).join(', ')

      const prompt = `Classify this message's intent. Reply with ONLY one word from this list: ${intentsList}

Rules:
- GREETING: hello, hi, hey, good morning
- HELP: asking what assistant can do or how it works
- GENERAL_CHAT: casual conversation, jokes, opinions, stories, naming, translations, math, writing, programming, general knowledge, "how are you", "tell me a joke", "give you a name", "what do you think"
- PROJECT_CREATE: create, add, make, start a new project
- PROJECT_UPDATE: update, change, rename, modify, edit a project
- PROJECT_DELETE: delete, remove, destroy project
- PROJECT_LIST: show, list, get my projects or all projects
- PROJECT_GET: show details of a specific project
- PROJECT_SUMMARY: project statistics, summary, overview, report, count
- ASSIGN_DEVELOPER: assign, add developer, add team member to project
- SEARCH_PROJECT: search, find, look for a project
- UNKNOWN: ambiguous, unclear, or doesn't fit above

Message: ${trimmed}
Intent:`

      const completion = await client.chat.completions.create({
        model: 'openrouter/auto',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 8,
        temperature: 0,
      })

      const content = completion.choices?.[0]?.message?.content?.trim().toUpperCase() || 'UNKNOWN'

      if (Object.values(Intent).includes(content as Intent)) {
        return content as Intent
      }

      return Intent.UNKNOWN
    } catch (error) {
      logger.error('Intent detection failed', error)
      return Intent.UNKNOWN
    }
  }
}
