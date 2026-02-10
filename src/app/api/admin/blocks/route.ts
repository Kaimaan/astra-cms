import { NextResponse } from 'next/server';
import '@/blocks';
import { getAllBlocks } from '@/core/blocks/registry';

export async function GET() {
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
}
