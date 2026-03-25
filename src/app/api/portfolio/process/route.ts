import { NextRequest } from "next/server";
import { DataProcessingService } from "@/lib/services/data-processing-service";
import { handleError, badRequest, json } from "@/lib/api/responses";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, category } = body;

    if (!text?.trim()) {
      return badRequest("Text content is required");
    }

    const service = DataProcessingService.getInstance();
    const data = await service.processText(text, category || "auto");

    return json({ success: true, data });
  } catch (error) {
    return handleError(error, "Failed to process text");
  }
}
