const { execSync } = require('child_process');

console.log('--- Installing Frontend Deps ---');
try {
  execSync('npm install better-auth @better-auth/client', { cwd: 'frontend', stdio: 'inherit' });
} catch (e) {
  console.error('Frontend failed', e.message);
}

console.log('--- Installing Backend Deps ---');
try {
  execSync('npm install better-auth better-auth-pg better-auth-sqlite', { cwd: 'backend', stdio: 'inherit' });
} catch (e) {
  console.error('Backend failed', e.message);
}
