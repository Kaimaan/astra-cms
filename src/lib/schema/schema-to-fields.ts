/**
 * Schema to Fields Utility
 *
 * Converts Zod schemas to field descriptions for the chat UI.
 * This allows the AI and users to understand what can be edited.
 */

import type { ZodType, ZodObject, ZodEnum, ZodArray } from 'zod';

export interface EditableField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'enum' | 'object' | 'array';
  label: string;
  required: boolean;
  description?: string;
  options?: string[]; // For enums
  nested?: EditableField[]; // For objects
  itemType?: string; // For arrays
}

// Type for accessing Zod internal definitions
interface ZodDef {
  typeName?: string;
  innerType?: ZodType;
  type?: ZodType;
  values?: string[];
  checks?: Array<{ kind: string }>;
}

/**
 * Get the internal definition of a Zod schema
 */
function getDef(schema: ZodType): ZodDef {
  return (schema as unknown as { _def: ZodDef })._def || {};
}

/**
 * Get the inner type of a Zod schema (unwrapping optional, default, etc.)
 */
function unwrapType(schema: ZodType): { schema: ZodType; required: boolean } {
  let required = true;
  let current = schema;

  // Keep unwrapping until we get to the base type
  while (true) {
    const def = getDef(current);
    const typeName = def.typeName;

    if (typeName === 'ZodOptional' || typeName === 'ZodDefault' || typeName === 'ZodNullable') {
      // Optional and nullable make the field not required
      // Default keeps it required but still needs unwrapping
      if (typeName === 'ZodOptional' || typeName === 'ZodNullable') {
        required = false;
      }
      if (def.innerType) {
        current = def.innerType;
      } else {
        break;
      }
    } else {
      break;
    }
  }

  return { schema: current, required };
}

/**
 * Get the Zod type name
 */
function getTypeName(schema: ZodType): string {
  return getDef(schema).typeName || 'unknown';
}

/**
 * Convert a field name to a human-readable label
 */
function nameToLabel(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim();
}

/**
 * Extract fields from a Zod object schema
 */
export function getEditableFields(schema: ZodType, currentProps?: Record<string, unknown>): EditableField[] {
  const fields: EditableField[] = [];

  const typeName = getTypeName(schema);
  if (typeName !== 'ZodObject') {
    return fields;
  }

  const shape = (schema as ZodObject<Record<string, ZodType>>).shape;

  for (const [name, fieldSchema] of Object.entries(shape)) {
    const { schema: innerSchema, required } = unwrapType(fieldSchema);
    const innerTypeName = getTypeName(innerSchema);
    const innerDef = getDef(innerSchema);

    const field: EditableField = {
      name,
      type: 'string',
      label: nameToLabel(name),
      required,
    };

    switch (innerTypeName) {
      case 'ZodString':
        field.type = 'string';
        const checks = innerDef.checks || [];
        const urlCheck = checks.find((c) => c.kind === 'url');
        if (urlCheck) {
          field.description = 'URL';
        }
        break;

      case 'ZodNumber':
        field.type = 'number';
        break;

      case 'ZodBoolean':
        field.type = 'boolean';
        break;

      case 'ZodEnum':
        field.type = 'enum';
        field.options = (innerSchema as ZodEnum<[string, ...string[]]>)._def.values;
        break;

      case 'ZodArray':
        field.type = 'array';
        const elementSchema = (innerSchema as ZodArray<ZodType>)._def.type;
        const elementTypeName = getTypeName(elementSchema);
        if (elementTypeName === 'ZodObject') {
          field.nested = getEditableFields(elementSchema);
          field.itemType = 'object';
        } else {
          field.itemType = elementTypeName.replace('Zod', '').toLowerCase();
        }
        break;

      case 'ZodObject':
        field.type = 'object';
        field.nested = getEditableFields(innerSchema);
        break;

      default:
        field.type = 'string';
    }

    fields.push(field);
  }

  return fields;
}

/**
 * Generate a human-readable description of the schema for the AI
 */
export function schemaToDescription(fields: EditableField[], indent: number = 0): string {
  const lines: string[] = [];
  const prefix = '  '.repeat(indent);

  for (const field of fields) {
    const requiredStr = field.required ? '(required)' : '(optional)';
    let line = `${prefix}- ${field.label} (${field.name}): ${field.type} ${requiredStr}`;

    if (field.options) {
      line += ` - options: ${field.options.join(', ')}`;
    }

    if (field.description) {
      line += ` - ${field.description}`;
    }

    lines.push(line);

    if (field.nested && field.nested.length > 0) {
      lines.push(schemaToDescription(field.nested, indent + 1));
    }
  }

  return lines.join('\n');
}

/**
 * Format current props as a readable summary
 */
export function formatPropsForDisplay(
  fields: EditableField[],
  props: Record<string, unknown>
): Array<{ label: string; name: string; value: string; type: string }> {
  const result: Array<{ label: string; name: string; value: string; type: string }> = [];

  for (const field of fields) {
    const value = props[field.name];

    let displayValue: string;
    if (value === undefined || value === null) {
      displayValue = '(not set)';
    } else if (typeof value === 'object') {
      if (Array.isArray(value)) {
        displayValue = `${value.length} item${value.length !== 1 ? 's' : ''}`;
      } else {
        displayValue = '(object)';
      }
    } else if (typeof value === 'string' && value.length > 50) {
      displayValue = value.substring(0, 50) + '...';
    } else {
      displayValue = String(value);
    }

    result.push({
      label: field.label,
      name: field.name,
      value: displayValue,
      type: field.type,
    });
  }

  return result;
}
