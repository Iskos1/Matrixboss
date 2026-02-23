import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { joinPath } from "@/lib/utils/file-utils";
import { handleApiError } from "@/lib/utils/error-utils";
import { CourseworkService } from "@/lib/services/coursework-service";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("file") as File[];
    const text = formData.get("text") as string;

    if ((!files || files.length === 0) && !text) {
      return NextResponse.json(
        { error: "No files or text provided" },
        { status: 400 }
      );
    }

    const uploadDir = joinPath("public", "coursework");
    
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }
    
    const filePaths: string[] = [];
    const publicUrls: string[] = [];
    const allowedTypes = [
      "image/jpeg", 
      "image/png", 
      "image/webp", 
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain"
    ];

    try {
      // Save all files
      if (files && files.length > 0) {
        for (const file of files) {
          // Determine mime type
        const mimeType = file.type;
        
        // Basic type check - though we allow saving more types than we might send to AI directly
        // The service will filter what it can handle.
        if (!allowedTypes.includes(mimeType) && !file.name.endsWith('.txt')) {
           // Skip strict validation here to allow flexibility, but log warning
           console.warn(`Warning: file type ${mimeType} for ${file.name} might not be fully supported.`);
        }
  
        // Save file permanently
        const buffer = Buffer.from(await file.arrayBuffer());
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filename = `${timestamp}-${safeName}`;
        const filePath = path.join(uploadDir, filename);
        
        await fs.writeFile(filePath, buffer);
        filePaths.push(filePath);
        publicUrls.push(`/coursework/${filename}`);
      }
    }

      // Handle text input if provided
      if (text) {
        const timestamp = Date.now();
        const filename = `${timestamp}-text-content.txt`;
        const filePath = path.join(uploadDir, filename);
        
        await fs.writeFile(filePath, text);
        filePaths.push(filePath);
      }

      console.log(`Analyzing ${filePaths.length} files/inputs with CourseworkService...`);

      // Use the new TypeScript Service instead of Python script
      const service = new CourseworkService();
      const analysisResult = await service.analyzeCoursework(filePaths);
      
      // Add file URLs to the result
      // @ts-ignore
      analysisResult.attachments = publicUrls;
      
      return NextResponse.json(analysisResult);
      
    } catch (serviceError: any) {
      console.error("Coursework analysis error:", serviceError);
      return NextResponse.json(
        { error: "Failed to analyze files", details: serviceError.message },
        { status: 500 }
      );
    } 

  } catch (error: any) {
    return handleApiError(error, "Internal server error");
  }
}
