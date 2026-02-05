'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card } from '@/components/ui/Card';

interface Asset {
  id: string;
  type: 'image' | 'video' | 'document';
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  alt?: string;
  createdAt: string;
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Fetch existing assets on mount
  useEffect(() => {
    async function fetchAssets() {
      try {
        const response = await fetch('/api/admin/assets');
        if (response.ok) {
          const data = await response.json();
          setAssets(data);
        } else {
          setError('Failed to load assets');
        }
      } catch (err) {
        console.error('Error fetching assets:', err);
        setError('Failed to load assets');
      } finally {
        setIsLoading(false);
      }
    }
    fetchAssets();
  }, []);

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError(null);

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('/api/admin/assets', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const asset = await response.json();
          setAssets((prev) => [asset, ...prev]);
        } else {
          const data = await response.json();
          setError(data.error || `Failed to upload ${file.name}`);
        }
      } catch (err) {
        console.error('Upload failed:', err);
        setError(`Failed to upload ${file.name}`);
      }
    }

    setIsUploading(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this asset?')) return;

    try {
      await fetch(`/api/admin/assets/${id}`, { method: 'DELETE' });
      setAssets((prev) => prev.filter((a) => a.id !== id));
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Media Library</h1>
          <p className="text-gray-600 mt-1">Upload and manage images, videos, and documents</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Upload Area */}
      <div
        className={`mb-8 border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragOver
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <div className="text-4xl mb-4">📁</div>
        <p className="text-gray-600 mb-4">
          Drag and drop files here, or click to select
        </p>
        <input
          type="file"
          id="file-upload"
          className="hidden"
          multiple
          accept="image/*,video/*,.pdf,.doc,.docx"
          onChange={(e) => handleFileSelect(e.target.files)}
        />
        <label
          htmlFor="file-upload"
          className={`inline-flex items-center justify-center font-medium rounded-lg h-10 px-4 text-sm gap-2 transition-all duration-200 cursor-pointer ${
            isUploading
              ? 'bg-primary-400 text-white cursor-not-allowed'
              : 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-sm'
          }`}
        >
          {isUploading ? 'Uploading...' : 'Select Files'}
        </label>
      </div>

      {/* Assets Grid */}
      {isLoading ? (
        <Card className="p-12 text-center">
          <div className="text-4xl mb-4 animate-pulse">📂</div>
          <p className="text-gray-600">Loading assets...</p>
        </Card>
      ) : assets.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-4xl mb-4">🖼️</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">No assets yet</h2>
          <p className="text-gray-600">
            Upload images, videos, or documents to use in your pages.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {assets.map((asset) => (
            <Card key={asset.id} padding="none" className="group relative overflow-hidden">
              {asset.type === 'image' ? (
                <div className="aspect-square bg-gray-100">
                  <img
                    src={asset.url}
                    alt={asset.alt || asset.filename}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : asset.type === 'video' ? (
                <div className="aspect-square bg-gray-900 flex items-center justify-center">
                  <span className="text-4xl">🎬</span>
                </div>
              ) : (
                <div className="aspect-square bg-gray-100 flex items-center justify-center">
                  <span className="text-4xl">📄</span>
                </div>
              )}

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                <p className="text-white text-sm font-medium truncate">
                  {asset.filename}
                </p>
                <p className="text-white/70 text-xs">
                  {formatFileSize(asset.size)}
                </p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => navigator.clipboard.writeText(asset.url)}
                    className="text-xs bg-white/20 hover:bg-white/30 text-white px-2 py-1 rounded"
                  >
                    Copy URL
                  </button>
                  <button
                    onClick={() => handleDelete(asset.id)}
                    className="text-xs bg-red-500/80 hover:bg-red-500 text-white px-2 py-1 rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
