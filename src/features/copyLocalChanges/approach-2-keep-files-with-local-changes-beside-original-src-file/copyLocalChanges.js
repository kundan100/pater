#!/usr/bin/env node
// approach-2: keep files with local changes beside the original src file
//
// Convention:
//   For each file listed in copyLocalChangesConfig.json, a companion file
//   named  cykLocal__<filename>  must exist in the same directory as the
//   original.  This script reads that companion and overwrites the original.
//
// Example:
//   original:   ui/.husky/pre-commit
//   companion:  ui/.husky/cykLocal__pre-commit  ← your local version
//   result:     content of companion is copied into original

const fs = require('fs');
const path = require('path');

const { loadConfigJsonWithSynchedShadow } = require('#root/src/features/shadowManager/shadowManager.js');
const copyLocalChangesConfigJson = loadConfigJsonWithSynchedShadow(require.resolve('../copyLocalChangesConfig.json'));
const copyLocalChangesConfigData = Array.isArray(copyLocalChangesConfigJson.data) ? copyLocalChangesConfigJson.data : [];

const clog = require('#shared/clog-with-fallback');
const { promptToSetConfigField } = require('#shared/promptToSetConfigField');

const CYK_PREFIX = 'cykLocal__';

async function copyAll({ dryRun = false, verbose = false } = {}) {
  for (const entry of copyLocalChangesConfigData) {
    // get repoRoot from the config (merged with local shadow) for more flexibility
    const repoRoot = entry.repoRoot;
    if (!repoRoot) {
      const result = await promptToSetConfigField({
        fieldDesc: `repoRoot for entry.repo: ${entry.repo}`,
        configPath: require.resolve('../copyLocalChangesConfig.json'),
        verbose,
      });
      if (result === 'opened') return;
      throw new Error(`repoRoot not set for entry.repo: ${entry.repo}. Set 'repoRoot' in copyLocalChangesConfig.json or create a shadow override.`);
    }

    for (const relPath of entry.files) {
      const originalPath  = path.join(repoRoot, relPath);
      const dir           = path.dirname(originalPath);
      const filename      = path.basename(originalPath);
      const companionPath = path.join(dir, CYK_PREFIX + filename);

      if (verbose) clog.log('original :', originalPath);
      if (verbose) clog.log('companion:', companionPath);

      // companion must exist
      if (!fs.existsSync(companionPath)) {
        clog.log(`SKIPPED — companion not found: ${companionPath}`);
        continue;
      }

      // original must exist (safety check — we never create new files)
      if (!fs.existsSync(originalPath)) {
        clog.log(`SKIPPED — original not found: ${originalPath}`);
        continue;
      }

      if (dryRun) {
        clog.log(`[dry-run] would copy ${companionPath} -> ${originalPath}`);
        continue;
      }

      fs.copyFileSync(companionPath, originalPath);
      clog.log(`copied: ${companionPath} -> ${originalPath}`);
    }
  }
}

function parseArgs(argv) {
  return {
    dryRun:  argv.includes('--dry-run') || argv.includes('-n'),
    verbose: argv.includes('--verbose') || argv.includes('-v'),
  };
}

if (require.main === module) {
  (async () => {
    try {
      const opts = parseArgs(process.argv);
      await copyAll(opts);
      clog.log('done');
    } catch (err) {
      clog.error(err && err.message ? err.message : err);
      process.exit(1);
    }
  })();
}

module.exports = { copyAll };

