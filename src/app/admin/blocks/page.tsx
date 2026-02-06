import { getAllBlocks, getBlocksByCategory } from '../../../core/blocks/registry';
import type { BlockCategory, BlockDefinition } from '../../../core/blocks/types';

// Import blocks entry point to ensure all blocks are registered
import '@/blocks';

const categoryLabels: Record<BlockCategory, string> = {
  content: 'Content',
  media: 'Media',
  layout: 'Layout',
  interactive: 'Interactive',
};

const categoryColors: Record<BlockCategory, string> = {
  content: 'bg-blue-100 text-blue-800',
  media: 'bg-purple-100 text-purple-800',
  layout: 'bg-green-100 text-green-800',
  interactive: 'bg-orange-100 text-orange-800',
};

const categoryIcons: Record<BlockCategory, string> = {
  content: '📝',
  media: '🎬',
  layout: '📐',
  interactive: '🔘',
};

function BlockCard({ block }: { block: BlockDefinition }) {
  const category = block.category || 'content';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xl">
            {block.icon || '📦'}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{block.label}</h3>
            <code className="text-xs text-gray-500">{block.type}</code>
          </div>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${categoryColors[category]}`}>
          {categoryLabels[category]}
        </span>
      </div>

      {block.description && (
        <p className="text-sm text-gray-600 mb-3">{block.description}</p>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Version {block.version}</span>
        <span>Schema: {block.schema ? '✓' : '✗'}</span>
      </div>
    </div>
  );
}

function CategorySection({ category, blocks }: { category: BlockCategory; blocks: BlockDefinition[] }) {
  if (blocks.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">{categoryIcons[category]}</span>
        <h2 className="text-xl font-semibold text-gray-900">{categoryLabels[category]}</h2>
        <span className="text-sm text-gray-500">({blocks.length})</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {blocks.map((block) => (
          <BlockCard key={block.type} block={block} />
        ))}
      </div>
    </section>
  );
}

export default function BlocksPage() {
  const allBlocks = getAllBlocks();
  const categories: BlockCategory[] = ['layout', 'content', 'media', 'interactive'];

  // Group blocks by category
  const uncategorized = allBlocks.filter((b) => !b.category);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Block Registry</h1>
        <p className="text-gray-600 mt-2">
          {allBlocks.length} blocks registered • Use these blocks to build pages
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {categories.map((category) => {
          const count = getBlocksByCategory(category).length;
          return (
            <div key={category} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-1">
                <span>{categoryIcons[category]}</span>
                <span className="text-sm font-medium text-gray-700">{categoryLabels[category]}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{count}</p>
            </div>
          );
        })}
      </div>

      {/* Blocks by category */}
      {categories.map((category) => (
        <CategorySection
          key={category}
          category={category}
          blocks={getBlocksByCategory(category)}
        />
      ))}

      {/* Uncategorized blocks */}
      {uncategorized.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">📦</span>
            <h2 className="text-xl font-semibold text-gray-900">Uncategorized</h2>
            <span className="text-sm text-gray-500">({uncategorized.length})</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {uncategorized.map((block) => (
              <BlockCard key={block.type} block={block} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
