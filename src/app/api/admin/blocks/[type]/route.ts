import { NextRequest, NextResponse } from 'next/server';
import '@/blocks'; // trigger block registration
import { getBlockDefinition } from '@/core/blocks/registry';
import { getEditableFields } from '@/lib/schema/schema-to-fields';
import { withAuthParams } from '@/core/auth/middleware';

export const GET = withAuthParams('pages:read', async (_request, { params }, _auth) => {
  const { type } = await params;
  const definition = getBlockDefinition(type);

  if (!definition) {
    return NextResponse.json({ error: 'Block type not found' }, { status: 404 });
  }

  const fields = getEditableFields(definition.schema);

  return NextResponse.json({
    type: definition.type,
    label: definition.label,
    description: definition.description || '',
    icon: definition.icon || '',
    category: definition.category || '',
    version: definition.version,
    defaultProps: definition.defaultProps,
    fields,
  });
});
