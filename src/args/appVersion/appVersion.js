#!/usr/bin/env node
// appVersion helper — encapsulates logic for printing package version
const pkg = require('../../../package.json');

function printVersion() {
  console.log(pkg && pkg.version ? pkg.version : '0.0.0');
}

module.exports = { printVersion };
