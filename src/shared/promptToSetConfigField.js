const { askForUserEntry } = require('#shared/askForUserEntry');
const { openFile } = require('#shared/openFile');
const clog = require('#shared/clog-with-fallback');

/**
 * Prompts the user to open a config file when a required field is missing.
 *
 * @param {object} opts
 * @param {string} opts.fieldDesc  - Human-readable description of the missing field (e.g. "repoRoot for entry.repo: my-repo")
 * @param {string} opts.configPath - Absolute path to the config file to open
 * @param {boolean} [opts.verbose] - If true, log errors from openFile
 * @returns {Promise<'opened'|'declined'>}
 *   'opened'  — user said yes and the file was opened; caller should return (not throw)
 *   'declined' — user said no or an error occurred; caller should throw
 */
async function promptToSetConfigField({ fieldDesc, configPath, verbose = false }) {
  const prompt = `${fieldDesc} is not set. Open the config file to set it and re-run? (yes/no) `;
  try {
    const answer = await askForUserEntry(prompt);
    if (answer && String(answer).trim().toLowerCase().startsWith('y')) {
      try {
        await openFile(configPath, '');
        clog.log(`Opened config file. After updating the value, re-run this command.`);
        // give the spawned editor a small window to detach properly on Windows
        setTimeout(() => process.exit(0), 200);
        return 'opened';
      } catch (openErr) {
        if (verbose) clog.debug && clog.debug('[promptToSetConfigField] openFile failed:', openErr && openErr.message ? openErr.message : openErr);
      }
    }
  } catch (e) {
    if (verbose) clog.debug && clog.debug('[promptToSetConfigField] prompt/open error:', e && e.message ? e.message : e);
  }
  return 'declined';
}

module.exports = { promptToSetConfigField };
