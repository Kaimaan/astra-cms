import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { getContentProvider } from '@/infrastructure';

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

// Ensure uploads directory exists
async function ensureUploadsDir() {
  try {
    await mkdir(UPLOADS_DIR, { recursive: true });
  } catch {
    // Directory exists
  }
}

// GET /api/admin/assets - List all assets
export async function GET() {
  try {
    const provider = getContentProvider();
    const assets = await provider.getAssets({ sortBy: 'createdAt', sortOrder: 'desc' });
    return NextResponse.json(assets);
  } catch (error) {
    console.error('Error fetching assets:', error);
    return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 });
  }
}

// POST /api/admin/assets - Upload new asset
export async function POST(request: NextRequest) {
  try {
    await ensureUploadsDir();

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const ext = path.extname(file.name);
    const baseName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9]/g, '-');
    const filename = `${baseName}-${timestamp}${ext}`;

    // Save file to public/uploads
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = path.join(UPLOADS_DIR, filename);
    await writeFile(filePath, buffer);

    // Get image dimensions if it's an image
    let width: number | undefined;
    let height: number | undefined;

    // Register asset in content provider
    const provider = getContentProvider();
    const asset = await provider.uploadAsset(buffer, {
      filename,
      mimeType: file.type,
    });

    // Update with correct URL
    const updatedAsset = await provider.updateAsset(asset.id, {
      url: `/uploads/${filename}`,
      size: buffer.length,
      width,
      height,
    });

    return NextResponse.json(updatedAsset);
  } catch (error) {
    console.error('Error uploading asset:', error);
    return NextResponse.json({ error: 'Failed to upload asset' }, { status: 500 });
  }
}
