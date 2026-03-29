import { NextRequest } from "next/server";
import fs from "fs/promises";
import path from "path";
import { joinPath } from "@/lib/storage/file-utils";
import { CourseworkService } from "@/lib/coursework/service";
import { handleError, badRequest, json } from "@/lib/http/responses";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("file") as File[];
    const text = formData.get("text") as string;

    if ((!files || files.length === 0) && !text) {
      return badRequest("No files or text provided");
    }

    const uploadDir = joinPath("public", "coursework");

    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    const filePaths: string[] = [];
    const publicUrls: string[] = [];

    // Save all files
    if (files && files.length > 0) {
      for (const file of files) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const filename = `${timestamp}-${safeName}`;
        const filePath = path.join(uploadDir, filename);

        await fs.writeFile(filePath, buffer);
        filePaths.push(filePath);
        publicUrls.push(`/coursework/${filename}`);
      }
    }

    // Handle text input
    if (text) {
      const timestamp = Date.now();
      const filename = `${timestamp}-text-content.txt`;
      const filePath = path.join(uploadDir, filename);

      await fs.writeFile(filePath, text);
      filePaths.push(filePath);
    }

    console.log(`[CourseworkAnalyze] Analyzing ${filePaths.length} files...`);

    const service = CourseworkService.getInstance();
    const analysisResult = await service.analyzeCoursework(filePaths);

    return json({
      ...analysisResult,
      attachments: publicUrls,
    });
  } catch (error) {
    return handleError(error, "Failed to analyze coursework");
  }
}
