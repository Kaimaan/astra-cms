import { NextRequest, NextResponse } from 'next/server';
import '@/blocks'; // trigger block registration
import { getBlockDefinition } from '@/core/blocks/registry';
import { getEditableFields } from '@/lib/schema/schema-to-fields';
import { withAuthParams } from '@/core/auth/middleware';
import { apiError, ErrorCode } from '@/lib/api-errors';

export const GET = withAuthParams('pages:read', async (_request, { params }, _auth) => {
  try {
    const { type } = await params;
    const definition = getBlockDefinition(type);

    if (!definition) {
      return apiError('Block type not found', ErrorCode.NOT_FOUND, 404);
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
  } catch (error) {
    return apiError('Failed to fetch block definition', ErrorCode.INTERNAL_ERROR, 500, error);
  }
});
