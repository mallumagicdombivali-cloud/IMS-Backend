const assert = require('assert');
const { handler } = require('./handlers/reports/activity-history');

async function testActivityHistory() {
  const req = { method: 'GET' };
  const res = {
    statusCode: null,
    body: null,
    status: function (code) {
      this.statusCode = code;
      return this;
    },
    json: function (data) {
      this.body = data;
      return this;
    },
    setHeader: () => {},
    end: () => {},
  };

  await handler(req, res);

  assert.strictEqual(res.statusCode, 200, 'Status code should be 200');
  assert.ok(res.body.success, 'Success should be true');
  assert.ok(Array.isArray(res.body.data), 'Data should be an array');
  assert.strictEqual(
    res.body.data.length,
    7,
    'Data array should have 7 days'
  );

  for (const item of res.body.data) {
    assert.ok(item.date, 'Each item should have a date');
    assert.ok(item.dayName, 'Each item should have a dayName');
    assert.strictEqual(
      typeof item.orders,
      'number',
      'Orders should be a number'
    );
    assert.strictEqual(
      typeof item.received,
      'number',
      'Received should be a number'
    );
  }

  console.log('Activity history test passed!');
}

testActivityHistory().catch((err) => {
  console.error('Activity history test failed:', err);
  process.exit(1);
});
