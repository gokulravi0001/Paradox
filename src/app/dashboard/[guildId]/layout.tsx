"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";

interface GuildData {
  id: string;
  name: string;
  icon: string | null;
  botInstalled: boolean;
  inviteUrl: string;
}

export default function GuildDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const router = useRouter();
  const guildId = params.guildId as string;

  const [guild, setGuild] = useState<GuildData | null>(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    async function loadGuild() {
      try {
        const res = await fetch(`/api/guilds/${guildId}`);
        if (!res.ok) {
          if (res.status === 401) {
            router.push("/api/auth/login");
            return;
          }
          if (res.status === 403) {
            router.push("/dashboard?error=You+do+not+have+permission+to+manage+this+server.");
            return;
          }
          router.push("/dashboard");
          return;
        }

        const data = await res.json();
        setGuild(data.guild);
      } catch {
        router.push("/dashboard");
      } finally {
        setLoading(false);
      }
    }

    if (guildId) {
      loadGuild();
    }
  }, [guildId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090a0f] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-discord-blurple animate-spin" />
        <p className="text-xs font-semibold text-zinc-400">Loading server configuration...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090a0f] text-zinc-100 flex flex-col font-sans">
      <Sidebar
        guildId={guildId}
        guildName={guild?.name}
        guildIcon={guild?.icon}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((prev) => !prev)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <Navbar
        guildId={guildId}
        guildName={guild?.name}
        collapsed={collapsed}
        onOpenMobile={() => setMobileOpen(true)}
      />

      {/* Main Content Area */}
      <main
        className={`flex-1 pt-16 transition-all duration-300 ${
          collapsed ? "lg:pl-20" : "lg:pl-64"
        }`}
      >
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
          {children}
        </div>
      </main>
    </div>
  );
}
