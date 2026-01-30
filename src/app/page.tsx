'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';
import BeforeAfterSlider from '@/components/BeforeAfterSlider';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

const MAX_FREE_TRANSFORMS = 3;
const STORAGE_KEY = 'fliplane_demo_count';

interface ProcessedImage {
  imageId: string;
  url: string;
}

function ArrowIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  );
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [demoCount, setDemoCount] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<ProcessedImage | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setDemoCount(parseInt(stored, 10));
    }

    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const remainingTransforms = MAX_FREE_TRANSFORMS - demoCount;
  const hasReachedLimit = demoCount >= MAX_FREE_TRANSFORMS;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!hasReachedLimit) setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (hasReachedLimit) return;
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (hasReachedLimit) return;
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = async (file: File) => {
    setError(null);
    setProcessedImage(null);
    setOriginalImage(null);
    setCopied(false);

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];
    
    // iOS sometimes uploads with empty type or different types for camera roll
    const isAllowedType = file.type === '' || allowedTypes.includes(file.type);
    
    if (!isAllowedType) {
      // Check extension as fallback
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

    setProcessing(true);

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
          // Dynamically import heic2any only when needed (client-side only)
          const heic2any = (await import('heic2any')).default;
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
        } catch (heicErr) {
          console.error('HEIC conversion failed:', heicErr);
          setError('Failed to convert HEIC image. Please convert it to JPEG or PNG first.');
          setProcessing(false);
          return;
        }
      }

      const originalUrl = URL.createObjectURL(fileToUpload);
      setOriginalImage(originalUrl);

      const formData = new FormData();
      formData.append('image', fileToUpload);

      const response = await fetch('/api/demo', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Processing failed');
      }

      setProcessedImage({
        imageId: data.imageId,
        url: data.url,
      });

      const newCount = demoCount + 1;
      setDemoCount(newCount);
      localStorage.setItem(STORAGE_KEY, newCount.toString());

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed');
      setOriginalImage(null);
    } finally {
      setProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCopyUrl = async () => {
    if (!processedImage) return;
    try {
      await navigator.clipboard.writeText(processedImage.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Failed to copy URL');
    }
  };

  const handleDelete = async () => {
    if (!processedImage) return;
    setDeleting(true);

    try {
      const response = await fetch(`/api/demo/${processedImage.imageId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Delete failed');
      }

      handleTryAnother();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const handleTryAnother = () => {
    if (originalImage) {
      URL.revokeObjectURL(originalImage);
    }
    setProcessedImage(null);
    setOriginalImage(null);
    setError(null);
    setCopied(false);
  };

  const features = [
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      ),
      title: 'Easy Upload',
      description: 'Drag and drop or click to upload. We support JPEG, PNG, WebP, and GIF formats.',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      title: 'AI Background Removal',
      description: 'State-of-the-art AI removes backgrounds cleanly from any photo.',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
      title: 'Horizontal Flip',
      description: 'Images are automatically flipped horizontally after background removal.',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
      title: 'Shareable URLs',
      description: 'Get a unique link for every processed image you can share anywhere.',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
      title: 'Easy Deletion',
      description: 'Delete your images anytime. You control your content.',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: '100% Free',
      description: 'This is a demo project. No payment required, ever.',
    },
  ];

  return (
    <div className="min-h-screen relative">
      <div className="gradient-bg" />

      {/* Navigation */}
      <nav className="relative z-10 border-b border-[var(--border-subtle)]">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Logo />
            </Link>
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <span className="text-sm text-[var(--text-muted)] hidden sm:block">
                    {user.email?.split('@')[0]}
                  </span>
                  <Link href="/dashboard" className="btn-primary px-5 py-2.5 text-sm">
                    Dashboard
                  </Link>
                </>
              ) : (
                <Link href="/login" className="btn-primary px-5 py-2.5 text-sm">
                  Get Started <ArrowIcon />
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="pt-20 pb-16 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-3xl mx-auto text-center">
              <div className="animate-fade-in-up">
                <span className="section-badge mb-6 inline-flex">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
                  Free AI-Powered Tool
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight animate-fade-in-up delay-100">
                Remove backgrounds
                <br />
                <span className="gradient-text">instantly</span>
              </h1>

              <p className="mt-6 text-lg sm:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto animate-fade-in-up delay-200">
                Upload any image and get a clean, transparent PNG with the background removed and image flipped. No sign up required.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center animate-fade-in-up delay-300">
                <a href="#upload" className="btn-primary px-8 py-3.5 text-base">
                  Try it Free <ArrowIcon />
                </a>
                <a href="#demo" className="btn-secondary px-8 py-3.5 text-base">
                  See Example
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Demo Slider Section */}
        <section id="demo" className="py-16 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10 animate-fade-in-up">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">See it in action</h2>
              <p className="text-[var(--text-muted)]">
                Drag the slider to compare the original and processed image
              </p>
            </div>
            <div className="animate-scale-in delay-200">
              <BeforeAfterSlider
                beforeSrc="/cat_in_snow.png"
                afterSrc="/cat_in_snow_result.png"
                beforeAlt="Original cat photo"
                afterAlt="Cat with background removed and flipped"
              />
            </div>
          </div>
        </section>

        {/* Upload Section */}
        <section id="upload" className="py-16 px-6">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">Try it yourself</h2>
              {!hasReachedLimit ? (
                <p className="text-[var(--text-muted)]">
                  {remainingTransforms} free transform{remainingTransforms !== 1 ? 's' : ''} remaining
                </p>
              ) : (
                <p className="text-[var(--accent-red)]">
                  You've used all {MAX_FREE_TRANSFORMS} free transforms
                </p>
              )}
            </div>

            {!processedImage ? (
              <>
                {hasReachedLimit ? (
                  <div className="feature-card p-10 text-center">
                    <div className="icon-box mx-auto mb-5">
                      <svg className="w-6 h-6 text-[var(--accent-red)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Create an account to continue</h3>
                    <p className="text-[var(--text-muted)] mb-6 max-w-sm mx-auto">
                      Sign up free to get more transforms and permanent shareable URLs.
                    </p>
                    <Link href="/login" className="btn-primary px-8 py-3">
                      Sign Up Free <ArrowIcon />
                    </Link>
                  </div>
                ) : (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`
                      feature-card relative p-12 text-center cursor-pointer
                      border-2 border-dashed transition-all duration-200
                      ${dragging
                        ? 'border-[var(--accent-red)] bg-[rgba(255,68,68,0.02)]'
                        : 'border-[var(--border-medium)] hover:border-[var(--accent-red)]/40 hover:bg-[rgba(255,68,68,0.01)]'
                      }
                      ${processing ? 'pointer-events-none' : ''}
                    `}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif"
                      onChange={handleFileInput}
                      className="hidden"
                      disabled={processing}
                    />

                    <div className="space-y-4">
                      <div className={`icon-box mx-auto ${processing ? 'animate-pulse' : ''}`}>
                        {processing ? (
                          <div className="w-5 h-5 border-2 border-[var(--accent-red)]/30 border-t-[var(--accent-red)] rounded-full animate-spin" />
                        ) : (
                          <svg
                            className={`w-6 h-6 ${dragging ? 'text-[var(--accent-red)]' : 'text-[var(--accent-red)]'}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                        )}
                      </div>

                      <div>
                        <p className="text-lg font-medium text-[var(--text-primary)]">
                          {processing ? 'Processing your image...' : dragging ? 'Drop to upload' : 'Drop your image here'}
                        </p>
                        <p className="text-sm text-[var(--text-muted)] mt-1">
                          {processing ? 'Removing background and flipping' : 'or click to browse • Max 10MB'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-100">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="feature-card p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-xs font-medium text-[var(--text-muted)] mb-2 uppercase tracking-wide">Original</p>
                    <div className="aspect-square relative rounded-xl overflow-hidden bg-[var(--bg-tertiary)]">
                      {originalImage && (
                        <img src={originalImage} alt="Original" className="w-full h-full object-contain" />
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[var(--text-muted)] mb-2 uppercase tracking-wide">Result</p>
                    <div
                      className="aspect-square relative rounded-xl overflow-hidden"
                      style={{
                        backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect width=\'10\' height=\'10\' fill=\'%23e5e5e5\'/%3E%3Crect x=\'10\' y=\'10\' width=\'10\' height=\'10\' fill=\'%23e5e5e5\'/%3E%3Crect x=\'10\' width=\'10\' height=\'10\' fill=\'%23f5f5f5\'/%3E%3Crect y=\'10\' width=\'10\' height=\'10\' fill=\'%23f5f5f5\'/%3E%3C/svg%3E")',
                        backgroundSize: '20px 20px',
                      }}
                    >
                      <img src={processedImage.url} alt="Processed" className="w-full h-full object-contain" />
                    </div>
                  </div>
                </div>

                <div className="mb-5">
                  <p className="text-xs font-medium text-[var(--text-muted)] mb-2 uppercase tracking-wide">Shareable URL</p>
                  <div className="flex gap-2">
                    <input type="text" readOnly value={processedImage.url} className="input-field text-sm flex-1 font-mono" />
                    <button onClick={handleCopyUrl} className="btn-secondary px-4 py-2 text-sm whitespace-nowrap">
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <a href={processedImage.url} download="processed-image.png" className="btn-primary flex-1 py-3 text-center">
                    Download PNG
                  </a>
                  {!hasReachedLimit && (
                    <button onClick={handleTryAnother} className="btn-secondary flex-1 py-3">
                      Try Another
                    </button>
                  )}
                </div>

                <div className="mt-5 pt-5 border-t border-[var(--border-subtle)] flex justify-between items-center">
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="text-sm text-[var(--text-muted)] hover:text-red-500 disabled:opacity-50 transition-colors"
                  >
                    {deleting ? 'Deleting...' : 'Delete image'}
                  </button>
                  {hasReachedLimit && (
                    <Link href="/login" className="text-sm font-medium text-[var(--accent-red)] hover:underline">
                      Create account for more →
                    </Link>
                  )}
                </div>

                {error && (
                  <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-100">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <span className="section-badge mb-4 inline-flex">Features</span>
              <h2 className="text-3xl sm:text-4xl font-bold">Everything you need</h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  className="feature-card p-6 animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="icon-box mb-4 text-[var(--accent-red)]">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-[var(--text-muted)] text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="feature-card p-10 sm:p-14 text-center bg-gradient-to-br from-[rgba(255,68,68,0.03)] to-transparent">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to get started?</h2>
              <p className="text-lg text-[var(--text-muted)] mb-8 max-w-xl mx-auto">
                Create an account to unlock unlimited transforms and save your images permanently.
              </p>
              <Link href="/login" className="btn-primary px-10 py-4 text-base">
                Get Started Free <ArrowIcon />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[var(--border-subtle)] py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <Logo />
              <span className="text-sm text-[var(--text-muted)]">A demo project</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
