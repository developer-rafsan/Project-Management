import { ProjectService } from '@/lib/services/ProjectService'
import { logger } from '@/lib/utils/logger'

interface ToolCallItem {
  id: string
  function: { name: string; arguments: string }
}

export class AIAgentService {
  private projectService: ProjectService
  private userId: string

  constructor(userId: string) {
    this.projectService = new ProjectService()
    this.userId = userId
  }

  getToolDefinitions() {
    return [
      {
        type: 'function' as const,
        function: {
          name: 'getProjects',
          description: `List all projects for the current user with optional status/priority filters.

USE THIS ONLY FOR:
- listing/showing all projects
- filtering projects by status or priority
- checking how many projects exist

NEVER USE FOR:
- greetings, casual conversation, jokes, naming, programming questions, translations, math, writing, opinions, general knowledge`,
          parameters: {
            type: 'object',
            properties: {
              status: { type: 'string', description: 'Filter by status: Pending, In Progress, Delivered, Revision, On Hold, Cancelled' },
              priority: { type: 'string', description: 'Filter by priority: Low, Medium, High, Urgent' },
            },
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'getProject',
          description: `Get detailed information about a specific project by ID or name.

USE THIS ONLY FOR:
- viewing details of a specific project
- checking a project's status, priority, price

NEVER USE FOR:
- greetings, casual conversation, jokes, naming, programming questions, translations, math, writing, opinions, general knowledge`,
          parameters: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Project ID or project name to search for' },
            },
            required: ['query'],
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'createProject',
          description: `Create a new project with the given details.

USE THIS ONLY FOR:
- creating a new project
- adding/starting/making a project

NEVER USE FOR:
- greetings, casual conversation, jokes, naming, programming questions, translations, math, writing, opinions, general knowledge`,
          parameters: {
            type: 'object',
            properties: {
              projectName: { type: 'string', description: 'Name of the project' },
              status: { type: 'string', description: 'Project status', enum: ['Pending', 'In Progress', 'Delivered', 'Revision', 'On Hold', 'Cancelled'] },
              priority: { type: 'string', description: 'Priority level', enum: ['Low', 'Medium', 'High', 'Urgent'] },
              price: { type: 'number', description: 'Project price' },
              orderId: { type: 'string', description: 'Order ID' },
              cms: { type: 'string', description: 'CMS platform' },
            },
            required: ['projectName'],
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'updateProject',
          description: `Update an existing project's fields by ID or name.

USE THIS ONLY FOR:
- updating/changing/modifying a project's name, status, priority, or price
- renaming a project

NEVER USE FOR:
- greetings, casual conversation, jokes, naming (user naming YOU, not renaming a project), programming questions, translations, math, writing, opinions, general knowledge`,
          parameters: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Project ID or project name to update' },
              updates: {
                type: 'object',
                description: 'Fields to update',
                properties: {
                  projectName: { type: 'string' },
                  status: { type: 'string', enum: ['Pending', 'In Progress', 'Delivered', 'Revision', 'On Hold', 'Cancelled'] },
                  priority: { type: 'string', enum: ['Low', 'Medium', 'High', 'Urgent'] },
                  price: { type: 'number' },
                },
              },
            },
            required: ['query', 'updates'],
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'deleteProject',
          description: `Delete a project by ID or name. Only the owner can delete.

USE THIS ONLY FOR:
- deleting/removing a project
- removing/destroying a project

NEVER USE FOR:
- greetings, casual conversation, jokes, naming, programming questions, translations, math, writing, opinions, general knowledge`,
          parameters: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Project ID or project name to delete' },
            },
            required: ['query'],
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'assignDeveloper',
          description: `Assign a developer to a project.

USE THIS ONLY FOR:
- assigning/adding a developer or team member to a project

NEVER USE FOR:
- greetings, casual conversation, jokes, naming, programming questions, translations, math, writing, opinions, general knowledge`,
          parameters: {
            type: 'object',
            properties: {
              projectQuery: { type: 'string', description: 'Project ID or project name' },
              developerName: { type: 'string', description: 'Developer name' },
              developerEmail: { type: 'string', description: 'Developer email (optional)' },
            },
            required: ['projectQuery', 'developerName'],
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'getProjectSummary',
          description: `Get a summary of all projects including total count and status breakdown.

USE THIS ONLY FOR:
- project statistics, overview, summary, report
- counting projects by status

NEVER USE FOR:
- greetings, casual conversation, jokes, naming, programming questions, translations, math, writing, opinions, general knowledge`,
          parameters: { type: 'object', properties: {} },
        },
      },
    ]
  }

