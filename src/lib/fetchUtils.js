export async function handleResponse(response) {
  let data;
  try {
    data = await response.json();
  } catch {
    const text = await response.text().catch(() => '');
    throw new Error(`Server error (${response.status}): ${text || 'Response is not valid JSON'}`);
  }
  if (!response.ok) {
    throw new Error(data.error || data.message || `Server error (${response.status})`);
  }
  return data;
}

export function buildQueryString(params) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value);
    }
  });
  return searchParams.toString();
}
