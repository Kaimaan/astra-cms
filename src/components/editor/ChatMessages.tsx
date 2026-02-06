'use client';

import { useEffect, useRef } from 'react';
import type { ChatMessage } from './chat-types';
import { ProposalDiff } from './ProposalDiff';

interface ChatMessagesProps {
  messages: ChatMessage[];
  onAcceptProposal: (messageId: string) => void;
  onRejectProposal: (messageId: string) => void;
  isLoading: boolean;
}

export function ChatMessages({
  messages,
  onAcceptProposal,
  onRejectProposal,
  isLoading,
}: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages or loading state change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.map((message) => {
        if (message.role === 'system') {
          return (
            <div key={message.id} className="text-center">
              <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
                {message.content}
              </span>
            </div>
          );
        }

        if (message.role === 'user') {
          return (
            <div key={message.id} className="flex justify-end">
              <div className="max-w-[85%] bg-primary-600 text-white px-3 py-2 rounded-lg rounded-br-sm text-sm">
                {message.content}
              </div>
            </div>
          );
        }

        // Assistant message
        return (
          <div key={message.id} className="flex justify-start">
            <div className="max-w-[85%] space-y-2">
              <div className="bg-gray-100 px-3 py-2 rounded-lg rounded-bl-sm text-sm text-gray-800">
                {message.content}
              </div>

              {message.proposal && (
                <div className="ml-1">
                  <ProposalDiff
                    diffs={message.proposal.diffs}
                    status={message.proposal.status}
                  />

                  {message.proposal.status === 'pending' && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => onAcceptProposal(message.id)}
                        className="px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded-md hover:bg-green-100 transition-colors"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => onRejectProposal(message.id)}
                        className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 border border-red-200 rounded-md hover:bg-red-100 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {message.proposal.status === 'accepted' && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Changes applied
                    </div>
                  )}

                  {message.proposal.status === 'rejected' && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-red-500">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Changes discarded
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-gray-100 px-4 py-2 rounded-lg rounded-bl-sm">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
