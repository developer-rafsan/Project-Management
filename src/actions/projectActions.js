import { handleResponse, buildQueryString } from '@/lib/fetchUtils';

const BASE_URL = '/api/projects';

export async function getProjects(filters = {}) {
  const query = buildQueryString(filters);
  const url = query ? `${BASE_URL}?${query}` : BASE_URL;
  const response = await fetch(url);
  return handleResponse(response);
}

export async function getProject(id) {
  const response = await fetch(`${BASE_URL}/${id}`);
  return handleResponse(response);
}

export async function createProject(data) {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

export async function updateProject(id, data) {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

export async function deleteProject(id) {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: 'DELETE',
  });
  return handleResponse(response);
}

export async function getUsers() {
  const response = await fetch('/api/users');
  return handleResponse(response);
}

export async function getProjectPassword(projectId) {
  const response = await fetch(`/api/projects/${projectId}/password`);
  return handleResponse(response);
}

export async function getAdditionalPasswords(projectId) {
  const response = await fetch(`/api/projects/${projectId}/additional-passwords`);
  return handleResponse(response);
}

export async function getProjectActivities(projectId) {
  const response = await fetch(`/api/projects/${projectId}/updates`);
  return handleResponse(response);
}

export { getProjectActivities as getProjectUpdates };

export async function getProjectNotes(projectId) {
  const response = await fetch(`/api/projects/${projectId}/notes`);
  return handleResponse(response);
}

export async function createNote(projectId, data) {
  const response = await fetch(`/api/projects/${projectId}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

export async function updateNote(projectId, noteId, data) {
  const response = await fetch(`/api/projects/${projectId}/notes/${noteId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

export async function deleteNote(projectId, noteId) {
  const response = await fetch(`/api/projects/${projectId}/notes/${noteId}`, {
    method: 'DELETE',
  });
  return handleResponse(response);
}

export async function getStats(params = {}) {
  const query = buildQueryString(params);
  const url = query ? `${BASE_URL}/stats?${query}` : `${BASE_URL}/stats`;
  const response = await fetch(url);
  return handleResponse(response);
}
