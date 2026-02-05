/**
 * Generate Icon Registry
 *
 * Extracts SVG node data from all Lucide icons and saves to a JSON registry.
 * This registry is used server-side to render icons without bundling all of lucide-react.
 *
 * Run: npx tsx scripts/generate-icon-registry.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// Import all Lucide icons
import * as LucideIcons from 'lucide-react';

// Type for icon node data
type IconNodeChild = [string, Record<string, string>];
type IconNode = IconNodeChild[];

interface IconData {
  nodes: IconNode;
}

// Get the icon node data from a Lucide icon component
function getIconNodes(icon: unknown): IconNode | null {
  const iconAny = icon as {
    $$typeof?: symbol;
    render?: {
      toString?: () => string;
    };
    [key: string]: unknown;
  };

  if (iconAny && typeof iconAny === 'object') {
    for (const key of Object.keys(iconAny)) {
      const value = iconAny[key];
      if (Array.isArray(value) && value.length > 0 && Array.isArray(value[0])) {
        return value as IconNode;
      }
    }
  }

  return null;
}

async function generateRegistry() {
  console.log('Generating icon registry...\n');

  const registry: Record<string, IconData> = {};
  let count = 0;
  let skipped = 0;

  // Get all exports from lucide-react
  const iconNames = Object.keys(LucideIcons).filter((key) => {
    return (
      /^[A-Z]/.test(key) &&
      !key.includes('Icon') &&
      key !== 'createLucideIcon' &&
      key !== 'IconNode'
    );
  });

  console.log(`Found ${iconNames.length} potential icons\n`);

  for (const name of iconNames) {
    const icon = (LucideIcons as Record<string, unknown>)[name];

    if (!icon || typeof icon !== 'object') {
      skipped++;
      continue;
    }

    const nodes = getIconNodes(icon);

    if (nodes) {
      const cleanedNodes = nodes.map(([tag, attrs]) => {
        const cleanAttrs = { ...attrs };
        delete cleanAttrs.key;
        return [tag, cleanAttrs] as IconNodeChild;
      });

      registry[name] = { nodes: cleanedNodes };
      count++;
    } else {
      skipped++;
    }
  }

  // If we couldn't get nodes via introspection, try reading the source files
  if (count < 100) {
    console.log('Direct introspection limited, parsing source files...\n');
    await parseSourceFiles(registry);
    count = Object.keys(registry).length;
  }

  console.log(`\nProcessed ${count} icons, skipped ${skipped}`);

  // Write to JSON file (minified for smaller size)
  const outputPath = path.join(process.cwd(), 'src/lib/icons/icon-registry.json');
  const jsonContent = JSON.stringify(registry);

  fs.writeFileSync(outputPath, jsonContent);

  const sizeKB = (Buffer.byteLength(jsonContent) / 1024).toFixed(1);
  console.log(`\nWrote ${outputPath} (${sizeKB} KB)`);
}

async function parseSourceFiles(registry: Record<string, IconData>) {
  const iconsDir = path.join(process.cwd(), 'node_modules/lucide-react/dist/esm/icons');

  if (!fs.existsSync(iconsDir)) {
    console.error('Could not find lucide-react icons directory');
    return;
  }

  const files = fs.readdirSync(iconsDir).filter((f) => f.endsWith('.js') && !f.endsWith('.map'));
  const aliases: Record<string, string> = {};

  // First pass: collect actual icons
  for (const file of files) {
    const filePath = path.join(iconsDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    // Check for re-export files (aliases)
    const reExportMatch = content.match(/export \{ default \} from ['"]\.\/([^'"]+)\.js['"]/);
    if (reExportMatch) {
      const aliasSlug = file.replace('.js', '');
      const targetSlug = reExportMatch[1];
      const aliasName = kebabToPascal(aliasSlug);
      const targetName = kebabToPascal(targetSlug);
      aliases[aliasName] = targetName;
      continue;
    }

    // Extract icon name from createLucideIcon call
    const nameMatch = content.match(/createLucideIcon\s*\(\s*["']([^"']+)["']/);
    if (!nameMatch) continue;

    const iconName = nameMatch[1];

    // Extract the array passed to createLucideIcon - it's the second argument
    // Format: createLucideIcon("Name", [ ... ])
    const arrayMatch = content.match(/createLucideIcon\s*\(\s*["'][^"']+["']\s*,\s*(\[[\s\S]*?\])\s*\)/);
    if (!arrayMatch) continue;

    try {
      const nodeStr = arrayMatch[1]
        .replace(/key:\s*["'][^"']+["']\s*,?/g, '')
        .replace(/,\s*}/g, '}')
        .replace(/,\s*\]/g, ']');

      // eslint-disable-next-line no-new-func
      const nodes = new Function(`return ${nodeStr}`)();

      if (Array.isArray(nodes)) {
        registry[iconName] = { nodes };
      }
    } catch (e) {
      console.warn(`Failed to parse ${iconName}:`, (e as Error).message);
    }
  }

  // Second pass: resolve aliases
  for (const [aliasName, targetName] of Object.entries(aliases)) {
    if (registry[targetName]) {
      registry[aliasName] = registry[targetName];
    }
  }

  console.log(`Resolved ${Object.keys(aliases).length} icon aliases`);
}

function kebabToPascal(str: string): string {
  return str
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

generateRegistry().catch(console.error);
