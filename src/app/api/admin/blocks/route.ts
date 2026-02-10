import { NextRequest, NextResponse } from 'next/server';
import '@/blocks';
import { getAllBlocks } from '@/core/blocks/registry';
import { withAuth } from '@/core/auth/middleware';

export const GET = withAuth('pages:read', async (_request, _auth) => {
  const blocks = getAllBlocks().map((block) => ({
    type: block.type,
    label: block.label,
    description: block.description || '',
    icon: block.icon || '',
    category: block.category || '',
    version: block.version,
    defaultProps: block.defaultProps,
  }));

  return NextResponse.json(blocks);
});
