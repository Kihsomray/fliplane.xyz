'use client';

import { useState, useRef } from 'react';
import heic2any from 'heic2any';

interface ImageUploaderProps {
  onUploadComplete: () => void;
}

export default function ImageUploader({ onUploadComplete }: ImageUploaderProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = async (file: File) => {
    setError(null);

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];
    // On iPhone, photos might be HEIC/HEIF which browser input[type=file] might not automatically convert or accept
    // depending on iOS version. However, iOS Safari usually converts to JPEG when uploading to web.
    // We should be lenient with type checking or check extension if type is empty (which can happen).
    
    // Check if type is empty or one of the allowed types
    const isAllowedType = file.type === '' || allowedTypes.includes(file.type);
    
    if (!isAllowedType) {
      // Also check extension as fallback
      const extension = file.name.split('.').pop()?.toLowerCase();
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif'];
      if (!extension || !allowedExtensions.includes(extension)) {
         setError('Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.');
         return;
      }
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit.');
      return;
    }

    setUploading(true);
    setProgress('Converting HEIC...');

    try {
      let fileToUpload = file;
      
      // Convert HEIC to JPEG client-side before uploading
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const isHeic = file.type === 'image/heic' || 
                     file.type === 'image/heif' || 
                     fileExtension === 'heic' || 
                     fileExtension === 'heif';
      
      if (isHeic) {
        try {
          setProgress('Converting HEIC to JPEG...');
          // heic2any returns an array of Blobs
          const convertedBlobs = await heic2any({
            blob: file,
            toType: 'image/jpeg',
            quality: 0.95
          });
          
          // Get the first converted blob (heic2any can return multiple for multi-image HEIC)
          const convertedBlob = Array.isArray(convertedBlobs) ? convertedBlobs[0] : convertedBlobs;
          
          // Create a new File object with JPEG type
          fileToUpload = new File(
            [convertedBlob as Blob],
            file.name.replace(/\.(heic|heif)$/i, '.jpg'),
            { type: 'image/jpeg' }
          );
          
          setProgress('Uploading...');
        } catch (heicErr) {
          console.error('HEIC conversion failed:', heicErr);
          setError('Failed to convert HEIC image. Please convert it to JPEG or PNG first.');
          return;
        }
      } else {
        setProgress('Uploading...');
      }

      const formData = new FormData();
      formData.append('image', fileToUpload);

      setProgress('Processing...');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Upload failed');
      }

      setProgress('');
      onUploadComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      setProgress('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative rounded-xl p-8 text-center cursor-pointer
          border border-dashed transition-all duration-200
          ${dragging
            ? 'border-[var(--accent-red)] bg-[var(--accent-red)]/5'
            : 'border-[var(--border-light)] hover:border-[var(--accent-red)]/50 bg-[var(--bg-tertiary)]'
          }
          ${uploading ? 'pointer-events-none opacity-70' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif"
          onChange={handleFileInput}
          className="hidden"
          disabled={uploading}
        />

        <div className="space-y-3">
          <div
            className={`
              mx-auto w-12 h-12 rounded-xl flex items-center justify-center
              ${dragging ? 'bg-[var(--accent-red)]/10' : 'bg-[var(--bg-card)]'}
            `}
          >
            {uploading ? (
              <div className="w-6 h-6 border-2 border-[var(--accent-red)]/30 border-t-[var(--accent-red)] rounded-full animate-spin" />
            ) : (
              <svg
                className={`h-6 w-6 ${dragging ? 'text-[var(--accent-red)]' : 'text-[var(--text-muted)]'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {uploading ? progress : dragging ? 'Drop to upload' : 'Drop your image here'}
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              {uploading ? 'Please wait...' : 'or click to browse (max 10MB)'}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
