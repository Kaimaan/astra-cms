import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { getContentProvider } from '@/infrastructure';
import { withAuth } from '@/core/auth/middleware';
import { apiError, ErrorCode } from '@/lib/api-errors';

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

function getTypeSubdir(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'images';
  if (mimeType.startsWith('video/')) return 'videos';
  return 'documents';
}

async function ensureDir(dir: string) {
  try {
    await mkdir(dir, { recursive: true });
  } catch {
    // Directory exists
  }
}

// GET /api/admin/assets - List all assets
export const GET = withAuth('assets:read', async (_request, _auth) => {
  try {
    const provider = getContentProvider();
    const assets = await provider.getAssets({ sortBy: 'createdAt', sortOrder: 'desc' });
    return NextResponse.json(assets);
  } catch (error) {
    return apiError('Failed to fetch assets', ErrorCode.INTERNAL_ERROR, 500, error);
  }
});

// POST /api/admin/assets - Upload new asset
export const POST = withAuth('assets:create', async (request, _auth) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return apiError('No file provided', ErrorCode.VALIDATION_ERROR, 400);
    }

    // Determine type subdirectory
    const typeDir = getTypeSubdir(file.type);
    const targetDir = path.join(UPLOADS_DIR, typeDir);
    await ensureDir(targetDir);

    // Generate unique filename
    const timestamp = Date.now();
    const ext = path.extname(file.name);
    const baseName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9]/g, '-');
    const filename = `${baseName}-${timestamp}${ext}`;

    // Save file to public/uploads/{type}/
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = path.join(targetDir, filename);
    await writeFile(filePath, buffer);

    // Register asset in content provider
    const provider = getContentProvider();
    const asset = await provider.uploadAsset(buffer, {
      filename,
      mimeType: file.type,
    });

    // Update with correct URL
    const updatedAsset = await provider.updateAsset(asset.id, {
      url: `/uploads/${typeDir}/${filename}`,
      size: buffer.length,
    });

    return NextResponse.json(updatedAsset);
  } catch (error) {
    return apiError('Failed to upload asset', ErrorCode.INTERNAL_ERROR, 500, error);
  }
});
