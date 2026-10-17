export async function rentalRequest(api, path, { method = 'GET', body, token, signal } = {}, fetcher = fetch) {
  const response = await fetcher(`${api.replace(/\/$/, '')}/rentals${path}`, {
    method, credentials: 'include', signal,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {})
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.success) {
    const message = response.status === 401 ? 'Your session has expired. Please sign in again.' : response.status === 403 ? 'You no longer have permission to manage rental agreements.' : result.message || result.error || 'Rental service unavailable. Please retry.';
    throw Object.assign(new Error(message), { status: response.status });
  }
  return result;
}
