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
    if (type === 'buyer' && ['Buy', 'Rent'].includes(filters.requirementType) && result.requirementType !== filters.requirementType) {
      return loadLegacyBuyerPage(request, filters);
    }
    const lastPage = Math.max(1, Math.ceil(result.total / filters.limit));
    if (page <= lastPage) return { ...result, page };
    page = lastPage;
  }
}

// Older servers ignore requirementType and omit it from list rows. Filter the
// complete matching queue before paginating, fetching details only when needed.
async function loadLegacyBuyerPage(request, filters) {
  const matches = [];
  for (let page = 1; ; page++) {
    const result = await request(`buyer?${new URLSearchParams({ ...filters, requirementType: 'all', page, limit: 100 })}`);
    for (let offset = 0; offset < result.data.length; offset += 5) {
      const batch = await Promise.all(result.data.slice(offset, offset + 5).map(async row => {
        let requirementType = row.requirement_type || row.requirementType || row.payload?.requirementType;
        if (!requirementType) requirementType = (await request(`buyer/${row.id}`)).data?.payload?.requirementType;
        if (!['Buy', 'Rent'].includes(requirementType)) throw new Error('Could not determine a submission’s requirement type. Please refresh to retry.');
        return requirementType === filters.requirementType ? row : null;
      }));
      matches.push(...batch.filter(Boolean));
    }
    if (page * 100 >= result.total) break;
    if (!result.data.length) throw new Error('The submission queue changed while filtering. Please refresh to retry.');
  }
  const page = Math.min(filters.page, Math.max(1, Math.ceil(matches.length / filters.limit)));
  return { data: matches.slice((page - 1) * filters.limit, page * filters.limit), total: matches.length, page };
}

export async function reviewAndRefresh({ save, applyDecision, refresh }) {
  const result = await save();
  // Review responses omit history. Do not present the pre-decision history as current.
  applyDecision({ ...result.data, history: null });
  return refreshIndependently(refresh);
}
