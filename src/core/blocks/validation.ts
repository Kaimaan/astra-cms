/**
 * Block Validation
 *
 * Utilities for validating block instances against their schemas.
 * NO Next.js imports - pure TypeScript
 */

import type { ZodError } from 'zod';
import type { BlockInstance } from './types';
import { getBlockDefinition } from './registry';

// =============================================================================
// VALIDATION RESULT
// =============================================================================

export interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
}

export interface ValidationError {
  blockId: string;
  blockType: string;
  path: string[];
  message: string;
}

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Validate a single block instance
 */
export function validateBlock(instance: BlockInstance): ValidationResult {
  const definition = getBlockDefinition(instance.type);

  if (!definition) {
    return {
      valid: false,
      errors: [
        {
          blockId: instance.id,
          blockType: instance.type,
          path: [],
          message: `Unknown block type: ${instance.type}`,
        },
      ],
    };
  }

  try {
    definition.schema.parse(instance.props);
    return { valid: true };
  } catch (error) {
    const zodError = error as ZodError;
    return {
      valid: false,
      errors: zodError.errors.map((err) => ({
        blockId: instance.id,
        blockType: instance.type,
        path: err.path.map(String),
        message: err.message,
      })),
    };
  }
}

/**
 * Validate multiple block instances
 */
export function validateBlocks(instances: BlockInstance[]): ValidationResult {
  const allErrors: ValidationError[] = [];

  for (const instance of instances) {
    const result = validateBlock(instance);
    if (!result.valid && result.errors) {
      allErrors.push(...result.errors);
    }
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors.length > 0 ? allErrors : undefined,
  };
}

/**
 * Safely parse block props, returning default props on failure
 */
export function safeParseBlockProps<T>(
  instance: BlockInstance
): { success: true; data: T } | { success: false; error: ValidationError[] } {
  const definition = getBlockDefinition(instance.type);

  if (!definition) {
    return {
      success: false,
      error: [
        {
          blockId: instance.id,
          blockType: instance.type,
          path: [],
          message: `Unknown block type: ${instance.type}`,
        },
      ],
    };
  }

  const result = definition.schema.safeParse(instance.props);

  if (result.success) {
    return { success: true, data: result.data as T };
  }

  return {
    success: false,
    error: result.error.errors.map((err) => ({
      blockId: instance.id,
      blockType: instance.type,
      path: err.path.map(String),
      message: err.message,
    })),
  };
}
