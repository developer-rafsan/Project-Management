import { handleResponse, buildQueryString } from '@/lib/fetchUtils';

export async function getSettings(workspaceId) {
  const query = buildQueryString(workspaceId ? { workspaceId } : {});
  const response = await fetch(`/api/settings${query ? `?${query}` : ''}`);
  return handleResponse(response);
}

export async function updateSettings(data, workspaceId) {
  const query = buildQueryString(workspaceId ? { workspaceId } : {});
  const response = await fetch(`/api/settings${query ? `?${query}` : ''}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

export function syncSettingsToLocalStorage(settings, workspaceId) {
  const suffix = workspaceId ? `_${workspaceId}` : '';
  localStorage.setItem(`projectViewMode${suffix}`, settings.viewMode || 'list');
  localStorage.setItem(`monthStartDay${suffix}`, String(settings.monthStartDay || 1));
  localStorage.setItem(`fiverrFeeEnabled${suffix}`, String(settings.fiverrFeeEnabled !== false));
  if (workspaceId) {
    localStorage.setItem('projectViewMode', settings.viewMode || 'list');
    localStorage.setItem('monthStartDay', String(settings.monthStartDay || 1));
    localStorage.setItem('fiverrFeeEnabled', String(settings.fiverrFeeEnabled !== false));
  }
}
