// Each task reports its own outcome; one failed request must not block another.
export async function refreshIndependently(tasks) {
  const entries = await Promise.all(Object.entries(tasks).map(async ([name, task]) => {
    try {
      const result = await task();
      return [name, result?.success === false ? result : { success: true }];
    } catch (error) {
      return [name, { success: false, error: error.message || 'Refresh failed' }];
    }
  }));
  const results = Object.fromEntries(entries);
  return { success: entries.every(([, result]) => result.success), results };
}

export async function refreshList(url, options, format, update, fetcher = fetch) {
  const response = await fetcher(url, options);
  if (!response.ok) throw new Error(`Refresh failed (HTTP ${response.status})`);
  const result = await response.json();
  if (!result.success || !Array.isArray(result.data)) throw new Error('Invalid list response');
  update(result.data.map(format));
}

export async function loadSubmissionPage(request, type, filters) {
  let page = filters.page;
  while (true) {
    const result = await request(`${type}?${new URLSearchParams({ ...filters, page })}`);
    const lastPage = Math.max(1, Math.ceil(result.total / filters.limit));
    if (page <= lastPage) return { ...result, page };
    page = lastPage;
  }
}

export async function reviewAndRefresh({ save, applyDecision, refresh }) {
  const result = await save();
  // Review responses omit history. Do not present the pre-decision history as current.
  applyDecision({ ...result.data, history: null });
  return refreshIndependently(refresh);
}
