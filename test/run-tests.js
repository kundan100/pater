const path = require('path');
const fs = require('fs');

// recursively find all files under `startDir` that match `.test.js`
function findTestFiles(startDir) {
  const results = [];
  const entries = fs.readdirSync(startDir, { withFileTypes: true });
  for (const ent of entries) {
    // skip node_modules and hidden folders
    if (ent.name === 'node_modules' || ent.name.startsWith('.')) continue;
    const full = path.join(startDir, ent.name);
    if (ent.isDirectory()) {
      results.push(...findTestFiles(full));
    } else if (ent.isFile() && ent.name.endsWith('.test.js')) {
      results.push(full);
    }
  }
  return results;
}

const packageRoot = path.join(__dirname, '..');
const tests = findTestFiles(packageRoot).sort();

let passed = 0;
let failed = 0;

for (const full of tests) {
  try {
    require(full);
    console.log(`${path.relative(packageRoot, full)} ✓`);
    passed++;
  } catch (err) {
    console.error(`${path.relative(packageRoot, full)} ✗`);
    console.error(err.stack || err);
    failed++;
  }
}

console.log(`\nSummary: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
