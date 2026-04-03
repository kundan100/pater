let clog;
try { clog = require('./clog'); }
catch (_) { clog = { log: console.log, info: console.info, warn: console.warn, error: console.error }; }

module.exports = clog;
