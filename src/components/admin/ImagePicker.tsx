'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import type { Asset } from '@/core/content/types';

interface ImagePickerProps {
  /** Currently selected image URL */
  value?: string;
  /** Callback when image is selected */
  onChange: (url: string, asset?: Asset) => void;
  /** Placeholder text */
  placeholder?: string;
}

export function ImagePicker({
  value,
  onChange,
  placeholder = 'Select an image',
}: ImagePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/assets?type=image');
      if (response.ok) {
        const data = await response.json();
        setAssets(data);
      }
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchAssets();
    }
  }, [isOpen, fetchAssets]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', files[0]);

      const response = await fetch('/api/admin/assets', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const asset = await response.json();
        setAssets((prev) => [asset, ...prev]);
        onChange(asset.url, asset);
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  };

  const handleSelect = (asset: Asset) => {
    onChange(asset.url, asset);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange('');
  };

  return (
    <div>
      {/* Preview / Trigger */}
      <div
        onClick={() => setIsOpen(true)}
        className="border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-primary-400 transition-colors"
      >
        {value ? (
          <div className="relative group">
            <img
              src={value}
              alt="Selected"
              className="w-full h-32 object-cover rounded"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(true);
                }}
                className="px-3 py-1 bg-white text-gray-900 text-sm rounded hover:bg-gray-100"
              >
                Change
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="text-3xl mb-2">🖼️</div>
            <p className="text-sm text-gray-600">{placeholder}</p>
            <p className="text-xs text-gray-400 mt-1">Click to browse</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Select Image</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Upload Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`m-4 border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                dragOver
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-300'
              }`}
            >
              {uploading ? (
                <p className="text-sm text-gray-600">Uploading...</p>
              ) : (
                <>
                  <p className="text-sm text-gray-600 mb-2">
                    Drag and drop an image here, or
                  </p>
                  <label className="cursor-pointer">
                    <span className="text-primary-600 hover:text-primary-800 text-sm font-medium">
                      browse files
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleUpload(e.target.files)}
                    />
                  </label>
                </>
              )}
            </div>

            {/* Asset Grid */}
            <div className="px-4 pb-4 overflow-y-auto max-h-[50vh]">
              {loading ? (
                <div className="text-center py-8 text-gray-500">
                  Loading images...
                </div>
              ) : assets.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No images yet. Upload one above.
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-3">
                  {assets.map((asset) => (
                    <button
                      key={asset.id}
                      onClick={() => handleSelect(asset)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:border-primary-500 ${
                        value === asset.url
                          ? 'border-primary-500 ring-2 ring-primary-200'
                          : 'border-transparent'
                      }`}
                    >
                      <img
                        src={asset.url}
                        alt={asset.alt || asset.filename}
                        className="w-full h-full object-cover"
                      />
                      {value === asset.url && (
                        <div className="absolute top-1 right-1 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-200 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
