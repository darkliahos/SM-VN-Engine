import * as fs from 'fs';
import * as path from 'path';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates that a project directory has the required layout before packing.
 *
 * Required:
 *   - Metadata.json
 *   - Assets/   directory
 *   - Scripts/  directory
 *   - Scripts/<StartFile>.txt  (or whatever ScenarioExtension dictates)
 *   - Assets/<TitleScreenImageName>.png  (when TitleScreenImageName is non-empty)
 */
export function validateProjectLayout(projectDir: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const metaPath = path.join(projectDir, 'Metadata.json');
  if (!fs.existsSync(metaPath)) {
    errors.push(`Missing Metadata.json in ${projectDir}`);
    return { valid: false, errors, warnings };
  }

  let metadata: Record<string, unknown>;
  try {
    const raw = fs.readFileSync(metaPath, 'utf8');
    metadata = JSON.parse(raw) as Record<string, unknown>;
  } catch (e) {
    errors.push(`Metadata.json is not valid JSON: ${(e as Error).message}`);
    return { valid: false, errors, warnings };
  }

  // Required scalar fields
  for (const field of ['Title', 'Author', 'Version', 'StartFile', 'ScenarioExtension']) {
    if (typeof metadata[field] !== 'string' || !(metadata[field] as string).trim()) {
      errors.push(`Metadata.json is missing or has empty field: ${field}`);
    }
  }

  const assetsDir = path.join(projectDir, 'Assets');
  const scriptsDir = path.join(projectDir, 'Scripts');

  if (!fs.existsSync(assetsDir) || !fs.statSync(assetsDir).isDirectory()) {
    errors.push(`Missing Assets/ directory in ${projectDir}`);
  }

  if (!fs.existsSync(scriptsDir) || !fs.statSync(scriptsDir).isDirectory()) {
    errors.push(`Missing Scripts/ directory in ${projectDir}`);
  }

  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  // Check start scenario file exists (search recursively under Scripts/)
  const startFile = metadata['StartFile'] as string;
  const ext = metadata['ScenarioExtension'] as string;
  const targetFilename = `${startFile}.${ext}`;

  function findFileRecursive(dir: string, filename: string): boolean {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (findFileRecursive(path.join(dir, entry.name), filename)) return true;
      } else if (entry.name === filename) {
        return true;
      }
    }
    return false;
  }

  if (!findFileRecursive(scriptsDir, targetFilename)) {
    errors.push(
      `Start scenario "${targetFilename}" not found anywhere under Scripts/ — ` +
      `check StartFile and ScenarioExtension in Metadata.json`
    );
  }

  // Check title screen image (non-fatal warning if missing — may be PNG or JPEG)
  const titleImg = metadata['TitleScreenImageName'] as string | undefined;
  if (titleImg && titleImg.trim()) {
    const imgBasename = `${titleImg}.png`;
    const foundImg = findFileRecursive(assetsDir, imgBasename) ||
      findFileRecursive(assetsDir, `${titleImg}.jpg`) ||
      findFileRecursive(assetsDir, `${titleImg}.jpeg`);
    if (!foundImg) {
      warnings.push(`Title screen image not found: Assets/**/${titleImg}.png (or .jpg)`);
    }
  }

  // Warn on empty directories
  const assetFiles = fs.readdirSync(assetsDir);
  if (assetFiles.length === 0) {
    warnings.push('Assets/ directory is empty');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
