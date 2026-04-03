const fs = require('fs').promises;
const os = require('os');
const path = require('path');

async function removeEntry(entryPath) {
  try {
    await fs.rm(entryPath, { recursive: true, force: true });
    return { path: entryPath, ok: true };
  } catch (err) {
    return { path: entryPath, ok: false, error: err && err.message ? err.message : String(err) };
  }
}

/**
 * clearTempFiles(options)
 * - options.dryRun (boolean) default: false
 * - options.maxAgeHours (number) default: 72
 * - options.tempDirs (string[]) default: [os.tmpdir()]
 *
 * Returns a summary object with scanned/removed/skipped/errors arrays.
 */
async function clearTempFiles(options = {}) {
  const dryRun = options.dryRun === undefined ? false : Boolean(options.dryRun);
  const maxAgeHours = typeof options.maxAgeHours === 'number' ? options.maxAgeHours : 72;
  // falls back to the system temp directory from os.tmpdir()
  const tempDirs = Array.isArray(options.tempDirs) && options.tempDirs.length ? options.tempDirs : [os.tmpdir()];

  const now = Date.now();
  const cutoff = now - maxAgeHours * 3600 * 1000;
  const results = { scanned: 0, removed: [], skipped: [], errors: [] };

  for (const dir of tempDirs) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const dirent of entries) {
        const entryPath = path.join(dir, dirent.name);
        results.scanned++;
        try {
          const stats = await fs.stat(entryPath);
          const mtime = (stats && stats.mtimeMs) ? stats.mtimeMs : stats.mtime.getTime();
          if (mtime <= cutoff) {
            if (dryRun) {
              results.removed.push({ path: entryPath, dryRun: true });
            } else {
              const r = await removeEntry(entryPath);
              if (r.ok) results.removed.push({ path: entryPath });
              else results.errors.push(r);
            }
          } else {
            results.skipped.push({ path: entryPath, reason: 'too_new' });
          }
        } catch (err) {
          results.errors.push({ path: entryPath, error: err && err.message ? err.message : String(err) });
        }
      }
    } catch (err) {
      results.errors.push({ path: dir, error: err && err.message ? err.message : String(err) });
    }
  }

  if (dryRun) {
    console.log(`\n[feature] clearTempFiles dry-run: scanned=${results.scanned} would-remove=${results.removed.length}`);
  } else {
    console.log(`\n[feature] clearTempFiles completed: scanned=${results.scanned} removed=${results.removed.length} skipped=${results.skipped.length}`);
  }

  return results;
}

module.exports = { clearTempFiles };
