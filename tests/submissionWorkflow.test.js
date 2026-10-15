import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSubmissionPage, refreshIndependently, refreshList, reviewAndRefresh } from '../src/utils/submissionWorkflow.js';

const ok = data => ({ ok: true, json: async () => ({ success: true, data }) });
const identity = value => value;

for (const wanted of ['Buy', 'Rent']) {
  test(`legacy backend filters ${wanted} across all pages before counting and paginating`, async () => {
    const rows = Array.from({ length: 105 }, (_, id) => ({ id: String(id) }));
    const result = await loadSubmissionPage(async path => {
      if (!path.includes('?')) {
        const id = Number(path.split('/')[1]);
        return { data: { payload: { requirementType: id % 2 ? 'Buy' : 'Rent' } } };
      }
      const params = new URLSearchParams(path.split('?')[1]);
      assert.equal(params.get('status'), 'pending');
      assert.equal(params.get('search'), 'town');
      const page = Number(params.get('page'));
      const limit = Number(params.get('limit'));
      return { total: rows.length, data: rows.slice((page - 1) * limit, page * limit) };
    }, 'buyer', { requirementType: wanted, status: 'pending', search: 'town', page: 3, limit: 20 });
    const expected = rows.filter(row => (Number(row.id) % 2 ? 'Buy' : 'Rent') === wanted);
    assert.equal(result.total, expected.length);
    assert.equal(result.page, 3);
    assert.deepEqual(result.data, expected.slice(40, 60));
  });
}

test('legacy type lookup failure reports an error instead of showing all requirements', async () => {
  await assert.rejects(loadSubmissionPage(async path => {
    if (!path.includes('?')) throw new Error('Details unavailable');
    return { total: 1, data: [{ id: 'one' }] };
  }, 'buyer', { requirementType: 'Rent', page: 1, limit: 20 }), /Details unavailable/);
});

test('All requirements does not fetch details or filter rows', async () => {
  let calls = 0;
  const result = await loadSubmissionPage(async () => {
    calls++;
    return { total: 2, data: [{ id: 'buy' }, { id: 'rent' }] };
  }, 'buyer', { requirementType: 'all', page: 1, limit: 20 });
  assert.equal(calls, 1);
  assert.equal(result.total, 2);
});

for (const failed of ['properties', 'requirements']) {
  test(`${failed} failure preserves cached data without blocking the other list`, async () => {
    const state = { properties: ['cached'], requirements: ['cached'] };
    const outcome = await refreshIndependently(Object.fromEntries(Object.keys(state).map(name => [name, () =>
      refreshList(name, {}, identity, data => { state[name] = data; }, async () => {
        if (name === failed) throw new Error('Network unavailable');
        return ok(['new']);
      })
    ])));
    const other = failed === 'properties' ? 'requirements' : 'properties';
    assert.equal(outcome.success, false);
    assert.deepEqual(outcome.results[failed], { success: false, error: 'Network unavailable' });
    assert.equal(outcome.results[other].success, true);
    assert.deepEqual(state[failed], ['cached']);
    assert.deepEqual(state[other], ['new']);
  });
}

test('HTTP, invalid JSON and unsuccessful list responses preserve cached data', async () => {
  for (const response of [
    { ok: false, status: 503 },
    { ok: true, json: async () => { throw new Error('Invalid JSON'); } },
    { ok: true, json: async () => ({ success: false, data: [] }) },
    ok(null)
  ]) {
    let updated = false;
    await assert.rejects(refreshList('/list', {}, identity, () => { updated = true; }, async () => response));
    assert.equal(updated, false);
  }
});

test('a successful empty list clears old records and uses the supplied formatter', async () => {
  let records = ['old'];
  await refreshList('/list', {}, value => value * 2, data => { records = data; }, async () => ok([2]));
  assert.deepEqual(records, [4]);
  await refreshList('/list', {}, identity, data => { records = data; }, async () => ok([]));
  assert.deepEqual(records, []);
});

