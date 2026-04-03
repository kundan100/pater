# pater
`personal assistant in terminal` for devs, for recurring workflows.


# project setup for local dev
1. clone the repo.
2. create a file (.env for local use only) in project root.
    1. add this line `NPM_TOKEN=your-npm-token-for-publishing`
3. Configuration before running (follow sample)
    1. update .\config.js
        - REPO1_ROOT
        - REPO2_ROOT
    2. update .\src\features\copy-local-changes\local-changes-manifest.json
        - add list of files which needs to have local changes.
4. for local testing of changes (without publishing or install):
    1. run caommand `node index.js`, from project root.
5. done.


# publishing to npm registry
1. for publishing, run command `npm run publish:env`, after increasing to new version number.


# how to use
1. for installation by users, run command `npm install -g @kundan100/pater`
2. for usage by user, run command `pater`.
3. done.


# How to add new feature in this utility
1. Add a menu-option in file (`src\menu\menu.json`).
2. Create a utility (e.g. `src\features\system\clearTempFiles.js`)
3. Consume this newly created utility in file (`src\menu\index.js`)
