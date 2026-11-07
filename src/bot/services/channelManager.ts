import {
  Guild,
  PermissionsBitField,
  ChannelType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { prisma } from "@/lib/prisma";

export async function ensureAdminIdeasChannel(
  guild: Guild,
  announcement: { id: string; channelId: string; title?: string | null; adminChannelId?: string | null },
  title?: string
) {
  if (announcement.adminChannelId) {
    const existing = await guild.channels.fetch(announcement.adminChannelId).catch(() => null);
    if (existing) return existing;
  }

  const botMember = await guild.members.fetchMe().catch(() => null);
  const permissionOverwrites: any[] = [
    {
      id: guild.id, // @everyone role
      deny: [PermissionsBitField.Flags.ViewChannel],
    },
  ];

  if (botMember) {
    permissionOverwrites.push({
      id: botMember.id,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.EmbedLinks,
        PermissionsBitField.Flags.ManageChannels,
        PermissionsBitField.Flags.ReadMessageHistory,
      ],
    });
  }

  if (guild.ownerId) {
    permissionOverwrites.push({
      id: guild.ownerId,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ReadMessageHistory,
      ],
    });
  }

  const adminRoles = guild.roles.cache.filter(
    (r) =>
      r.permissions.has(PermissionsBitField.Flags.Administrator) ||
      r.permissions.has(PermissionsBitField.Flags.ManageGuild)
  );
  for (const role of adminRoles.values()) {
    permissionOverwrites.push({
      id: role.id,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ReadMessageHistory,
      ],
    });
  }

  const cleanName = (title || announcement.title || "event-ideas")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .slice(0, 80);

  const finalName = cleanName.startsWith("ideas-") ? `🔒-${cleanName}` : `🔒-ideas-${cleanName}`;

  const channel = await guild.channels.create({
    name: finalName,
    type: ChannelType.GuildText,
    topic: "Temporary private channel for announcement responses. Visible only to Admins and the Server Owner.",
    permissionOverwrites,
  });

  await prisma.announcement.update({
    where: { id: announcement.id },
    data: { adminChannelId: channel.id },
  }).catch(() => null);

  const headerEmbed = new EmbedBuilder()
    .setColor(0xf59e0b)
    .setTitle("🔒 Temporary Admin & Owner Response Log")
    .setDescription(
      `This private channel was automatically created to log member responses for the announcement in <#${announcement.channelId}>.\n\n` +
      `• **Access:** Only Server Owner & Administrators have permission to view this channel.\n` +
      `• **Submissions:** Whenever a member clicks **[💡 Type Your Idea / Feedback]** on the announcement and submits the text field, their response will appear here in real time.\n\n` +
      `*When the event/collection is complete, click the red button below to close and delete this channel.*`
    )
    .setFooter({ text: "Paradox • Temporary Admin Log" })
    .setTimestamp();

  const headerRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`delete_temp_channel_${announcement.id}`)
      .setLabel("🗑️ Close & Delete Temporary Channel")
      .setStyle(ButtonStyle.Danger)
  );

  await channel.send({ embeds: [headerEmbed], components: [headerRow] }).catch(() => null);
  return channel;
}
