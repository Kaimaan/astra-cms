import { notFound } from 'next/navigation';
import Link from 'next/link';
import '@/blocks';
import { getBlockDefinition } from '@/core/blocks/registry';
import { getEditableFields } from '@/lib/schema/schema-to-fields';
import type { EditableField } from '@/lib/schema/schema-to-fields';
import { ServerIcon } from '@/lib/icons/ServerIcon';
import { categoryLabels, categoryColors } from '@/lib/blocks/category-meta';
import type { BlockCategory } from '@/core/blocks/types';

interface BlockDetailPageProps {
  params: Promise<{ type: string }>;
}

function deriveComponents(fields: EditableField[]): Array<{ name: string; label: string; fieldCount: number }> {
  const components: Array<{ name: string; label: string; fieldCount: number }> = [];
  for (const field of fields) {
    if (field.type === 'object' && field.nested && field.nested.length > 0) {
      components.push({ name: field.name, label: field.label, fieldCount: field.nested.length });
    }
    if (field.type === 'array' && field.itemType === 'object' && field.nested && field.nested.length > 0) {
      components.push({ name: field.name, label: `${field.label} Item`, fieldCount: field.nested.length });
    }
  }
  return components;
}

function FieldRow({ field, depth = 0 }: { field: EditableField; depth?: number }) {
  const indent = depth * 24;

  return (
    <>
      <tr className="border-t border-gray-100">
        <td className="px-4 py-3 text-sm" style={{ paddingLeft: `${16 + indent}px` }}>
          <code className="text-gray-900 font-medium">{field.name}</code>
        </td>
        <td className="px-4 py-3">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
            {field.type}
          </span>
        </td>
        <td className="px-4 py-3 text-sm">
          {field.required ? (
            <span className="text-red-600 font-medium">Required</span>
          ) : (
            <span className="text-gray-400">Optional</span>
          )}
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">
          {field.options ? (
            <div className="flex flex-wrap gap-1">
              {field.options.map((opt) => (
                <code key={opt} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{opt}</code>
              ))}
            </div>
          ) : field.description ? (
            <span className="text-gray-500">{field.description}</span>
          ) : null}
        </td>
        <td className="px-4 py-3 text-sm text-gray-500">
          {field.defaultValue !== undefined ? (
            <code className="text-xs">{JSON.stringify(field.defaultValue)}</code>
          ) : (
            <span className="text-gray-300">&mdash;</span>
          )}
        </td>
      </tr>
      {field.nested?.map((nested) => (
        <FieldRow key={nested.name} field={nested} depth={depth + 1} />
      ))}
    </>
  );
}

export default async function BlockDetailPage({ params }: BlockDetailPageProps) {
  const { type } = await params;
  const definition = getBlockDefinition(type);

  if (!definition) {
    notFound();
  }

  const fields = getEditableFields(definition.schema);
  const components = deriveComponents(fields);
  const category = (definition.category || 'content') as BlockCategory;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Back link */}
      <Link
        href="/admin/blocks"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to blocks
      </Link>

      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center text-2xl shrink-0">
            {definition.icon ? <ServerIcon name={definition.icon} size={28} /> : '📦'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{definition.label}</h1>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${categoryColors[category]}`}>
                {categoryLabels[category]}
              </span>
            </div>
            <code className="text-sm text-gray-500">{definition.type}</code>
            {definition.description && (
              <p className="text-gray-600 mt-2">{definition.description}</p>
            )}
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
              <span>Version {definition.version}</span>
              <span>{fields.length} fields</span>
              {components.length > 0 && <span>{components.length} component{components.length !== 1 ? 's' : ''}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Included Components */}
      {components.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Included Components</h2>
          <div className="flex flex-wrap gap-2">
            {components.map((comp) => (
              <span
                key={comp.name}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium"
              >
                {comp.label}
                <span className="text-blue-400 text-xs">({comp.fieldCount} fields)</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Schema Fields */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Schema Fields</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Field</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Required</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Options</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Default</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field) => (
                <FieldRow key={field.name} field={field} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Default Props */}
      <details className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <summary className="px-6 py-4 cursor-pointer hover:bg-gray-50 text-lg font-semibold text-gray-900">
          Default Props
        </summary>
        <div className="px-6 pb-4">
          <pre className="bg-gray-50 rounded-lg p-4 text-sm text-gray-800 overflow-x-auto">
            {JSON.stringify(definition.defaultProps, null, 2)}
          </pre>
        </div>
      </details>
    </div>
  );
}
