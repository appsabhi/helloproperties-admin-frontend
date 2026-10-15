import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const backendRequire = createRequire(new URL('../../backend/package.json', import.meta.url));
const express = backendRequire('express');
const jwt = backendRequire('jsonwebtoken');
process.env.JWT_SECRET = 'notification-route-test-secret';
const { createSubmissionRouter } = await import('../../backend/routes/submissionRoutes.js');

test('buyer requirement filters constrain both rows and counts and reject invalid types', async t => {
  const queries = [];
  const pool = { async query(sql, params) {
    if (sql.includes('FROM users')) return { rows: [{ user_id: 'admin' }] };
    queries.push({ sql, params });
    if (sql.startsWith('SELECT count')) return { rows: [{ count: '21' }] };
    return { rows: [{ id: 'matching-submission' }] };
  } };
  const app = express();
  app.use('/submissions', createSubmissionRouter(() => pool));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const headers = { Authorization: `Bearer ${jwt.sign({ userId: 'admin' }, process.env.JWT_SECRET)}` };
  for (const type of ['Buy', 'Rent', 'all']) {
    queries.length = 0;
    const res = await fetch(`http://127.0.0.1:${server.address().port}/submissions/buyer?requirementType=${type}&status=pending&search=town&page=2&limit=20`, { headers });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.total, 21);
    assert.equal(data.page, 2);
    assert.equal(queries.length, 2);
    for (const query of queries) {
      assert.match(query.sql, /AND \(\$3='all' OR payload->>'requirementType'=\$3\)/);
      assert.deepEqual(query.params.slice(0, 3), ['pending', 'town', type]);
    }
    assert.match(queries[0].sql, /LIMIT \$4 OFFSET \$5/);
    assert.deepEqual(queries[0].params.slice(3), [20, 20]);
  }
  const invalid = await fetch(`http://127.0.0.1:${server.address().port}/submissions/buyer?requirementType=unknown`, { headers });
  assert.equal(invalid.status, 400);
});

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
