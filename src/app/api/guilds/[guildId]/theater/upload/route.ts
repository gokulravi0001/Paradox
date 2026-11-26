import { NextRequest, NextResponse } from "next/server";
import { authorizeGuildAdmin } from "@/lib/serverAuth";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { guildId: string } }
) {
  const { guildId } = params;
  const auth = await authorizeGuildAdmin(guildId);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = (formData.get("title") as string) || file?.name || "Uploaded Movie";
    const description = (formData.get("description") as string) || "";

    if (!file) {
      return NextResponse.json({ error: "No video file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize filename & create unique destination
    const originalName = file.name || "movie.mp4";
    const ext = path.extname(originalName) || ".mp4";
    const baseName = path
      .basename(originalName, ext)
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "-")
      .slice(0, 50);

    const uniqueId = crypto.randomBytes(6).toString("hex");
    const safeFileName = `${baseName}-${uniqueId}${ext}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads", "movies");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, safeFileName);
    fs.writeFileSync(filePath, buffer);

    // Construct stream URL
    const relativeUrl = `/uploads/movies/${safeFileName}`;

    // Ensure guild config exists
    await prisma.guildConfig.upsert({
      where: { id: guildId },
      update: {},
      create: { id: guildId, name: "Discord Server" },
    });

    const movie = await prisma.movie.create({
      data: {
        guildId,
        title: title.trim(),
        description: description.trim() || null,
        fileUrl: relativeUrl,
        fileName: safeFileName,
        fileSize: String(file.size),
        mimeType: file.type || "video/mp4",
        uploadedBy: auth.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      movie,
      streamUrl: relativeUrl,
    });
  } catch (err: any) {
    console.error(`[API:Theater:Upload:POST] Error:`, err);
    return NextResponse.json(
      { error: err.message || "Failed to upload video file" },
      { status: 500 }
    );
  }
}
