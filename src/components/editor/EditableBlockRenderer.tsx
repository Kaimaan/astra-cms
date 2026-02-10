'use client';

/**
 * Editable Block Renderer
 *
 * Client-side block renderer for edit mode.
 * Shows block previews with selection state for editing.
 *
 * Note: We don't render full blocks here because some blocks are async
 * server components. Instead, we show preview representations.
 */

import { useState, useCallback } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import { useEditMode } from './EditModeProvider';
import { BlockPicker } from '@/components/admin/BlockPicker';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { generateBlockId } from '@/core/blocks/types';
import * as LucideIcons from 'lucide-react';

// Get a Lucide icon component by name
function getIconComponent(name: string): LucideIcons.LucideIcon | null {
  const icons = LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>;
  return icons[name] || null;
}

export function EditableBlockRenderer() {
  const { state, addBlock } = useEditMode();
  const [showPicker, setShowPicker] = useState(false);

  const handleBlockSelect = useCallback((blockMeta: { type: string; version: number; defaultProps: unknown }) => {
    const newBlock = {
      id: generateBlockId(),
      type: blockMeta.type,
      version: blockMeta.version,
      props: blockMeta.defaultProps,
    };
    addBlock(newBlock);
    setShowPicker(false);
  }, [addBlock]);

  return (
    <>
      {state.page.blocks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 px-8">
          <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Start building your page</h3>
          <p className="text-gray-500 text-center max-w-sm mb-6">
            Add your first block to start designing this page. Choose from heroes, features, CTAs, and more.
          </p>
          <Button onClick={() => setShowPicker(true)}>
            Add First Block
          </Button>
        </div>
      ) : (
        <>
          {state.page.blocks.map((block, index) => (
            <EditableBlockPreview
              key={block.id}
              blockId={block.id}
              blockType={block.type}
              blockProps={block.props as Record<string, unknown>}
              index={index}
              totalBlocks={state.page.blocks.length}
            />
          ))}
          <div className="flex justify-center py-8">
            <Button variant="outline" size="sm" onClick={() => setShowPicker(true)}>
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Block
              </span>
            </Button>
          </div>
        </>
      )}

      <BlockPicker
        isOpen={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={handleBlockSelect}
      />
    </>
  );
}

interface EditableBlockPreviewProps {
  blockId: string;
  blockType: string;
  blockProps: Record<string, unknown>;
  index: number;
  totalBlocks: number;
}

function EditableBlockPreview({
  blockId,
  blockType,
  blockProps,
  index,
  totalBlocks,
}: EditableBlockPreviewProps) {
  const { state, selectBlock, setEditMode, deleteBlock, reorderBlocks } = useEditMode();
  const isSelected = state.selectedBlockId === blockId;

  // Get display info based on block type
  const blockInfo = getBlockDisplayInfo(blockType, blockProps);

  return (
    <div
      className={cn(
        'relative group transition-all duration-200 cursor-pointer',
        isSelected && 'ring-2 ring-primary-500 ring-offset-2'
      )}
      data-block-id={blockId}
      data-block-type={blockType}
    >
      {/* Block type indicator + delete button */}
      <div
        className={cn(
          'absolute top-2 left-2 z-10 flex items-center gap-2 transition-opacity duration-200',
          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        )}
      >
        <span
          className={cn(
            'px-2 py-1 text-xs font-medium rounded shadow-sm',
            isSelected ? 'bg-primary-600 text-white' : 'bg-gray-900 text-white'
          )}
        >
          {blockInfo.label}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            reorderBlocks(index, index - 1);
          }}
          disabled={index === 0}
          className="p-1 bg-gray-900 hover:bg-gray-700 text-white rounded shadow-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Move up"
          aria-label="Move block up"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            reorderBlocks(index, index + 1);
          }}
          disabled={index === totalBlocks - 1}
          className="p-1 bg-gray-900 hover:bg-gray-700 text-white rounded shadow-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Move down"
          aria-label="Move block down"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            selectBlock(blockId);
            setEditMode('properties');
          }}
          className={cn(
            'p-1 text-white rounded shadow-sm transition-colors',
            isSelected && state.editMode === 'properties'
              ? 'bg-primary-600 hover:bg-primary-700'
              : 'bg-gray-900 hover:bg-gray-700'
          )}
          title="Edit properties"
          aria-label="Edit block properties"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            selectBlock(blockId);
            setEditMode('ai');
          }}
          className={cn(
            'p-1 text-white rounded shadow-sm transition-colors',
            isSelected && state.editMode === 'ai'
              ? 'bg-primary-600 hover:bg-primary-700'
              : 'bg-gray-900 hover:bg-gray-700'
          )}
          title="Edit with AI"
          aria-label="Edit block with AI"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!window.confirm('Delete this block?')) return;
            deleteBlock(blockId);
          }}
          className="p-1 bg-red-600 hover:bg-red-700 text-white rounded shadow-sm transition-colors"
          title="Delete block"
          aria-label="Delete block"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Selection border on hover */}
      {!isSelected && (
        <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="absolute inset-0 border-2 border-primary-500/50 border-dashed rounded-lg" />
        </div>
      )}

      {/* Click instruction */}
      {!isSelected && (
        <div className="absolute bottom-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <span className="px-2 py-1 text-xs bg-gray-900/80 text-white rounded shadow-sm">
            Click to edit
          </span>
        </div>
      )}

      {/* Block preview content */}
      <BlockPreviewContent type={blockType} props={blockProps} info={blockInfo} />
    </div>
  );
}

