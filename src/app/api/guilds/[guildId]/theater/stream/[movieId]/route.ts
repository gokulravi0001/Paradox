import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { guildId: string; movieId: string } }
) {
  const { guildId, movieId } = params;

  try {
    const movie = await prisma.movie.findFirst({
      where: { id: movieId, guildId },
    });

    if (!movie) {
      return new NextResponse("Movie not found", { status: 404 });
    }

    // 1. If it's an external remote URL (e.g. Supabase Storage CDN, YouTube, direct MP4 link), redirect to it
    if (movie.fileUrl.startsWith("http://") || movie.fileUrl.startsWith("https://")) {
      return NextResponse.redirect(movie.fileUrl);
    }

    // 2. Otherwise serve local file with HTTP 206 Partial Content Range Streaming
    const relativePath = movie.fileUrl.startsWith("/") ? movie.fileUrl.slice(1) : movie.fileUrl;
    const absolutePath = path.join(process.cwd(), "public", relativePath.replace(/^public\//, ""));

    if (!fs.existsSync(absolutePath)) {
      return new NextResponse("Video file not found on disk", { status: 404 });
    }

    const stat = fs.statSync(absolutePath);
    const fileSize = stat.size;
    const range = request.headers.get("range");

    const mimeType = movie.mimeType || "video/mp4";

    if (!range) {
      // Return full file if no range requested
      const fileBuffer = fs.readFileSync(absolutePath);
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          "Content-Length": String(fileSize),
          "Content-Type": mimeType,
          "Accept-Ranges": "bytes",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // Parse Range header: e.g. "bytes=0-1048576"
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : Math.min(start + 5 * 1024 * 1024 - 1, fileSize - 1); // 5MB chunks

    if (start >= fileSize || start < 0) {
      return new NextResponse("Requested range not satisfiable", {
        status: 416,
        headers: { "Content-Range": `bytes */${fileSize}` },
      });
    }

    const chunkLength = end - start + 1;
    const stream = fs.createReadStream(absolutePath, { start, end });

    // Convert Node ReadStream to Web ReadableStream
    const readable = new ReadableStream({
      start(controller) {
        stream.on("data", (chunk) => controller.enqueue(chunk));
        stream.on("end", () => controller.close());
        stream.on("error", (err) => controller.error(err));
      },
      cancel() {
        stream.destroy();
      },
    });

    return new NextResponse(readable, {
      status: 206,
      headers: {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": String(chunkLength),
        "Content-Type": mimeType,
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err: any) {
    console.error("[API:Theater:Stream] Error:", err);
    return new NextResponse("Internal server error streaming video", { status: 500 });
  }
}
