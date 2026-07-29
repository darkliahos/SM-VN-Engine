const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

function copyRecursiveSync(src, dest) {
  if (!fs.existsSync(src)) {
    return;
  }
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src);
    for (const entry of entries) {
      copyRecursiveSync(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    fs.copyFileSync(src, dest);
  }
}

function copyStatic() {
  try {
    const srcDir = path.join(rootDir, 'src', 'renderer');
    const destDir = path.join(rootDir, 'dist', 'renderer');
    
    if (fs.existsSync(srcDir)) {
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      const files = fs.readdirSync(srcDir);
      for (const file of files) {
        if (file.endsWith('.html')) {
          fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
        }
      }
    }
  } catch (err) {
    console.warn('Warning copying static files:', err.message);
  }
}

function copyContent() {
  const folders = ['Scenarios', 'Scenes', 'Characters', 'Assets', 'Audio'];
  for (const folder of folders) {
    try {
      const srcDir = path.join(rootDir, folder);
      const destDir = path.join(rootDir, 'dist', folder);
      copyRecursiveSync(srcDir, destDir);
    } catch (err) {
      console.warn(`Warning copying folder ${folder}:`, err.message);
    }
  }

  try {
    const metadataSrc = path.join(rootDir, 'Metadata.json');
    const metadataDest = path.join(rootDir, 'dist', 'Metadata.json');
    if (fs.existsSync(metadataSrc)) {
      fs.copyFileSync(metadataSrc, metadataDest);
    }
  } catch (err) {
    console.warn('Warning copying Metadata.json:', err.message);
  }
}

console.log('Copying static assets and content folders...');
copyStatic();
copyContent();
console.log('Copy completed.');
