const { execSync } = require('child_process');

const shouldRun = process.argv.includes('--run');

try {
  console.log('1/3 Running TypeScript compiler (tsc)...');
  execSync('npx tsc', { stdio: 'inherit' });

  console.log('2/3 Building renderer bundle (esbuild)...');
  execSync('npm run build-renderer', { stdio: 'inherit' });

  console.log('3/3 Copying static assets...');
  execSync('npm run copy-assets', { stdio: 'inherit' });

  console.log('Build completed successfully!');

  if (shouldRun) {
    console.log('Launching Electron...');
    execSync('npx electron .', { stdio: 'inherit' });
  }
} catch (error) {
  console.error('Build or execution failed:', error.message);
  process.exit(1);
}
