const BASE_URL = '/api/projects';

async function handleResponse(response) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || data.message || 'Something went wrong');
  }
  return data;
}

function buildQueryString(params) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value);
    }
  });
  return searchParams.toString();
}

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

export async function getProjectUpdates(projectId) {
  const response = await fetch(`/api/projects/${projectId}/updates`);
  return handleResponse(response);
}

export async function getStats(params = {}) {
  const query = buildQueryString(params);
  const url = query ? `${BASE_URL}/stats?${query}` : `${BASE_URL}/stats`;
  const response = await fetch(url);
  return handleResponse(response);
}
