import { NextRequest, NextResponse } from "next/server";
import { authorizeGuildAdmin } from "@/lib/serverAuth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { guildId: string } }
) {
  const { guildId } = params;
  const auth = await authorizeGuildAdmin(guildId);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const movies = await prisma.movie.findMany({
      where: { guildId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, movies });
  } catch (err: any) {
    console.error(`[API:Theater:Movies:GET] Error:`, err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch movies" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { guildId: string } }
) {
  const { guildId } = params;
  const auth = await authorizeGuildAdmin(guildId);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await request.json();
    const { title, description, fileUrl, fileName, fileSize, mimeType, thumbnail } = body;

    if (!title || !fileUrl) {
      return NextResponse.json(
        { error: "Title and Video URL are required." },
        { status: 400 }
      );
    }

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
        description: description?.trim() || null,
        fileUrl: fileUrl.trim(),
        fileName: fileName || null,
        fileSize: fileSize ? String(fileSize) : null,
        mimeType: mimeType || "video/mp4",
        thumbnail: thumbnail?.trim() || null,
        uploadedBy: auth.user.id,
      },
    });

    return NextResponse.json({ success: true, movie });
  } catch (err: any) {
    console.error(`[API:Theater:Movies:POST] Error:`, err);
    return NextResponse.json(
      { error: err.message || "Failed to save movie" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { guildId: string } }
) {
  const { guildId } = params;
  const auth = await authorizeGuildAdmin(guildId);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { searchParams } = new URL(request.url);
    const movieId = searchParams.get("id");

    if (!movieId) {
      return NextResponse.json({ error: "Movie ID is required" }, { status: 400 });
    }

    await prisma.movie.deleteMany({
      where: { id: movieId, guildId },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(`[API:Theater:Movies:DELETE] Error:`, err);
    return NextResponse.json(
      { error: err.message || "Failed to delete movie" },
      { status: 500 }
    );
  }
}
