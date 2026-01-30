import Link from 'next/link';
import Logo, { LogoIcon } from '@/components/Logo';
import AuthForm from '@/components/AuthForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen relative flex flex-col">
      {/* Background */}
      <div className="gradient-bg" />

      {/* Navigation */}
      <nav className="relative z-10 border-b border-[var(--border-subtle)]">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <Link href="/">
            <Logo />
          </Link>
        </div>
      </nav>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] mb-5">
              <LogoIcon className="w-8 h-8" />
            </div>
            <h1
              className="text-2xl font-bold mb-2"
              style={{ fontFamily: 'Cabinet Grotesk, system-ui, sans-serif' }}
            >
              Welcome to Fliplane
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Transform and share your images
            </p>
          </div>

          {/* Auth Form */}
          <AuthForm />

          {/* Footer link */}
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
