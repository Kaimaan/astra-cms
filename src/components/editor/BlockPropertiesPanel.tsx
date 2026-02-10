'use client';

/**
 * Block Properties Panel
 *
 * Schema-aware form editing for block properties.
 * Uses the block's Zod schema (via getEditableFields) to render inputs
 * for ALL fields — including optional ones not yet set in the block data.
 * Enum fields render as dropdowns, optional objects get Add/Remove toggles.
 */

import { useId, useRef } from 'react';
import { useEditMode } from './EditModeProvider';
import { useBlockFields } from './useBlockFields';
import { ImagePicker } from '@/components/admin/ImagePicker';
import type { EditableField } from '@/lib/schema/schema-to-fields';

const MAX_DEPTH = 4;

function getEmptyValue(type: EditableField['type']): unknown {
  switch (type) {
    case 'string': return '';
    case 'number': return 0;
    case 'boolean': return false;
    case 'enum': return '';
    case 'array': return [];
    case 'object': return {};
    default: return '';
  }
}

function initializeObject(nested: EditableField[]): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const f of nested) {
    obj[f.name] = f.defaultValue ?? getEmptyValue(f.type);
  }
  return obj;
}

function getItemLabel(item: unknown, index: number): string {
  if (typeof item === 'object' && item !== null) {
    const obj = item as Record<string, unknown>;
    if (typeof obj.title === 'string') return obj.title || `Item ${index + 1}`;
    if (typeof obj.label === 'string') return obj.label || `Item ${index + 1}`;
    if (typeof obj.name === 'string') return obj.name || `Item ${index + 1}`;
  }
  return `Item ${index + 1}`;
}

const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500';

