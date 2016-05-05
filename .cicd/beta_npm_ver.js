#!/usr/bin/env node

'use strict'

const shell = require('shelljs');
const cv = require('compare-version');
const fs = require('fs');
const path = require('path');

const cwd = path.dirname(require.main.filename);
const project_dir = path.dirname(cwd);

const FLAGFILE = "/tmp/deployment.flag";

const pjson = require(path.join(project_dir, 'package.json'));
const oldPjson = JSON.parse(shell.exec("git show HEAD~1:package.json").stdout);

const lastPublishedVersion = shell.exec("npm show "+pjson.name+" version").stdout.trim();

if (process.env.TRAVIS_BRANCH !== "develop"){
    console.log("--- Not publishing.");
    return;
};

fs.writeFile(FLAGFILE);

console.log("--- Latest published version: ", lastPublishedVersion);
console.log("--- Previous package.json version: ", oldPjson.version);
console.log("--- Current package.json version: ", pjson.version);

let versionBump = (cv(oldPjson.version, pjson.version) < 0);
console.log("===== Bumped version:", versionBump);

if (!versionBump){
    console.log("--- Publishing...");
    pjson.version = lastPublishedVersion;
    fs.writeFileSync(path.join(project_dir, 'package.json'), JSON.stringify(pjson, null, 2));
    shell.exec("git add package.json");
    shell.exec("git config --global user.name travis");
    shell.exec("git config --global user.email travis@example.com");
    shell.exec("git commit --amend -C $(git rev-parse --verify HEAD)");
    shell.exec("npm version --no-git-tag-version prerelease");
    shell.exec("git status");
    shell.exec("git add package.json");
    shell.exec("git commit --amend -C $(git rev-parse --verify HEAD)");
    //need rebuild after version bump so that the published vizabi is self-aware of its version
    shell.exec("gulp build");
};
