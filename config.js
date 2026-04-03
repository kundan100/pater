// config.js
// Central place for environment-specific paths and global constants.
// Edit this file when your repo is checked out at a different location.
const path = require('path');

// Approach enums — grouped under APPROACHES for scalability
// Values match the actual folder names under each feature's directory.
const APPROACHES = {
  COPY_LOCAL_CHANGES: {
    APPROACH_1: 'approach-1-keep-files-with-local-changes-inside-utility/copyLocalChanges',
    APPROACH_2: 'approach-2-keep-files-with-local-changes-beside-original-src-file/copyLocalChanges',
  },
};

const config = {
  // ---------------------------------------------------------------------------
  // USER SETTINGS — edit these to match your environment
  // ---------------------------------------------------------------------------
  REPO1_ROOT: 'D:\\kk\\zeb_codes\\phoenix-services',
  REPO2_ROOT: 'D:\\kk\\zeb_codes\\zds-react',

  // ---------------------------------------------------------------------------
  // ADMIN SETTINGS — edit these to match your environment
  // ---------------------------------------------------------------------------
  SELECTED_APPROACH: {
    COPY_LOCAL_CHANGES: APPROACHES.COPY_LOCAL_CHANGES.APPROACH_2,
  },

  // ---------------------------------------------------------------------------
  // DERIVED / COMPUTED — do not edit below this line
  // ---------------------------------------------------------------------------
  get REPO1_PARENT_DIR() { return path.resolve(this.REPO1_ROOT, '..'); },
};

module.exports = config;
