import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";

export const metadata = {
  title: "Terms of Service | Paradox Discord Bot",
  description: "Terms of Service for the Paradox Discord bot and web dashboard.",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-discord-darkest text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-discord-muted hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>

        {/* Operator Review Notice */}
        <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-200 flex items-start gap-3">
          <ShieldAlert className="w-6 h-6 flex-shrink-0 text-amber-400 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-amber-300 uppercase tracking-wide">
              Operator Notice: Pre-Launch Draft for Legal Review
            </p>
            <p className="mt-1 text-amber-200/90">
              This document is a customizable template designed for the Paradox bot and dashboard. It includes
              prominent placeholders (e.g. <code>[OPERATOR_LEGAL_NAME]</code>, <code>[CONTACT_EMAIL]</code>) and must be
              reviewed and tailored by the bot operator before commercial or public deployment.
            </p>
          </div>
        </div>

        {/* Header */}
        <div className="border-b border-discord-card pb-6">
          <h1 className="text-3xl font-extrabold text-white">Terms of Service</h1>
          <p className="mt-2 text-sm text-discord-muted">
            Effective Date: <span className="text-discord-yellow font-mono">[EFFECTIVE_DATE]</span> | Last Updated:{" "}
            <span className="text-discord-yellow font-mono">[LAST_UPDATED_DATE]</span>
          </p>
        </div>

        {/* Content */}
        <div className="space-y-6 text-slate-300 text-sm leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">1. Agreement to Terms</h2>
            <p>
              By adding the Paradox bot (&quot;the Bot&quot;) to your Discord server or accessing the companion dashboard website
              located at <code>[APP_DOMAIN]</code> (&quot;the Service&quot;), operated by{" "}
              <strong className="text-white font-mono">[OPERATOR_LEGAL_NAME]</strong> (&quot;Operator&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;),
              you agree to be bound by these Terms of Service. If you do not agree to these terms, do not install or use
              the Bot or the Service.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">2. Scope of Service & Features</h2>
            <p>
              The Service provides Discord server management utilities, including:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Reaction Roles:</strong> Automated assignment and removal of Discord server roles when members
                react to designated messages.
              </li>
              <li>
                <strong>Rich Embed Publisher:</strong> A dashboard editor allowing authorized server managers to design,
                preview, and broadcast rich embed messages to designated channels.
              </li>
              <li>
                <strong>Link-to-Video Embed Transformer:</strong> Automatic conversion of supported social video URLs (such as
                X/Twitter, TikTok, Instagram, and Reddit) into Discord-compatible inline video playback links.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">3. Third-Party Services and Video Transformation</h2>
            <p>
              The Link-to-Video feature operates strictly by rewriting public URLs to third-party open web utilities (e.g.
              fxtwitter.com, tiktxk.com, ddinstagram.com, rxddit.com).
            </p>
            <div className="p-4 rounded-lg bg-discord-card border border-white/5 space-y-2 text-xs">
              <p className="font-semibold text-white">Important Technical Disclaimers:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>No Media Hosting:</strong> Paradox does NOT download, store, rehost, or proxy proprietary video files
                  or content onto its own servers.
                </li>
                <li>
                  <strong>Third-Party Availability:</strong> Upstream platforms may alter their APIs, rate-limit, or restrict
                  embedding without prior notice. We do not guarantee uninterrupted availability of link transformation for any
                  third-party provider.
                </li>
                <li>
                  <strong>Private / Protected Content:</strong> The Bot does not and cannot bypass platform paywalls, account
                  privacy settings, or age restrictions.
                </li>
              </ul>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">4. User Responsibilities & Acceptable Use</h2>
            <p>When using the Service, you agree that you will NOT:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Violate Discord’s Terms of Service or Community Guidelines.</li>
              <li>Use the embed publisher or bot messaging to transmit malware, phishing links, hate speech, or harassment.</li>
              <li>Attempt to bypass rate limits, probe security vulnerabilities, or interfere with bot operations.</li>
              <li>Misuse reaction roles to grant unauthorized administrative permissions to untrusted users.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">5. Account & Server Permissions</h2>
            <p>
              Access to server configuration in the dashboard requires Discord OAuth2 authorization. You may only edit
              settings for servers where your Discord account possesses the <code>Manage Server</code> or{" "}
              <code>Administrator</code> permission. The Operator disclaims liability for actions taken by members of your
              team whom you have granted administrative privileges in your Discord server.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">6. Disclaimer of Warranties & Limitation of Liability</h2>
            <p>
              THE SERVICE IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR
              IMPLIED. TO THE MAXIMUM EXTENT PERMITTED BY LAW, [OPERATOR_LEGAL_NAME] SHALL NOT BE LIABLE FOR ANY INDIRECT,
              INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES ARISING OUT OF YOUR USE OF THE SERVICE, INCLUDING BUT NOT LIMITED
              TO LOSS OF DATA, SERVER DISRUPTIONS, OR THIRD-PARTY API OUTAGES.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">7. Termination</h2>
            <p>
              We reserve the right to suspend or terminate access to the Bot and dashboard for servers or accounts that
              violate these terms or engage in abusive activities, with or without prior notice.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">8. Contact Information</h2>
            <p>For questions or notices regarding these Terms, contact:</p>
            <div className="p-4 rounded-lg bg-discord-card border border-white/5 font-mono text-xs space-y-1">
              <p>Operator: [OPERATOR_LEGAL_NAME]</p>
              <p>Contact Email: [CONTACT_EMAIL]</p>
              <p>Business Address: [BUSINESS_ADDRESS]</p>
            </div>
          </section>
        </div>

        {/* Footer links */}
        <div className="pt-6 border-t border-discord-card flex items-center justify-between text-xs text-discord-muted">
          <span>&copy; {new Date().getFullYear()} [OPERATOR_LEGAL_NAME]. All rights reserved.</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-white transition underline">
              Privacy Policy
            </Link>
            <Link href="/dashboard" className="hover:text-white transition">
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
