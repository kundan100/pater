// config.js
// Central place for environment-specific paths and global constants.
// Edit this file when your repo is checked out at a different location.
const path = require('path');

const userConfig = {
  // ---------------------------------------------------------------------------
  // USER CONFIG — edit these to match your environment
  // ---------------------------------------------------------------------------
  // Set to "true" to enable debug logs (e.g. from clog.debug) in development environment. Does not affect production environment.
  DEBUG_LOG_ENABLED: false,
  // make it "true" to open config file when used arg "--config"
  OPEN_CONFIG_FILE_WHILE_CHECKING_CONFIG: true,
  SELECTED_APPROACH__COPY_LOCAL_CHANGES: 'APPROACH_2',
};

// Approach enums — Values match the actual folder names under each feature's directory.
const APPROACHES = {
  COPY_LOCAL_CHANGES: {
    APPROACH_1: 'approach-1-keep-files-with-local-changes-inside-utility/copyLocalChanges',
    APPROACH_2: 'approach-2-keep-files-with-local-changes-beside-original-src-file/copyLocalChanges',
  },
};

const config = {
  // ----- Setting REPO PATHS and other important items
  DEBUG_LOG_ENABLED: process.env.NODE_ENV === 'development' ? userConfig.DEBUG_LOG_ENABLED : false,
  OPEN_CONFIG_FILE_WHILE_CHECKING_CONFIG: userConfig.OPEN_CONFIG_FILE_WHILE_CHECKING_CONFIG,
  // ----- Setting APPROACH SELECTIONS
  SELECTED_APPROACH: {
    COPY_LOCAL_CHANGES: APPROACHES.COPY_LOCAL_CHANGES[userConfig.SELECTED_APPROACH__COPY_LOCAL_CHANGES],
  },
  FEATURES_LIST: {}
  // ------ Derived paths based on root paths
  // get REPO1_PARENT_DIR() { return path.resolve(this.REPO1_ROOT, '..'); },
};

module.exports = config;
