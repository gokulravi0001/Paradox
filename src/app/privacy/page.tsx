import Link from "next/link";
import { ArrowLeft, ShieldCheck, ShieldAlert } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | Paradox Discord Bot",
  description: "Privacy Policy for the Paradox Discord bot and web dashboard.",
};

export default function PrivacyPolicyPage() {
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
              This Privacy Policy contains standard disclosures for Discord bots and web dashboards with obvious placeholders
              (e.g. <code>[OPERATOR_LEGAL_NAME]</code>, <code>[CONTACT_EMAIL]</code>). Please review and adapt this policy to
              meet your specific operational jurisdictions and obligations before public launch.
            </p>
          </div>
        </div>

        {/* Header */}
        <div className="border-b border-discord-card pb-6">
          <h1 className="text-3xl font-extrabold text-white">Privacy Policy</h1>
          <p className="mt-2 text-sm text-discord-muted">
            Effective Date: <span className="text-discord-yellow font-mono">[EFFECTIVE_DATE]</span> | Last Updated:{" "}
            <span className="text-discord-yellow font-mono">[LAST_UPDATED_DATE]</span>
          </p>
        </div>

        {/* Content */}
        <div className="space-y-6 text-slate-300 text-sm leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">1. Introduction</h2>
            <p>
              This Privacy Policy describes how{" "}
              <strong className="text-white font-mono">[OPERATOR_LEGAL_NAME]</strong> (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;)
              collects, uses, and protects information when you use our Paradox Discord bot and web dashboard
              (collectively, the &quot;Service&quot;). We take privacy seriously and collect only the minimum data required to deliver
              bot functionality and server management services.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">2. Information We Collect</h2>
            <p>We collect and process the following categories of information:</p>

            <div className="space-y-4 mt-2">
              <div className="p-4 rounded-lg bg-discord-card border border-white/5 space-y-1">
                <h3 className="font-semibold text-white">A. Discord Account Data (Via OAuth2 Sign-In)</h3>
                <p className="text-xs text-discord-muted">
                  When you sign in using Discord OAuth2, we request only the <code>identify</code> and <code>guilds</code> scopes:
                </p>
                <ul className="list-disc pl-5 text-xs space-y-1 mt-1">
                  <li>Discord User ID, username, discriminator, and avatar hash.</li>
                  <li>List of Discord servers you belong to and your permission bitfields in each server (to verify administrative rights).</li>
                  <li>OAuth access tokens (stored securely in signed, HTTP-only session cookies and never exposed to the client browser).</li>
                </ul>
              </div>

              <div className="p-4 rounded-lg bg-discord-card border border-white/5 space-y-1">
                <h3 className="font-semibold text-white">B. Server Configuration Data</h3>
                <p className="text-xs text-discord-muted">
                  Information explicitly created or configured by administrators on the dashboard:
                </p>
                <ul className="list-disc pl-5 text-xs space-y-1 mt-1">
                  <li>Discord Guild ID, server name, and icon hash.</li>
                  <li>Reaction Role configurations: Message IDs, Channel IDs, Role IDs, and Emoji identifiers.</li>
                  <li>Embed templates: Titles, descriptions, field names/values, and color hexes saved by server managers.</li>
                  <li>Video fixer settings: Enabled provider list and ignored channel IDs.</li>
                  <li>Audit logs: Records of which admin user updated settings or published embeds, for server accountability.</li>
                </ul>
              </div>

              <div className="p-4 rounded-lg bg-discord-card border border-white/5 space-y-1">
                <h3 className="font-semibold text-white text-emerald-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> C. Information We Do NOT Collect or Store
                </h3>
                <ul className="list-disc pl-5 text-xs space-y-1 mt-1">
                  <li>We do NOT store or log general chat message content or chat histories.</li>
                  <li>We do NOT read or store private direct messages (DMs).</li>
                  <li>We do NOT download, cache, or rehost user video files or media attachments.</li>
                  <li>We do NOT collect financial, payment, or credit card information.</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">3. How We Use Information</h2>
            <p>Your information is used solely to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Authenticate your identity and authorize access to server configuration.</li>
              <li>Execute reaction-based role assignments when members react to designated messages.</li>
              <li>Deliver and publish rich embeds configured by administrators to specified Discord channels.</li>
              <li>Rewrite supported public video links to enable native player previews in Discord.</li>
              <li>Maintain server security and provide audit logs to server owners.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">4. Third-Party Services & Integrations</h2>
            <p>The Service interacts with the following external providers:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Discord API:</strong> For user authentication, bot gateway events, role management, and message sending.
                Subject to <a href="https://discord.com/privacy" target="_blank" rel="noreferrer" className="text-discord-blurple underline">Discord&apos;s Privacy Policy</a>.
              </li>
              <li>
                <strong>Video Embed Resolvers (e.g., fxtwitter.com, tiktxk.com, ddinstagram.com, rxddit.com):</strong> The bot
                converts message links to these publicly available URL formats without passing personal identifiers.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">5. Security Safeguards</h2>
            <p>
              We implement industry-standard security practices to protect your data:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Encrypted, HTTP-only, SameSite session cookies for web authentication.</li>
              <li>Cryptographic state parameters to prevent Cross-Site Request Forgery (CSRF).</li>
              <li>Server-side authorization checks on all API endpoints to prevent privilege escalation.</li>
              <li>Strict minimization of Discord bot gateway intents and API permissions.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">6. Data Retention and Deletion</h2>
            <p>
              Server configurations are retained while the bot remains a member of your Discord server.
              Server administrators or owners may request complete deletion of all server configuration data and associated
              audit records at any time by contacting us at <code className="text-discord-yellow">[CONTACT_EMAIL]</code>.
              Upon confirmation, all server records will be permanently purged within 30 days.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">7. Contact Information</h2>
            <p>
              If you have any questions or concerns regarding this Privacy Policy or data handling, please contact:
            </p>
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
            <Link href="/terms" className="hover:text-white transition underline">
              Terms of Service
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
