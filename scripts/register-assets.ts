/**
 * Register Assets Script
 *
 * Recursively scans public/uploads/ and public/assets/ (including subdirectories)
 * for files not registered in content/assets/assets.json and registers them.
 * Files in public/assets/ are moved to public/uploads/ (the canonical location).
 *
 * Run: npx tsx scripts/register-assets.ts
 *      npx tsx scripts/register-assets.ts --dry-run
 */

import * as fs from 'fs/promises';
import * as path from 'path';

// Inline generateId to avoid tsconfig path alias issues with tsx
function generateId(prefix: string = 'id'): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `${prefix}_${timestamp}_${random}`;
}

// MIME type map
const EXTENSION_TO_MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

interface Asset {
  id: string;
  type: 'image' | 'video' | 'document';
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  alt?: string;
  title?: string;
  createdAt: string;
}

interface ScanResult {
  registered: { filename: string; from: string; url: string }[];
  moved: { from: string; to: string }[];
  skipped: { filename: string; reason: string }[];
  errors: { filename: string; error: string }[];
}

const ROOT = process.cwd();
const UPLOADS_DIR = path.join(ROOT, 'public', 'uploads');
const ASSETS_PUBLIC_DIR = path.join(ROOT, 'public', 'assets');
const ASSETS_JSON = path.join(ROOT, 'content', 'assets', 'assets.json');

function getAssetType(mimeType: string): 'image' | 'video' | 'document' {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  return 'document';
}

async function getImageDimensions(filePath: string): Promise<{ width: number; height: number } | null> {
  try {
    const sharp = (await import('sharp')).default;
    const metadata = await sharp(filePath).metadata();
    if (metadata.width && metadata.height) {
      return { width: metadata.width, height: metadata.height };
    }
  } catch {
    // sharp not available or file unreadable
  }
  return null;
}

async function dirExists(dir: string): Promise<boolean> {
  try {
    const stat = await fs.stat(dir);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

async function listFilesRecursive(dir: string, baseDir?: string): Promise<string[]> {
  if (!(await dirExists(dir))) return [];
  const base = baseDir || dir;
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFilesRecursive(fullPath, base)));
    } else if (entry.isFile()) {
      // Return path relative to base dir (e.g. "subdir/image.jpg")
      files.push(path.relative(base, fullPath));
    }
  }
  return files;
}

async function readAssetsJson(): Promise<Asset[]> {
  try {
    const content = await fs.readFile(ASSETS_JSON, 'utf-8');
    return JSON.parse(content);
  } catch {
    return [];
  }
}

