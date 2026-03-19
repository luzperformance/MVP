const { execSync } = require('child_process');

console.log('=== Installing backend deps ===');
try {
  execSync('npm install --legacy-peer-deps', { cwd: 'd:/MVP/backend', stdio: 'inherit', timeout: 120000 });
  console.log('✅ Backend done');
} catch (e) {
  console.error('Backend install error:', e.message);
}

console.log('=== Installing frontend deps ===');
try {
  execSync('npm install --legacy-peer-deps', { cwd: 'd:/MVP/frontend', stdio: 'inherit', timeout: 120000 });
  console.log('✅ Frontend done');
} catch (e) {
  console.error('Frontend install error:', e.message);
}

console.log('=== DONE ===');
