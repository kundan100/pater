#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { loadConfigJsonWithSynchedShadow } = require('#root/src/features/shadowManager/shadowManager.js');
const copyLocalChangesConfigJson = loadConfigJsonWithSynchedShadow('../copyLocalChangesConfig.json');

const copyLocalChangesConfigData = Array.isArray(copyLocalChangesConfigJson.data) ? copyLocalChangesConfigJson.data : [];

function log(...args) {
  console.log('[copyLocalChanges]', ...args);
}

async function copyAll({ dryRun = false, verbose = false } = {}) {
  // loop through copyLocalChangesConfig entries
  for (const entry of copyLocalChangesConfigData) {
    const repoRoot = entry.repoRoot;
    if (!repoRoot) {
      const { askForUserEntry } = require('#shared/askForUserEntry');
      const { openFile } = require('#shared/openFile');
      const prompt = `repoRoot not found for entry.repo: ${entry.repo}. i am going to open the config file where you can set the repoRoot and once done save and close that file. should i open the file (yes/no)? `;
      try {
        const answer = await askForUserEntry(prompt);
        if (answer && String(answer).trim().toLowerCase().startsWith('y')) {
          const cfgPath = require.resolve('../copyLocalChangesConfig.json');
          try {
            await openFile(cfgPath, '');
            console.log(`Opened config file. After updating 'repoRoot', re-run this command.`);
            // give the spawned editor a small window to detach properly on Windows
            setTimeout(() => process.exit(0), 200);
            return;
          } catch (openErr) {
            if (verbose) console.debug('[copyLocalChanges] openFile failed:', openErr && openErr.message ? openErr.message : openErr);
            // fall through to the final error throw below
          }
        }
      } catch (e) {
        if (verbose) console.debug('[copyLocalChanges] prompt/open error:', e && e.message ? e.message : e);
      }
      throw new Error(`repoRoot not found for entry.repo: ${entry.repo}. Please set 'repoRoot' in src/features/copyLocalChanges/copyLocalChangesConfig.json or create a shadow override using the shadow manager.`);
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
  (async () => {
    try {
      const opts = parseArgs(process.argv);
      await copyAll(opts);
      log('done');
    } catch (err) {
      console.error('[copyLocalChanges] error:', err && err.message ? err.message : err);
      process.exit(1);
    }
  })();
}

module.exports = { copyAll };
