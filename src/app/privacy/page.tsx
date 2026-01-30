import Link from 'next/link';
import Logo from '@/components/Logo';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen relative">
      <div className="gradient-bg" />

      <nav className="relative z-10 border-b border-[var(--border-subtle)]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/"><Logo /></Link>
          <Link href="/login" className="btn-primary px-5 py-2.5 text-sm">
            Get Started
          </Link>
        </div>
      </nav>

      <main className="relative z-10">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <h1
            className="text-3xl sm:text-4xl font-bold mb-8"
            style={{ fontFamily: 'Cabinet Grotesk, system-ui, sans-serif' }}
          >
            Privacy Policy
          </h1>

          <div className="prose prose-gray max-w-none space-y-6 text-[var(--text-secondary)]">
            <p className="text-sm text-[var(--text-muted)]">Last updated: January 2026</p>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">Overview</h2>
              <p>
                Fliplane is a free demo project for AI-powered background removal. We respect your privacy
                and are committed to being transparent about how we handle your data.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">Images You Upload</h2>
              <p>
                When you use our background removal tool:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Images are sent to our server for processing</li>
                <li>For guest users, images are processed and returned immediately — we do not store them</li>
                <li>For registered users, processed images are stored to provide shareable URLs</li>
                <li>You can delete your images at any time from your dashboard</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">Account Information</h2>
              <p>
                If you create an account, we collect:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Email address (for authentication)</li>
                <li>We do not sell or share your email with third parties</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">Local Storage</h2>
              <p>
                We use browser local storage to track your free transform count. This data stays
                on your device and is not sent to our servers.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">Third-Party Services</h2>
              <p>
                We use the following services to operate Fliplane:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Remove.bg — for AI background removal processing</li>
                <li>Supabase — for authentication and database</li>
                <li>Backblaze B2 — for image storage (registered users only)</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">Contact</h2>
              <p>
                This is a demo project. For questions, please open an issue on the project repository.
              </p>
            </section>
          </div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-[var(--border-subtle)] py-6">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[var(--text-muted)]">
            © 2026 Fliplane. A demo project.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-sm text-[var(--text-primary)] font-medium">
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
