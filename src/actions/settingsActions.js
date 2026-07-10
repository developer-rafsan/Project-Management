import { handleResponse } from '@/lib/fetchUtils';

export async function getSettings() {
  const response = await fetch('/api/settings');
  return handleResponse(response);
}

export async function updateSettings(data) {
  const response = await fetch('/api/settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

export function syncSettingsToLocalStorage(settings) {
  localStorage.setItem('projectViewMode', settings.viewMode || 'list');
  localStorage.setItem('monthStartDay', String(settings.monthStartDay || 1));
  localStorage.setItem('fiverrFeeEnabled', String(settings.fiverrFeeEnabled !== false));
}
