import { config } from '@/lib/config'
import { logger } from '@/lib/utils/logger'

export class TelegramService {
  private baseUrl: string

  constructor() {
    this.baseUrl = `${config.telegram.apiBase}${config.telegram.botToken}`
  }

  async sendMessage(chatId: string, text: string, parseMode: 'HTML' | 'Markdown' | '' = 'HTML') {
    try {
      const res = await fetch(`${this.baseUrl}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: parseMode || undefined,
        }),
      })
      const data = await res.json()
      if (!data.ok) {
        logger.warn('Telegram sendMessage failed', data.description)
      }
      return data
    } catch (error) {
      logger.error('Telegram sendMessage error', error)
      throw error
    }
  }

  async sendChatAction(chatId: string, action: 'typing' | 'upload_photo' | 'record_video' = 'typing') {
    try {
      await fetch(`${this.baseUrl}/sendChatAction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, action }),
      })
    } catch {
      // silent
    }
  }

  async setWebhook(url: string) {
    const res = await fetch(`${this.baseUrl}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, drop_pending_updates: true }),
    })
    return res.json()
  }

  formatProjectList(projects: any[]): string {
    if (!projects.length) return 'No projects found.'
    return projects
      .map(
        (p, i) =>
          `${i + 1}. <b>${p.projectName || 'Untitled'}</b>\n` +
          `   Status: ${p.status || 'N/A'} | Priority: ${p.priority || 'N/A'}\n` +
          `   Order: ${p.orderId || 'N/A'}`
      )
      .join('\n')
  }

  formatProjectDetail(project: any): string {
    if (!project) return 'Project not found.'
    const assignees = (project.assignee || []).map((a: any) => a.name || a.email || 'Unknown').join(', ')
    return (
      `<b>${project.projectName || 'Untitled'}</b>\n\n` +
      `📋 <b>Order ID:</b> ${project.orderId || 'N/A'}\n` +
      `📊 <b>Status:</b> ${project.status || 'N/A'}\n` +
      `⭐ <b>Priority:</b> ${project.priority || 'N/A'}\n` +
      `💰 <b>Price:</b> $${project.price || 0}\n` +
      `👥 <b>Assignees:</b> ${assignees || 'None'}\n` +
      `📅 <b>Created:</b> ${project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'N/A'}`
    )
  }

  formatSuccessMessage(title: string, details: Record<string, string>): string {
    const lines = Object.entries(details)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}:\n${v}`)
    return `<b>✅ ${title}</b>\n\n${lines.join('\n\n')}`
  }
}
