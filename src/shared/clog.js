// src/shared/clog.js
// Self-contained terminal color module. Zero external dependencies.
// Colors auto-disable when:
//   - stdout is not a TTY (piped / redirected output)
//   - NO_COLOR env var is set (https://no-color.org)

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
};

module.exports = clog;
