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
          description: 'Get a list of all projects for the current user. Supports optional status and priority filters.',
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
          description: 'Get detailed information about a specific project by ID or name.',
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
          description: 'Create a new project with the given details.',
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
          description: 'Update an existing project by ID or name.',
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
          description: 'Delete a project by ID or name. Only the owner can delete.',
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
          description: 'Assign a developer to a project.',
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
          description: 'Get a summary of all projects including total count and status breakdown.',
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
            result = projects.map((p: any) => ({
              _id: p._id,
              projectName: p.projectName,
              status: p.status,
              priority: p.priority,
              orderId: p.orderId,
              price: p.price,
              createdAt: p.createdAt,
            }))
            break
          }
          case 'getProject': {
            const projects = await this.projectService.getProjects(this.userId)
            const project = projects.find(
              (p: any) =>
                p._id.toString() === args.query ||
                p.projectName?.toLowerCase().includes(args.query.toLowerCase())
            )
            result = project || null
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
            result = { _id: project._id, projectName: project.projectName, status: project.status }
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
            result = { _id: updated._id, projectName: updated.projectName, status: updated.status }
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
            result = { deleted: true, projectName: target.projectName }
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
            result = { projectName: updated.projectName, developer: args.developerName }
            break
          }
          case 'getProjectSummary': {
            result = await this.projectService.getProjectSummary(this.userId)
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
