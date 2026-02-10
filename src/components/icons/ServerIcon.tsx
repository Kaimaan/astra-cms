/**
 * Server Icon Component
 *
 * Renders Lucide icons as inline SVG on the server.
 * Uses the pre-generated icon registry to avoid bundling all icons.
 * This component should NOT have 'use client' - it's server-only.
 */

import type { ReactElement } from 'react';
import iconRegistry from './icon-registry.json';
import { cn } from '@/lib/cn';

// Type for icon node data from registry
type IconNode = [string, Record<string, string>];

interface IconData {
  nodes: IconNode[];
}

// Type the registry
const registry = iconRegistry as unknown as Record<string, IconData>;

interface ServerIconProps {
  name: string;
  size?: number;
  className?: string;
}

/**
 * Renders a Lucide icon from the pre-generated registry.
 * Falls back to null if icon not found.
 */
export function ServerIcon({ name, size = 24, className }: ServerIconProps) {
  const iconData = registry[name];

  if (!iconData) {
    return null;
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('lucide', className)}
      aria-hidden="true"
    >
      {iconData.nodes.map((node, index) => {
        const [tag, attrs] = node;
        return renderSvgElement(tag, attrs, index);
      })}
    </svg>
  );
}

/**
 * Renders an SVG element from node data
 */
function renderSvgElement(
  tag: string,
  attrs: Record<string, string>,
  key: number
): ReactElement | null {
  switch (tag) {
    case 'path':
      return <path key={key} {...attrs} />;
    case 'circle':
      return <circle key={key} {...(attrs as unknown as React.SVGProps<SVGCircleElement>)} />;
    case 'rect':
      return <rect key={key} {...(attrs as unknown as React.SVGProps<SVGRectElement>)} />;
    case 'line':
      return <line key={key} {...(attrs as unknown as React.SVGProps<SVGLineElement>)} />;
    case 'polyline':
      return <polyline key={key} {...(attrs as unknown as React.SVGProps<SVGPolylineElement>)} />;
    case 'polygon':
      return <polygon key={key} {...(attrs as unknown as React.SVGProps<SVGPolygonElement>)} />;
    case 'ellipse':
      return <ellipse key={key} {...(attrs as unknown as React.SVGProps<SVGEllipseElement>)} />;
    default:
      return null;
  }
}

export default ServerIcon;
