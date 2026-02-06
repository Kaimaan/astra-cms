/**
 * Chat utility functions
 *
 * Diff computation and formatting for the chat-based editor.
 */

import type { PropDiff } from './chat-types';
import type { EditableField } from '@/lib/schema/schema-to-fields';

/** Generate a unique message ID */
export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Serialize a value for diff display */
export function serializeForDisplay(value: unknown): string {
  if (value === undefined || value === null) return '(not set)';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return `${value.length} item${value.length !== 1 ? 's' : ''}`;
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return '(object)';
    }
  }
  return String(value);
}

/** Truncate a string for display */
export function truncateDisplay(value: string, maxLength = 80): string {
  if (value.length <= maxLength) return value;
  return value.substring(0, maxLength) + '...';
}

/**
 * Compute field-level diffs between old and new props.
 * Walks the schema fields recursively to produce labeled diffs.
 */
export function computePropDiffs(
  fields: EditableField[],
  oldProps: Record<string, unknown>,
  newProps: Record<string, unknown>,
  pathPrefix = ''
): PropDiff[] {
  const diffs: PropDiff[] = [];

  for (const field of fields) {
    const oldVal = oldProps[field.name];
    const newVal = newProps[field.name];
    const path = pathPrefix ? `${pathPrefix}.${field.name}` : field.name;

    if (field.type === 'object' && field.nested) {
      // Recurse into nested objects
      const oldObj = (oldVal && typeof oldVal === 'object' ? oldVal : {}) as Record<string, unknown>;
      const newObj = (newVal && typeof newVal === 'object' ? newVal : {}) as Record<string, unknown>;
      diffs.push(...computePropDiffs(field.nested, oldObj, newObj, path));
    } else if (field.type === 'array' && Array.isArray(newVal)) {
      const oldArr = Array.isArray(oldVal) ? oldVal : [];

      // Show count change if items were added or removed
      if (oldArr.length !== newVal.length) {
        diffs.push({
          path,
          label: field.label,
          oldValue: `${oldArr.length} item${oldArr.length !== 1 ? 's' : ''}`,
          newValue: `${newVal.length} item${newVal.length !== 1 ? 's' : ''}`,
          type: 'array',
        });
      }

      // Compare items that exist in both arrays
      if (field.nested) {
        const sharedLen = Math.min(oldArr.length, newVal.length);
        for (let i = 0; i < sharedLen; i++) {
          const oldItem = (oldArr[i] && typeof oldArr[i] === 'object' ? oldArr[i] : {}) as Record<string, unknown>;
          const newItem = (newVal[i] && typeof newVal[i] === 'object' ? newVal[i] : {}) as Record<string, unknown>;
          diffs.push(...computePropDiffs(field.nested, oldItem, newItem, `${path}[${i}]`));
        }
      }
    } else {
      // Primitive comparison
      const oldStr = JSON.stringify(oldVal);
      const newStr = JSON.stringify(newVal);
      if (oldStr !== newStr) {
        diffs.push({
          path,
          label: field.label,
          oldValue: truncateDisplay(serializeForDisplay(oldVal)),
          newValue: truncateDisplay(serializeForDisplay(newVal)),
          type: field.type,
        });
      }
    }
  }

  return diffs;
}
