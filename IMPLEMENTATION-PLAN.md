# Multi-Workspace + Organization + Team Platform — Implementation Plan

**Based on:** Project Manager v4.0.5 (Next.js 16, React 19, MongoDB, NextAuth.js, Redux Toolkit, Tailwind CSS 4, shadcn/ui)

## Guiding Principles
1. **Backward compatibility** — All existing features continue working. No rewrites.
2. **Permission-first** — `PermissionService` is the single source of truth. Never trust client-provided IDs.
3. **Existing users get a default Individual Workspace** via migration.
4. **Existing projects** associated with that workspace automatically.
5. **Progressive enhancement** — Each phase is independently shippable.

---

## Phase 1: Deep Codebase Analysis ✅ DONE

- [x] Full directory and file inventory
- [x] Read all 12 models, all actions, all lib utilities, all repos, all services
- [x] Read all layouts, components, API routes, pages
- [x] Created `PROJECT-DOCUMENTATION.md` (23 sections)
- [x] Sub-agent analysis of 30 items across the codebase
- [x] Identified exposed secrets in `.env.local`

---

## Phase 2: Workspace Model + Service + API + Switcher UI

### Models
- Create `src/models/Workspace.js`:
  ```
  name: String (required)
  slug: String (required, unique, URL-safe)
  type: enum['individual', 'organization'] (default: 'individual')
  owner: ObjectId ref User (required)
  organization: ObjectId ref Organization (optional)
  settings: {
    defaultRole: 'admin'|'manager'|'member'|'viewer' (default: 'admin'),
    allowInvites: Boolean (default: true),
    maxMembers: Number (default: 10)
  }
  createdAt, updatedAt (timestamps: true)
  ```
- Indexes: `{ slug: 1 }` unique, `{ owner: 1 }`

### Service (`src/lib/services/WorkspaceService.ts`)
- `createWorkspace(data, userId)` — create workspace, return doc
- `getUserWorkspaces(userId)` — workspaces where user is owner OR member
- `getWorkspaceById(workspaceId, userId)` — fetch + permission check
- `updateWorkspace(workspaceId, data, userId)` — owner-only
- `deleteWorkspace(workspaceId, userId)` — owner-only

### Repository (`src/lib/repos/WorkspaceRepo.js`)
- Standard CRUD wrapping Workspace model

### API Routes (`src/app/api/workspaces/`)
- `GET /api/workspaces` — list user's workspaces
- `POST /api/workspaces` — create workspace
- `GET /api/workspaces/[workspaceId]` — get workspace detail
- `PATCH /api/workspaces/[workspaceId]` — update workspace
- `DELETE /api/workspaces/[workspaceId]` — delete workspace

### Redux (`src/lib/redux/`)
- `slices/workspaceSlice.js` — `setCurrentWorkspace`, `setUserWorkspaces`
- API thunks for workspace CRUD
- Persist currentWorkspaceId in localStorage

### Workspace Switcher UI
- `src/app/(dashboard)/dashboard/components/WorkspaceSwitcher.tsx` — dropdown in sidebar/header
- Shows workspace name + type badge
- On switch: update Redux, refetch dashboard data for that workspace

### Files to Create
- `src/models/Workspace.js`
- `src/lib/repos/WorkspaceRepo.js`
- `src/lib/services/WorkspaceService.ts`
- `src/app/api/workspaces/route.ts`
- `src/app/api/workspaces/[workspaceId]/route.ts`
- `src/lib/redux/slices/workspaceSlice.js`
- `src/app/(dashboard)/dashboard/components/WorkspaceSwitcher.tsx`

---

## Phase 3: Default Workspace Migration

### Migration Script (`src/scripts/migrate-default-workspaces.js`)
- Iterate all Users without `defaultWorkspaceCreated` flag
- For each user: create `Workspace` named `"{name}'s Workspace"` with `type: 'individual'`
- Set `workspaceId` on all their existing Projects to the new workspace
- Set flag on User to prevent re-run

### Integration at Auth Time (`src/lib/auth.js`)
- In `signIn` callback (Google OAuth success): after user creation, call `WorkspaceService.createDefaultWorkspace(userId)`

### Files to Modify
- `src/lib/auth.js` — add default workspace creation after new user signup
- `src/models/User.js` — add `defaultWorkspaceCreated: Boolean` field
- Create `src/scripts/migrate-default-workspaces.js`

---

## Phase 4: Individual Multi-Workspace Support

### Workspace Management UI
- `src/app/(dashboard)/dashboard/workspaces/page.tsx` — list all workspaces
- Create workspace modal (name, settings)
- Edit workspace settings modal
- Delete workspace with confirmation

