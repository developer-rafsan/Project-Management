# AI Assistant System — Complete Flow Documentation

## 1. Architecture Overview

```
Frontend (React/Next.js)  ─── src/components/ai/*
         │
         ▼
API Routes (Next.js)  ─── src/app/api/ai/*
         │
         ▼
Service Layer  ─── src/lib/services/*.ts
         │
         ▼
Repository Layer  ─── src/lib/repositories/*.ts
         │
         ▼
MongoDB Models  ─── src/models/*.js
```

The AI system uses **OpenRouter** (OpenAI-compatible API) for LLM access. It supports function/tool calling for project CRUD operations, long-term memory extraction, and conversation history management.

---

## 2. Configuration (`src/lib/config/index.ts`)

- **Provider**: OpenRouter (`https://openrouter.ai/api/v1`)
- **Default Model**: `openrouter/free` (Auto Free)
- **Available Models**: DeepSeek V4 Flash, DeepSeek V4 Pro
- **Default Temperature**: 0.3
- **Default Max Tokens**: 1024
- **Max History**: 50 messages per session

---

## 3. Database Models

### AISettings (`src/models/AISettings.js`)
Per-user settings document (one per user):
- `userId`, `enabled`, `provider`, `model`, `temperature`, `maxTokens`
- `promptTemplate` — the system prompt
- `totalTokensUsed` / `totalTokensLimit` — token tracking
- `apiKey` — user's custom API key (optional)
- `telegramConnectCode` — Telegram pairing support

### AIConversation (`src/models/AIConversation.js`)
Conversation sessions with embedded messages (max 50):
- `userId`, `sessionId`, `telegramId`
- `messages[]` — each with `role` (user/assistant/system/tool), `content`, `toolCalls`, `toolCallId`, `name`, `timestamp`

### AIMemory (`src/models/AIMemory.js`)
Long-term memory key-value store:
- `userId`, `category` (preference/fact/event/project/date/general), `key`, `value`
- `sourceSessionId` — which session this memory came from
- `lastAccessed` — timestamp for relevance tracking

---

## 4. Repository Layer

All repositories extend `BaseRepository` (wraps Mongoose).

| Repository | Key Methods |
|---|---|
| `AISettingsRepository` | `getSettings()` — creates defaults if missing; `updateSettings()` — partial update; `addTokensUsed()` — atomic `$inc` |
| `AIConversationRepository` | `getOrCreateSession()`; `addMessage()` — appends with cap; `getHistory()` — last N messages; `getUserSessions()` — paginated list |
| `AIMemoryRepository` | `setMemory()` — upsert; `getMemories()` — sorted by recency; `getMemoryContext()` — builds formatted string for prompt injection |

---

## 5. Service Layer

### AIService — The Core Engine (`src/lib/services/AIService.ts`)

**`chat(userId, message, sessionId?, userName?)` — Complete Flow:**

```
1. Session ID → crypto.randomUUID() if not provided
2. Load Settings → AISettingsRepository.getSettings()
   → If disabled, return early
3. Load History → last 10 messages from session
4. Save User Message → immediately to DB
5. Build System Prompt:
   ├── Base: settings.promptTemplate
   ├── Current date/time (so AI knows "today")
   ├── User name context (for performedBy field)
   └── Memory context (AIMemoryService.buildMemoryContext)
6. Build Messages Array: [system, ...history, user]
7. Load Tool Definitions → AIAgentService.getToolDefinitions()
8. Call OpenRouter API → chat.completions.create() with tools

9. If tool_calls in response:
   ├── Save assistant message with toolCalls
   ├── Execute each tool → AIAgentService.executeToolCalls()
   │   └── Delegates to ProjectService for CRUD
   ├── Save each tool result
   ├── Follow-up API call with tool results injected
   └── Save final assistant reply

10. If no tool_calls (simple reply):
    └── Save assistant reply directly

11. Extract Memories → fire-and-forget (AIMemoryService)
12. Track Token Usage → atomic $inc
13. Return { reply, sessionId, provider, model, usage }
```

