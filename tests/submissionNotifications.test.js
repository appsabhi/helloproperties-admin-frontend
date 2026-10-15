import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const backendRequire = createRequire(new URL('../../backend/package.json', import.meta.url));
const express = backendRequire('express');
const jwt = backendRequire('jsonwebtoken');
process.env.JWT_SECRET = 'notification-route-test-secret';
const { createSubmissionRouter } = await import('../../backend/routes/submissionRoutes.js');

test('notification counts are staff-readable without exposing submissions or review access', async t => {
  const pool = {
    async query(sql, params) {
      if (sql.includes('FROM users')) {
        const allowed = params[0] === 'admin' || (params[0] === 'staff' && sql.includes("'Staff'"));
        return { rows: allowed ? [{ user_id: params[0] }] : [] };
      }
      assert.match(sql, /WHERE status='pending'/);
      assert.match(sql, /count\(\*\).*max\(submitted_at\)/);
      return { rows: [{ total: '2', latest_submitted_at: '2026-10-15T10:00:00.000Z' }] };
    }
  };
  const app = express();
  app.use(express.json());
  app.use('/submissions', createSubmissionRouter(() => pool));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const url = `http://127.0.0.1:${server.address().port}/submissions`;
  const call = (path, userId, method = 'GET') => fetch(url + path, {
    method, headers: userId ? { Authorization: `Bearer ${jwt.sign({ userId }, process.env.JWT_SECRET)}` } : {}
  });
  assert.equal((await call('/notifications')).status, 401);
  assert.equal((await call('/notifications', 'inactive')).status, 403);
  for (const role of ['admin', 'staff']) {
    const response = await call('/notifications', role);
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.deepEqual(result.data, ['sale', 'rent', 'buyer'].map(type => ({ type, total: 2, latest_submitted_at: '2026-10-15T10:00:00.000Z' })));
  }
  assert.equal((await call('/sale', 'staff')).status, 403);
  assert.equal((await call('/sale/00000000-0000-0000-0000-000000000001/review', 'staff', 'POST')).status, 403);
});
