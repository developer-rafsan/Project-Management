export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
    .trim()
}

export function validateProjectName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) return { valid: false, error: 'Project name is required' }
  if (name.trim().length < 2) return { valid: false, error: 'Project name must be at least 2 characters' }
  if (name.trim().length > 200) return { valid: false, error: 'Project name must be under 200 characters' }
  return { valid: true }
}

export function validateTelegramId(id: string): boolean {
  return /^\d+$/.test(id)
}

export function validateObjectId(id: string): boolean {
  return /^[a-fA-F0-9]{24}$/.test(id)
}

export function validatePagination(page: number, limit: number): { valid: boolean; error?: string } {
  if (page < 1) return { valid: false, error: 'Page must be >= 1' }
  if (limit < 1 || limit > 100) return { valid: false, error: 'Limit must be between 1 and 100' }
  return { valid: true }
}

export function validateAIMessage(message: string): { valid: boolean; error?: string } {
  if (!message || message.trim().length === 0) return { valid: false, error: 'Message is required' }
  if (message.length > 4000) return { valid: false, error: 'Message too long (max 4000 chars)' }
  const suspicious = /<script|javascript:|onload=|onerror=|eval\(|prompt\(|alert\(/i
  if (suspicious.test(message)) return { valid: false, error: 'Invalid message content' }
  return { valid: true }
}
