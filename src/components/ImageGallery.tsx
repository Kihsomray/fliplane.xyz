'use client';

import { useState } from 'react';
import type { UserImage } from '@/types';

interface ImageGalleryProps {
  images: UserImage[];
  onDelete: (id: string) => Promise<void>;
  loading: boolean;
}

export default function ImageGallery({ images, onDelete, loading }: ImageGalleryProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopyUrl = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex items-center gap-3 text-[var(--text-muted)]">
          <div className="w-5 h-5 border-2 border-[var(--border-light)] border-t-[var(--accent-red)] rounded-full animate-spin" />
          <span className="text-sm">Loading images...</span>
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="mx-auto w-14 h-14 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center mb-4">
          <svg
            className="h-7 w-7 text-[var(--text-muted)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <p className="text-[var(--text-secondary)] font-medium">No images yet</p>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Upload your first image to get started
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {images.map((image) => (
        <div
          key={image.id}
          className="group glass-card overflow-hidden"
        >
          <div className="aspect-square relative bg-[var(--bg-tertiary)] overflow-hidden">
            {image.public_url ? (
              <img
                src={image.public_url}
                alt={image.original_filename}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <svg
                  className="h-10 w-10 text-[var(--text-muted)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            )}

            {/* Status badge */}
            <div className="absolute top-2 left-2">
              <span
                className={`
                  px-2 py-1 text-xs font-medium rounded-md
                  ${
                    image.status === 'completed'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : image.status === 'processing'
                      ? 'bg-amber-500/20 text-amber-400'
                      : image.status === 'failed'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-[var(--bg-card)] text-[var(--text-muted)]'
                  }
                `}
              >
                {image.status}
              </span>
            </div>

            {/* Hover actions */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              {image.public_url && (
                <>
                  <a
                    href={image.public_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                    title="View full size"
                  >
                    <svg
                      className="h-5 w-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>

                  <button
                    onClick={() => handleCopyUrl(image.public_url!, image.id)}
                    className={`p-2.5 rounded-lg transition-colors ${
                      copiedId === image.id
                        ? 'bg-emerald-500/20'
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                    title="Copy URL"
                  >
                    {copiedId === image.id ? (
                      <svg
                        className="h-5 w-5 text-emerald-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-5 w-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    )}
                  </button>
                </>
              )}

              <button
                onClick={() => handleDelete(image.id)}
                disabled={deletingId === image.id}
                className="p-2.5 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors disabled:opacity-50"
                title="Delete"
              >
                {deletingId === image.id ? (
                  <div className="w-5 h-5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                ) : (
                  <svg
                    className="h-5 w-5 text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="p-3">
            <p className="text-sm font-medium truncate">{image.original_filename}</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {new Date(image.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
