'use client';

import { useState } from 'react';
import type { BlockRendererProps } from '@/core/block-system/types';
import type { FormProps, FormField } from './index';
import { cn } from '@/lib/cn';

// Known contact field names — these get mapped into the `contact` object
const CONTACT_FIELDS = new Set(['email', 'name', 'phone', 'company']);

export function FormRenderer({ props }: BlockRendererProps<FormProps>) {
  const { formId, formName, description, fields, submitLabel, successMessage } = props;

  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  function handleChange(name: string, value: string | boolean) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');

    // Split values into contact fields and generic fields
    const contact: Record<string, string> = {};
    const genericFields: Record<string, string | boolean> = {};

    for (const [key, val] of Object.entries(values)) {
      if (CONTACT_FIELDS.has(key) && typeof val === 'string') {
        contact[key] = val;
      } else {
        genericFields[key] = val;
      }
    }

    try {
      const response = await fetch('/api/forms/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formId,
          formName,
          contact,
          fields: genericFields,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? 'Submission failed');
      }

      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  if (status === 'success') {
    return (
      <section className="py-16 px-4">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-lg text-gray-700">{successMessage}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4">
      <div className="mx-auto max-w-xl">
        {formName && (
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">{formName}</h2>
        )}
        {description && (
          <p className="mt-2 text-gray-600">{description}</p>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {fields.map((field) => (
            <FieldInput
              key={field.name}
              field={field}
              value={values[field.name] ?? (field.type === 'checkbox' ? false : '')}
              onChange={(val) => handleChange(field.name, val)}
            />
          ))}

          {status === 'error' && (
            <p className="text-sm text-red-600">{errorMessage}</p>
          )}

          <button
            type="submit"
            disabled={status === 'submitting'}
            className={cn(
              'w-full rounded-lg bg-primary-500 px-6 py-3 font-semibold text-white transition-colors',
              'hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {status === 'submitting' ? 'Sending...' : submitLabel}
          </button>
        </form>
      </div>
    </section>
  );
}

// =============================================================================
// FIELD INPUT COMPONENT
// =============================================================================

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FormField;
  value: string | boolean;
  onChange: (value: string | boolean) => void;
}) {
  const inputClasses =
    'w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500';

  if (field.type === 'checkbox') {
    return (
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={value === true}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
        />
        <span className="text-sm text-gray-700">{field.label}</span>
      </label>
    );
  }

  if (field.type === 'textarea') {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {field.label}
          {field.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <textarea
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          required={field.required}
          rows={4}
          className={inputClasses}
        />
      </div>
    );
  }

  if (field.type === 'select') {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {field.label}
          {field.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <select
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          className={inputClasses}
        >
          <option value="">{field.placeholder ?? 'Select...'}</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    );
  }

  // text, email, tel
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {field.required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={field.type}
        value={value as string}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        required={field.required}
        className={inputClasses}
      />
    </div>
  );
}
