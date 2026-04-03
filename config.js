// config.js
// Central place for environment-specific paths and global constants.
// Edit this file when your repo is checked out at a different location.
const path = require('path');

const userConfig = {
  // ---------------------------------------------------------------------------
  // USER CONFIG — edit these to match your environment
  // ---------------------------------------------------------------------------
  REPO1_ROOT: 'D:\\kk\\zeb_codes\\phoenix-services',
  REPO2_ROOT: 'D:\\kk\\zeb_codes\\zds-react',
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
  // ----- Setting REPO PATHS
  REPO1_ROOT: userConfig.REPO1_ROOT,
  REPO2_ROOT: userConfig.REPO2_ROOT,
  // ----- Setting APPROACH SELECTIONS
  SELECTED_APPROACH: {
    COPY_LOCAL_CHANGES: APPROACHES.COPY_LOCAL_CHANGES[userConfig.SELECTED_APPROACH__COPY_LOCAL_CHANGES],
  },
  // ------ Derived paths based on root paths
  get REPO1_PARENT_DIR() { return path.resolve(this.REPO1_ROOT, '..'); },
};

module.exports = config;