interface BlockDisplayInfo {
  label: string;
  icon: string;
  bgColor: string;
}

function getBlockDisplayInfo(type: string, props: Record<string, unknown>): BlockDisplayInfo {
  const blockMeta: Record<string, BlockDisplayInfo> = {
    hero: { label: 'Hero', icon: '🎯', bgColor: 'bg-gradient-to-br from-primary-600 to-primary-800' },
    features: { label: 'Features', icon: '✨', bgColor: 'bg-gradient-to-br from-blue-500 to-blue-700' },
    cta: { label: 'Call to Action', icon: '📢', bgColor: 'bg-gradient-to-br from-green-500 to-green-700' },
    'rich-text': { label: 'Rich Text', icon: '📝', bgColor: 'bg-gradient-to-br from-gray-600 to-gray-800' },
    video: { label: 'Video', icon: '🎬', bgColor: 'bg-gradient-to-br from-red-500 to-red-700' },
    'blog-list': { label: 'Blog List', icon: '📰', bgColor: 'bg-gradient-to-br from-purple-500 to-purple-700' },
  };

  return blockMeta[type] || { label: type, icon: '📦', bgColor: 'bg-gradient-to-br from-gray-500 to-gray-700' };
}

interface BlockPreviewContentProps {
  type: string;
  props: Record<string, unknown>;
  info: BlockDisplayInfo;
}

function BlockPreviewContent({ type, props, info }: BlockPreviewContentProps) {
  switch (type) {
    case 'hero':
      return <HeroPreview props={props} />;
    case 'features':
      return <FeaturesPreview props={props} />;
    case 'cta':
      return <CtaPreview props={props} />;
    case 'rich-text':
      return <RichTextPreview props={props} />;
    case 'video':
      return <VideoPreview props={props} />;
    case 'blog-list':
      return <CollectionBlockPreview type={type} props={props} info={info} />;
    default:
      return <GenericBlockPreview type={type} props={props} info={info} />;
  }
}

