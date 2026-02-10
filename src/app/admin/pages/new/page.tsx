'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function CreatePagePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [path, setPath] = useState('');
  const [pathManuallyEdited, setPathManuallyEdited] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (!pathManuallyEdited) {
      setPath(slugify(newTitle));
    }
  }, [pathManuallyEdited]);

  const handlePathChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPath(e.target.value);
    setPathManuallyEdited(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), path }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create page');
      }

      const newPage = await response.json();
      const pagePath = Object.values(newPage.paths)[0] || '';
      router.push(`/${newPage.locale}${pagePath ? `/${pagePath}` : ''}?edit=true`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create page');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/pages"
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Page</h1>
          <p className="text-gray-600 mt-1">Set up your new page, then add blocks in the editor</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
          <Input
            label="Title"
            placeholder="e.g. About Us"
            value={title}
            onChange={handleTitleChange}
            required
            autoFocus
          />

          <Input
            label="URL Path"
            placeholder="e.g. about-us"
            value={path}
            onChange={handlePathChange}
            hint={path ? `Your page will be available at /${path}` : 'Auto-generated from title'}
          />
        </div>

        <div className="flex items-center gap-3 mt-6">
          <Button type="submit" disabled={isSubmitting || !title.trim()}>
            {isSubmitting ? 'Creating...' : 'Create Page'}
          </Button>
          <Link href="/admin/pages">
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
