import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy - Champions Lab",
  description:
    "Champions Lab privacy policy: what data we collect, how we use cookies and analytics, and your rights.",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="glass rounded-2xl p-6 sm:p-8 border border-emerald-200/60 dark:border-emerald-400/20 bg-gradient-to-br from-emerald-50/40 to-teal-50/40 dark:from-emerald-500/10 dark:to-teal-500/5 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          Privacy Policy
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Last updated: June 13, 2026
        </p>
      </div>

      <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">
        <section className="glass rounded-2xl p-6 border border-gray-200/60 dark:border-gray-200/10">
          <h2 className="text-lg font-bold text-foreground mb-3">1. Introduction</h2>
          <p>
            Champions Lab (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) operates the website{" "}
            <Link href="/" className="text-emerald-600 hover:underline">https://championslab.xyz</Link>{" "}
            (the &ldquo;Service&rdquo;). This Privacy Policy explains how we collect, use, and protect your information when you use the Service.
          </p>
          <p className="mt-3">
            By using the Service, you agree to the collection and use of information in accordance with this policy. If you do not agree, please do not use the Service.
          </p>
        </section>

        <section className="glass rounded-2xl p-6 border border-gray-200/60 dark:border-gray-200/10">
          <h2 className="text-lg font-bold text-foreground mb-3">2. Information We Collect</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Contact information:</strong> When you use the contact form on the About page, you may provide your name, email address, and any message or screenshot you choose to attach.
            </li>
            <li>
              <strong>Usage data:</strong> We use Google Analytics to collect anonymous information about how visitors interact with the Service, such as pages visited, time spent, and approximate location (country/region level).
            </li>
            <li>
              <strong>Cookies and local storage:</strong> We use cookies and browser local storage to remember your language preference and theme choice. Analytics cookies are only set after you consent.
            </li>
            <li>
              <strong>User-generated content:</strong> Teams, tournaments, and other data you choose to share through the Service may be stored and displayed publicly.
            </li>
          </ul>
        </section>

        <section className="glass rounded-2xl p-6 border border-gray-200/60 dark:border-gray-200/10">
          <h2 className="text-lg font-bold text-foreground mb-3">3. How We Use Your Information</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>To provide, maintain, and improve the Service.</li>
            <li>To respond to contact form submissions and support requests.</li>
            <li>To understand how the Service is used and to improve user experience.</li>
            <li>To remember your preferences (language, theme).</li>
          </ul>
        </section>

        <section className="glass rounded-2xl p-6 border border-gray-200/60 dark:border-gray-200/10">
          <h2 className="text-lg font-bold text-foreground mb-3">4. Cookies and Analytics</h2>
          <p>
            We use cookies to operate the Service and to collect analytics. Essential cookies for language and theme preferences are set without prior consent.
          </p>
          <p className="mt-3">
            Analytics cookies (Google Analytics) are only loaded after you provide consent. Users in the European Union, United Kingdom, and California will see a consent banner on their first visit. You can change or withdraw your consent at any time by clicking &ldquo;Cookie Settings&rdquo; in the footer.
          </p>
          <p className="mt-3">
            For more information on how Google processes data, please see{" "}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 hover:underline"
            >
              Google&apos;s Privacy Policy
            </a>.
          </p>
        </section>

        <section className="glass rounded-2xl p-6 border border-gray-200/60 dark:border-gray-200/10">
          <h2 className="text-lg font-bold text-foreground mb-3">5. Third-Party Services</h2>
          <p>We may use the following third-party services:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>
              <strong>Google Analytics</strong> — anonymous usage analytics.
            </li>
            <li>
              <strong>Supabase</strong> — database and authentication services.
            </li>
            <li>
              <strong>Buy Me a Coffee</strong> — donation processing (external site).
            </li>
            <li>
              <strong>Shopify</strong> — merchandise store (external site).
            </li>
          </ul>
          <p className="mt-3">
            These third parties have their own privacy policies. We are not responsible for their practices.
          </p>
        </section>

        <section className="glass rounded-2xl p-6 border border-gray-200/60 dark:border-gray-200/10">
          <h2 className="text-lg font-bold text-foreground mb-3">6. Data Retention</h2>
          <p>
            Contact form submissions are retained only as long as necessary to respond to your request and for record-keeping purposes. Analytics data is retained according to Google Analytics&apos; policies. User-generated shared content is retained until you request its removal or we decide to remove it.
          </p>
        </section>

        <section className="glass rounded-2xl p-6 border border-gray-200/60 dark:border-gray-200/10">
          <h2 className="text-lg font-bold text-foreground mb-3">7. Your Rights</h2>
          <p>Depending on your location, you may have the right to:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>Access the personal information we hold about you.</li>
            <li>Request correction or deletion of your personal information.</li>
            <li>Object to or restrict certain processing.</li>
            <li>Withdraw consent for analytics cookies at any time.</li>
          </ul>
          <p className="mt-3">
            To exercise these rights, please contact us through the form on the{" "}
            <Link href="/about" className="text-emerald-600 hover:underline">About page</Link>.
          </p>
        </section>

        <section className="glass rounded-2xl p-6 border border-gray-200/60 dark:border-gray-200/10">
          <h2 className="text-lg font-bold text-foreground mb-3">8. Children&apos;s Privacy</h2>
          <p>
            The Service is not directed to children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe we have collected such information, please contact us and we will delete it.
          </p>
        </section>

        <section className="glass rounded-2xl p-6 border border-gray-200/60 dark:border-gray-200/10">
          <h2 className="text-lg font-bold text-foreground mb-3">9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated &ldquo;Last updated&rdquo; date.
          </p>
        </section>

        <section className="glass rounded-2xl p-6 border border-gray-200/60 dark:border-gray-200/10">
          <h2 className="text-lg font-bold text-foreground mb-3">10. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us through the{" "}
            <Link href="/about" className="text-emerald-600 hover:underline">About page</Link>.
          </p>
        </section>
      </div>
    </div>
  );
}
