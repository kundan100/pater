#!/usr/bin/env node
// approach-2: keep files with local changes beside the original src file
//
// Convention:
//   For each file listed in local-changes-manifest.json, a companion file
//   named  cykLocal__<filename>  must exist in the same directory as the
//   original.  This script reads that companion and overwrites the original.
//
// Example:
//   original:   ui/.husky/pre-commit
//   companion:  ui/.husky/cykLocal__pre-commit  ← your local version
//   result:     content of companion is copied into original

const fs = require('fs');
const path = require('path');

const manifest = require('../local-changes-manifest.json');

const config  = require('#config');
const clog = require('#shared/clog-with-fallback');


const CYK_PREFIX = 'cykLocal__';

function copyAll({ dryRun = false, verbose = false } = {}) {
  for (const entry of manifest) {
    // get repoRoot from the manifest for more flexibility and less coupling with config.js
    const repoRoot = entry.repoRoot;
    if (!repoRoot) {
      throw new Error(`repoRoot not found for entry.repo: ${entry.repo}`);
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
  try {
    const opts = parseArgs(process.argv);
    copyAll(opts);
    clog.log('done');
  } catch (err) {
    clog.error(err && err.message ? err.message : err);
    process.exit(1);
  }
}

module.exports = { copyAll };

