import { z } from "zod";

export const DISCORD_LIMITS = {
  TITLE_MAX: 256,
  DESCRIPTION_MAX: 4096,
  FIELDS_MAX: 25,
  FIELD_NAME_MAX: 256,
  FIELD_VALUE_MAX: 1024,
  FOOTER_TEXT_MAX: 2048,
  AUTHOR_NAME_MAX: 256,
  TOTAL_CHAR_MAX: 6000,
};

export interface EmbedValidationResult {
  valid: boolean;
  errors: string[];
  totalChars: number;
}

export function validateDiscordEmbed(embed: {
  title?: string | null;
  description?: string | null;
  url?: string | null;
  color?: string | null;
  authorName?: string | null;
  authorUrl?: string | null;
  authorIconUrl?: string | null;
  footerText?: string | null;
  footerIconUrl?: string | null;
  fields?: { name: string; value: string; inline?: boolean }[];
}): EmbedValidationResult {
  const errors: string[] = [];
  let totalChars = 0;

  if (embed.title) {
    if (embed.title.length > DISCORD_LIMITS.TITLE_MAX) {
      errors.push(`Title exceeds ${DISCORD_LIMITS.TITLE_MAX} characters (currently ${embed.title.length}).`);
    }
    totalChars += embed.title.length;
  }

  if (embed.description) {
    if (embed.description.length > DISCORD_LIMITS.DESCRIPTION_MAX) {
      errors.push(`Description exceeds ${DISCORD_LIMITS.DESCRIPTION_MAX} characters (currently ${embed.description.length}).`);
    }
    totalChars += embed.description.length;
  }

  if (embed.authorName) {
    if (embed.authorName.length > DISCORD_LIMITS.AUTHOR_NAME_MAX) {
      errors.push(`Author name exceeds ${DISCORD_LIMITS.AUTHOR_NAME_MAX} characters (currently ${embed.authorName.length}).`);
    }
    totalChars += embed.authorName.length;
  }

  if (embed.footerText) {
    if (embed.footerText.length > DISCORD_LIMITS.FOOTER_TEXT_MAX) {
      errors.push(`Footer text exceeds ${DISCORD_LIMITS.FOOTER_TEXT_MAX} characters (currently ${embed.footerText.length}).`);
    }
    totalChars += embed.footerText.length;
  }

  if (embed.fields && Array.isArray(embed.fields)) {
    if (embed.fields.length > DISCORD_LIMITS.FIELDS_MAX) {
      errors.push(`Total fields exceed limit of ${DISCORD_LIMITS.FIELDS_MAX} (currently ${embed.fields.length}).`);
    }

    embed.fields.forEach((field, index) => {
      if (!field.name || field.name.trim().length === 0) {
        errors.push(`Field #${index + 1} name cannot be empty.`);
      } else if (field.name.length > DISCORD_LIMITS.FIELD_NAME_MAX) {
        errors.push(`Field #${index + 1} name exceeds ${DISCORD_LIMITS.FIELD_NAME_MAX} characters.`);
      }

      if (!field.value || field.value.trim().length === 0) {
        errors.push(`Field #${index + 1} value cannot be empty.`);
      } else if (field.value.length > DISCORD_LIMITS.FIELD_VALUE_MAX) {
        errors.push(`Field #${index + 1} value exceeds ${DISCORD_LIMITS.FIELD_VALUE_MAX} characters.`);
      }

      totalChars += (field.name?.length || 0) + (field.value?.length || 0);
    });
  }

  if (totalChars > DISCORD_LIMITS.TOTAL_CHAR_MAX) {
    errors.push(
      `Total characters across all embed elements (${totalChars}) exceeds Discord limit of ${DISCORD_LIMITS.TOTAL_CHAR_MAX}.`
    );
  }

  if (embed.color) {
    const hexPattern = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
    if (!hexPattern.test(embed.color)) {
      errors.push("Embed color must be a valid hex code (e.g., #5865F2).");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    totalChars,
  };
}

/**
 * Format embed data into Discord API format
 */
export function formatToDiscordEmbedApi(embed: {
  title?: string | null;
  description?: string | null;
  url?: string | null;
  color?: string | null;
  authorName?: string | null;
  authorUrl?: string | null;
  authorIconUrl?: string | null;
  footerText?: string | null;
  footerIconUrl?: string | null;
  timestamp?: boolean;
  thumbnailUrl?: string | null;
  imageUrl?: string | null;
  fields?: { name: string; value: string; inline?: boolean }[];
}) {
  const result: Record<string, unknown> = {};

  if (embed.title?.trim()) result.title = embed.title.trim();
  if (embed.description?.trim()) result.description = embed.description.trim();
  if (embed.url?.trim()) result.url = embed.url.trim();

  if (embed.color?.trim()) {
    const cleanHex = embed.color.replace("#", "");
    result.color = parseInt(cleanHex, 16);
  }

  if (embed.authorName?.trim()) {
    result.author = {
      name: embed.authorName.trim(),
      url: embed.authorUrl?.trim() || undefined,
      icon_url: embed.authorIconUrl?.trim() || undefined,
    };
  }

  if (embed.footerText?.trim()) {
    result.footer = {
      text: embed.footerText.trim(),
      icon_url: embed.footerIconUrl?.trim() || undefined,
    };
  }

  if (embed.timestamp) {
    result.timestamp = new Date().toISOString();
  }

  if (embed.thumbnailUrl?.trim()) {
    result.thumbnail = { url: embed.thumbnailUrl.trim() };
  }

  if (embed.imageUrl?.trim()) {
    result.image = { url: embed.imageUrl.trim() };
  }

  if (embed.fields && Array.isArray(embed.fields) && embed.fields.length > 0) {
    result.fields = embed.fields.map((f) => ({
      name: f.name.trim(),
      value: f.value.trim(),
      inline: !!f.inline,
    }));
  }

  return result;
}

// Zod schemas
export const ReactionRoleSchema = z.object({
  channelId: z.string().min(10, "Invalid channel ID"),
  messageId: z.string().min(10, "Invalid message ID"),
  emoji: z.string().min(1, "Emoji is required"),
  roleId: z.string().min(10, "Invalid role ID"),
  roleName: z.string().min(1, "Role name is required"),
  description: z.string().optional(),
});

export const EmbedSchema = z.object({
  name: z.string().min(1, "Template name is required").max(100),
  title: z.string().max(DISCORD_LIMITS.TITLE_MAX).optional().nullable(),
  description: z.string().max(DISCORD_LIMITS.DESCRIPTION_MAX).optional().nullable(),
  url: z.string().url("Must be a valid URL").optional().or(z.literal("")).nullable(),
  color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Invalid hex color").optional().nullable(),
  authorName: z.string().max(DISCORD_LIMITS.AUTHOR_NAME_MAX).optional().nullable(),
  authorUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")).nullable(),
  authorIconUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")).nullable(),
  footerText: z.string().max(DISCORD_LIMITS.FOOTER_TEXT_MAX).optional().nullable(),
  footerIconUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")).nullable(),
  timestamp: z.boolean().optional(),
  thumbnailUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")).nullable(),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")).nullable(),
  fields: z.array(
    z.object({
      name: z.string().min(1, "Field title cannot be empty").max(DISCORD_LIMITS.FIELD_NAME_MAX),
      value: z.string().min(1, "Field content cannot be empty").max(DISCORD_LIMITS.FIELD_VALUE_MAX),
      inline: z.boolean().optional(),
    })
  ).max(DISCORD_LIMITS.FIELDS_MAX).optional(),
});

export const VideoFixerSettingsSchema = z.object({
  videoFixerEnabled: z.boolean(),
  videoFixerProviders: z.array(z.enum(["twitter", "tiktok", "instagram", "reddit"])),
  videoFixerIgnoredChannels: z.array(z.string()),
});

export const GuildSettingsSchema = z.object({
  prefix: z.string().min(1).max(5),
});
