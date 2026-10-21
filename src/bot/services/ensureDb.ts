import { PrismaClient } from "@prisma/client";

/**
 * Automatically creates and updates all required database tables and columns if they do not exist yet.
 * Runs on bot startup so users never have to run manual schema push commands.
 */
export async function ensureDatabaseSchema(prisma: PrismaClient) {
  try {
    console.log("[Database] Checking and ensuring database tables exist...");

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "username" TEXT NOT NULL,
        "discriminator" TEXT,
        "avatar" TEXT,
        "accessToken" TEXT,
        "refreshToken" TEXT,
        "tokenExpiresAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "GuildConfig" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "icon" TEXT,
        "botJoined" BOOLEAN NOT NULL DEFAULT true,
        "prefix" TEXT NOT NULL DEFAULT '$',
        "videoFixerEnabled" BOOLEAN NOT NULL DEFAULT true,
        "videoFixerProviders" TEXT NOT NULL DEFAULT '["twitter","tiktok","instagram","reddit","bluesky","threads"]',
        "videoFixerIgnoredChannels" TEXT NOT NULL DEFAULT '[]',
        "videoFixerDeleteButton" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ReactionRole" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "guildId" TEXT NOT NULL REFERENCES "GuildConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        "channelId" TEXT NOT NULL,
        "messageId" TEXT NOT NULL,
        "emoji" TEXT NOT NULL,
        "roleId" TEXT NOT NULL,
        "roleName" TEXT NOT NULL,
        "description" TEXT,
        "type" TEXT NOT NULL DEFAULT 'REACTION',
        "mode" TEXT NOT NULL DEFAULT 'TOGGLE',
        "requiredRoleId" TEXT,
        "imageUrl" TEXT,
        "bannerUrl" TEXT,
        "confirmGif" TEXT,
        "buttonStyle" TEXT DEFAULT 'PRIMARY',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "EmbedTemplate" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "guildId" TEXT NOT NULL REFERENCES "GuildConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        "name" TEXT NOT NULL DEFAULT 'Untitled Embed',
        "title" TEXT,
        "description" TEXT,
        "url" TEXT,
        "color" TEXT DEFAULT '#5865F2',
        "authorName" TEXT,
        "authorUrl" TEXT,
        "authorIconUrl" TEXT,
        "footerText" TEXT,
        "footerIconUrl" TEXT,
        "timestamp" BOOLEAN NOT NULL DEFAULT false,
        "thumbnailUrl" TEXT,
        "imageUrl" TEXT,
        "fields" TEXT NOT NULL DEFAULT '[]',
        "lastPublishedChannelId" TEXT,
        "lastPublishedMessageId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AuditLog" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "guildId" TEXT NOT NULL REFERENCES "GuildConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        "userId" TEXT NOT NULL,
        "action" TEXT NOT NULL,
        "details" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure newly added columns exist in existing PostgreSQL tables
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "GuildConfig" ADD COLUMN IF NOT EXISTS "videoFixerDeleteButton" BOOLEAN DEFAULT true;
    `).catch(() => null);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "ReactionRole" ADD COLUMN IF NOT EXISTS "mode" TEXT DEFAULT 'TOGGLE';
    `).catch(() => null);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "ReactionRole" ADD COLUMN IF NOT EXISTS "requiredRoleId" TEXT;
    `).catch(() => null);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "ReactionRole_guildId_idx" ON "ReactionRole"("guildId");
    `).catch(() => null);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "ReactionRole_messageId_idx" ON "ReactionRole"("messageId");
    `).catch(() => null);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "EmbedTemplate_guildId_idx" ON "EmbedTemplate"("guildId");
    `).catch(() => null);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "AuditLog_guildId_idx" ON "AuditLog"("guildId");
    `).catch(() => null);

    console.log("[Database] Specialist tables and indexes are ready!");
  } catch (err: unknown) {
    console.error("[Database] Automatic schema verification warning:", err);
  }
}
