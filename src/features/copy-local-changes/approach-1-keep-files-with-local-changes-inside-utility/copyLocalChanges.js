#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function log(...args) {
  console.log('[copyLocalChanges]', ...args);
}

// paths from central config
const { REPO1_ROOT, REPO1_PARENT_DIR } = require('#config');
// dir of local files
const LOCAL_FILES_DIR = path.join(__dirname, 'files-with-local-changes');

function copyAll({ dryRun = false, verbose = false } = {}) {
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
    // log('REPO1_ROOT:', REPO1_ROOT);
    if (REPO1_ROOT && path.basename(REPO1_ROOT) === folderParts[0]) {
      // drop the first segment because REPO1_ROOT already points to it
      folderParts = folderParts.slice(1);
    }

    const destPathWithFilename = path.join(REPO1_ROOT, ...folderParts, fileName);
    // log('destPathWithFilename:', destPathWithFilename);

    // const targetFolder = folderParts.length ? path.join(...folderParts) : '.';
    // log(`Found file: ${fileName}`);
    // log(`Found target path: ${targetFolder}`);
    log(`destPathWithFilename: ${destPathWithFilename}`);

    if (verbose) log('using REPO1_ROOT:', REPO1_ROOT, ' -> full dest:', destPathWithFilename);

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
