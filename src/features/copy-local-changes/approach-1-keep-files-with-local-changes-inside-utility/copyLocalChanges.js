#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const manifest = require('../local-changes-manifest.json');

function log(...args) {
  console.log('[copyLocalChanges]', ...args);
}

function copyAll({ dryRun = false, verbose = false } = {}) {
  // loop through manifest entries
  for (const entry of manifest) {
    const repoRoot = entry.repoRoot;
    if (!repoRoot) {
      throw new Error(`repoRoot not found for entry.repo: ${entry.repo}`);
    }
    //
    const LOCAL_FILES_DIR = path.join(repoRoot, 'files-with-local-changes');
    // check if LOCAL_FILES_DIR exists
    if (!fs.existsSync(LOCAL_FILES_DIR)) {
      throw new Error(`source folder not found: ${LOCAL_FILES_DIR}`);
    }

    // read list of files
    const filesList = fs.readdirSync(LOCAL_FILES_DIR);
    if (!filesList.length) {
      log('no files found in', LOCAL_FILES_DIR);
      return;
    }

    // loop through list of files
    filesList.forEach(file => {
      const srcPath = path.join(LOCAL_FILES_DIR, file);
      const stats = fs.statSync(srcPath);
      if (!stats.isFile()) {
      if (verbose) log('skipping non-file', file);
        return;
      }

      // split filename into parts by '___'
      const parts = file.split('___');
      if (parts.length === 0) return;

      // last part is the actual filename
      const fileName = parts[parts.length - 1];
      let folderParts = parts.slice(0, -1);

      log('file:', file);
      // log('srcPath:', srcPath);
      // log('stats:', stats);
      // log('fileName:', fileName);
      // log('folderParts:', folderParts);

      // use hardcoded repo root directly
      
      if (repoRoot && path.basename(repoRoot) === folderParts[0]) {
        // drop the first segment because repoRoot already points to it
        folderParts = folderParts.slice(1);
      }
      //
      const destPathWithFilename = path.join(repoRoot, ...folderParts, fileName);
      // const targetFolder = folderParts.length ? path.join(...folderParts) : '.';
      // log(`Found file: ${fileName}`);
      // log(`Found target path: ${targetFolder}`);
      log(`destPathWithFilename: ${destPathWithFilename}`);

      if (verbose) log('using repoRoot:', repoRoot, ' -> full dest:', destPathWithFilename);

      if (dryRun) {
        log('[dry-run] would copy', srcPath, '->', destPathWithFilename);
        return;
      }

      // ensure directory exists
      const destDir = path.dirname(destPathWithFilename);
      fs.mkdirSync(destDir, { recursive: true });

      fs.copyFileSync(srcPath, destPathWithFilename);
      log('copied...', srcPath, '->', destPathWithFilename);
    });
  }
}

function parseArgs(argv) {
  return {
    dryRun: argv.includes('--dry-run') || argv.includes('-n'),
    verbose: argv.includes('--verbose') || argv.includes('-v')
  };
}

if (require.main === module) {
  try {
    const opts = parseArgs(process.argv);
    copyAll(opts);
    log('done');
  } catch (err) {
    console.error('[copyLocalChanges] error:', err && err.message ? err.message : err);
    process.exit(1);
  }
}

module.exports = { copyAll };
