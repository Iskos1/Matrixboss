import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";
import { handleError, badRequest, json } from "@/lib/http/responses";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const projectId = formData.get("projectId") as string | null;

    if (!file) {
      return badRequest("No file provided");
    }

    // Validate file type
    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (!validTypes.includes(file.type)) {
      return badRequest(
        "Invalid file type. Supported: images (JPG, PNG, GIF, WebP), PDFs, Word docs, Excel, and text files."
      );
    }

    // Validate file size (20MB max for documents, 5MB for images)
    const maxSize = file.type.startsWith("image/") ? 5 * 1024 * 1024 : 20 * 1024 * 1024;
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      return badRequest(`File too large. Maximum size is ${maxSizeMB}MB.`);
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filename = `${timestamp}-${originalName}`;

    let uploadDir: string;
    let publicPathPrefix: string;

    if (file.type.startsWith("image/")) {
      uploadDir = path.join(process.cwd(), "public", "projects");
      publicPathPrefix = "/projects";
    } else {
      uploadDir = path.join(process.cwd(), "public", "documents");
      publicPathPrefix = "/documents";
    }

    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    const publicPath = `${publicPathPrefix}/${filename}`;

    const getFileCategory = (mimeType: string): string => {
      if (mimeType.startsWith("image/")) return "image";
      if (mimeType === "application/pdf") return "pdf";
      if (mimeType.includes("word")) return "document";
      if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) return "spreadsheet";
      return "text";
    };

    return json({
      success: true,
      path: publicPath,
      filename,
      originalName: file.name,
      size: file.size,
      type: file.type,
      category: getFileCategory(file.type),
      projectId,
    });
  } catch (error) {
    return handleError(error, "Failed to upload file");
  }
}
