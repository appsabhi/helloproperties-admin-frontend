async function readResponse(response) {
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401) throw new Error('Your session has expired. Please sign in again.');
    if (response.status === 404) throw new Error('Submission reminders are temporarily unavailable. Please contact your administrator.');
    throw new Error(result?.message || result?.error || `Could not load reminders (HTTP ${response.status}).`);
  }
  if (!result?.success || !Array.isArray(result.data)) throw new Error('The server returned an invalid notification response. Please retry.');
  return result;
}

export async function loadSubmissionNotifications(api, options, role, fetcher = fetch) {
  const response = await fetcher(`${api}/submissions/notifications`, options);
  // Older backends expose the Admin queue, but do not yet have staff summaries.
  // Never fall back on authorization failures or request queue data for Staff.
  if (response.status === 404 && role === 'Admin') {
    return Promise.all(['sale', 'rent', 'buyer'].map(async type => {
      const result = await readResponse(await fetcher(`${api}/submissions/${type}?status=pending&page=1&limit=1`, options));
      if (!Number.isInteger(result.total) || result.total < 0) throw new Error('The server returned an invalid submission count. Please retry.');
      return { type, total: result.total, latest_submitted_at: result.data[0]?.submitted_at || null };
    }));
  }
  return (await readResponse(response)).data;
}
