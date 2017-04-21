const shell = require('shelljs');
const cv = require('compare-version');
const fs = require('fs');
const path = require('path');
const rmrf = require('rimraf');

const {
  TRAVIS_BRANCH,
  AWS_BUCKET,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_KEY,
  AWS_SUBFOLDER
} = process.env;

const projectDir = process.cwd();
const pjson = require(path.join(projectDir, 'package.json'));
const oldPjson = JSON.parse(shell.exec("git show HEAD~1:package.json").stdout);
const lastPublishedVersion = shell.exec("npm show " + pjson.name + " version").stdout.trim();
const versionBump = cv(oldPjson.version, pjson.version) < 0;

const bump = () => {
  if (TRAVIS_BRANCH !== "develop") {
    return console.log("--- Not publishing.");
  }

  const FLAGFILE = "/tmp/deployment.flag";
  fs.writeFileSync(FLAGFILE);

  console.log("--- Latest published version: ", lastPublishedVersion);
  console.log("--- Previous package.json version: ", oldPjson.version);
  console.log("--- Current package.json version: ", pjson.version);

  console.log("===== Bumped version:", versionBump);

  if (!versionBump) {
    console.log("--- Publishing...");
    pjson.version = lastPublishedVersion;
    fs.writeFileSync(path.join(projectDir, 'package.json'), JSON.stringify(pjson, null, 2));
    shell.exec("git add package.json");
    shell.exec("git config --global user.name travis");
    shell.exec("git config --global user.email travis@example.com");
    shell.exec("git commit --amend -C $(git rev-parse --verify HEAD)");
    shell.exec("npm version --no-git-tag-version prerelease");
    shell.exec("git status");
    shell.exec("git add package.json");
    shell.exec("git commit --amend -C $(git rev-parse --verify HEAD)");
    // need rebuild after version bump so that the published vizabi is self-aware of its version
    shell.exec("npm run build");
  }
};

const upload = (path) => {
  shell.ShellString([
    '[default]',
    `access_key = ${AWS_ACCESS_KEY_ID}`,
    `secret_key = ${AWS_SECRET_KEY}`,
    `acl_public = True`
  ].join('\n'));

  shell.exec(
    `s3cmd -v --config=/tmp/.${AWS_BUCKET}-s3.s3cfg` +
    ` --acl-public` +
    ` --recursive` +
    ` --no-mime-magic` +
    ` --guess-mime-type` +
    ` sync build/ "${path}"`
  );
};

const deploy = () => {
  upload(`s3://${AWS_BUCKET}/${AWS_SUBFOLDER}/${TRAVIS_BRANCH}/`);
  versionBump && upload(`s3://${AWS_BUCKET}/`);

  const withoutRelease = TRAVIS_BRANCH.replace('release/v', '');
  if (withoutRelease !== TRAVIS_BRANCH) {
    shell.exec(
      `s3cmd -v --config=/tmp/.${AWS_BUCKET}-s3.s3cfg` +
      ` put s3://${AWS_BUCKET}/* s3://${AWS_BUCKET}/${withoutRelease}`
    );
  }

  rmrf.sync('/.tmp');
};

deploy();
bump();