for (const status of ['approved', 'rejected', 'changes_requested', 'pending']) {
  test(`${status} decision is applied before follow-ups and survives their failures`, async () => {
    let selected = { id: 'submission', status: 'pending', history: ['old'] };
    const calls = [];
    const outcome = await reviewAndRefresh({
      save: async () => ({ data: { id: selected.id, status, payload: {}, official_reference: 'reference' } }),
      applyDecision: decision => { selected = decision; calls.push('decision'); },
      refresh: {
        details: async () => { calls.push('details'); throw new Error('Details unavailable'); },
        queue: async () => { calls.push('queue'); return { success: false, error: 'Queue unavailable' }; },
        lists: async () => { calls.push('lists'); }
      }
    });
    assert.deepEqual(calls, ['decision', 'details', 'queue', 'lists']);
    assert.equal(selected.status, status);
    assert.equal(selected.official_reference, 'reference');
    assert.equal(selected.history, null);
    assert.equal(outcome.results.details.success, false);
    assert.equal(outcome.results.queue.success, false);
    assert.equal(outcome.results.lists.success, true);
  });
}

test('failed review does not change selection or run follow-up requests', async () => {
  let touched = false;
  await assert.rejects(reviewAndRefresh({
    save: async () => { throw new Error('Review rejected'); },
    applyDecision: () => { touched = true; },
    refresh: { queue: () => { touched = true; } }
  }), /Review rejected/);
  assert.equal(touched, false);
});

for (const failed of ['details', 'queue']) {
  test(`${failed} failure does not block a successful follow-up`, async () => {
    let selected;
    let queueUpdated = false;
    const outcome = await reviewAndRefresh({
      save: async () => ({ data: { status: 'approved' } }),
      applyDecision: decision => { selected = decision; },
      refresh: {
        details: async () => {
          if (failed === 'details') throw new Error('Offline');
          selected = { status: 'approved', history: [{ to_status: 'approved' }] };
        },
        queue: async () => {
          if (failed === 'queue') throw new Error('Offline');
          queueUpdated = true;
        }
      }
    });
    assert.equal(selected.status, 'approved');
    assert.equal(queueUpdated, failed !== 'queue');
    assert.equal(selected.history?.length ?? 0, failed === 'details' ? 0 : 1);
    assert.equal(outcome.results[failed].success, false);
    assert.equal(outcome.results[failed === 'details' ? 'queue' : 'details'].success, true);
  });
}

test('one pending follow-up does not delay another refresh applying its data', async () => {
  let finish;
  let updated = false;
  const pending = refreshIndependently({
    slow: () => new Promise(resolve => { finish = resolve; }),
    fast: async () => { updated = true; }
  });
  assert.equal(updated, true);
  finish();
  assert.equal((await pending).success, true);
});

test('removing the final row on page two reloads page one with the same filters', async () => {
  const paths = [];
  const result = await loadSubmissionPage(async path => {
    paths.push(path);
    return { total: 20, requirementType: 'Rent', data: paths.length === 1 ? [] : [{ id: 'remaining' }] };
  }, 'buyer', { page: 2, limit: 20, status: 'pending', search: 'district', requirementType: 'Rent' });
  assert.equal(result.page, 1);
  assert.deepEqual(result.data, [{ id: 'remaining' }]);
  assert.equal(paths.length, 2);
  for (const [index, path] of paths.entries()) {
    const params = new URLSearchParams(path.split('?')[1]);
    assert.equal(params.get('page'), String(2 - index));
    assert.equal(params.get('status'), 'pending');
    assert.equal(params.get('search'), 'district');
    assert.equal(params.get('requirementType'), 'Rent');
  }
});

test('empty queue recovers to page one even after multiple pages disappear', async () => {
  let calls = 0;
  const result = await loadSubmissionPage(async () => { calls++; return { total: 0, data: [] }; }, 'sale', { page: 4, limit: 20 });
  assert.equal(result.page, 1);
  assert.equal(calls, 2);
});

test('failed recovery request reports failure instead of claiming a successful reload', async () => {
  let calls = 0;
  await assert.rejects(loadSubmissionPage(async () => {
    if (++calls === 1) return { total: 20, data: [] };
    throw new Error('Queue unavailable');
  }, 'rent', { page: 2, limit: 20 }), /Queue unavailable/);
});