### AIAgentService — Tool Definitions (`src/lib/services/AIAgentService.ts`)

7 OpenAI function-calling tools:

| Tool | What it does | How result is formatted |
|---|---|---|
| `getProjects` | List projects (optional status/priority filter) | `"Found 5 project(s):\n1. Name — Status, Priority"` |
| `getProject` | Get single project by ID or name | `"Project: Name\nStatus: ...\nPriority: ..."` |
| `createProject` | Create new project | `"Project "X" created successfully (Status: ...)."` |
| `updateProject` | Update project fields | `"Project "X" updated successfully."` |
| `deleteProject` | Delete project (owner only) | `"Project "X" has been deleted."` |
| `assignDeveloper` | Assign dev to project | `"Dev assigned to "Project X"."` |
| `getProjectSummary` | Summary + status breakdown | `"Total: 10\n\nPending: 3\nIn Progress: 4\n..."` |

All results are **natural language strings** — no raw JSON/arrays returned to the AI.

### AIMemoryService — Long-Term Memory (`src/lib/services/AIMemoryService.ts`)

**`extractMemories(userId, sessionId, userMessage, assistantReply)`:**
- After each response, makes a lightweight AI call to extract key facts
- Prompt: "Extract key facts from this conversation that should be remembered long-term"
- Returns JSON: `[{key: "meeting count", value: "10 meetings scheduled"}, ...]`
- Auto-categorizes into: `preference`, `date`, `project`, or `general`
- Upserts into AIMemory collection

**`buildMemoryContext(userId)`:**
- Before each chat, fetches all stored memories
- Returns formatted string: `"\n\nThings I know about the user:\n- meetings: 10 meetings scheduled\n- ..."`
- Injected into the system prompt

---

## 6. API Routes

### `POST /api/ai/chat`
- **Body**: `{ message: string, sessionId?: string }`
- **Returns**: `{ reply, sessionId, provider, model, usage }`
- **Auth**: NextAuth session required
- **Flow**: Validate → sanitize → AIService.chat() → return response

### `GET /api/ai/settings`
- Returns: `{ enabled, provider, model, temperature, maxTokens, systemPrompt, apiKey, hasApiKey, tokenUsage }`

### `PUT /api/ai/settings`
- Allowed fields: `enabled`, `provider`, `model`, `temperature`, `maxTokens`, `systemPrompt`, `promptTemplate`, `apiKey`
- Maps `systemPrompt` → `promptTemplate` for DB storage

### `GET /api/ai/history`
- With `?sessionId=xxx`: returns all messages for that session
- Without: returns paginated session list `{ conversations, total, page, totalPages }`

### `DELETE /api/ai/history`
- With `?sessionId=xxx`: clears that session
- Without: deletes ALL user sessions

### `POST /api/ai/test-key`
- **Body**: `{ apiKey?: string }`
- Tests API key by sending `"Respond with exactly: ok"` to OpenRouter
- Returns `{ success, message, model, usedKey }`

### `POST /api/ai/generate-prompt`
- **Body**: `{ description: string }`
- Uses AI to generate a system prompt based on user's description

---

## 7. Frontend Components

### AI Assistant Page (`src/app/dashboard/ai-assistant/page.jsx`)
Dashboard page with 3 tabs: AI Chat, Channels, Settings.
- Responsive: horizontal tabs on mobile, vertical sidebar on desktop
- Active tab tracking with animated glow effects

### AIChat (`src/components/ai/AIChat.tsx`)
Core chat UI:
- **Sidebar**: Session history list, new chat button, clear all
- **Messages**: User/AI bubbles with timestamps, copy button, typing indicators
- **Input**: Auto-resizing textarea, model selector dropdown, send button
- **Suggestions**: Quick-prompt chips
- **Token bar**: Shows used/limit with color coding
- **Loading**: Animated typing dots while AI responds

### AISettings (`src/components/ai/AISettings.tsx`)
Configuration UI:
- Model config: provider, model, temperature, max tokens presets
- Token usage progress bar
- API key input with show/hide + test connection
- System prompt editor with presets + AI-powered generator
- Advanced settings: session timeout, max history, rate limit, token limit

