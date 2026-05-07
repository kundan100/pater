/**
 * FILE: ./src/shared/clog.js
 * lightweight CLI logging helper with optional ANSI color support
 *
 * PURPOSE:
 * Provides a small, dependency-free logger for CLI output with optional colored text.
 * Colors are automatically disabled when stdout is not a TTY or when NO_COLOR is set.
 *
 * KEY FEATURES:
 * - `log`, `info`, `warn`, `error`, `debug` helpers for consistent message formatting
 * - `debug` output is enabled only when DEBUG_LOG_ENABLED is true in config
 * - automatic ANSI color wrapping when output is a TTY or FORCE_COLOR is enabled
 * - keyword-based color highlighting for common CLI message terms
 *
 * USAGE (from other modules):
 * const clog = require('#shared/clog-with-fallback');
 * clog.log('hello world');
 * clog.debug('verbose information');
 * clog.error('something went wrong');
 */

// const appConfigJson = require(`#root/config.json`);
const { loadConfigJsonWithSynchedShadow } = require('#features/configManager/configManager');
const appConfigJson = loadConfigJsonWithSynchedShadow('#root/config.json');
// console.log('[./src/shared/clog.js] Loaded appConfigJson:', appConfigJson);

// Determine if debug logs should be enabled based on appConfigJson, with a fallback to false (if fails to load).
const _DEBUG_LOG_ENABLED = (() => {
  try {
    let _debugLogEnabled = Boolean(appConfigJson.data.DEBUG_LOG_ENABLED);
    _debugLogEnabled = process.env.NODE_ENV === 'development' ? _debugLogEnabled : false;
    //
    if (_debugLogEnabled) {
      console.log('[./src/shared/clog.js] _DEBUG_LOG_ENABLED (set from config):', _debugLogEnabled);
    }
    return _debugLogEnabled;
  } catch {
    console.error('[./src/shared/clog.js] _DEBUG_LOG_ENABLED defaulting to false because config load failed');
    return false;
  }
})();

const ENABLED = (!!process.stdout.isTTY || !!process.env.FORCE_COLOR) && !process.env.NO_COLOR;

const C = {
  reset:  '\x1b[0m',
  dim:    '\x1b[2m',
  red:    '\x1b[31m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  // background colors
  bgBlue:      '\x1b[44m',
  bgHotPink:   '\x1b[105m',   // bright magenta/hot-pink bg (16-color, high visibility)
  fgWhiteBold: '\x1b[1;97m', // bold bright white text — readable on hot-pink bg
  bgBold:      '\x1b[1m',    // bold — pairs with darker bg colors
};

function wrap(code, str) {
  return ENABLED ? `${code}${str}${C.reset}` : String(str);
}

// Inline color helpers — for embedding color inside a longer string
const colors = {
  red:    (s) => wrap(C.red,    s),
  green:  (s) => wrap(C.green,  s),
  yellow: (s) => wrap(C.yellow, s),
  cyan:   (s) => wrap(C.cyan,   s),
  dim:    (s) => wrap(C.dim,    s),
};

// ---------------------------------------------------------------------------
// Single keyword map. Values are arrays:
//   [bgCode, fgCode] — background highlight (takes priority over default color)
//   [fgCode]         — foreground color only
// Add / remove entries freely — this is the only place you need to touch.
// ---------------------------------------------------------------------------
const KEYWORD_COLORS = {
  // bg — background highlight
  welcome:  [C.bgHotPink, C.fgWhiteBold],
  exiting:     [C.bgHotPink, C.fgWhiteBold],
  step:     [C.bgBlue,    C.bgBold],
  running:  [C.bgBlue,    C.bgBold],
  starting: [C.cyan],
  // fg — positive outcomes
  success:  [C.green],
  done:     [C.green],
  ready:    [C.green],
  ok:       [C.green],
  copied:   [C.green],
  started:  [C.green],
  // fg — caution
  warning:  [C.yellow],
  warn:     [C.yellow],
  skipped:  [C.yellow],
  cancelled:  [C.yellow],
  'dry-run':[C.yellow],
  // fg — problems
  error:    [C.red],
  failed:   [C.red],
  failure:  [C.red],
  invalid:  [C.red],
  // fg — neutral progress
  info:     [C.cyan],
  // running:  [C.cyan],
  // starting: [C.cyan],
};

function fmt(defaultCode, args) {
  const msg = args.join(' ');
  if (!ENABLED) return msg;
  const msgLower = msg.toLowerCase();
  for (const [keyword, codes] of Object.entries(KEYWORD_COLORS)) {
    const pattern = /\W/.test(keyword) ? keyword : `\\b${keyword}\\b`;
    if (new RegExp(pattern).test(msgLower)) {
      return codes.length === 2
        ? `${codes[0]}${codes[1]}${msg}${C.reset}`
        : `${codes[0]}${msg}${C.reset}`;
    }
  }
  return defaultCode ? `${defaultCode}${msg}${C.reset}` : msg;
}

const clog = {
  log:   (...args) => console.log(fmt(null,      args)),
  info:  (...args) => console.log(fmt(C.cyan,    args)),
  warn:  (...args) => console.warn(fmt(C.yellow, args)),
  error: (...args) => console.error(fmt(C.red,   args)),
  debug: (...args) => {
    if (!_DEBUG_LOG_ENABLED) return;
    console.debug(fmt(C.dim, args));
  },
};

module.exports = clog;