// Validate URL for safe use in CSS (only allow http(s) and relative paths starting with /)
function isSafeCssUrl(url: string): boolean {
  if (url.startsWith('/') && !url.startsWith('//')) return true;
  try {
    const u = new URL(url);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

// Hero block preview
function HeroPreview({ props }: { props: Record<string, unknown> }) {
  const title = (props.title as string) || 'Hero Title';
  const subtitle = (props.subtitle as string) || '';
  const description = (props.description as string) || '';
  const alignment = (props.alignment as string) || 'center';
  const rawBgImage = props.backgroundImage as string | undefined;
  const backgroundImage = rawBgImage && isSafeCssUrl(rawBgImage) ? rawBgImage : undefined;
  const cta = props.cta as { label?: string; href?: string } | undefined;
  const secondaryCta = props.secondaryCta as { label?: string; href?: string } | undefined;

  const alignmentClass = {
    left: 'text-left items-start',
    center: 'text-center items-center',
    right: 'text-right items-end',
  }[alignment] || 'text-center items-center';

  return (
    <section
      className="relative py-24 px-6 bg-gray-900"
      style={backgroundImage ? {
        backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url("${encodeURI(backgroundImage)}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      } : undefined}
    >
      <div className={`max-w-4xl mx-auto flex flex-col ${alignmentClass}`}>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{title}</h1>
        {subtitle && <p className="text-xl text-gray-200 mb-2">{subtitle}</p>}
        {description && <p className="text-lg text-gray-300 mb-6">{description}</p>}
        {(cta || secondaryCta) && (
          <div className="flex gap-4 flex-wrap justify-center">
            {cta?.label && (
              <span className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium">
                {cta.label}
              </span>
            )}
            {secondaryCta?.label && (
              <span className="px-6 py-3 border border-white text-white rounded-lg font-medium">
                {secondaryCta.label}
              </span>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

// Features block preview
function FeaturesPreview({ props }: { props: Record<string, unknown> }) {
  const title = (props.title as string) || '';
  const subtitle = (props.subtitle as string) || '';
  const features = (props.features as Array<{ title: string; description: string; icon?: string }>) || [];
  const columns = (props.columns as string) || '3';

  const gridCols = {
    '2': 'md:grid-cols-2',
    '3': 'md:grid-cols-2 lg:grid-cols-3',
    '4': 'md:grid-cols-2 lg:grid-cols-4',
  }[columns] || 'md:grid-cols-3';

  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        {(title || subtitle) && (
          <div className="text-center mb-12">
            {title && <h2 className="text-3xl font-bold text-gray-900">{title}</h2>}
            {subtitle && <p className="mt-4 text-lg text-gray-600">{subtitle}</p>}
          </div>
        )}
        <div className={`grid gap-8 ${gridCols}`}>
          {features.length > 0 ? (
            features.map((feature, i) => {
              const IconComponent = feature.icon ? getIconComponent(feature.icon) : null;
              return (
                <div key={i} className="text-center p-6 rounded-lg bg-gray-50">
                  {feature.icon && (
                    <div className="w-12 h-12 mx-auto flex items-center justify-center rounded-lg bg-primary-100 text-primary-600 mb-4">
                      {IconComponent ? <IconComponent className="w-6 h-6" /> : <span className="text-xl">{feature.icon}</span>}
                    </div>
                  )}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-12 text-gray-400">
              No features added yet
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// CTA block preview
function CtaPreview({ props }: { props: Record<string, unknown> }) {
  const title = (props.title as string) || 'Call to Action';
  const description = (props.description as string) || '';
  const buttonText = (props.buttonText as string) || 'Get Started';
  const variant = (props.variant as string) || 'primary';

  const bgClass = variant === 'primary'
    ? 'bg-primary-600'
    : variant === 'secondary'
      ? 'bg-gray-900'
      : 'bg-gray-100';
  const textClass = variant === 'light' ? 'text-gray-900' : 'text-white';

  return (
    <section className={`py-16 ${bgClass}`}>
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className={`text-3xl font-bold ${textClass} mb-4`}>{title}</h2>
        {description && <p className={`text-lg mb-6 ${variant === 'light' ? 'text-gray-600' : 'text-gray-200'}`}>{description}</p>}
        <span className="inline-block px-6 py-3 bg-white text-gray-900 rounded-lg font-medium">
          {buttonText}
        </span>
      </div>
    </section>
  );
}

// Rich text preview
function RichTextPreview({ props }: { props: Record<string, unknown> }) {
  const content = (props.content as string) || '<p>Rich text content...</p>';

  return (
    <section className="py-12 bg-white">
      <div className="max-w-3xl mx-auto px-6 prose prose-gray" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }} />
    </section>
  );
}

// Video preview
function VideoPreview({ props }: { props: Record<string, unknown> }) {
  const title = (props.title as string) || '';
  const url = (props.url as string) || '';

  return (
    <section className="py-16 bg-gray-100">
      <div className="max-w-4xl mx-auto px-6">
        {title && <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">{title}</h2>}
        <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <span className="text-4xl">🎬</span>
            <p className="text-gray-400 mt-2">{url ? 'Video: ' + url.substring(0, 40) + '...' : 'No video URL'}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

// Collection blocks (blog-list, team-list) - show placeholder
function CollectionBlockPreview({ type, props, info }: { type: string; props: Record<string, unknown>; info: BlockDisplayInfo }) {
  const title = (props.title as string) || '';
  const subtitle = (props.subtitle as string) || '';
  const limit = (props.limit as number) || 6;

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        {(title || subtitle) && (
          <div className="text-center mb-8">
            {title && <h2 className="text-3xl font-bold text-gray-900">{title}</h2>}
            {subtitle && <p className="mt-4 text-lg text-gray-600">{subtitle}</p>}
          </div>
        )}
        <div className="grid md:grid-cols-3 gap-6">
          {Array.from({ length: Math.min(limit, 6) }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="h-32 bg-gray-100 rounded mb-4 flex items-center justify-center">
                <span className="text-3xl">{info.icon}</span>
              </div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-full mb-1" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-gray-500 mt-6">
          {info.icon} This block will fetch {type === 'blog-list' ? 'posts' : 'team members'} dynamically
        </p>
      </div>
    </section>
  );
}

// Generic fallback preview
function GenericBlockPreview({ type, props, info }: { type: string; props: Record<string, unknown>; info: BlockDisplayInfo }) {
  return (
    <section className={`py-16 ${info.bgColor}`}>
      <div className="max-w-4xl mx-auto px-6 text-center text-white">
        <span className="text-5xl mb-4 block">{info.icon}</span>
        <h3 className="text-2xl font-bold mb-2">{info.label} Block</h3>
        <p className="text-white/80 text-sm">
          {Object.keys(props).length} properties configured
        </p>
      </div>
    </section>
  );
}