export function BlockPropertiesPanel() {
  const { selectedBlock, updateBlock } = useEditMode();
  const { fields } = useBlockFields(selectedBlock?.type ?? null);
  const propsRef = useRef<Record<string, unknown>>({});

  if (!selectedBlock) return null;

  const blockId = selectedBlock.id;
  const props = (selectedBlock.props || {}) as Record<string, unknown>;
  propsRef.current = props;

  const handleChange = (key: string, value: unknown) => {
    updateBlock(blockId, { ...propsRef.current, [key]: value });
  };

  const handleRemove = (key: string) => {
    const { [key]: _, ...rest } = propsRef.current;
    updateBlock(blockId, rest);
  };

  // Schema-aware rendering when fields are available
  if (fields) {
    return (
      <div className="p-4 h-full">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-900 capitalize">
            {selectedBlock.type.replace(/-/g, ' ')} Properties
          </h3>
          <p className="text-xs text-gray-500 mt-1">Edit block properties directly</p>
        </div>
        <div className="space-y-4">
          {fields.map((field) => (
            <SchemaPropertyField
              key={field.name}
              field={field}
              value={props[field.name]}
              onChange={(newValue) => handleChange(field.name, newValue)}
              onRemove={() => handleRemove(field.name)}
            />
          ))}
        </div>
      </div>
    );
  }

  // Fallback: iterate props directly (if schema fetch failed)
  return (
    <div className="p-4 h-full">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900 capitalize">
          {selectedBlock.type.replace(/-/g, ' ')} Properties
        </h3>
        <p className="text-xs text-gray-500 mt-1">Edit block properties directly</p>
      </div>
      <div className="space-y-4">
        {Object.entries(props).map(([key, value]) => (
          <FallbackPropertyField
            key={key}
            name={key}
            value={value}
            onChange={(newValue) => handleChange(key, newValue)}
          />
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// SCHEMA-AWARE FIELD COMPONENT
// =============================================================================

function SchemaPropertyField({
  field,
  value,
  onChange,
  onRemove,
  depth = 0,
}: {
  field: EditableField;
  value: unknown;
  onChange: (value: unknown) => void;
  onRemove?: () => void;
  depth?: number;
}) {
  const fieldId = useId();
  const isSet = value !== undefined && value !== null;
  const optionalHint = !field.required ? (
    <span className="text-gray-400 font-normal ml-1">(optional)</span>
  ) : null;

  if (depth >= MAX_DEPTH) {
    return (
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">{field.label}</label>
        <p className="text-xs text-gray-400 italic">Nested too deep to edit</p>
      </div>
    );
  }

  // --- Optional object fields: Add/Remove toggle ---
  if (field.type === 'object' && field.nested && field.nested.length > 0 && !field.required) {
    if (!isSet) {
      return (
        <div>
          <div className="flex items-center justify-between">
            <label className="block text-xs font-medium text-gray-600">{field.label}</label>
            <button
              type="button"
              onClick={() => onChange(initializeObject(field.nested!))}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium"
            >
              + Add {field.label}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">Optional — click to add</p>
        </div>
      );
    }
    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-medium text-gray-600">{field.label}</label>
          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-red-500 hover:text-red-700 font-medium"
          >
            Remove
          </button>
        </div>
        <div className="pl-3 border-l-2 border-gray-200 space-y-3">
          {field.nested!.map((nestedField) => (
            <SchemaPropertyField
              key={nestedField.name}
              field={nestedField}
              value={(value as Record<string, unknown>)[nestedField.name]}
              depth={depth + 1}
              onChange={(newVal) => {
                onChange({ ...(value as Record<string, unknown>), [nestedField.name]: newVal });
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  // --- Required object fields ---
  if (field.type === 'object' && field.nested && field.nested.length > 0) {
    const objValue = (isSet ? value : {}) as Record<string, unknown>;
    return (
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">{field.label}</label>
        <div className="pl-3 border-l-2 border-gray-200 space-y-3">
          {field.nested.map((nestedField) => (
            <SchemaPropertyField
              key={nestedField.name}
              field={nestedField}
              value={objValue[nestedField.name]}
              depth={depth + 1}
              onChange={(newVal) => {
                onChange({ ...objValue, [nestedField.name]: newVal });
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  // --- Enum fields: dropdown ---
  if (field.type === 'enum' && field.options) {
    return (
      <div>
        <label htmlFor={fieldId} className="block text-xs font-medium text-gray-600 mb-1">
          {field.label}{optionalHint}
        </label>
        <select
          id={fieldId}
          value={String(value ?? field.defaultValue ?? '')}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        >
          {!isSet && !field.required && <option value="">(not set)</option>}
          {field.options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    );
  }

  // --- String fields ---
  if (field.type === 'string') {
    const strValue = typeof value === 'string' ? value : '';
    const isLong = strValue.length > 80;
    const isUrl = field.description === 'URL';

    // Image picker for URL fields (backgroundImage, poster, etc.)
    if (isUrl) {
      return (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            {field.label}{optionalHint}
          </label>
          <ImagePicker
            value={strValue || undefined}
            onChange={(url) => onChange(url)}
            placeholder={`Select ${field.label.toLowerCase()}`}
          />
        </div>
      );
    }

    return (
      <div>
        <label htmlFor={fieldId} className="block text-xs font-medium text-gray-600 mb-1">
          {field.label}{optionalHint}
        </label>
        {isLong ? (
          <textarea
            id={fieldId}
            value={strValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.defaultValue ? String(field.defaultValue) : undefined}
            rows={3}
            className={inputClass}
          />
        ) : (
          <input
            id={fieldId}
            type="text"
            value={strValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.defaultValue ? String(field.defaultValue) : undefined}
            className={inputClass}
          />
        )}
      </div>
    );
  }

  // --- Number fields ---
  if (field.type === 'number') {
    return (
      <div>
        <label htmlFor={fieldId} className="block text-xs font-medium text-gray-600 mb-1">
          {field.label}{optionalHint}
        </label>
        <input
          id={fieldId}
          type="number"
          value={typeof value === 'number' ? value : (typeof field.defaultValue === 'number' ? field.defaultValue : '')}
          onChange={(e) => {
            const parsed = Number(e.target.value);
            onChange(Number.isNaN(parsed) ? 0 : parsed);
          }}
          className={inputClass}
        />
      </div>
    );
  }

  // --- Boolean fields ---
  if (field.type === 'boolean') {
    const boolValue = typeof value === 'boolean' ? value : (field.defaultValue === true);
    return (
      <div className="flex items-center justify-between">
        <label htmlFor={fieldId} className="text-xs font-medium text-gray-600">
          {field.label}{optionalHint}
        </label>
        <button
          id={fieldId}
          type="button"
          role="switch"
          aria-checked={boolValue}
          onClick={() => onChange(!boolValue)}
          className={`relative w-10 h-5 rounded-full transition-colors ${boolValue ? 'bg-primary-600' : 'bg-gray-300'}`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${boolValue ? 'translate-x-5' : ''}`}
          />
        </button>
      </div>
    );
  }

  // --- Array fields ---
  if (field.type === 'array') {
    const items = Array.isArray(value) ? value : [];

    if (field.nested && field.nested.length > 0) {
      // Array of objects
      return (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">
            {field.label} ({items.length} item{items.length !== 1 ? 's' : ''})
          </label>
          <div className="space-y-2">
            {items.map((item, index) => (
              <details key={index} className="border border-gray-200 rounded-lg">
                <summary className="px-3 py-2 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50 flex items-center justify-between">
                  <span>{getItemLabel(item, index)}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      onChange(items.filter((_: unknown, i: number) => i !== index));
                    }}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </summary>
                <div className="px-3 pb-3 space-y-3">
                  {field.nested!.map((nestedField) => (
                    <SchemaPropertyField
                      key={nestedField.name}
                      field={nestedField}
                      value={(item as Record<string, unknown>)?.[nestedField.name]}
                      depth={depth + 1}
                      onChange={(newVal) => {
                        const updated = [...items];
                        updated[index] = { ...(item as Record<string, unknown>), [nestedField.name]: newVal };
                        onChange(updated);
                      }}
                    />
                  ))}
                </div>
              </details>
            ))}
            <button
              type="button"
              onClick={() => onChange([...items, initializeObject(field.nested!)])}
              className="w-full px-3 py-2 text-sm text-primary-600 border border-dashed border-gray-300 rounded-lg hover:border-primary-300 hover:bg-primary-50/50 transition-colors"
            >
              + Add item
            </button>
          </div>
        </div>
      );
    }

    // Array of primitives
    return (
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">
          {field.label} ({items.length} item{items.length !== 1 ? 's' : ''})
        </label>
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={String(item)}
                onChange={(e) => {
                  const updated = [...items];
                  updated[index] = e.target.value;
                  onChange(updated);
                }}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => onChange(items.filter((_: unknown, i: number) => i !== index))}
                className="text-xs text-red-500 hover:text-red-700 px-2"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => onChange([...items, ''])}
            className="w-full px-3 py-2 text-sm text-primary-600 border border-dashed border-gray-300 rounded-lg hover:border-primary-300 hover:bg-primary-50/50 transition-colors"
          >
            + Add item
          </button>
        </div>
      </div>
    );
  }

  // --- Fallback: text input ---
  return (
    <div>
      <label htmlFor={fieldId} className="block text-xs font-medium text-gray-600 mb-1">
        {field.label}{optionalHint}
      </label>
      <input
        id={fieldId}
        type="text"
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
    </div>
  );
}

// =============================================================================
// FALLBACK FIELD COMPONENT (when schema metadata is unavailable)
// =============================================================================

function FallbackPropertyField({
  name,
  value,
  onChange,
  depth = 0,
}: {
  name: string;
  value: unknown;
  onChange: (value: unknown) => void;
  depth?: number;
}) {
  const fieldId = useId();
  const label = name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();

  if (depth >= MAX_DEPTH) {
    return (
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">{label}</label>
        <p className="text-xs text-gray-400 italic">Nested too deep to edit</p>
      </div>
    );
  }

  if (typeof value === 'string') {
    const isLong = value.length > 80;
    return (
      <div>
        <label htmlFor={fieldId} className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
        {isLong ? (
          <textarea id={fieldId} value={value} onChange={(e) => onChange(e.target.value)} rows={3} className={inputClass} />
        ) : (
          <input id={fieldId} type="text" value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />
        )}
      </div>
    );
  }

  if (typeof value === 'number') {
    return (
      <div>
        <label htmlFor={fieldId} className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
        <input
          id={fieldId}
          type="number"
          value={value}
          onChange={(e) => {
            const parsed = Number(e.target.value);
            onChange(Number.isNaN(parsed) ? 0 : parsed);
          }}
          className={inputClass}
        />
      </div>
    );
  }

  if (typeof value === 'boolean') {
    return (
      <div className="flex items-center justify-between">
        <label htmlFor={fieldId} className="text-xs font-medium text-gray-600">{label}</label>
        <button
          id={fieldId}
          type="button"
          role="switch"
          aria-checked={value}
          onClick={() => onChange(!value)}
          className={`relative w-10 h-5 rounded-full transition-colors ${value ? 'bg-primary-600' : 'bg-gray-300'}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${value ? 'translate-x-5' : ''}`} />
        </button>
      </div>
    );
  }

  if (Array.isArray(value)) {
    return (
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">
          {label} ({value.length} item{value.length !== 1 ? 's' : ''})
        </label>
        <div className="space-y-2">
          {value.map((item, index) => (
            <details key={index} className="border border-gray-200 rounded-lg">
              <summary className="px-3 py-2 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50">
                {getItemLabel(item, index)}
              </summary>
              <div className="px-3 pb-3 space-y-3">
                {typeof item === 'object' && item !== null ? (
                  Object.entries(item as Record<string, unknown>).map(([key, val]) => (
                    <FallbackPropertyField
                      key={key}
                      name={key}
                      value={val}
                      depth={depth + 1}
                      onChange={(newVal) => {
                        const updated = [...value];
                        updated[index] = { ...(item as Record<string, unknown>), [key]: newVal };
                        onChange(updated);
                      }}
                    />
                  ))
                ) : (
                  <input
                    type="text"
                    value={String(item)}
                    onChange={(e) => {
                      const updated = [...value];
                      updated[index] = e.target.value;
                      onChange(updated);
                    }}
                    className={inputClass}
                  />
                )}
              </div>
            </details>
          ))}
        </div>
      </div>
    );
  }

  if (typeof value === 'object' && value !== null) {
    return (
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">{label}</label>
        <div className="pl-3 border-l-2 border-gray-200 space-y-3">
          {Object.entries(value as Record<string, unknown>).map(([key, val]) => (
            <FallbackPropertyField
              key={key}
              name={key}
              value={val}
              depth={depth + 1}
              onChange={(newVal) => {
                onChange({ ...(value as Record<string, unknown>), [key]: newVal });
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <label htmlFor={fieldId} className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input id={fieldId} type="text" value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} className={inputClass} />
    </div>
  );
}
