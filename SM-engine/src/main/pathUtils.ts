import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';

export function getResourcePath(...subPaths: string[]): string {
  const relativePath = path.join(...subPaths);

  // 1. Check process.resourcesPath if packaged via electron-builder extraResources
  if (app && app.isPackaged && process.resourcesPath) {
    const resourcePath = path.join(process.resourcesPath, relativePath);
    if (fs.existsSync(resourcePath)) {
      return resourcePath;
    }
  }

  // 2. Check dist directory (relative to compiled __dirname in dist/main)
  const distPath = path.join(__dirname, '..', relativePath);
  if (fs.existsSync(distPath)) {
    return distPath;
  }

  // 3. Check process.cwd() (development fallback)
  const cwdPath = path.join(process.cwd(), relativePath);
  if (fs.existsSync(cwdPath)) {
    return cwdPath;
  }

  // Default fallback
  return distPath;
}
