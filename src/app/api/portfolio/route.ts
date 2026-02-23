import { NextRequest, NextResponse } from "next/server";
import { readJsonFile, writeJsonFile, joinPath } from "@/lib/utils/file-utils";
import { PATHS } from "@/lib/constants";
import { handleApiError } from "@/lib/utils/error-utils";

const dataPath = joinPath(PATHS.PORTFOLIO_DATA);

// GET - Read portfolio data
export async function GET() {
  try {
    const data = readJsonFile(dataPath);
    return NextResponse.json(data);
  } catch (error: any) {
    return handleApiError(error, "Failed to read portfolio data");
  }
}

// PUT - Update portfolio data
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the data structure
    if (!body.profile || !body.skills || !body.experience || !body.projects || !body.certifications) {
      return NextResponse.json(
        { error: "Invalid data structure" },
        { status: 400 }
      );
    }

    // Write to file
    writeJsonFile(dataPath, body);
    
    return NextResponse.json({ 
      success: true, 
      message: "Portfolio data updated successfully" 
    });
  } catch (error: any) {
    return handleApiError(error, "Failed to update portfolio data");
  }
}
