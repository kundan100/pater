// externalActionRunner.js
const fs = require('fs');
const path = require('path');
const os = require('os');
const clog = require('#shared/clog-with-fallback');

/**
 * runExternalAction(item, rl)
 * - item: menu item object (expects an `action` field)
 * - rl: optional readline interface passed through to user scripts
 *
 * Supports action.sourceType === 'localMachine' and action.sourceBase === 'userHomePath'.
 * Resolves the script path, ensures it exists, clears require cache, requires it,
 * and invokes the exported function (module.exports, or .run, or .handler).
 *
 * Returns: boolean -> true if the menu selection was handled (even on errors),
 * false if not handled (so caller can continue with other handlers).
 */
async function runExternalAction(item, rl) {
  const action = item && item.action;
  if (!action) return false;
  if (String(action.sourceType).toLowerCase() !== 'localmachine') return false;

  let scriptPath = action.sourceScript || action.script;
  if (!scriptPath) {
    clog.error('[externalActionRunner] No script specified for external action.');
    return true; // consumed, but nothing to run
  }

  // Resolve base
  const startsWithSlash = /^[\\/]/.test(scriptPath);
  const hasSourceBase = !!action.sourceBase;
  // if (!path.isAbsolute(scriptPath)) {
  if (!path.isAbsolute(scriptPath) || (hasSourceBase && startsWithSlash)) {
    let baseDir = process.cwd();
    if (action.sourceBase === 'userHomePath') baseDir = os.homedir();
    else if (action.sourceBase === 'projectRoot' || action.sourceBase === '#root') {
      try { baseDir = path.dirname(require.resolve('#root/package.json')); } catch (_) {}
    }
    // allow scriptPath to start with leading slash
    scriptPath = path.join(baseDir, scriptPath.replace(/^[/\\]/, ''));
  }

  if (!fs.existsSync(scriptPath)) {
    clog.error(`[externalActionRunner] External script not found: ${scriptPath}`);
    return true;
  }

  // Clear require cache so user edits are picked up between runs
  try { delete require.cache[require.resolve(scriptPath)]; } catch (_) {}

  let mod;
  try { mod = require(scriptPath); } catch (err) {
    clog.error('[externalActionRunner] Failed to load external script:', err && err.message ? err.message : err);
    return true;
  }

  const fn = (typeof mod === 'function' && mod) || mod.run || mod.handler;
  if (typeof fn !== 'function') {
    clog.warn('[externalActionRunner] External script loaded but no callable export found (expected module.exports = fn, or export.run).');
    return true;
  }

  try {
    await Promise.resolve(fn(item, rl));
  } catch (err) {
    clog.error('[externalActionRunner] External script error:', err && err.message ? err.message : err);
  }

  return true;
}

module.exports = { runExternalAction };
