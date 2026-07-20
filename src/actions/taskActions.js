import { handleResponse, buildQueryString } from '@/lib/fetchUtils';

const BASE_URL = '/api/tasks';

export async function getTasks(params = {}) {
  const query = buildQueryString(params);
  const response = await fetch(`${BASE_URL}${query ? `?${query}` : ''}`);
  return handleResponse(response);
}

export async function createTask(data) {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

export async function updateTask(id, data) {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

export async function deleteTask(id) {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: 'DELETE',
  });
  return handleResponse(response);
}