### Files to Create
- `src/app/(dashboard)/dashboard/workspaces/page.tsx`
- `src/app/(dashboard)/dashboard/workspaces/components/CreateWorkspaceModal.tsx`
- `src/app/(dashboard)/dashboard/workspaces/components/WorkspaceList.tsx`
- `src/app/(dashboard)/dashboard/workspaces/components/WorkspaceSettingsModal.tsx`

---

## Phase 5: Organization Model + Workspace

### Models
- Create `src/models/Organization.js`:
  ```
  name: String (required)
  slug: String (required, unique)
  description: String
  logo: String (URL)
  owner: ObjectId ref User (required)
  settings: {
    allowMemberInvites: Boolean (default: true),
    requireAdminApproval: Boolean (default: true),
    maxTeams: Number (default: 20)
  }
  createdAt, updatedAt
  ```
- Indexes: `{ slug: 1 }` unique, `{ owner: 1 }`

### Service (`src/lib/services/OrganizationService.ts`)
- CRUD operations
- `getOrganizationWorkspaces(orgId, userId)` — list workspaces under org
- `createOrganizationWorkspace(orgId, data, userId)` — create workspace within org

### Repository (`src/lib/repos/OrganizationRepo.js`)

### API Routes
- `GET/POST /api/organizations`
- `GET/PATCH/DELETE /api/organizations/[orgId]`
- `GET/POST /api/organizations/[orgId]/workspaces`

### Organization Creation Flow
- User fills org details (name, slug)
- Organization created; owner becomes `admin`
- Default org workspace created automatically
- Invitation system (Phase 9) handles member addition

### Files to Create
- `src/models/Organization.js`
- `src/lib/repos/OrganizationRepo.js`
- `src/lib/services/OrganizationService.ts`
- `src/app/api/organizations/route.ts`
- `src/app/api/organizations/[orgId]/route.ts`
- `src/app/api/organizations/[orgId]/workspaces/route.ts`

---

## Phase 6: Organization Membership + Roles

### Models
- Create `src/models/OrganizationMembership.js`:
  ```
  organization: ObjectId ref Organization (required)
  user: ObjectId ref User (required)
  role: enum['admin', 'manager', 'member', 'viewer'] (default: 'member')
  joinedAt: Date (default: Date.now)
  invitedBy: ObjectId ref User
  status: enum['active', 'invited', 'suspended'] (default: 'active')
  ```
- Compound unique index: `{ organization: 1, user: 1 }`

### Service (`src/lib/services/OrganizationMembershipService.ts`)
- `addMember(orgId, userId, role, invitedBy)`
- `removeMember(orgId, userId)` — cannot remove self if only admin
- `updateMemberRole(orgId, userId, newRole)`
- `getMembers(orgId)` — paginated
- `getUserRole(orgId, userId)` — for PermissionService

### API Routes
- `GET/POST /api/organizations/[orgId]/members`
- `PATCH/DELETE /api/organizations/[orgId]/members/[userId]`

### Files to Create
- `src/models/OrganizationMembership.js`
- `src/lib/repos/OrganizationMembershipRepo.js`
- `src/lib/services/OrganizationMembershipService.ts`
- `src/app/api/organizations/[orgId]/members/route.ts`
- `src/app/api/organizations/[orgId]/members/[userId]/route.ts`

---

## Phase 7: PermissionService

### Centralized Permission Service (`src/lib/services/PermissionService.ts`)

```
class PermissionService {
  // Workspace-level
  async canAccessWorkspace(userId, workspaceId): boolean
  async getWorkspaceRole(userId, workspaceId): role
  async requireWorkspaceAccess(userId, workspaceId): void | throw

  // Organization-level
  async getOrgRole(userId, orgId): role
  async requireOrgRole(userId, orgId, minRole): void | throw

  // Project-level (delegates to workspace check + existing share system)
  async canAccessProject(userId, projectId): boolean
  async requireProjectAccess(userId, projectId): void | throw

  // Cross-cutting checks
  async isAdmin(userId, orgId?: string): boolean
  async hasPermission(userId, permission, resourceId): boolean
}
```

### Integration Points
- Wrap all existing project CRUD API routes with `requireProjectAccess`
- Wrap organization routes with `requireOrgRole`
- Workspace routes with `requireWorkspaceAccess`

### Files to Create
- `src/lib/services/PermissionService.ts`

---

## Phase 8: Team Model + Membership

### Models
- Create `src/models/Team.js`:
  ```
  name: String (required)
  description: String
  workspace: ObjectId ref Workspace (required)
  lead: ObjectId ref User
  createdAt, updatedAt
  ```

