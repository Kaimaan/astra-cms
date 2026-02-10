'use client';

/**
 * Block Properties Panel
 *
 * Direct form editing for block properties.
 * Renders inputs based on the prop types and calls updateBlock() on change.
 */

import { useId, useRef } from 'react';
import { useEditMode } from './EditModeProvider';

const MAX_DEPTH = 4;

export function BlockPropertiesPanel() {
  const { selectedBlock, updateBlock } = useEditMode();
  const propsRef = useRef<Record<string, unknown>>({});

  if (!selectedBlock) return null;

  const blockId = selectedBlock.id;
  const props = (selectedBlock.props || {}) as Record<string, unknown>;
  propsRef.current = props;

  const handleChange = (key: string, value: unknown) => {
    updateBlock(blockId, { ...propsRef.current, [key]: value });
  };

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
          <PropertyField
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

function PropertyField({
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
  const label = nameToLabel(name);

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
          <textarea
            id={fieldId}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          />
        ) : (
          <input
            id={fieldId}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          />
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
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
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
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${value ? 'translate-x-5' : ''}`}
          />
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
                    <PropertyField
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
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
            <PropertyField
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

  // Fallback: render as text
  return (
    <div>
      <label htmlFor={fieldId} className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input
        id={fieldId}
        type="text"
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
      />
    </div>
  );
}

function nameToLabel(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
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
