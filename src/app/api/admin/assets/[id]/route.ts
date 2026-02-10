import { NextRequest, NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import path from 'path';
import { getContentProvider } from '@/infrastructure';
import { validateId, validateBody } from '@/lib/validation/validate';
import { updateAssetSchema } from '@/lib/validation/schemas/asset-schemas';
import { withAuthParams } from '@/core/auth/middleware';

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

// GET /api/admin/assets/[id] - Get single asset
export const GET = withAuthParams('assets:read', async (_request, { params }, _auth) => {
  try {
    const { id } = await params;
    const provider = getContentProvider();
    const asset = await provider.getAsset(id);

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    return NextResponse.json(asset);
  } catch (error) {
    console.error('Error fetching asset:', error);
    return NextResponse.json({ error: 'Failed to fetch asset' }, { status: 500 });
  }
});

// PATCH /api/admin/assets/[id] - Update asset metadata
export const PATCH = withAuthParams('assets:update', async (request, { params }, _auth) => {
  try {
    const { id } = await params;
    const idError = validateId(id);
    if (idError) return idError;

    const validation = await validateBody(request, updateAssetSchema);
    if (!validation.success) return validation.response;

    const provider = getContentProvider();
    const asset = await provider.updateAsset(id, validation.data);

    return NextResponse.json(asset);
  } catch (error) {
    console.error('Error updating asset:', error);
    return NextResponse.json({ error: 'Failed to update asset' }, { status: 500 });
  }
});

// DELETE /api/admin/assets/[id] - Delete asset
export const DELETE = withAuthParams('assets:delete', async (_request, { params }, _auth) => {
  try {
    const { id } = await params;
    const provider = getContentProvider();

    // Get asset to find file path
    const asset = await provider.getAsset(id);
    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    // Delete file from disk
    if (asset.url.startsWith('/uploads/') || asset.url.startsWith('/assets/')) {
      const filePath = path.join(process.cwd(), 'public', asset.url);
      try {
        await unlink(filePath);
      } catch {
        // File might not exist
      }
    }

    // Delete from content provider
    await provider.deleteAsset(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting asset:', error);
    return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 });
  }
});
