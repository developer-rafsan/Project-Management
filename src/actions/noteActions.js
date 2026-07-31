import { handleResponse, buildQueryString } from '@/lib/fetchUtils';

const BASE_URL = '/api/notes';

export async function getNotes(workspaceId) {
  const query = buildQueryString(workspaceId ? { workspaceId } : {});
  const url = query ? `${BASE_URL}?${query}` : BASE_URL;
  const response = await fetch(url);
  return handleResponse(response);
}

export async function createNote(data) {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

export async function updateNote(id, data) {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

export async function deleteNote(id) {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: 'DELETE',
  });
  return handleResponse(response);
}
