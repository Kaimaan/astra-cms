'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { ImagePicker } from '@/components/admin/ImagePicker';

export default function SettingsPage() {
  const [aiStatus, setAiStatus] = useState<{
    configured: boolean;
    provider: string | null;
  } | null>(null);

  const [favicon, setFavicon] = useState('');
  const [appleTouchIcon, setAppleTouchIcon] = useState('');
  const [siteLoading, setSiteLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    fetch('/api/admin/ai')
      .then((res) => res.json())
      .then(setAiStatus)
      .catch(() => setAiStatus({ configured: false, provider: null }));

    fetch('/api/admin/site')
      .then((res) => res.json())
      .then((site) => {
        if (site?.favicon) setFavicon(site.favicon);
        if (site?.appleTouchIcon) setAppleTouchIcon(site.appleTouchIcon);
      })
      .catch(() => {})
      .finally(() => setSiteLoading(false));
  }, []);

  const handleSaveFavicon = async () => {
    setSaving(true);
    setSaveMessage('');
    try {
      const res = await fetch('/api/admin/site', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favicon, appleTouchIcon }),
      });
      if (res.ok) {
        setSaveMessage('Saved');
        setTimeout(() => setSaveMessage(''), 3000);
      }
    } catch {
      setSaveMessage('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Configure your CMS</p>
      </div>

      <div className="space-y-6">
        {/* AI Settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            AI Assistant
          </h2>

          {aiStatus === null ? (
            <p className="text-gray-500">Checking AI status...</p>
          ) : aiStatus.configured ? (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-green-700">
                Connected to {aiStatus.provider}
              </span>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 bg-yellow-500 rounded-full" />
                <span className="text-yellow-700">Not configured</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Add your API key to <code className="bg-gray-100 px-1 rounded">.env.local</code>:
              </p>
              <pre className="bg-gray-50 border border-gray-200 rounded p-3 text-sm overflow-x-auto">
                GEMINI_API_KEY=...
              </pre>
              <p className="text-xs text-gray-500 mt-2">
                Get your API key from{' '}
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline"
                >
                  aistudio.google.com
                </a>
              </p>
            </div>
          )}
        </div>

        {/* Site Icons */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Site Icons
          </h2>
          <p className="text-gray-500 text-sm mb-4">
            Favicon and Apple touch icon displayed in browser tabs and on home screens.
          </p>

          {siteLoading ? (
            <p className="text-gray-500 text-sm">Loading...</p>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Favicon
                </label>
                <div className="max-w-xs">
                  <ImagePicker
                    value={favicon}
                    onChange={(url) => setFavicon(url)}
                    placeholder="Select a favicon"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apple Touch Icon
                </label>
                <div className="max-w-xs">
                  <ImagePicker
                    value={appleTouchIcon}
                    onChange={(url) => setAppleTouchIcon(url)}
                    placeholder="Select an Apple touch icon"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button onClick={handleSaveFavicon} disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </Button>
                {saveMessage && (
                  <span className={`text-sm ${saveMessage === 'Saved' ? 'text-green-600' : 'text-red-600'}`}>
                    {saveMessage}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Site Settings info */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Site Settings
          </h2>
          <p className="text-gray-500 text-sm">
            Site configuration is managed in{' '}
            <code className="bg-gray-100 px-1 rounded">astra.config.ts</code>
          </p>
        </div>
      </div>
    </div>
  );
}
