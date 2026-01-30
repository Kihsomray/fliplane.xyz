import Link from 'next/link';
import Logo from '@/components/Logo';

export default function TermsPage() {
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
            Terms of Service
          </h1>

          <div className="prose prose-gray max-w-none space-y-6 text-[var(--text-secondary)]">
            <p className="text-sm text-[var(--text-muted)]">Last updated: January 2026</p>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">About This Service</h2>
              <p>
                Fliplane is a free demo project that provides AI-powered background removal. This service
                is provided "as is" for demonstration and educational purposes.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">Free to Use</h2>
              <p>
                This service is completely free. There are no hidden fees, subscriptions, or payment
                requirements. We may limit usage to ensure fair access for everyone.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">Acceptable Use</h2>
              <p>
                By using Fliplane, you agree to:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Only upload images you have the right to use</li>
                <li>Not upload illegal, harmful, or offensive content</li>
                <li>Not attempt to abuse, overload, or disrupt the service</li>
                <li>Not use the service for commercial bulk processing</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">Your Content</h2>
              <p>
                You retain all rights to images you upload. We do not claim ownership of your content.
                For guest users, images are processed and discarded. For registered users, you can
                delete your images at any time.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">No Warranty</h2>
              <p>
                This is a demo project provided without any warranty. We do not guarantee:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>The service will be available at all times</li>
                <li>Processing results will be perfect</li>
                <li>Stored images will be retained indefinitely</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, we are not liable for any damages arising from
                your use of this service. Use at your own risk.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">Changes</h2>
              <p>
                We may modify these terms or discontinue the service at any time. Continued use after
                changes constitutes acceptance of the new terms.
              </p>
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
            <Link href="/privacy" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-sm text-[var(--text-primary)] font-medium">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
