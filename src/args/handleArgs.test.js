const assert = require('assert');

const handleArgs = require('./handleArgs');

// help
(() => {
  const res = handleArgs(['--help']);
  assert.strictEqual(res.handled, true, 'help should be handled');
  assert.strictEqual(res.code, 0, 'help should return code 0');
  console.log('test: help passed');
})();

// version
(() => {
  const res = handleArgs(['--version']);
  assert.strictEqual(res.handled, true, 'version should be handled');
  assert.strictEqual(res.code, 0, 'version should return code 0');
  console.log('test: version passed');
})();

// echo with message
(() => {
  const res = handleArgs(['--echo', 'hello']);
  assert.strictEqual(res.handled, true, 'echo should be handled');
  assert.strictEqual(res.code, 0, 'echo with message should return 0');
  console.log('test: echo with message passed');
})();

// echo missing message
(() => {
  const res = handleArgs(['--echo']);
  assert.strictEqual(res.handled, true, 'echo missing message should be handled');
  assert.strictEqual(res.code, 1, 'echo missing message should return code 1');
  console.log('test: echo missing message passed');
})();

// no args
(() => {
  const res = handleArgs([]);
  assert.strictEqual(res.handled, false, 'no args should not be handled');
  console.log('test: no args passed');
})();
