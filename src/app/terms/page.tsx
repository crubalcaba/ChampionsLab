import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service - Champions Lab",
  description:
    "Champions Lab terms of service and unofficial fan-project disclaimer.",
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="glass rounded-2xl p-6 sm:p-8 border border-violet-200/60 dark:border-violet-400/20 bg-gradient-to-br from-violet-50/40 to-indigo-50/40 dark:from-violet-500/10 dark:to-indigo-500/5 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
          Terms of Service
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Last updated: June 13, 2026
        </p>
      </div>

      <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">
        <section className="glass rounded-2xl p-6 border border-amber-200/80 dark:border-amber-500/30 bg-gradient-to-br from-amber-50/60 to-orange-50/60 dark:from-amber-950/60 dark:to-orange-950/60">
          <h2 className="text-lg font-bold text-amber-900 dark:text-amber-200 mb-3">
            Unofficial Fan Project Disclaimer
          </h2>
          <p className="text-amber-800/90 dark:text-amber-300/90">
            <strong>Champions Lab is an unofficial fan project.</strong> It is not affiliated with, endorsed by, sponsored by, or approved by Nintendo, The Pokémon Company International, Game Freak Inc., or Creatures Inc.
          </p>
          <p className="mt-3 text-amber-800/90 dark:text-amber-300/90">
            Pokémon, Pokémon character names, Nintendo Switch, and related marks are trademarks of Nintendo, The Pokémon Company International, Game Freak Inc., and/or Creatures Inc. All rights to those marks and to Pokémon game data, sprites, artwork, and other materials belong to their respective owners.
          </p>
          <p className="mt-3 text-amber-800/90 dark:text-amber-300/90">
            Champions Lab is provided free of charge as a companion resource for the competitive Pokémon community. No revenue from the Service is derived from the sale of Pokémon intellectual property.
          </p>
        </section>

        <section className="glass rounded-2xl p-6 border border-gray-200/60 dark:border-gray-200/10">
          <h2 className="text-lg font-bold text-foreground mb-3">1. Acceptance of Terms</h2>
          <p>
            By accessing or using Champions Lab (the &ldquo;Service&rdquo;), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.
          </p>
        </section>

        <section className="glass rounded-2xl p-6 border border-gray-200/60 dark:border-gray-200/10">
          <h2 className="text-lg font-bold text-foreground mb-3">2. Use of the Service</h2>
          <p>
            The Service is provided for personal, non-commercial use. You may use the tools (Pokédex, Team Builder, Battle Simulator, Meta Analysis, etc.) to build teams, analyze data, and improve your competitive play.
          </p>
          <p className="mt-3">You agree not to:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>Use the Service to harass, abuse, or harm others.</li>
            <li>Attempt to gain unauthorized access to any part of the Service or its infrastructure.</li>
            <li>Use automated means to scrape, copy, or redistribute the Service&apos;s data at scale without permission.</li>
            <li>Use the Service in any way that violates applicable laws or third-party rights.</li>
          </ul>
        </section>

        <section className="glass rounded-2xl p-6 border border-gray-200/60 dark:border-gray-200/10">
          <h2 className="text-lg font-bold text-foreground mb-3">3. Intellectual Property</h2>
          <p>
            The Champions Lab code, logo, and original content created by the project team are licensed under the MIT License (see the project repository). However, this license does not grant any rights to Pokémon intellectual property used within the Service.
          </p>
          <p className="mt-3">
            All Pokémon-related names, sprites, artwork, move data, ability data, and other game materials remain the property of their respective owners. Their use in Champions Lab is intended as fair-use fan content and may be removed at the request of the rights holders.
          </p>
        </section>

        <section className="glass rounded-2xl p-6 border border-gray-200/60 dark:border-gray-200/10">
          <h2 className="text-lg font-bold text-foreground mb-3">4. User-Generated Content</h2>
          <p>
            You may choose to share teams, tournament data, or other content through the Service. By sharing content, you grant us a non-exclusive, royalty-free license to store, display, and distribute that content as part of the Service.
          </p>
          <p className="mt-3">
            You are solely responsible for any content you share. Do not share content that infringes third-party rights or violates these Terms.
          </p>
        </section>

        <section className="glass rounded-2xl p-6 border border-gray-200/60 dark:border-gray-200/10">
          <h2 className="text-lg font-bold text-foreground mb-3">5. Disclaimer of Warranties</h2>
          <p>
            The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind, either express or implied. We do not guarantee that the Service will be accurate, complete, reliable, secure, or error-free.
          </p>
          <p className="mt-3">
            Champions Lab is an independent project and is not an official source of Pokémon game information. Always verify critical data against official Pokémon games and announcements.
          </p>
        </section>

        <section className="glass rounded-2xl p-6 border border-gray-200/60 dark:border-gray-200/10">
          <h2 className="text-lg font-bold text-foreground mb-3">6. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, Champions Lab and its contributors shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or relating to your use of the Service.
          </p>
        </section>

        <section className="glass rounded-2xl p-6 border border-gray-200/60 dark:border-gray-200/10">
          <h2 className="text-lg font-bold text-foreground mb-3">7. Termination</h2>
          <p>
            We may suspend or terminate your access to the Service at any time, with or without notice, for any reason, including violation of these Terms.
          </p>
        </section>

        <section className="glass rounded-2xl p-6 border border-gray-200/60 dark:border-gray-200/10">
          <h2 className="text-lg font-bold text-foreground mb-3">8. Changes to These Terms</h2>
          <p>
            We may update these Terms from time to time. Changes will be posted on this page with an updated &ldquo;Last updated&rdquo; date. Continued use of the Service after changes constitutes acceptance of the revised Terms.
          </p>
        </section>

        <section className="glass rounded-2xl p-6 border border-gray-200/60 dark:border-gray-200/10">
          <h2 className="text-lg font-bold text-foreground mb-3">9. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of Portugal, without regard to conflict of law principles.
          </p>
        </section>

        <section className="glass rounded-2xl p-6 border border-gray-200/60 dark:border-gray-200/10">
          <h2 className="text-lg font-bold text-foreground mb-3">10. Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us through the{" "}
            <Link href="/about" className="text-emerald-600 hover:underline">About page</Link>.
          </p>
        </section>
      </div>
    </div>
  );
}
