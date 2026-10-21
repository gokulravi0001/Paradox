"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Smile,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Hash,
  ShieldAlert,
  Info,
} from "lucide-react";

interface Channel {
  id: string;
  name: string;
}

interface Role {
  id: string;
  name: string;
  color: string;
  position: number;
  managed: boolean;
  assignableByBot: boolean;
}

interface ReactionRoleItem {
  id: string;
  channelId: string;
  messageId: string;
  emoji: string;
  roleId: string;
  roleName: string;
  description: string | null;
  createdAt: string;
}

export default function ReactionRolesPage() {
  const params = useParams();
  const guildId = params.guildId as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [botHighestPosition, setBotHighestPosition] = useState<number>(0);
  const [reactionRoles, setReactionRoles] = useState<ReactionRoleItem[]>([]);

  // Form State
  const [channelId, setChannelId] = useState("");
  const [messageId, setMessageId] = useState("");
  const [emoji, setEmoji] = useState("⭐");
  const [roleId, setRoleId] = useState("");
  const [description, setDescription] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        setError(null);

        const [channelsRes, rolesRes, listRes] = await Promise.all([
          fetch(`/api/guilds/${guildId}/channels`),
          fetch(`/api/guilds/${guildId}/roles`),
          fetch(`/api/guilds/${guildId}/reaction-roles`),
        ]);

        if (channelsRes.ok) {
          const cData = await channelsRes.json();
          setChannels(cData.channels || []);
          if (cData.channels?.length > 0) {
            setChannelId(cData.channels[0].id);
          }
        }

        if (rolesRes.ok) {
          const rData = await rolesRes.json();
          setRoles(rData.roles || []);
          setBotHighestPosition(rData.botHighestPosition || 0);
          const firstAssignable = rData.roles?.find((r: Role) => r.assignableByBot);
          if (firstAssignable) {
            setRoleId(firstAssignable.id);
          }
        }

        if (listRes.ok) {
          const lData = await listRes.json();
          setReactionRoles(lData.reactionRoles || []);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load reaction roles.");
      } finally {
        setLoading(false);
      }
    }

    if (guildId) {
      init();
    }
  }, [guildId]);

  const selectedRole = roles.find((r) => r.id === roleId);
  const isRoleTooHigh = selectedRole && !selectedRole.assignableByBot;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!channelId || !messageId || !emoji || !roleId) {
      setError("Please fill out all required fields.");
      return;
    }

    if (isRoleTooHigh) {
      setError(
        `Cannot assign '${selectedRole?.name}' because it is higher than the bot's highest role. Please reposition the bot's role higher in your Discord Server Settings.`
      );
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`/api/guilds/${guildId}/reaction-roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId,
          messageId: messageId.trim(),
          emoji: emoji.trim(),
          roleId,
          roleName: selectedRole?.name || "Role",
          description: description.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create reaction role.");
      }

      setSuccess("Reaction role successfully configured!");
      setReactionRoles([data.reactionRole, ...reactionRoles]);
      setMessageId("");
      setDescription("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error creating reaction role");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to remove this reaction role mapping?")) return;

    try {
      const res = await fetch(`/api/guilds/${guildId}/reaction-roles/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete.");
      }

      setReactionRoles(reactionRoles.filter((item) => item.id !== id));
      setSuccess("Reaction role removed successfully.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete reaction role.");
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
          <Smile className="w-8 h-8 text-discord-blurple" />
          <span>Reaction Roles</span>
        </h1>
        <p className="text-sm text-discord-muted mt-1">
          Configure messages where members can react with an emoji to automatically receive or lose specific roles.
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-xl border border-discord-red/40 bg-discord-red/10 text-discord-red flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{success}</span>
        </div>
      )}

      {/* Creation Card */}
      <div className="p-6 rounded-2xl bg-discord-card border border-white/5 space-y-6">
        <div className="border-b border-white/5 pb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-discord-blurple" /> Add New Reaction Role Mapping
          </h2>
          <p className="text-xs text-discord-muted mt-1">
            Specify the destination channel, message snowflake ID, emoji trigger, and target role.
          </p>
        </div>

        <form onSubmit={handleCreate} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Channel Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Discord Channel
              </label>
              <select
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-discord-dark border border-white/10 text-sm text-white focus:outline-none focus:border-discord-blurple"
              >
                {channels.map((c) => (
                  <option key={c.id} value={c.id}>
                    #{c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Message ID */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Message ID (Snowflake)
              </label>
              <input
                type="text"
                placeholder="e.g. 112233445566778899"
                value={messageId}
                onChange={(e) => setMessageId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-discord-dark border border-white/10 text-sm text-white placeholder-discord-muted focus:outline-none focus:border-discord-blurple font-mono"
              />
              <p className="text-[11px] text-discord-muted flex items-center gap-1">
                <Info className="w-3 h-3" /> Enable Developer Mode in Discord settings, right-click any message &gt; Copy ID.
              </p>
            </div>

            {/* Emoji Trigger */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Trigger Emoji
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. ⭐, 🎮, or custom name:id"
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-discord-dark border border-white/10 text-sm text-white focus:outline-none focus:border-discord-blurple"
                />
                {/* Quick Emoji Buttons */}
                <div className="flex gap-1">
                  {["⭐", "🎮", "🔔", "🚀", "🔥"].map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setEmoji(em)}
                      className="px-2.5 py-1.5 bg-discord-dark hover:bg-discord-card rounded-lg border border-white/5 text-sm"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Target Role Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Target Role
              </label>
              <select
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-discord-dark border border-white/10 text-sm text-white focus:outline-none focus:border-discord-blurple"
              >
                {roles.map((r) => (
                  <option
                    key={r.id}
                    value={r.id}
                    disabled={!r.assignableByBot}
                    className={!r.assignableByBot ? "text-zinc-500" : "text-white"}
                  >
                    {r.name} {!r.assignableByBot ? "(Higher than Bot / Managed)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Role Hierarchy Warning if selected role is too high */}
          {isRoleTooHigh && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-amber-300">Hierarchy Restriction: </span>
                The role <strong className="text-white">&quot;{selectedRole?.name}&quot;</strong> is positioned higher than
                the bot&apos;s highest role in Discord. To assign this role, open your Discord Server Settings &gt; Roles, and
                drag the Paradox bot role above &quot;{selectedRole?.name}&quot;.
              </div>
            </div>
          )}

          {/* Optional Label / Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Internal Label (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Announcements Notification Role"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-discord-dark border border-white/10 text-sm text-white placeholder-discord-muted focus:outline-none focus:border-discord-blurple"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting || isRoleTooHigh}
              className="px-6 py-2.5 rounded-xl bg-discord-blurple hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition flex items-center gap-2 shadow-md shadow-discord-blurple/20"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Save Reaction Role</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Existing Reaction Roles Table */}
      <div className="p-6 rounded-2xl bg-discord-card border border-white/5 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center justify-between">
          <span>Active Reaction Role Mappings</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-discord-dark text-discord-muted">
            {reactionRoles.length} Total
          </span>
        </h2>

        {loading ? (
          <div className="py-12 flex justify-center text-discord-muted">
            <Loader2 className="w-6 h-6 animate-spin text-discord-blurple" />
          </div>
        ) : reactionRoles.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <p className="text-sm text-discord-muted">No reaction role mappings created yet.</p>
            <p className="text-xs text-discord-muted">
              Use the form above to connect an emoji on any message to a server role.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/5 text-discord-muted uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="pb-3 pl-2">Emoji</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Channel / Message</th>
                  <th className="pb-3">Label</th>
                  <th className="pb-3 pr-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {reactionRoles.map((item) => {
                  const channel = channels.find((c) => c.id === item.channelId);
                  return (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-3.5 pl-2">
                        <span className="text-xl inline-block">{item.emoji}</span>
                      </td>
                      <td className="py-3.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-discord-dark border border-white/10 text-white font-medium">
                          <span className="w-2 h-2 rounded-full bg-discord-blurple" />
                          {item.roleName}
                        </span>
                      </td>
                      <td className="py-3.5 font-mono text-discord-muted">
                        <div>#{channel?.name || item.channelId}</div>
                        <div className="text-[10px] text-zinc-500">Msg: {item.messageId}</div>
                      </td>
                      <td className="py-3.5 text-slate-300">
                        {item.description || <span className="text-zinc-500 italic">None</span>}
                      </td>
                      <td className="py-3.5 pr-2 text-right">
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 rounded-lg text-discord-muted hover:text-discord-red hover:bg-discord-red/10 transition"
                          title="Delete reaction role"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
