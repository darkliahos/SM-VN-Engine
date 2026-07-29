const { execSync } = require('child_process');

const isDirOnly = process.argv.includes('--dir');

try {
  console.log('1/2 Building project and copying assets/scenarios...');
  execSync('node scripts/build.js', { stdio: 'inherit' });

  console.log('2/2 Packaging Electron application...');
  const command = isDirOnly ? 'npx electron-builder --dir' : 'npx electron-builder';
  execSync(command, { stdio: 'inherit' });

  console.log('Distribution created successfully!');
} catch (error) {
  console.error('Distribution packaging failed:', error.message);
  process.exit(1);
}
