/**
 * Form Block Definition
 *
 * Generic form block for collecting user input (contact forms, newsletter signups, etc.).
 * Submits to POST /api/forms/submit, which triggers the onFormSubmitted lifecycle hook.
 * The formId field identifies the form type — external consumers (e.g. CRM) can route by it.
 */

import { z } from 'zod';
import type { BlockDefinition } from '@/core/block-system/types';
import { registerBlock } from '@/core/block-system/registry';
import { FormRenderer } from './renderer';

// =============================================================================
// SCHEMA
// =============================================================================

const formFieldSchema = z.object({
  /** Field key used in the submission payload (e.g. "email", "message") */
  name: z.string().min(1, 'Field name is required'),
  /** Display label */
  label: z.string().min(1, 'Field label is required'),
  /** Input type */
  type: z.enum(['text', 'email', 'tel', 'textarea', 'select', 'checkbox']),
  /** Placeholder text */
  placeholder: z.string().optional(),
  /** Whether the field is required */
  required: z.boolean().default(false),
  /** Options for select fields */
  options: z.array(z.string()).optional(),
});

export const formSchema = z.object({
  /** Form identifier sent in the webhook payload (e.g. "contact", "newsletter") */
  formId: z.string().min(1, 'Form ID is required'),
  /** Title displayed above the form */
  formName: z.string().optional(),
  /** Description text below the title */
  description: z.string().optional(),
  /** Form fields */
  fields: z.array(formFieldSchema).min(1, 'At least one field is required'),
  /** Submit button label */
  submitLabel: z.string().default('Submit'),
  /** Message shown after successful submission */
  successMessage: z.string().default('Thank you for your submission.'),
});

export type FormField = z.output<typeof formFieldSchema>;
export type FormProps = z.output<typeof formSchema>;

// =============================================================================
// BLOCK DEFINITION
// =============================================================================

export const formBlock = registerBlock<FormProps>({
  type: 'form',
  version: 1,
  schema: formSchema,
  defaultProps: {
    formId: 'contact',
    formName: 'Get in touch',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'message', label: 'Message', type: 'textarea', required: false },
    ],
    submitLabel: 'Send',
    successMessage: "Thanks! We'll be in touch.",
  },
  render: FormRenderer,
  label: 'Form',
  description: 'Collect user input with a customizable form',
  icon: 'FileText',
  category: 'interactive',
});
