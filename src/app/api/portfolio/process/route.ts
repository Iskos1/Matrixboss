import { NextRequest, NextResponse } from "next/server";
import { DataProcessingService } from "@/lib/services/data-processing-service";
import { handleApiError } from "@/lib/utils/error-utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, category } = body;

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: "Text content is required" },
        { status: 400 }
      );
    }

    const service = new DataProcessingService();
    const data = await service.processText(text, category || 'auto');

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Processing error:', error);
    return handleApiError(error, "Failed to process text");
  }
}
