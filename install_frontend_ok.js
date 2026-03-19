const { spawnSync } = require('child_process');

console.log('Installing @better-auth/client...');
const result = spawnSync('npm', ['install', '@better-auth/client', 'better-auth'], {
  cwd: 'frontend',
  stdio: 'inherit',
  shell: true
});

if (result.status === 0) {
  console.log('Success!');
} else {
  console.error('Failed with status', result.status);
}
