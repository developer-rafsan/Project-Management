import { Intent } from './IntentDetector'

export interface Plan {
  useTools: boolean
  intent: Intent
}

export function plan(intent: Intent): Plan {
  switch (intent) {
    case Intent.PROJECT_CREATE:
    case Intent.PROJECT_UPDATE:
    case Intent.PROJECT_DELETE:
    case Intent.PROJECT_LIST:
    case Intent.PROJECT_GET:
    case Intent.PROJECT_SUMMARY:
    case Intent.ASSIGN_DEVELOPER:
    case Intent.SEARCH_PROJECT:
      return { useTools: true, intent }
    default:
      return { useTools: false, intent }
  }
}
