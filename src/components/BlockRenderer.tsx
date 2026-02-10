/**
 * Block Renderer
 *
 * Renders a list of block instances by looking up their definitions
 * in the registry and calling their render functions.
 *
 * This is a server component to support async blocks that fetch data.
 */

import { type ComponentType } from 'react';
import type { BlockInstance, BlockRendererProps } from '@/core/block-system/types';
import { getBlockDefinition } from '@/core/block-system/registry';

// Ensure all blocks are registered
import '@/blocks';

interface Props {
  blocks: BlockInstance[];
  editMode?: boolean;
}

export function BlockRenderer({ blocks, editMode = false }: Props) {
  return (
    <>
      {blocks.map((block) => (
        <BlockInstanceRenderer
          key={block.id}
          block={block}
          editMode={editMode}
        />
      ))}
    </>
  );
}

interface BlockInstanceRendererProps {
  block: BlockInstance;
  editMode: boolean;
}

function BlockInstanceRenderer({ block, editMode }: BlockInstanceRendererProps) {
  const definition = getBlockDefinition(block.type);

  if (!definition) {
    // Unknown block type - show placeholder in edit mode, hide in view mode
    if (editMode) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          Unknown block type: <code>{block.type}</code>
        </div>
      );
    }
    return null;
  }

  // Get the render component from the definition
  const RenderComponent = definition.render as ComponentType<BlockRendererProps>;

  // Safety check - render function might not be loaded yet
  if (!RenderComponent) {
    if (editMode) {
      return (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
          Block &quot;{block.type}&quot; renderer not loaded
        </div>
      );
    }
    console.warn(`Block "${block.type}" has no render component`);
    return null;
  }

  // Wrap in edit mode wrapper if needed
  if (editMode) {
    return (
      <EditModeWrapper blockId={block.id} blockType={block.type}>
        <RenderComponent
          props={block.props}
          blockId={block.id}
          editMode={editMode}
        />
      </EditModeWrapper>
    );
  }

  return (
    <RenderComponent
      props={block.props}
      blockId={block.id}
      editMode={editMode}
    />
  );
}

interface EditModeWrapperProps {
  blockId: string;
  blockType: string;
  children: React.ReactNode;
}

function EditModeWrapper({ blockId, blockType, children }: EditModeWrapperProps) {
  // TODO: Implement edit mode functionality
  // - Click to select
  // - Show block type indicator
  // - Drag handle for reordering
  // - Edit/delete buttons

  return (
    <div
      className="relative group"
      data-block-id={blockId}
      data-block-type={blockType}
    >
      {/* Edit mode overlay - shown on hover */}
      <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute top-2 right-2 flex gap-2 pointer-events-auto">
          <span className="px-2 py-1 text-xs font-medium bg-gray-900 text-white rounded">
            {blockType}
          </span>
        </div>
        <div className="absolute inset-0 border-2 border-primary-500 border-dashed rounded-lg" />
      </div>

      {children}
    </div>
  );
}