### Channels (`src/components/ai/Channels.tsx`)
Telegram integration UI:
- Connection status polling (15s interval)
- Connect/disconnect with TelegramSettings inline
- Expandable card layout

### TelegramSettings (`src/components/ai/TelegramSettings.tsx`)
Telegram bot management:
- Input bot token, connect/disconnect
- Shows bot username, connected timestamp
- How-to instructions for BotFather

---

## 8. Complete End-to-End Flow

```
User types message in AIChat.tsx
    │
    ▼
POST /api/ai/chat { message, sessionId }
    │
    ├── getServerSession() → authenticate
    ├── validateAIMessage() → sanitize
    │
    ▼
AIService.chat(userId, message, sessionId, userName)
    │
    ├── 1. Generate/find sessionId
    ├── 2. Load user settings (if disabled → return)
    ├── 3. Load last 10 history messages
    ├── 4. Save user message to DB
    ├── 5. Build system prompt:
    │      └── template + date + userName + memoryContext
    ├── 6. Build messages: [system, ...history, user]
    ├── 7. Load 7 tool definitions
    ├── 8. Call OpenRouter (with tools)
    │
    ├── [If tool_calls] → Execute tools → Follow-up call → Reply
    └── [If no tool_calls] → Direct reply
    │
    ├── 9. Extract memories (fire-and-forget)
    └── 10. Return { reply, sessionId, provider, model, usage }
    │
    ▼
AIChat.tsx renders response
    ├── Update messages list
    ├── Update token counter
    └── Refresh session list (background)
```

---

## 9. Key Design Decisions

| Aspect | Decision |
|---|---|
| **API Protocol** | OpenAI SDK → OpenRouter (not direct OpenAI) |
| **Auth** | NextAuth `getServerSession` on every route |
| **Tool Calling** | OpenAI function calling + follow-up API call |
| **Memory** | Extract via LLM → store key-value → inject into system prompt |
| **History** | MongoDB embedded messages, capped at 50 |
| **Token Tracking** | Atomic `$inc` on settings document |
| **Streaming** | Not implemented (request/response pattern) |
| **Provider Extensibility** | `getClient()` switch — currently only openrouter |
| **Telegram** | Separate API routes under `/api/telegram/*` |

---

## 10. File Map

| Path | Purpose | Lines |
|---|---|---|
| `src/app/api/ai/chat/route.ts` | Chat API endpoint | 45 |
| `src/app/api/ai/settings/route.ts` | Settings GET/PUT | 70 |
| `src/app/api/ai/history/route.ts` | History GET/DELETE | 65 |
| `src/app/api/ai/test-key/route.ts` | API key test | 56 |
| `src/app/api/ai/generate-prompt/route.ts` | Prompt generator | 59 |
| `src/lib/services/AIService.ts` | Chat orchestrator | 182 |
| `src/lib/services/AIAgentService.ts` | Tool defs + execution | 262 |
| `src/lib/services/AIMemoryService.ts` | Memory extraction | 66 |
| `src/lib/repositories/AIMemoryRepository.ts` | Memory data access | 37 |
| `src/lib/repositories/AISettingsRepository.ts` | Settings data access | 48 |
| `src/lib/repositories/AIConversationRepository.ts` | Conversation data access | 73 |
| `src/models/AISettings.js` | Settings schema | 47 |
| `src/models/AIConversation.js` | Conversation schema | 32 |
| `src/models/AIMemory.js` | Memory schema | 25 |
| `src/lib/config/index.ts` | Central config | 43 |
| `src/app/dashboard/ai-assistant/page.jsx` | AI page | 101 |
| `src/components/ai/AIChat.tsx` | Chat UI | 564 |
| `src/components/ai/AISettings.tsx` | Settings UI | 542 |
| `src/components/ai/Channels.tsx` | Channels UI | 307 |
| `src/components/ai/TelegramSettings.tsx` | Telegram UI | 261 |
| **Total** | | **~3,500** |
