'use client';

import type { PropDiff } from './chat-types';

interface ProposalDiffProps {
  diffs: PropDiff[];
  status: 'pending' | 'accepted' | 'rejected';
}

export function ProposalDiff({ diffs, status }: ProposalDiffProps) {
  if (diffs.length === 0) {
    return (
      <p className="text-xs text-gray-400 italic py-1">No changes detected.</p>
    );
  }

  return (
    <div className={`space-y-2 ${status !== 'pending' ? 'opacity-60' : ''}`}>
      {diffs.map((diff) => (
        <div key={diff.path} className="text-xs border border-gray-100 rounded-md p-2 bg-gray-50">
          <div className="font-medium text-gray-700 mb-1">
            {diff.label}
            <span className="text-gray-400 font-normal ml-1">({diff.path})</span>
          </div>
          <div className="text-red-600 line-through break-words">{diff.oldValue}</div>
          <div className="text-green-600 break-words">{diff.newValue}</div>
        </div>
      ))}
    </div>
  );
}
