/**
 * Register Assets Script
 *
 * Recursively scans public/uploads/ and public/assets/ for files not registered
 * in content/assets/assets.json. All files are organized into type-based subdirs:
 *   public/uploads/images/   — image files
 *   public/uploads/videos/   — video files
 *   public/uploads/documents/ — documents
 *
 * Files from public/assets/ or the root of public/uploads/ are moved into the
 * correct type subdir and registered.
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

type AssetType = 'image' | 'video' | 'document';

const TYPE_DIRS: Record<AssetType, string> = {
  image: 'images',
  video: 'videos',
  document: 'documents',
};

interface Asset {
  id: string;
  type: AssetType;
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

function getAssetType(mimeType: string): AssetType {
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

async function resolveCollision(targetDir: string, filename: string): Promise<string> {
  const ext = path.extname(filename);
  const base = path.basename(filename, ext);
  let candidate = filename;
  let counter = 1;
  while (true) {
    try {
      await fs.access(path.join(targetDir, candidate));
      candidate = `${base}-${Date.now()}-${counter}${ext}`;
      counter++;
    } catch {
      return candidate;
    }
  }
}

function isInCorrectTypeDir(relPath: string, assetType: AssetType): boolean {
  const typeDir = TYPE_DIRS[assetType];
  const parts = relPath.split(path.sep);
  return parts[0] === typeDir;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  console.log(`\nScanning for unregistered assets...${dryRun ? ' (dry run)' : ''}\n`);

  const existingAssets = await readAssetsJson();
  const registeredUrls = new Set(existingAssets.map((a) => a.url));

  const result: ScanResult = { registered: [], moved: [], skipped: [], errors: [] };
  const newAssets: Asset[] = [];

  // Scan both directories
  const scanDirs = [
    { dir: UPLOADS_DIR, label: 'public/uploads' },
    { dir: ASSETS_PUBLIC_DIR, label: 'public/assets' },
  ];

  let sharpWarned = false;

  for (const source of scanDirs) {
    const relPaths = await listFilesRecursive(source.dir);

    for (const relPath of relPaths) {
      const ext = path.extname(relPath).toLowerCase();
      const mimeType = EXTENSION_TO_MIME[ext];
      const filename = path.basename(relPath);

      if (!mimeType) {
        result.skipped.push({ filename: relPath, reason: `unsupported extension (${ext})` });
        continue;
      }

      const assetType = getAssetType(mimeType);
      const typeDir = TYPE_DIRS[assetType];
      const sourceFilePath = path.join(source.dir, relPath);

      // Target: always /uploads/{type}/{filename}
      const targetDir = path.join(UPLOADS_DIR, typeDir);
      let targetFilename = filename;

      // Check if already registered under any known URL pattern
      const canonicalUrl = `/uploads/${typeDir}/${filename}`;
      const legacyUrls = [
        `/uploads/${relPath.split(path.sep).join('/')}`,
        `/assets/${relPath.split(path.sep).join('/')}`,
        `/uploads/${filename}`,
      ];
      const allUrls = [canonicalUrl, ...legacyUrls];
      if (allUrls.some((url) => registeredUrls.has(url))) {
        result.skipped.push({ filename: relPath, reason: 'already registered' });
        continue;
      }

      // Check if file is already in the correct location
      const alreadyInPlace =
        source.dir === UPLOADS_DIR && isInCorrectTypeDir(relPath, assetType);

      // Determine if we need to move the file
      const needsMove = !alreadyInPlace;

      if (needsMove) {
        try {
          // Resolve collision in target dir
          try {
            await fs.access(path.join(targetDir, filename));
            targetFilename = await resolveCollision(targetDir, filename);
          } catch {
            // No collision
          }

          if (!dryRun) {
            await fs.mkdir(targetDir, { recursive: true });
            await fs.rename(sourceFilePath, path.join(targetDir, targetFilename));
          }
          result.moved.push({
            from: `${source.label}/${relPath}`,
            to: `public/uploads/${typeDir}/${targetFilename}`,
          });
        } catch (err) {
          result.errors.push({ filename: relPath, error: `failed to move: ${err}` });
          continue;
        }
      }

      // Get file stats from final location
      const statPath = needsMove && !dryRun
        ? path.join(targetDir, targetFilename)
        : sourceFilePath;

      try {
        const stat = await fs.stat(statPath);

        // Get image dimensions (skip SVGs — unreliable via sharp)
        let dimensions: { width: number; height: number } | null = null;
        if (assetType === 'image' && ext !== '.svg') {
          dimensions = await getImageDimensions(statPath);
          if (!dimensions && !sharpWarned) {
            console.log('  Note: sharp not available, skipping image dimensions\n');
            sharpWarned = true;
          }
        }

        const targetUrl = `/uploads/${typeDir}/${targetFilename}`;
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
        result.registered.push({ filename: targetFilename, from: source.label, url: targetUrl });
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
