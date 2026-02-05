'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import type { BrandVoice } from '@/core/ai/types';

interface AIAssistantProps {
  /** Current content to work with */
  content?: string;
  /** Field name/label for context */
  fieldLabel?: string;
  /** Callback when AI generates content */
  onInsert?: (text: string) => void;
  /** Callback when AI improves content */
  onReplace?: (text: string) => void;
  /** Brand voice settings */
  brandVoice?: BrandVoice;
}

type TabType = 'generate' | 'improve' | 'suggest';

export function AIAssistant({
  content = '',
  fieldLabel = 'content',
  onInsert,
  onReplace,
  brandVoice,
}: AIAssistantProps) {
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('generate');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate tab state
  const [generatePrompt, setGeneratePrompt] = useState('');
  const [generateType, setGenerateType] = useState<
    'title' | 'description' | 'content' | 'seo' | 'custom'
  >('content');
  const [generateResults, setGenerateResults] = useState<string[]>([]);

  // Improve tab state
  const [improveType, setImproveType] = useState<
    'grammar' | 'clarity' | 'tone' | 'seo' | 'shorten' | 'expand'
  >('clarity');
  const [improveResult, setImproveResult] = useState<string | null>(null);

  // Suggest tab state
  const [suggestType, setSuggestType] = useState<
    'titles' | 'keywords' | 'improvements' | 'cta'
  >('titles');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Check if AI is configured
  useEffect(() => {
    fetch('/api/admin/ai')
      .then((res) => res.json())
      .then((data) => setIsConfigured(data.configured))
      .catch(() => setIsConfigured(false));
  }, []);

  const callAI = async (action: string, params: Record<string, unknown>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...params, brandVoice }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'AI request failed');
      }

      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!generatePrompt.trim()) return;

    const result = await callAI('generate', {
      prompt: generatePrompt,
      type: generateType,
      context: content || undefined,
      variations: 3,
    });

    if (result?.results) {
      setGenerateResults(result.results);
    }
  };

  const handleImprove = async () => {
    if (!content.trim()) {
      setError('No content to improve. Add some content first.');
      return;
    }

    const result = await callAI('improve', {
      content,
      type: improveType,
    });

    if (result?.result) {
      setImproveResult(result.result);
    }
  };

  const handleSuggest = async () => {
    if (!content.trim()) {
      setError('No content to analyze. Add some content first.');
      return;
    }

    const result = await callAI('suggest', {
      content,
      type: suggestType,
      count: 5,
    });

    if (result?.suggestions) {
      setSuggestions(result.suggestions);
    }
  };

  if (isConfigured === null) {
    return (
      <div className="p-4 text-center text-gray-500">
        <div className="animate-pulse">Checking AI status...</div>
      </div>
    );
  }

  if (!isConfigured) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-medium text-yellow-800 mb-2">AI Not Configured</h3>
        <p className="text-sm text-yellow-700 mb-3">
          Add your Anthropic API key to enable AI features.
        </p>
        <code className="block text-xs bg-yellow-100 p-2 rounded">
          ANTHROPIC_API_KEY=sk-ant-...
        </code>
        <p className="text-xs text-yellow-600 mt-2">
          Add this to your .env.local file and restart the server.
        </p>
      </div>
    );
  }

  const tabs: { id: TabType; label: string }[] = [
    { id: 'generate', label: 'Generate' },
    { id: 'improve', label: 'Improve' },
    { id: 'suggest', label: 'Suggest' },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="font-medium text-gray-900 flex items-center gap-2">
          <span className="text-lg">✨</span>
          AI Assistant
        </h3>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Generate Tab */}
        {activeTab === 'generate' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content Type
              </label>
              <select
                value={generateType}
                onChange={(e) => setGenerateType(e.target.value as typeof generateType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="title">Title/Headline</option>
                <option value="description">Description</option>
                <option value="content">Body Content</option>
                <option value="seo">SEO Content</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                What do you want to create?
              </label>
              <textarea
                value={generatePrompt}
                onChange={(e) => setGeneratePrompt(e.target.value)}
                placeholder={`Describe the ${fieldLabel} you want to generate...`}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={3}
              />
            </div>

            <Button onClick={handleGenerate} disabled={loading || !generatePrompt.trim()}>
              {loading ? 'Generating...' : 'Generate'}
            </Button>

            {generateResults.length > 0 && (
              <div className="space-y-2 mt-4">
                <p className="text-sm font-medium text-gray-700">Results:</p>
                {generateResults.map((result, i) => (
                  <div
                    key={i}
                    className="p-3 bg-gray-50 border border-gray-200 rounded text-sm"
                  >
                    <p className="text-gray-800 mb-2">{result}</p>
                    <button
                      onClick={() => onInsert?.(result)}
                      className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                    >
                      Insert
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Improve Tab */}
        {activeTab === 'improve' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Improvement Type
              </label>
              <select
                value={improveType}
                onChange={(e) => setImproveType(e.target.value as typeof improveType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="grammar">Fix Grammar & Spelling</option>
                <option value="clarity">Improve Clarity</option>
                <option value="tone">Adjust Tone</option>
                <option value="seo">Optimize for SEO</option>
                <option value="shorten">Make Shorter</option>
                <option value="expand">Expand Content</option>
              </select>
            </div>

            {content ? (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                <p className="text-xs text-gray-500 mb-1">Current content:</p>
                <p className="text-sm text-gray-700 line-clamp-3">{content}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">
                Select some content to improve it.
              </p>
            )}

            <Button onClick={handleImprove} disabled={loading || !content.trim()}>
              {loading ? 'Improving...' : 'Improve'}
            </Button>

            {improveResult && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Improved:</p>
                <div className="p-3 bg-green-50 border border-green-200 rounded text-sm">
                  <p className="text-gray-800 mb-2">{improveResult}</p>
                  <button
                    onClick={() => onReplace?.(improveResult)}
                    className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                  >
                    Replace Original
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Suggest Tab */}
        {activeTab === 'suggest' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Suggestion Type
              </label>
              <select
                value={suggestType}
                onChange={(e) => setSuggestType(e.target.value as typeof suggestType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="titles">Alternative Titles</option>
                <option value="keywords">SEO Keywords</option>
                <option value="improvements">Improvements</option>
                <option value="cta">Call-to-Action Phrases</option>
              </select>
            </div>

            <Button onClick={handleSuggest} disabled={loading || !content.trim()}>
              {loading ? 'Analyzing...' : 'Get Suggestions'}
            </Button>

            {suggestions.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Suggestions:</p>
                <ul className="space-y-2">
                  {suggestions.map((suggestion, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 p-2 bg-gray-50 border border-gray-200 rounded text-sm"
                    >
                      <span className="text-gray-400">{i + 1}.</span>
                      <span className="text-gray-800 flex-1">{suggestion}</span>
                      {suggestType === 'titles' && (
                        <button
                          onClick={() => onInsert?.(suggestion)}
                          className="text-xs text-primary-600 hover:text-primary-800 font-medium shrink-0"
                        >
                          Use
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer with brand voice indicator */}
      {brandVoice && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Using brand voice: <span className="font-medium">{brandVoice.name}</span>
          </p>
        </div>
      )}
    </div>
  );
}
