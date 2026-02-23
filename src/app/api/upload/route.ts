import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const projectId = formData.get("projectId") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type - now supports images, PDFs, and documents
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
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ];
    
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Supported: images (JPG, PNG, GIF, WebP), PDFs, Word docs, Excel, and text files." },
        { status: 400 }
      );
    }

    // Validate file size (20MB max for documents, 5MB for images)
    const maxSize = file.type.startsWith("image/") ? 5 * 1024 * 1024 : 20 * 1024 * 1024;
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      return NextResponse.json(
        { error: `File too large. Maximum size is ${maxSizeMB}MB.` },
        { status: 400 }
      );
    }

    // Get file buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create safe filename
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filename = `${timestamp}-${originalName}`;

    // Determine upload directory based on file type
    let uploadDir: string;
    let publicPathPrefix: string;
    
    if (file.type.startsWith("image/")) {
      uploadDir = path.join(process.cwd(), "public", "projects");
      publicPathPrefix = "/projects";
    } else {
      // Documents go to a separate folder
      uploadDir = path.join(process.cwd(), "public", "documents");
      publicPathPrefix = "/documents";
    }

    // Ensure directory exists
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Save file
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    // Return the public URL path
    const publicPath = `${publicPathPrefix}/${filename}`;

    // Determine file category
    const getFileCategory = (mimeType: string): string => {
      if (mimeType.startsWith("image/")) return "image";
      if (mimeType === "application/pdf") return "pdf";
      if (mimeType.includes("word")) return "document";
      if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) return "spreadsheet";
      return "text";
    };

    return NextResponse.json({
      success: true,
      path: publicPath,
      filename: filename,
      originalName: file.name,
      size: file.size,
      type: file.type,
      category: getFileCategory(file.type),
      projectId: projectId,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file", details: String(error) },
      { status: 500 }
    );
  }
}
