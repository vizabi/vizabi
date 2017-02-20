require('shelljs');

const FIX = process.env.FIX ? '-- --fix' : '';
const silent = true;

const modifiedFiles = exec('git diff-index --name-only HEAD', { silent })
  .grep(/\.js$/)
  .stdout.split(/[\n\r]/).join(' ');

const result = exec(`npm run lint ${FIX} ${modifiedFiles}`, { silent });

if (result.code) {
  echo(result.stdout);
  exit(result.code);
}
