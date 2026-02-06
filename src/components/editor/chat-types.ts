/**
 * Chat-based block editing types
 */

import type { EditableField } from '@/lib/schema/schema-to-fields';

/** A single field-level diff between old and new props */
export interface PropDiff {
  /** Dot-notation path (e.g., "cta.label" or "features[0].title") */
  path: string;
  /** Human-readable label */
  label: string;
  /** Previous value (serialized for display) */
  oldValue: string;
  /** New value (serialized for display) */
  newValue: string;
  /** Field type from schema introspection */
  type: 'string' | 'number' | 'boolean' | 'enum' | 'object' | 'array';
}

/** A proposed set of property changes from the AI */
export interface PropProposal {
  updatedProps: Record<string, unknown>;
  explanation: string;
  diffs: PropDiff[];
  status: 'pending' | 'accepted' | 'rejected';
}

/** A single message in the chat conversation */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  proposal?: PropProposal;
}

/** Per-block conversation state */
export interface BlockConversation {
  blockId: string;
  blockType: string;
  messages: ChatMessage[];
  /** Conversation history in the format the API expects */
  apiHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
}

/** Block metadata fetched from the API */
export interface BlockMetadata {
  type: string;
  label: string;
  description: string;
  icon: string;
  category: string;
  fields: EditableField[];
}