  async executeToolCalls(toolCalls: ToolCallItem[]) {
    const results: { toolCallId: string; name: string; result: any }[] = []

    for (const tc of toolCalls) {
      const { name, arguments: argsStr } = tc.function
      let args: Record<string, any> = {}
      try {
        args = JSON.parse(argsStr)
      } catch {
        args = {}
      }

      logger.info(`Executing tool: ${name}`, args)

      try {
        let result: any
        switch (name) {
          case 'getProjects': {
            const filters: Record<string, unknown> = {}
            if (args.status) filters.status = args.status
            if (args.priority) filters.priority = args.priority
            const projects = await this.projectService.getProjects(this.userId, filters)
            if (projects.length === 0) {
              result = 'No projects found.'
            } else {
              const lines = projects.map((p: any, i: number) => {
                const priceStr = p.price ? ` ($${p.price})` : ''
                return `${i + 1}. ${p.projectName} — ${p.status}, ${p.priority}${priceStr}`
              })
              result = `Found ${projects.length} project(s):\n${lines.join('\n')}`
            }
            break
          }
          case 'getProject': {
            const projects = await this.projectService.getProjects(this.userId)
            const project = projects.find(
              (p: any) =>
                p._id.toString() === args.query ||
                p.projectName?.toLowerCase().includes(args.query.toLowerCase())
            )
            if (!project) {
              result = `No project found matching "${args.query}".`
            } else {
              const priceStr = project.price ? `$${project.price}` : 'Not set'
              const orderStr = project.orderId || 'Not set'
              result = `Project: ${project.projectName}\nStatus: ${project.status}\nPriority: ${project.priority}\nPrice: ${priceStr}\nOrder ID: ${orderStr}`
            }
            break
          }
          case 'createProject': {
            const project = await this.projectService.createProject(this.userId, {
              projectName: args.projectName,
              status: args.status || 'Pending',
              priority: args.priority || 'Medium',
              price: args.price || 0,
              orderId: args.orderId || '',
              cms: args.cms || '',
            })
            result = `Project "${project.projectName}" created successfully (Status: ${project.status}).`
            break
          }
          case 'updateProject': {
            const projects = await this.projectService.getProjects(this.userId)
            const target = projects.find(
              (p: any) =>
                p._id.toString() === args.query ||
                p.projectName?.toLowerCase().includes(args.query.toLowerCase())
            )
            if (!target) throw new Error('Project not found')
            const updated = await this.projectService.updateProject(
              target._id.toString(),
              this.userId,
              args.updates || {}
            )
            result = `Project "${updated.projectName}" updated successfully. Current status: ${updated.status}.`
            break
          }
          case 'deleteProject': {
            const projects = await this.projectService.getProjects(this.userId)
            const target = projects.find(
              (p: any) =>
                p._id.toString() === args.query ||
                p.projectName?.toLowerCase().includes(args.query.toLowerCase())
            )
            if (!target) throw new Error('Project not found')
            await this.projectService.deleteProject(target._id.toString(), this.userId)
            result = `Project "${target.projectName}" has been deleted.`
            break
          }
          case 'assignDeveloper': {
            const projects = await this.projectService.getProjects(this.userId)
            const target = projects.find(
              (p: any) =>
                p._id.toString() === args.projectQuery ||
                p.projectName?.toLowerCase().includes(args.projectQuery.toLowerCase())
            )
            if (!target) throw new Error('Project not found')
            const updated = await this.projectService.assignDeveloper(
              target._id.toString(),
              this.userId,
              { name: args.developerName, email: args.developerEmail }
            )
            result = `${args.developerName} has been assigned to "${updated.projectName}".`
            break
          }
          case 'getProjectSummary': {
            const summary = await this.projectService.getProjectSummary(this.userId)
            const statusBreakdown = Object.entries(summary.byStatus)
              .map(([s, c]) => `${s}: ${c}`)
              .join('\n')
            result = `Total projects: ${summary.total}\n\nBreakdown by status:\n${statusBreakdown}`
            break
          }
          default:
            throw new Error(`Unknown tool: ${name}`)
        }

        results.push({ toolCallId: tc.id, name, result })
      } catch (error: any) {
        logger.error(`Tool ${name} error`, error)
        results.push({
          toolCallId: tc.id,
          name,
          result: { error: error.message || 'An error occurred' },
        })
      }
    }

    return results
  }
}