async function writeAssetsJson(assets: Asset[]): Promise<void> {
  await fs.mkdir(path.dirname(ASSETS_JSON), { recursive: true });
  await fs.writeFile(ASSETS_JSON, JSON.stringify(assets, null, 2), 'utf-8');
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function resolveFilenameCollision(relPath: string): Promise<string> {
  const ext = path.extname(relPath);
  const dir = path.dirname(relPath);
  const base = path.basename(relPath, ext);
  let candidate = relPath;
  let counter = 1;
  while (true) {
    try {
      await fs.access(path.join(UPLOADS_DIR, candidate));
      const newName = `${base}-${Date.now()}-${counter}${ext}`;
      candidate = dir === '.' ? newName : path.join(dir, newName);
      counter++;
    } catch {
      return candidate;
    }
  }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  console.log(`\nScanning for unregistered assets...${dryRun ? ' (dry run)' : ''}\n`);

  const existingAssets = await readAssetsJson();
  const registeredUrls = new Set(existingAssets.map((a) => a.url));

  const result: ScanResult = { registered: [], moved: [], skipped: [], errors: [] };
  const newAssets: Asset[] = [];

  // Collect files from both directories
  const sources: { dir: string; urlPrefix: string; needsMove: boolean }[] = [
    { dir: UPLOADS_DIR, urlPrefix: '/uploads/', needsMove: false },
    { dir: ASSETS_PUBLIC_DIR, urlPrefix: '/assets/', needsMove: true },
  ];

  let sharpWarned = false;

  for (const source of sources) {
    const relPaths = await listFilesRecursive(source.dir);

    for (const relPath of relPaths) {
      const ext = path.extname(relPath).toLowerCase();
      const mimeType = EXTENSION_TO_MIME[ext];

      if (!mimeType) {
        result.skipped.push({ filename: relPath, reason: `unsupported extension (${ext})` });
        continue;
      }

      // Use forward slashes for URLs
      const urlPath = relPath.split(path.sep).join('/');

      // Check if already registered under either path
      const uploadsUrl = `/uploads/${urlPath}`;
      const assetsUrl = `/assets/${urlPath}`;
      if (registeredUrls.has(uploadsUrl) || registeredUrls.has(assetsUrl)) {
        result.skipped.push({ filename: relPath, reason: 'already registered' });
        continue;
      }

      const sourceFilePath = path.join(source.dir, relPath);
      let targetRelPath = relPath;
      let targetUrl = uploadsUrl;

      // Move from public/assets/ to public/uploads/
      if (source.needsMove) {
        try {
          // Check collision with existing file in uploads
          try {
            await fs.access(path.join(UPLOADS_DIR, relPath));
            // File exists in uploads — resolve collision
            targetRelPath = await resolveFilenameCollision(relPath);
            targetUrl = `/uploads/${targetRelPath.split(path.sep).join('/')}`;
          } catch {
            // No collision
          }

          if (!dryRun) {
            await fs.mkdir(path.dirname(path.join(UPLOADS_DIR, targetRelPath)), { recursive: true });
            await fs.rename(sourceFilePath, path.join(UPLOADS_DIR, targetRelPath));
          }
          result.moved.push({ from: `public/assets/${relPath}`, to: `public/uploads/${targetRelPath}` });
        } catch (err) {
          result.errors.push({ filename: relPath, error: `failed to move: ${err}` });
          continue;
        }
      }

      // Get file stats
      const filePath = source.needsMove && !dryRun
        ? path.join(UPLOADS_DIR, targetRelPath)
        : sourceFilePath;

      try {
        const stat = await fs.stat(filePath);
        const assetType = getAssetType(mimeType);

        // Get image dimensions (skip SVGs — unreliable via sharp)
        let dimensions: { width: number; height: number } | null = null;
        if (assetType === 'image' && ext !== '.svg') {
          dimensions = await getImageDimensions(filePath);
          if (!dimensions && !sharpWarned) {
            console.log('  Note: sharp not available, skipping image dimensions\n');
            sharpWarned = true;
          }
        }

        const targetFilename = path.basename(targetRelPath);
        const asset: Asset = {
          id: generateId('asset'),
          type: assetType,
          filename: targetFilename,
          url: targetUrl,
          mimeType,
          size: stat.size,
          ...(dimensions ? { width: dimensions.width, height: dimensions.height } : {}),
          createdAt: stat.mtime.toISOString(),
        };

        newAssets.push(asset);
        registeredUrls.add(targetUrl);
        result.registered.push({ filename: targetRelPath, from: source.dir, url: targetUrl });
      } catch (err) {
        result.errors.push({ filename: relPath, error: `failed to read: ${err}` });
      }
    }
  }

  // Write results
  if (!dryRun && newAssets.length > 0) {
    const allAssets = [...existingAssets, ...newAssets];
    await writeAssetsJson(allAssets);
  }

  // Print summary
  if (result.registered.length > 0) {
    console.log(`  Registered (${result.registered.length}):`);
    for (const r of result.registered) {
      console.log(`    [NEW] ${r.filename} -> ${r.url}`);
    }
    console.log();
  }

  if (result.moved.length > 0) {
    console.log(`  Moved (${result.moved.length}):`);
    for (const m of result.moved) {
      console.log(`    ${m.from} -> ${m.to}`);
    }
    console.log();
  }

  if (result.skipped.length > 0) {
    console.log(`  Skipped (${result.skipped.length}):`);
    for (const s of result.skipped) {
      console.log(`    [SKIP] ${s.filename} (${s.reason})`);
    }
    console.log();
  }

  if (result.errors.length > 0) {
    console.log(`  Errors (${result.errors.length}):`);
    for (const e of result.errors) {
      console.log(`    [ERR] ${e.filename}: ${e.error}`);
    }
    console.log();
  }

  const action = dryRun ? 'Would register' : 'Registered';
  const moveAction = dryRun ? 'Would move' : 'Moved';
  console.log(`${action} ${result.registered.length} assets. ${moveAction} ${result.moved.length} files. Skipped ${result.skipped.length}. Errors: ${result.errors.length}.\n`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
