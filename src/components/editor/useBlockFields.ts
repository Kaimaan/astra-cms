'use client';

import { useState, useEffect } from 'react';
import type { EditableField } from '@/lib/schema/schema-to-fields';

const cache = new Map<string, EditableField[]>();
const inflight = new Map<string, Promise<EditableField[]>>();

export function useBlockFields(blockType: string | null): { fields: EditableField[] | null } {
  const [fields, setFields] = useState<EditableField[] | null>(
    blockType ? cache.get(blockType) ?? null : null
  );

  useEffect(() => {
    if (!blockType) return;

    if (cache.has(blockType)) {
      setFields(cache.get(blockType)!);
      return;
    }

    let cancelled = false;

    // Deduplicate concurrent requests for the same block type
    let promise = inflight.get(blockType);
    if (!promise) {
      promise = fetch(`/api/admin/blocks/${encodeURIComponent(blockType)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.fields) {
            cache.set(blockType, data.fields);
          }
          inflight.delete(blockType);
          return data.fields ?? [];
        })
        .catch(() => {
          inflight.delete(blockType);
          return [];
        });
      inflight.set(blockType, promise);
    }

    promise.then((result) => {
      if (!cancelled && result.length > 0) {
        setFields(result);
      }
    });

    return () => { cancelled = true; };
  }, [blockType]);

  return { fields };
}
