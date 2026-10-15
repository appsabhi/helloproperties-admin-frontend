import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSubmissionNotifications } from '../src/utils/submissionNotifications.js';
const response = (status, body) => ({ status, ok: status === 200, json: async () => body });

test('Admin uses existing queues when the summary endpoint is missing', async () => {
  const paths = [];
  const options = { credentials: 'include', headers: { Authorization: 'Bearer test' } };
  const result = await loadSubmissionNotifications('/api', options, 'Admin', async (path, received) => {
    assert.equal(received, options);
    paths.push(path);
    if (path.endsWith('/notifications')) return response(404, { message: 'Unknown submission type' });
    assert.match(path, /status=pending&page=1&limit=1$/);
    return response(200, { success: true, total: 3, data: [{ submitted_at: '2026-10-15T10:00:00Z' }] });
  });
  assert.equal(paths.length, 4);
  assert.deepEqual(result.map(group => [group.type, group.total]), [['sale', 3], ['rent', 3], ['buyer', 3]]);
  assert.equal(result[0].latest_submitted_at, '2026-10-15T10:00:00Z');
});

test('Staff never requests Admin queues and authentication failures never trigger fallback', async () => {
  for (const [role, status] of [['Staff', 404], ['Staff', 403], ['Admin', 401], ['Admin', 403], ['Admin', 500]]) {
    let calls = 0;
    await assert.rejects(loadSubmissionNotifications('/api', {}, role, async () => {
      calls++;
      return response(status, {});
    }));
    assert.equal(calls, 1);
  }
});

test('new summary endpoint works for Staff without queue requests', async () => {
  const groups = [{ type: 'sale', total: 0, latest_submitted_at: null }];
  const result = await loadSubmissionNotifications('/api', {}, 'Staff', async path => {
    assert.equal(path, '/api/submissions/notifications');
    return response(200, { success: true, data: groups });
  });
  assert.deepEqual(result, groups);
});

test('a failed fallback queue does not present incomplete totals as successful', async () => {
  await assert.rejects(loadSubmissionNotifications('/api', {}, 'Admin', async path => {
    if (path.endsWith('/notifications')) return response(404, {});
    if (path.includes('/rent?')) return response(500, { message: 'Queue unavailable' });
    return response(200, { success: true, total: 0, data: [] });
  }), /Queue unavailable/);
});
