# Project Manager — Complete Documentation

> **Version:** 4.0.5  
> **Developer:** NanoPiCode (Jahid Islam Rafsan)  
> **Tech Stack:** Next.js 16, React 19, MongoDB, Mongoose, NextAuth.js, Redux Toolkit, Tailwind CSS 4, OpenAI, Serwist (PWA)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Project Structure](#2-project-structure)
3. [Tech Stack & Dependencies](#3-tech-stack--dependencies)
4. [Database Models](#4-database-models)
5. [Authentication System](#5-authentication-system)
6. [API Routes (Endpoints)](#6-api-routes-endpoints)
7. [Server Actions (Client-side API Calls)](#7-server-actions-client-side-api-calls)
8. [Services Layer](#8-services-layer)
9. [Repositories Layer](#9-repositories-layer)
10. [Redux Store & State Management](#10-redux-store--state-management)
11. [Pages & Routes](#11-pages--routes)
12. [UI Components](#12-ui-components)
13. [Layout Components](#13-layout-components)
14. [Dashboard Components](#14-dashboard-components)
15. [Project Components](#15-project-components)
16. [AI Assistant Components](#16-ai-assistant-components)
17. [Shared Components](#17-shared-components)
18. [Utilities & Libraries](#18-utilities--libraries)
19. [Features Overview](#19-features-overview)
20. [How the Site Works](#20-how-the-site-works)
21. [PWA Support](#21-pwa-support)
22. [Environment Variables](#22-environment-variables)
23. [Security Notice](#23-security-notice)

---

## 1. Architecture Overview

Project Manager is a **full-stack web application** built with Next.js 16 (App Router) for project management. It uses:

- **Next.js 16** with App Router for routing (both server and client components)
- **MongoDB + Mongoose** for database
- **NextAuth.js** for Google OAuth authentication
- **Redux Toolkit** for client-side state management
- **Tailwind CSS 4 + shadcn/ui** for styling
- **OpenRouter API** for AI-powered assistant features
- **Telegram Bot API** for Telegram integration
- **Serwist** for PWA (Service Worker) support

### How It Works (End-to-End Flow)

1. User visits → Root layout loads → Session checked
2. If not logged in → Redirect to `/login` → Google OAuth sign-in
3. After login → Redirect to `/dashboard` → Check setup completion
4. If setup incomplete → Redirect to `/setup` for profile setup
5. Dashboard displays stats, charts, recent projects, activity feed
6. User can create/edit/delete projects, manage tasks, take notes, share projects via links
7. AI Assistant (OpenRouter) helps manage projects via chat (web + Telegram)
8. Telegram bot allows project management via messaging
9. PWA service worker enables offline caching

---

## 2. Project Structure

```
C:\DEVELOPMENT\Project-Management\
├── .env.local                          # Environment variables
├── .gitignore
├── components.json                     # shadcn/ui configuration
├── eslint.config.mjs                   # ESLint configuration
├── jsconfig.json                       # JS path aliases
├── next-env.d.ts                       # Next.js TypeScript declarations
├── next.config.mjs                     # Next.js config + Serwist PWA
├── package.json                        # Dependencies & scripts
├── postcss.config.mjs                  # PostCSS config
├── README.md                           # Default Next.js README
├── tsconfig.json                       # TypeScript config
│
├── public/                             # Static assets
│   ├── apple-icon-180x180.png
│   ├── favicon.png
│   ├── file.svg
│   ├── globe.svg
│   ├── logo.png
│   ├── logo-192x192.png
│   ├── logo-512x512.png
│   ├── sw.js                           # Generated service worker
│   └── window.svg
│
└── src/
    ├── proxy.js                        # Next.js middleware (auth guard)
    ├── types/
    │   └── next-auth.d.ts              # NextAuth type declarations
    │
    ├── app/                            # Next.js App Router pages
    │   ├── globals.css                 # Global styles (Tailwind)
    │   ├── layout.js                   # Root layout
    │   ├── manifest.js                 # PWA manifest
    │   ├── page.js                     # Home page (redirect logic)
    │   ├── error.jsx                   # Root error boundary
    │   ├── sw.js                       # Service worker entry
    │   │
    │   ├── api/                        # API routes
    │   │   ├── auth/[...nextauth]/route.js
    │   │   ├── ai/
    │   │   │   ├── chat/route.ts
    │   │   │   ├── settings/route.ts
    │   │   │   ├── history/route.ts
    │   │   │   ├── generate-prompt/route.ts
    │   │   │   └── test-key/route.ts
    │   │   ├── notes/
    │   │   │   ├── route.js
    │   │   │   └── [id]/route.js
    │   │   ├── notifications/
    │   │   │   ├── route.js
    │   │   │   └── [id]/route.js
    │   │   ├── profile/route.js
    │   │   ├── projects/
    │   │   │   ├── route.js
    │   │   │   ├── stats/route.js
    │   │   │   └── [id]/
    │   │   │       ├── route.js
    │   │   │       ├── additional-passwords/route.js
    │   │   │       ├── domain-password/route.js
    │   │   │       ├── notes/
    │   │   │       │   ├── route.js
    │   │   │       │   └── [noteId]/route.js
    │   │   │       ├── password/route.js
    │   │   │       ├── shares/
    │   │   │       │   ├── route.js
    │   │   │       │   └── [shareId]/route.js
    │   │   │       ├── transfer/route.js
    │   │   │       └── updates/route.js
    │   │   ├── settings/route.js
    │   │   ├── shared/[token]/route.js
    │   │   ├── share-list/
    │   │   │   ├── route.js
    │   │   │   └── [token]/route.js
    │   │   ├── tasks/
    │   │   │   ├── route.js
    │   │   │   └── [id]/route.js
    │   │   ├── telegram/
    │   │   │   ├── code/route.ts
    │   │   │   ├── connect/route.ts
    │   │   │   ├── disconnect/route.ts
    │   │   │   ├── save-bot/route.ts
    │   │   │   ├── setup-webhook/route.ts
    │   │   │   ├── status/route.ts
    │   │   │   └── webhook/[...slug]/route.ts
    │   │   └── users/route.js
    │   │
    │   ├── login/
    │   │   ├── page.jsx                # Login page (server)
    │   │   └── LoginClient.jsx         # Login button (client)
    │   ├── setup/page.jsx              # Profile setup wizard
    │   ├── shared/[token]/page.jsx     # Shared project view
    │   ├── shared-list/[token]/page.jsx# Shared project list view
    │   │
    │   └── dashboard/
    │       ├── layout.jsx              # Dashboard layout wrapper
    │       ├── page.jsx                # Dashboard main page
    │       ├── error.jsx               # Dashboard error boundary
    │       ├── loading.jsx             # Dashboard loading state
    │       ├── ai-assistant/page.jsx   # AI Assistant page
    │       ├── notes/page.jsx          # Notes page
    │       ├── profile/page.jsx        # Profile management page
    │       ├── settings/page.jsx       # Settings page
    │       └── projects/
    │           ├── page.jsx            # Projects listing page
    │           ├── loading.jsx
    │           └── [id]/
    │               ├── page.jsx        # Project detail page
    │               └── loading.jsx
    │
    ├── actions/                        # Client-side API fetch functions
    │   ├── noteActions.js
    │   ├── profileActions.js
    │   ├── projectActions.js
    │   ├── settingsActions.js
    │   └── taskActions.js
    │
    ├── components/
    │   ├── ai/
    │   │   ├── AIChat.tsx              # AI chat interface
    │   │   ├── AISettings.tsx          # AI configuration panel
    │   │   ├── Channels.tsx            # Telegram channel settings
    │   │   └── TelegramSettings.tsx    # Telegram connection UI
    │   ├── dashboard/
    │   │   ├── DashboardScreenOptions.jsx
    │   │   ├── MonthlyProgressChart.jsx
    │   │   ├── RecentProjects.jsx
    │   │   ├── RecentUpdates.jsx
    │   │   ├── RevenueSummary.jsx
    │   │   ├── StatsCards.jsx
    │   │   └── StatusChart.jsx
    │   ├── layout/
    │   │   ├── DashboardLayout.jsx     # Dashboard shell
    │   │   ├── Navbar.jsx             # Top navigation bar
    │   │   ├── NotificationProvider.jsx# Notification context
    │   │   ├── Providers.jsx          # Root providers wrapper
    │   │   ├── Sidebar.jsx            # Sidebar navigation
    │   │   └── ThemeProvider.jsx      # Theme context
    │   ├── projects/
    │   │   ├── ContributorRequestDialog.jsx
    │   │   ├── DisplayOptions.jsx
    │   │   ├── MonthTransferDialog.jsx
    │   │   ├── Notes.jsx              # Project notes section
    │   │   ├── Pagination.jsx
    │   │   ├── ProgressDialog.jsx
    │   │   ├── ProjectCard.jsx
    │   │   ├── ProjectDetailHeader.jsx
    │   │   ├── ProjectFilters.jsx
    │   │   ├── ProjectForm.jsx
    │   │   ├── ProjectInfoSidebar.jsx
    │   │   ├── ProjectTable.jsx
    │   │   ├── ProjectTimeline.jsx
    │   │   ├── ShareDialog.jsx
    │   │   ├── ShareListDialog.jsx
    │   │   ├── StatusChangeDialog.jsx
    │   │   ├── TransferAssigneeDialog.jsx
    │   │   └── TransferOwnershipDialog.jsx
    │   ├── shared/
    │   │   ├── ServerError.jsx
    │   │   ├── SharedDeleteConfirm.jsx
    │   │   ├── SharedEditForm.jsx
    │   │   ├── SharedMonthTransfer.jsx
    │   │   └── SharedTransferAssignee.jsx
    │   └── ui/                        # shadcn/ui components
    │       ├── avatar.jsx, badge.jsx, button.jsx, calendar.jsx
    │       ├── card.jsx, checkbox.jsx, command.jsx
    │       ├── date-picker.jsx, date-range-picker.jsx
    │       ├── dialog.jsx, dropdown-menu.jsx
    │       ├── input.jsx, input-group.jsx
    │       ├── popover.jsx, progress.jsx
    │       ├── scroll-area.jsx, select.jsx, separator.jsx
    │       ├── sheet.jsx, skeleton.jsx, sonner.jsx
    │       ├── table.jsx, tabs.jsx, textarea.jsx, tooltip.jsx
    │
    ├── lib/
    │   ├── auth.js                    # NextAuth configuration
    │   ├── config/index.ts           # App configuration
    │   ├── dateUtils.js              # Date/month utilities
    │   ├── encryption.js             # AES-256-CBC encryption
    │   ├── features/
    │   │   └── projectSlice.js       # Redux slice for projects
    │   ├── fetchUtils.js             # Fetch helpers
    │   ├── middlewares/auth.ts       # Auth middleware for API
    │   ├── mongoose.js               # Mongoose connection export
    │   ├── mongodb.js                # MongoDB connection logic
    │   ├── repositories/
    │   │   ├── BaseRepository.ts     # Generic CRUD repository
    │   │   ├── AIConversationRepository.ts
    │   │   ├── AISettingsRepository.ts
    │   │   └── TelegramRepository.ts
    │   ├── services/
    │   │   ├── AIAgentService.ts     # AI tool definitions & execution
    │   │   ├── AIService.ts          # AI chat service
    │   │   ├── ProjectService.ts     # Project CRUD service
    │   │   └── TelegramService.ts    # Telegram API service
    │   ├── store.js                  # Redux store configuration
    │   ├── types/index.ts            # TypeScript type definitions
    │   ├── utils.js                  # cn() utility
    │   ├── utils/logger.ts           # Logging utility
    │   └── validators/index.ts       # Input validators
    │
    └── models/                       # Mongoose schemas
        ├── Activity.js
        ├── AIConversation.js
        ├── AISettings.js
        ├── index.js                  # Model exports
        ├── Note.js
        ├── Notification.js
        ├── Project.js
        ├── ProjectNote.js
        ├── Share.js
        ├── Task.js
        ├── TelegramConnection.js
        └── User.js
```

---

## 3. Tech Stack & Dependencies

### Core
| Package | Version | Purpose |
|---------|---------|---------|
| next | 16.2.9 | Framework (App Router) |
| react | 19.2.4 | UI library |
| react-dom | 19.2.4 | DOM rendering |

### State & Data
| Package | Version | Purpose |
|---------|---------|---------|
| @reduxjs/toolkit | ^2.12.0 | State management |
| react-redux | ^9.3.0 | React-Redux bindings |
| mongoose | ^9.7.3 | MongoDB ODM |

### Authentication
| Package | Version | Purpose |
|---------|---------|---------|
| next-auth | ^4.24.14 | Google OAuth |

### UI & Styling
| Package | Version | Purpose |
|---------|---------|---------|
| tailwindcss | ^4 | CSS framework |
| @tailwindcss/postcss | ^4 | PostCSS plugin |
| tw-animate-css | ^1.4.0 | Animation utilities |
| shadcn | ^4.12.0 | UI component library |
| @base-ui/react | ^1.6.0 | Base UI primitives |
| class-variance-authority | ^0.7.1 | Variant management |
| clsx | ^2.1.1 | Class name utility |
| tailwind-merge | ^3.6.0 | Tailwind class merging |
| lucide-react | ^1.21.0 | Icons |
| framer-motion | ^12.42.0 | Animations |
| cmdk | ^1.1.1 | Command menu |
| sonner | ^2.0.7 | Toast notifications |
| react-day-picker | ^10.0.1 | Date picker |
| date-fns | ^4.4.0 | Date utilities |
| react-hook-form | ^7.80.0 | Form handling |
| @hookform/resolvers | ^5.4.0 | Form validation |
| zod | ^4.4.3 | Schema validation |

### AI & Integration
| Package | Version | Purpose |
|---------|---------|---------|
| openai | ^6.48.0 | OpenAI/OpenRouter API |
| next-themes | ^0.4.6 | Theme management |

### PWA
| Package | Version | Purpose |
|---------|---------|---------|
| @serwist/next | ^9.5.11 | PWA service worker |
| @serwist/sw | ^9.5.11 | Service worker runtime |

### Dev
| Package | Version | Purpose |
|---------|---------|---------|
| eslint | ^9 | Linting |
| eslint-config-next | 16.2.9 | Next.js ESLint config |
| @types/node | 26.1.1 | Node types |
| @types/react | 19.2.17 | React types |
| @vercel/og | ^0.11.1 | Open Graph |

---

## 4. Database Models

### User (`src/models/User.js`)
**Collection:** `users`

| Field | Type | Description |
|-------|------|-------------|
| `name` | String (required) | User's full name |
| `email` | String (required, unique) | Email address |
| `image` | String | Profile image URL |
| `monthStartDay` | Number (default: 1) | Custom month start day |
| `viewMode` | String (enum: list/grid) | Project view preference |
| `fiverrFeeEnabled` | Boolean (default: true) | Fiverr fee calculation |
| `accountType` | String (enum: single/organization) | Account type |
| `phone` | String | Phone number |
| `address` | String | Address |
| `profession` | String | Profession |
| `organizationName` | String | Org name |
| `organizationEmail` | String | Org email |
| `organizationPhone` | String | Org phone |
| `organizationAddress` | String | Org address |
| `organizationWebsite` | String | Org website |
| `organizationLogo` | String | Org logo URL |
| `organizationRole` | String | Role in organization |
| `setupComplete` | Boolean (default: false) | Setup wizard done |

### Project (`src/models/Project.js`)
**Collection:** `projects`

| Field | Type | Description |
|-------|------|-------------|
| `orderId` | String | Auto-generated NPC-XXXXX |
| `projectName` | String (required) | Project name |
| `cms` | String (default: Other) | CMS type |
| `priority` | String (enum: Low/Medium/High/Urgent) | Priority |
| `status` | String (enum: Pending/In Progress/Delivered/Revision/On Hold/Cancelled) | Status |
| `assignee` | Array of `{user, percentage}` | Assigned users |
| `createdBy` | ObjectId (ref: User) | Creator |
| `tags` | [String] | Tags |
| `owner` | ObjectId (ref: User) | Owner |
| `description` | String | Description |
| `price` | Number | Price |
| `fiverrFeeEnabled` | Boolean | Fiverr fee toggle |
| `progress` | Number (0-100) | Progress percentage |
| `websites` | Array of `{name, url, username, password}` | Website credentials |
| `domainHosting` | Array of `{provider, domainUrl, email, password, hostingProvider, hostingEmail, hostingPassword, sameAccount}` | Domain/hosting |
| `links` | Array of `{title, url}` | Related links |
| `currentProjectDate` | Date | Current project date |
| `transferMonth` | Array of `{oldMonth, newMonth, newYear, transferDate, transferredBy}` | Month transfer history |
| `personTransfer` | Array of `{from, to, transferDate}` | Person transfer history |

### Task (`src/models/Task.js`)
**Collection:** `tasks`

| Field | Type | Description |
|-------|------|-------------|
| `title` | String (required) | Task title |
| `description` | String | Description |
| `priority` | String (enum: low/medium/high/urgent) | Priority |
| `status` | String (enum: pending/in_progress/completed/archived) | Status |
| `source` | String (manual/microsoft_teams/ai_detection) | Source |
| `createdBy` | ObjectId (ref: User) | Creator |
| `assignedTo` | ObjectId (ref: User) | Assignee |
| `dueDate` | Date | Due date |
| `project` | String | Related project |
| `labels` | [String] | Labels |
| `confidenceScore` | Number (0-1) | AI confidence |
| `sourceMessage` | String | Source message |
| `sourceUrl` | String | Source URL |
| `assignedByName` | String | Assignee display name |
| `metadata` | Mixed | Extra data |

### Note (`src/models/Note.js`)
**Collection:** `notes` — Simple notes with title, content, createdBy.

### ProjectNote (`src/models/ProjectNote.js`)
**Collection:** `projectnotes` — Notes attached to specific projects.

### Share (`src/models/Share.js`)
**Collection:** `shares`

| Field | Type | Description |
|-------|------|-------------|
| `type` | String (project/list) | Share type |
| `project` | ObjectId (ref: Project) | Shared project |
| `projects` | [ObjectId] | Multiple projects for list shares |
| `token` | String (unique) | Share token (UUID) |
| `createdBy` | ObjectId (ref: User) | Creator |
| `expiresAt` | Date | Expiration (TTL index) |
| `accessLevel` | String (view/manager/full) | Access level |

### Notification (`src/models/Notification.js`)
**Collection:** `notifications` — Handles assignee/owner transfer requests and responses.

### Activity (`src/models/Activity.js`)
**Collection:** `activities` — Activity log entries for project changes.

### AISettings (`src/models/AISettings.js`)
**Collection:** `aisettings` — Per-user AI configuration (provider, model, temperature, token limits, API key, telegram connect code).

### AIConversation (`src/models/AIConversation.js`)
**Collection:** `aiconversations` — Chat history with messages array (role, content, toolCalls).

### TelegramConnection (`src/models/TelegramConnection.js`)
**Collection:** `telegramconnections` — Links Telegram accounts to users.

---

## 5. Authentication System

**File:** `src/lib/auth.js`

Uses **NextAuth.js** with Google OAuth provider:
- Strategy: JWT-based sessions
- On sign-in: Creates user in MongoDB if not exists
- On session: Ensures user exists in DB, attaches `user.id`
- Custom sign-in page: `/login`
- Passwords for websites/domain-hosting are encrypted using AES-256-CBC (see `src/lib/encryption.js`)

**Middleware:** `src/proxy.js` (Next.js middleware) guards `/dashboard/*` routes.

**API Auth Middleware:** `src/lib/middlewares/auth.ts` — `requireAuth()` / `getAuthenticatedUser()` used by API routes.

---

## 6. API Routes (Endpoints)

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| GET/POST | `/api/auth/[...nextauth]` | NextAuth handler |

### Projects
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/projects` | List projects (filters: status, priority, month, year, cms, tags, assignee, search, sort, page, limit) |
| POST | `/api/projects` | Create project (auto-generates Order ID NPC-XXXXX) |
| GET | `/api/projects/stats` | Dashboard stats (status counts, prices, chart data, recent projects, activities) |
| GET | `/api/projects/[id]` | Get project detail |
| PATCH | `/api/projects/[id]` | Update project (assignees can only update status) |
| DELETE | `/api/projects/[id]` | Delete project (owner only) |
| GET | `/api/projects/[id]/password` | Decrypt website password |
| GET | `/api/projects/[id]/additional-passwords` | Decrypt all website passwords |
| GET | `/api/projects/[id]/domain-password` | Decrypt domain/hosting passwords |
| GET | `/api/projects/[id]/updates` | Get activity timeline |
| POST | `/api/projects/[id]/transfer` | Transfer ownership |
| GET/POST | `/api/projects/[id]/notes` | List/Create project notes |
| PATCH/DELETE | `/api/projects/[id]/notes/[noteId]` | Update/Delete project notes |
| GET/POST | `/api/projects/[id]/shares` | List/Create share links |
| DELETE | `/api/projects/[id]/shares/[shareId]` | Revoke share link |

### Tasks
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/tasks` | List tasks (filters: status, priority, today) |
| POST | `/api/tasks` | Create task |
| PATCH | `/api/tasks/[id]` | Update task |
| DELETE | `/api/tasks/[id]` | Delete task |

### Notes
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/notes` | List user notes |
| POST | `/api/notes` | Create note |
| PATCH | `/api/notes/[id]` | Update note |
| DELETE | `/api/notes/[id]` | Delete note |

### Sharing
| Method | Route | Description |
|--------|-------|-------------|
| GET/POST | `/api/share-list` | List/Create shared project lists |
| GET/DELETE | `/api/share-list/[token]` | Get/Delete shared list |
| GET | `/api/shared/[token]` | Get shared project detail |
| PATCH | `/api/shared/[token]` | Update project via shared link |
| DELETE | `/api/shared/[token]` | Delete project via shared link (full access) |

### Notifications
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/notifications` | List notifications (filters: project, type, sent) |
| POST | `/api/notifications` | Create notification (transfer/add/remove requests) |
| PATCH | `/api/notifications/[id]` | Accept/Reject notification or toggle read |
| DELETE | `/api/notifications/[id]` | Delete notification |

### Profile & Settings
| Method | Route | Description |
|--------|-------|-------------|
| GET/PATCH | `/api/profile` | Get/Update user profile |
| GET/PATCH | `/api/settings` | Get/Update user settings (viewMode, monthStartDay, fiverrFeeEnabled) |
| GET | `/api/users` | List users (optional share_token query for public access) |

### AI
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/ai/chat` | Send message to AI assistant |
| GET/PUT | `/api/ai/settings` | Get/Update AI settings |
| GET/DELETE | `/api/ai/history` | Get conversation history / Clear sessions |
| POST | `/api/ai/generate-prompt` | Generate AI system prompt from description |
| GET | `/api/ai/test-key` | Test OpenRouter API key |

### Telegram
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/telegram/connect` | Connect Telegram account |
| POST | `/api/telegram/disconnect` | Disconnect Telegram |
| GET | `/api/telegram/status` | Get connection status |
| POST | `/api/telegram/save-bot` | Save/verify bot token and set webhook |
| POST | `/api/telegram/setup-webhook` | Set Telegram webhook |
| GET/POST | `/api/telegram/code` | Get/Regenerate connect code |
| POST | `/api/telegram/webhook/[...slug]` | Telegram webhook receiver (handles /start, /help, connect codes, AI chat) |

---

## 7. Server Actions (Client-side API Calls)

### `src/actions/projectActions.js`
| Function | Description |
|----------|-------------|
| `getProjects(filters)` | Fetch projects with optional filters |
| `getProject(id)` | Fetch single project |
| `createProject(data)` | Create new project |
| `updateProject(id, data)` | Update project |
| `deleteProject(id)` | Delete project |
| `getUsers()` | Fetch all users |
| `getProjectPassword(projectId)` | Get decrypted website password |
| `getAdditionalPasswords(projectId)` | Get all decrypted website passwords |
| `getProjectActivities(projectId)` | Get activity timeline |
| `getProjectNotes(projectId)` | Get project notes |
| `createNote(projectId, data)` | Add note to project |
| `updateNote(projectId, noteId, data)` | Update project note |
| `deleteNote(projectId, noteId)` | Delete project note |
| `getDomainPassword(projectId)` | Get decrypted domain/hosting passwords |
| `getStats(params)` | Get dashboard statistics |

### `src/actions/taskActions.js`
| Function | Description |
|----------|-------------|
| `getTasks(params)` | Fetch tasks with filters |
| `createTask(data)` | Create task |
| `updateTask(id, data)` | Update task |
| `deleteTask(id)` | Delete task |

### `src/actions/noteActions.js`
| Function | Description |
|----------|-------------|
| `getNotes()` | Fetch user notes |
| `createNote(data)` | Create note |
| `updateNote(id, data)` | Update note |
| `deleteNote(id)` | Delete note |

### `src/actions/profileActions.js`
| Function | Description |
|----------|-------------|
| `getProfile()` | Fetch user profile |
| `updateProfile(data)` | Update user profile |

### `src/actions/settingsActions.js`
| Function | Description |
|----------|-------------|
| `getSettings()` | Fetch user settings |
| `updateSettings(data)` | Update user settings |
| `syncSettingsToLocalStorage(settings)` | Sync settings to localStorage |

---

## 8. Services Layer

### `ProjectService` (`src/lib/services/ProjectService.ts`)
CRUD operations for projects with activity logging:
- `getProjects(userId, filters)` — List projects with optional filters
- `getProjectById(projectId)` — Get single project
- `createProject(userId, data)` — Create with activity log
- `updateProject(projectId, userId, updates)` — Update with permission check
- `deleteProject(projectId, userId)` — Delete (owner only)
- `assignDeveloper(projectId, userId, developerData)` — Assign developer
- `getProjectSummary(userId)` — Summary with status breakdown

### `AIService` (`src/lib/services/AIService.ts`)
AI chat service using OpenRouter:
- `chat(userId, message, sessionId, userName)` — Send message, get AI response
- Supports tool calling (create/update/delete projects, assign developers)
- Fallback model retry logic across multiple models
- Tracks token usage

### `AIAgentService` (`src/lib/services/AIAgentService.ts`)
Defines AI tools and executes them:
- `getToolDefinitions()` — Returns 7 tools: getProjects, getProject, createProject, updateProject, deleteProject, assignDeveloper, getProjectSummary
- `executeToolCalls(toolCalls)` — Executes tool calls from AI

### `TelegramService` (`src/lib/services/TelegramService.ts`)
Telegram Bot API wrapper:
- `getMe(botToken)` — Verify bot token
- `sendMessage(chatId, text, parseMode, botToken)` — Send message
- `sendChatAction(chatId, action)` — Send typing indicator
- `setWebhook(url, botToken)` — Register webhook
- `formatProjectList(projects)` / `formatProjectDetail(project)` / `formatSuccessMessage(title, details)` — Message formatting

---

## 9. Repositories Layer

### `BaseRepository` (`src/lib/repositories/BaseRepository.ts`)
Generic CRUD for MongoDB:
- `findById`, `findOne`, `find`, `create`, `updateById`, `updateOne`, `deleteById`, `deleteOne`, `count`, `exists`

### `AISettingsRepository` (`src/lib/repositories/AISettingsRepository.ts`)
- `getSettings(userId)` — Get or create AI settings
- `updateSettings(userId, updates)` — Update settings
- `addTokensUsed(userId, tokens)` — Increment token count
- `findByConnectCode(code)` — Find by telegram code
- `setConnectCode / clearConnectCode` — Manage connect codes

### `AIConversationRepository` (`src/lib/repositories/AIConversationRepository.ts`)
- `getOrCreateSession`, `addMessage`, `getHistory`, `getUserSessions`, `clearSession`, `clearAllSessions`

### `TelegramRepository` (`src/lib/repositories/TelegramRepository.ts`)
- `findByUserId`, `findByTelegramId`, `connect`, `saveBotConfig`, `getBotConfig`, `disconnect`, `getConnectionStatus`

---

## 10. Redux Store & State Management

**File:** `src/lib/store.js`
- Single slice: `projects`
- Configured with Redux Toolkit

**Slice:** `src/lib/features/projectSlice.js`
| Action | Description |
|--------|-------------|
| `fetchProjects` (async) | Fetch all projects from API |
| `clearProjects` | Clear project list |
| `addProject` | Add project to beginning |
| `updateProjectInStore` | Update project by ID |
| `removeProject` | Remove project by ID |

State shape: `{ items: [], total, totalPrice, loading, error, fetched }`

---

## 11. Pages & Routes

### Public Routes
| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `page.js` | Redirects to `/dashboard` or `/login` |
| `/login` | `LoginClient.jsx` | Google OAuth sign-in |
| `/setup` | Multi-step wizard | Profile setup (account type, personal/org info) |
| `/shared/[token]` | Dynamic page | View shared project detail |
| `/shared-list/[token]` | Dynamic page | View shared project list |

### Dashboard Routes (Protected)
| Route | Component | Description |
|-------|-----------|-------------|
| `/dashboard` | `page.jsx` | Main dashboard with stats, charts, recent projects |
| `/dashboard/projects` | `page.jsx` | Projects listing with filters, bulk actions |
| `/dashboard/projects/[id]` | `page.jsx` | Project detail with sidebar, timeline, notes |
| `/dashboard/notes` | `page.jsx` | Personal notes management |
| `/dashboard/profile` | `page.jsx` | Profile viewing/editing |
| `/dashboard/settings` | `page.jsx` | Settings (General, AI Channels, AI Config) |
| `/dashboard/ai-assistant` | `page.jsx` | AI chat interface |

---

## 12. UI Components (shadcn/ui)

All located in `src/components/ui/`:

| Component | Description |
|-----------|-------------|
| `avatar.jsx` | User avatar with fallback |
| `badge.jsx` | Status/category badges |
| `button.jsx` | Variants: default, destructive, outline, secondary, ghost, link |
| `calendar.jsx` | Date picker calendar |
| `card.jsx` | Card with header/content/footer |
| `checkbox.jsx` | Checkbox input |
| `command.jsx` | Command menu (cmd+k style) |
| `date-picker.jsx` | Single date picker |
| `date-range-picker.jsx` | Date range picker |
| `dialog.jsx` | Modal dialog |
| `dropdown-menu.jsx` | Dropdown menu |
| `input.jsx` | Text input |
| `input-group.jsx` | Input with label/error |
| `popover.jsx` | Popover overlay |
| `progress.jsx` | Progress bar |
| `scroll-area.jsx` | Custom scroll area |
| `select.jsx` | Select dropdown |
| `separator.jsx` | Divider |
| `sheet.jsx` | Slide-out panel |
| `skeleton.jsx` | Loading skeleton |
| `sonner.jsx` | Toast notifications |
| `table.jsx` | Data table |
| `tabs.jsx` | Tab navigation |
| `textarea.jsx` | Multi-line text input |
| `tooltip.jsx` | Tooltip on hover |

---

## 13. Layout Components

### `Providers.jsx`
Wraps app with: Redux Provider → SessionProvider → ThemeProvider → TooltipProvider → NotificationProvider → Toaster

### `DashboardLayout.jsx`
- Checks auth status, redirects to /login if unauthenticated
- Loads user settings on mount
- Checks setup completion, redirects to /setup if incomplete
- Layout: Sidebar (left) + Navbar (top) + main content + footer

### `Sidebar.jsx`
Navigation links: Dashboard, Projects, Notes, Profile, AI Assistant, Settings, Logout
- Responsive: Overlay sheet on mobile, fixed sidebar on desktop
- Active route highlighting with indicator

### `Navbar.jsx`
- Page title based on route
- Search button → dialog to search projects by Order ID
- Notification bell with badge + dropdown panel
- User avatar → link to profile
- Mobile menu sheet (same links as sidebar)
- Notification accept/reject actions inline

### `NotificationProvider.jsx`
Context providing:
- `notifications`, `unreadCount`, `fetchNotifications`
- `markAsRead`, `setReadStatus`
- `acceptTransfer(notification)`, `rejectTransfer(notification)`
- Auto-polls every 30 seconds for new notifications

### `ThemeProvider.jsx`
- Dark/Light theme toggle
- Persists to localStorage
- Adds/removes `dark` class on `<html>`

---

## 14. Dashboard Components

### `StatsCards.jsx`
Displays: Total Projects, Running, Completed, Pending, On Hold, Revision with animated counts.

### `RevenueSummary.jsx`
Financial summary: Total Revenue, Delivered, In Progress, Fiverr Fee (20%), Net Profit.

### `StatusChart.jsx`
Pie/donut chart showing project distribution by status with colors.

### `MonthlyProgressChart.jsx`
Bar chart showing daily project creation count over the selected month/range.

### `RecentProjects.jsx`
Last 10 projects with status badges and quick links.

### `RecentUpdates.jsx`
Recent activity timeline (last 10) with avatars and descriptions.

### `DashboardScreenOptions.jsx`
Toggle visibility of dashboard sections (stats, revenue, charts, projects, updates, filter bar).

---

## 15. Project Components

### `ProjectForm.jsx`
Full create/edit form with fields:
- Order ID, Name, CMS, Priority, Status, Price, Progress
- Description, Tags, Websites (multiple), Links (multiple)
- Domain/Hosting (multiple), Fiverr Fee toggle
- Assignee selection with percentage

### `ProjectFilters.jsx`
Filter by: Status (multi-select), Priority, CMS, Search text.

### `ProjectTable.jsx`
Tabular view: index, orderId, project name, status (clickable), priority, CMS, price, progress, created date, actions.

### `ProjectCard.jsx`
Grid view card with all key info and action buttons.

### `DisplayOptions.jsx`
Toggle columns in table view.

### `Pagination.jsx`
Page navigation with page numbers.

### `ProjectDetailHeader.jsx`
Breadcrumbs, title with status/priority badges, action buttons (status, duplicate, transfer month, transfer ownership, share, delete).

### `ProjectInfoSidebar.jsx`
Multiple cards on project detail page:
- `ProjectDetailsCard` — Status, Priority, Price, Progress, Dates
- `ProjectWebsiteCard` — Websites with password show/hide
- `ProjectDomainCard` — Domain/Hosting info
- `ProjectLinksCard` — Related links
- `ProjectContributorsCard` — Assignee list with percentages
- `ProjectMetaCard` — Created by, Created date, Order ID
- `ProjectTagsCard` — Tag badges

### `ProjectTimeline.jsx`
Activity feed with icons for each action type, user avatars, relative timestamps.

### `Notes.jsx`
Project-specific notes (add, edit, delete).

### `StatusChangeDialog.jsx`
Quick status change with note.

### `MonthTransferDialog.jsx`
Transfer project to another month.

### `TransferAssigneeDialog.jsx`
Transfer project to another user (assignee).

### `TransferOwnershipDialog.jsx`
Transfer full ownership to another user.

### `ShareDialog.jsx`
Create share link for a project with expiration and access level (view/manager/full).

### `ShareListDialog.jsx`
Create/manage share lists (multiple projects).

### `ProgressDialog.jsx`
Quick progress percentage update.

### `ContributorRequestDialog.jsx`
Request to add/remove/update assignee.

---

## 16. AI Assistant Components

### `AIChat.tsx`
Full chat interface with:
- Message history display
- Text input with send button
- Session management (new chat, clear)
- Model/provider info display
- Loading states

### `AISettings.tsx`
AI configuration panel:
- Enable/disable AI
- API Key input (per-user or global)
- Model selection (Qwen3 Coder, DeepSeek V4 Flash, Gemini Flash, GPT-OSS, Qwen3)
- Temperature, Max Tokens sliders
- System prompt editor
- Auto-generate prompt button
- Token usage display with limit
- Test API key button

### `Channels.tsx`
Telegram channel settings:
- Connection status display
- Connect code generation
- Custom bot token setup
- Disconnect option

### `TelegramSettings.tsx`
Detailed Telegram configuration:
- Bot token input + validation
- Connection code for linking Telegram
- Webhook URL display
- Connection status

---

## 17. Shared Components

### `ServerError.jsx`
Full-page or inline server error display with retry button.

### `SharedEditForm.jsx`
Edit form for shared project view.

### `SharedDeleteConfirm.jsx`
Delete confirmation for shared view.

### `SharedMonthTransfer.jsx`
Month transfer for shared view.

### `SharedTransferAssignee.jsx`
Assignee transfer for shared view.

---

## 18. Utilities & Libraries

| File | Description |
|------|-------------|
| `src/lib/utils.js` | `cn()` — Tailwind class merge utility |
| `src/lib/dateUtils.js` | `getMonthRange()`, `getMonthFromDate()`, `getEffectiveMonthYear()` |
| `src/lib/encryption.js` | `encrypt(text)`, `decrypt(data)` — AES-256-CBC |
| `src/lib/fetchUtils.js` | `handleResponse()`, `buildQueryString()` |
| `src/lib/utils/logger.ts` | Structured logger with levels (debug/info/warn/error) |
| `src/lib/validators/index.ts` | Input validators (sanitizeInput, validateProjectName, validateTelegramId, validateObjectId, validatePagination, validateAIMessage) |
| `src/lib/config/index.ts` | App configuration (OpenRouter, Telegram, AI defaults) |
| `src/lib/types/index.ts` | TypeScript interfaces |

---

## 19. Features Overview

### Core Features
1. **Project Management** — Full CRUD with auto-generated Order IDs (NPC-XXXXX)
2. **Dashboard** — Stats, charts, revenue tracking, recent activity
3. **User Authentication** — Google OAuth via NextAuth.js
4. **Multi-user Collaboration** — Assignees with percentage shares, owner/assignee permissions
5. **Project Status Workflow** — Pending → In Progress → Delivered → Revision → On Hold → Cancelled
6. **Priority Levels** — Low, Medium, High, Urgent
7. **Website & Domain Credential Management** — Encrypted storage (AES-256-CBC)
8. **Activity Timeline** — Full audit trail for all project changes
9. **Project Notes** — Per-project notes with user attribution
10. **Personal Notes** — User-level notes
11. **Task Management** — Basic todo/task tracking
12. **Tag System** — Flexible tagging for projects
13. **Progress Tracking** — 0-100% progress per project
14. **Revenue Tracking** — Price + Fiverr fee (20%) calculations
15. **Month Transfer** — Move projects between months
16. **Person Transfer** — Transfer ownership or assignee
17. **Notification System** — Accept/reject requests for transfers
18. **Sharing** — Share individual projects or lists via token links
19. **Shared Access Levels** — View, Manager, Full
20. **Search** — Search projects by Order ID from navbar
21. **Bulk Actions** — Bulk status change and delete
22. **Multiple View Modes** — List and grid views
23. **Custom Month Start Day** — Flexible accounting periods
24. **Dark/Light Theme** — Toggle with localStorage persistence
25. **PWA Support** — Installable, offline caching via service worker
26. **AI Assistant** — Chat-based project management using OpenRouter API
27. **Telegram Bot Integration** — Manage projects via Telegram messages
28. **Profile Management** — Personal/Organization profiles
29. **Setup Wizard** — First-time user onboarding
30. **Display Customization** — Toggle dashboard sections and table columns

---

## 20. How the Site Works (Step-by-Step)

### A. First Visit & Authentication
1. User visits `https://[domain]/`
2. `src/app/page.js` checks for session via `getServerSession()`
3. If no session → Redirects to `/login`
4. Login page shows "Sign in with Google" button
5. User clicks → Google OAuth flow → User created in MongoDB if new
6. Redirected to `/dashboard`

### B. Setup Wizard (First Login)
1. `DashboardLayout` checks `setupComplete` field
2. If `false` → Redirects to `/setup`
3. User selects account type (Individual/Organization)
4. Fills in contact/profession/organization info
5. Profile saved → Redirected to `/dashboard`

### C. Dashboard Experience
1. Projects loaded via Redux (fetched once, cached)
2. Dashboard filters projects by current month (based on monthStartDay)
3. Stats cards show counts by status
4. Revenue summary calculates personal share based on assignee percentage
5. Charts show status distribution and daily progress
6. Recent projects and updates shown at bottom
7. User can switch between Month/Range/All filter modes

### D. Project Management
1. Users go to `/dashboard/projects`
2. View all projects in list or grid mode
3. Filter by status, priority, CMS, search, month/range
4. Create new project via dialog form → auto-generates Order ID
5. Click project → Detail page with:
   - Activity timeline
   - Project notes
   - Sidebar with details, websites (encrypted passwords), domains, links, contributors, metadata
6. Update status, priority, progress, etc.
7. Transfer month, transfer assignee, transfer ownership
8. Share via token link with expiration

### E. AI Assistant
1. Go to `/dashboard/ai-assistant`
2. Configure AI settings first (Settings → AI Configuration)
3. Set API key or use global key
4. Chat with AI — can create/update/delete/list projects via natural language
5. AI uses tool calling to execute actions

### F. Telegram Integration
1. Go to Settings → AI Channels
2. Set up a Telegram Bot (create via @BotFather, paste token)
3. Or connect via code: Get code from dashboard → Send to Telegram bot
4. Once connected, send commands like "Show my projects", "Create project XYZ"
5. Bot replies with formatted project info

### G. Sharing
1. On project detail → Share button
2. Set expiration (1h, 24h, custom) and access level (view/manager/full)
3. Copy link — anyone with the link can view/edit based on access level
4. Share lists → Select multiple projects → Share link
5. Revoke shares anytime

### H. Notifications & Transfers
1. Owner can request: add assignee, remove assignee, transfer ownership
2. Target user receives notification (bell icon + dropdown)
3. Can Accept or Reject inline
4. On accept: Project updated, activity logged, response notification sent back

---

## 21. PWA Support

**Config:** `next.config.mjs` — Uses `@serwist/next` to inject service worker.

**Service Worker:** `src/app/sw.js` — Precache + runtime caching with defaultCache.

**Manifest:** `src/app/manifest.js` — PWA manifest with icons, standalone display, categories.

**User can install the app** as a native-like application on mobile/desktop.

---

## 22. Environment Variables

| Variable | Description |
|----------|-------------|
| `NanoPiCode_MONGODB_URI` | MongoDB connection string |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `ENCRYPTION_KEY` | Key for AES-256-CBC encryption |
| `NEXTAUTH_SECRET` | NextAuth.js JWT secret |
| `NEXT_PUBLIC_APP_URL` | Public app URL (e.g. http://localhost:3000) |
| `OPENROUTER_API_KEY` | Global OpenRouter API key (optional) |
| `TELEGRAM_BOT_TOKEN` | Global Telegram bot token (optional) |
| `TELEGRAM_BOT_USERNAME` | Telegram bot username |
| `TELEGRAM_WEBHOOK_URL` | Webhook URL for Telegram bot |
| `LOG_LEVEL` | Logger level (debug/info/warn/error) |

---

## 23. Security Notice

> **⚠️ CRITICAL: The `.env.local` file contains exposed secrets!**  
> The file at `.env.local` includes:
> - Google OAuth Client Secret
> - Encryption Key
> - NextAuth Secret
>
> **These should NEVER be committed to version control.**  
> The `.env.local` is in `.gitignore`, but the values are still visible in the local file system. In production, use environment variables on your hosting platform. Also consider:
> - Regenerating the Google OAuth secret
> - Changing the ENCRYPTION_KEY and NEXTAUTH_SECRET
> - Using a MongoDB Atlas URI (not localhost) in production