- Create `src/models/TeamMembership.js`:
  ```
  team: ObjectId ref Team (required)
  user: ObjectId ref User (required)
  role: enum['lead', 'member'] (default: 'member')
  joinedAt: Date
  ```
- Compound unique index: `{ team: 1, user: 1 }`

### Service (`src/lib/services/TeamService.ts`)
- CRUD for teams within a workspace
- `addMember`, `removeMember`, `setLead`

### API Routes
- `GET/POST /api/workspaces/[workspaceId]/teams`
- `GET/PATCH/DELETE /api/teams/[teamId]`
- `POST/DELETE /api/teams/[teamId]/members`

### Files to Create
- `src/models/Team.js`
- `src/models/TeamMembership.js`
- `src/lib/repos/TeamRepo.js`
- `src/lib/repos/TeamMembershipRepo.js`
- `src/lib/services/TeamService.ts`
- `src/app/api/workspaces/[workspaceId]/teams/route.ts`
- `src/app/api/teams/[teamId]/route.ts`
- `src/app/api/teams/[teamId]/members/route.ts`

---

## Phase 9: Invitation System

### Models
- Create `src/models/Invitation.js`:
  ```
  email: String
  organization: ObjectId ref Organization
  workspace: ObjectId ref Workspace
  team: ObjectId ref Team (optional)
  invitedBy: ObjectId ref User
  role: enum['admin','manager','member','viewer']
  token: String (unique, crypto.randomUUID)
  status: enum['pending','accepted','expired','cancelled'] (default: 'pending')
  expiresAt: Date (default: 7 days)
  createdAt, updatedAt
  ```

### Service (`src/lib/services/InvitationService.ts`)
- `createInvitation(data, invitingUserId)` — generates token, creates record
- `acceptInvitation(token, acceptingUserId)` — creates membership, marks accepted
- `cancelInvitation(invitationId, userId)`
- `getPendingForUser(email)` — look up by email
- `getOrganizationInvitations(orgId)`

### API Routes
- `POST /api/invitations` — create invitation
- `GET /api/invitations/pending` — pending invitations for current user
- `POST /api/invitations/[token]/accept` — accept
- `DELETE /api/invitations/[invitationId]` — cancel
- `GET /api/organizations/[orgId]/invitations` — list for org

### Email Integration (basic)
- Use existing Notification model/action system to notify invited user
- In-app notification: "You've been invited to join {org name}"

### Files to Create
- `src/models/Invitation.js`
- `src/lib/repos/InvitationRepo.js`
- `src/lib/services/InvitationService.ts`
- `src/app/api/invitations/route.ts`
- `src/app/api/invitations/pending/route.ts`
- `src/app/api/invitations/[token]/accept/route.ts`
- `src/app/api/invitations/[invitationId]/route.ts`
- `src/app/api/organizations/[orgId]/invitations/route.ts`

---

## Phase 10: Workspace-Aware Projects

### Project Model Changes (`src/models/Project.js`)
- Add `workspace: ObjectId ref Workspace` (optional for backward compat)
- Add `team: ObjectId ref Team` (optional)
- Migration: set `workspace` on existing projects to user's default workspace

### ProjectService Changes (`src/lib/services/ProjectService.ts`)
- All queries filtered by `workspaceId` from Redux store (not user ID alone)
- `createProject` accepts `workspaceId`
- `getUserProjects(userId, workspaceId)` scoped to workspace

### API Route Changes
- `GET /api/projects?workspaceId=xxx` — all routes accept workspaceId param
- `POST /api/projects` — body includes `workspaceId`

### Dashboard Data Loading (`src/app/(dashboard)/dashboard/page.tsx`)
- Fetch projects filtered by `currentWorkspaceId`
- Stats scoped to workspace

### Files to Modify
- `src/models/Project.js`
- `src/lib/services/ProjectService.ts`
- `src/app/api/projects/route.ts`
- `src/app/api/projects/[projectId]/route.ts`
- `src/app/(dashboard)/dashboard/page.tsx`

---

## Phase 11: Organization Dashboard

### Organization Admin Dashboard
- `src/app/(dashboard)/dashboard/organizations/[orgId]/page.tsx`
- Overview: member count, project count, team count
- Member management (invite, remove, change roles)
- Workspace management (create, suspend)
- Organization settings

### Files to Create
- `src/app/(dashboard)/dashboard/organizations/[orgId]/page.tsx`
- `src/app/(dashboard)/dashboard/organizations/[orgId]/layout.tsx`
- `src/app/(dashboard)/dashboard/organizations/[orgId]/members/page.tsx`
- `src/app/(dashboard)/dashboard/organizations/[orgId]/settings/page.tsx`

---

## Phase 12: Manager Dashboard

