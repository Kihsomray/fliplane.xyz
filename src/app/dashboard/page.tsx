'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import Logo from '@/components/Logo';
import ImageUploader from '@/components/ImageUploader';
import ImageGallery from '@/components/ImageGallery';
import type { UserImage } from '@/types';

export default function DashboardPage() {
  const [images, setImages] = useState<UserImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [mounted, setMounted] = useState(false);

  const supabase = useMemo(() => {
    if (typeof window !== 'undefined') {
      try {
        return createClient();
      } catch {
        return null;
      }
    }
    return null;
  }, []);

  const fetchImages = useCallback(async () => {
    try {
      const response = await fetch('/api/images');
      const data = await response.json();
      if (data.success) {
        setImages(data.images);
      }
    } catch (error) {
      console.error('Failed to fetch images:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !supabase) return;

    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
    fetchImages();
  }, [mounted, supabase, fetchImages]);

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/images/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        setImages((prev) => prev.filter((img) => img.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete image:', error);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen relative flex flex-col">
      {/* Background */}
      <div className="gradient-bg" />

      {/* Header */}
      <header className="relative z-10 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/90 backdrop-blur-md sticky top-0">
        <div className="max-w-5xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <Link href="/">
            <Logo />
          </Link>

          <div className="flex items-center gap-3">
            {/* User email */}
            <span className="text-sm text-[var(--text-muted)] hidden sm:block max-w-[180px] truncate">
              {user?.email}
            </span>

            {/* Sign out button */}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-3.5 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] hover:border-[var(--border-light)] rounded-lg transition-all"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 py-8 flex-1 w-full">
        {/* Upload Section */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold mb-4">Upload Image</h2>
          <ImageUploader onUploadComplete={fetchImages} />
        </section>

        {/* Gallery Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Your Images</h2>
            <span className="text-sm text-[var(--text-muted)]">
              {images.length} image{images.length !== 1 ? 's' : ''}
            </span>
          </div>

          <ImageGallery
            images={images}
            onDelete={handleDelete}
            loading={loading}
          />
        </section>
      </main>

      <footer className="relative z-10 border-t border-[var(--border-subtle)] py-6">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[var(--text-muted)]">
            © 2026 Fliplane. A demo project.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
