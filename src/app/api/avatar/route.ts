import { NextRequest } from "next/server";
import { writeFile, unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { readJsonFile, writeJsonFile, joinPath } from "@/lib/storage/file-utils";
import { PATHS } from "@/lib/config/constants";
import { handleError, badRequest, json } from "@/lib/http/responses";

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) return badRequest("No file provided");

    const ext = MIME_TO_EXT[file.type];
    if (!ext) return badRequest("Invalid file type. Supported: JPG, PNG, WebP, GIF");

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) return badRequest("File too large. Maximum size is 5MB.");

    const publicDir = path.join(process.cwd(), "public");

    // Remove any existing profile image regardless of extension
    for (const oldExt of ["jpg", "png", "webp", "gif"]) {
      const oldPath = path.join(publicDir, `profile.${oldExt}`);
      if (existsSync(oldPath)) {
        try { await unlink(oldPath); } catch { /* ignore */ }
      }
    }

    const filename = `profile.${ext}`;
    const filePath = path.join(publicDir, filename);
    const publicPath = `/${filename}`;

    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    // Update portfolio.json avatar field
    const dataPath = joinPath(PATHS.PORTFOLIO_DATA);
    const data = readJsonFile(dataPath);
    data.profile.avatar = publicPath;
    writeJsonFile(dataPath, data);

    return json({ success: true, path: publicPath });
  } catch (error) {
    return handleError(error, "Failed to upload avatar");
  }
}

export async function DELETE() {
  try {
    const publicDir = path.join(process.cwd(), "public");

    // Remove profile image files
    for (const ext of ["jpg", "png", "webp", "gif"]) {
      const filePath = path.join(publicDir, `profile.${ext}`);
      if (existsSync(filePath)) {
        try { await unlink(filePath); } catch { /* ignore */ }
      }
    }

    // Clear avatar in portfolio.json
    const dataPath = joinPath(PATHS.PORTFOLIO_DATA);
    const data = readJsonFile(dataPath);
    data.profile.avatar = "";
    writeJsonFile(dataPath, data);

    return json({ success: true });
  } catch (error) {
    return handleError(error, "Failed to remove avatar");
  }
}