### Manager Views
- Team management dashboard
- Project assignment across teams
- Member workload overview
- Reports (basic: project status, member activity)

### Files to Create
- `src/app/(dashboard)/dashboard/manage/page.tsx`
- `src/app/(dashboard)/dashboard/manage/teams/page.tsx`
- `src/app/(dashboard)/dashboard/manage/projects/page.tsx`

---

## Phase 13: Member Dashboard

### Member Views
- My tasks and projects (filtered by teams/membership)
- Team view
- Personal stats within organization
- Invitation acceptance flow

### Files to Modify/Create
- `src/app/(dashboard)/dashboard/page.tsx` — workspace-scoped member view
- `src/app/(dashboard)/dashboard/my-tasks/page.tsx`
- `src/app/(dashboard)/dashboard/teams/page.tsx`

---

## Phase 14: Activity Logging

### Service (`src/lib/services/ActivityService.ts`)
- `logActivity({ type, resourceType, resourceId, userId, orgId, workspaceId, metadata, projectId })`
- `getActivityForOrganization(orgId, filters)`
- `getActivityForWorkspace(workspaceId, filters)`
- `getActivityForProject(projectId, filters)`

### Integration Points
- Wrap workspace CRUD, org CRUD, membership changes, invitation events
- Existing project CRUD already has activity via `createActivity` in actions

### Files to Create
- `src/lib/services/ActivityService.ts`

---

## Phase 15: AI + Telegram Workspace Awareness

### AIAgentService (`src/lib/services/AIAgentService.ts`)
- All tools accept `workspaceId` parameter
- Tool `create_task`: resolves project/assignee within workspace
- Tool `list_projects`: filtered by workspace
- Tool `get_project_stats`: workspace-scoped
- Permission check before executing any tool

### Telegram Bot (`src/app/api/telegram/webhook/[...slug]/route.ts`)
- `/start` command: user selects/creates workspace via inline keyboard
- `/workspace` command: switch workspace
- All project-related commands scoped to active workspace
- User session stored in Redis/in-memory: `{ telegramId -> { workspaceId, userId } }`

### Files to Modify
- `src/lib/services/AIAgentService.ts`
- `src/lib/services/AgentToolService.ts` (if exists)
- `src/app/api/telegram/webhook/[...slug]/route.ts`

---

## Phase 16: UI/UX Polish

### Sidebar Enhancement
- Current project navigation sidebar shows workspace switcher at top
- Organization badge (if in org workspace)
- Teams dropdown under workspace

### Navigation Updates
- Top nav: workspace context indicator
- Breadcrumbs include workspace path

### Responsive Considerations
- Workspace switcher collapses to icon on mobile
- Organization admin panels hide behind hamburger

---

## Phase 17: Reports & Analytics

### Service (`src/lib/services/ReportService.ts`)
- `generateOrgReport(orgId, dateRange)` — member activity, project completion, team velocity
- `generateWorkspaceReport(workspaceId, dateRange)` — per-workspace stats
- `generateMemberReport(userId, workspaceId, dateRange)` — individual contribution

### API Routes
- `GET /api/reports/organizations/[orgId]`
- `GET /api/reports/workspaces/[workspaceId]`

### UI Pages (basic)
- Report view with date range picker
- Export to CSV

---

## Phase 18: Security Audit & Testing

### Security Audit
- Regenerate all exposed secrets in `.env.local` (Google OAuth secret, ENCRYPTION_KEY, NEXTAUTH_SECRET)
- Verify PermissionService gates every API route
- Ensure no client-side role checks as sole authority
- Rate limiting on invitation endpoints
- Input sanitization on all new models

### Testing
- Unit tests for PermissionService (all role combinations)
- Integration tests for workspace-scoped project CRUD
- Migration script test (dry-run mode)
- API route tests for invitation flow

---

## Cross-Cutting Concerns

### Error Handling
- All new services throw typed errors: `PermissionError`, `NotFoundError`, `ValidationError`
- API routes catch and return consistent JSON: `{ error: string, code: string }`

### Middleware
- Consider adding middleware for workspace header injection:
  - Client sends `X-Workspace-Id` header
  - Middleware validates and attaches to request

### Redux State Shape
```js
{
  workspace: {
    currentWorkspaceId: string | null,
    workspaces: [],
    loading: false,
    error: null
  },
  organization: {
    currentOrg: null,
    memberships: [],
    loading: false
  },
  // existing slices remain unchanged
}
```

### Data Fetching Pattern
- All dashboard pages use a `useWorkspace()` hook that returns `{ currentWorkspace, workspaces, switchWorkspace }`
- This hook reads from Redux and fetches if needed
- Dashboard data queries include `workspaceId` in the request

---


